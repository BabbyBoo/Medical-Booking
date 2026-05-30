import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import { bookingSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

// GET /api/appointments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return apiResponse(false, null, undefined, "Chưa đăng nhập", 401);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const role = session.user.role;
    const where: Record<string, unknown> = {};

    if (role === "PATIENT") {
      where.patientId = session.user.patientId;
    } else if (role === "DOCTOR") {
      where.doctorId = session.user.doctorId;
    }

    if (status) where.status = status;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          doctor: {
            include: {
              user: { select: { name: true, avatar: true } },
              specialty: { select: { name: true, icon: true } },
            },
          },
          patient: {
            include: {
              user: { select: { name: true, avatar: true, phone: true } },
            },
          },
          payment: true,
          review: { select: { id: true, rating: true } },
          medicalRecord: { select: { id: true } },
        },
        orderBy: { appointmentDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    return apiResponse(true, {
      appointments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get appointments error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}

// POST /api/appointments
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "PATIENT") {
      return apiResponse(false, null, undefined, "Chưa đăng nhập hoặc không phải bệnh nhân", 401);
    }

    const body = await request.json();
    const validatedData = bookingSchema.safeParse(body);

    if (!validatedData.success) {
      return apiResponse(false, null, undefined, validatedData.error.issues[0].message, 400);
    }

    const { doctorId, appointmentDate, slotTime, symptoms } = validatedData.data;

    // Validate lunch break: 11:00 to 14:00
    const [slotH, slotM] = slotTime.split(":").map(Number);
    const slotMin = slotH * 60 + slotM;
    if (slotMin >= 11 * 60 && slotMin < 14 * 60) {
      return apiResponse(false, null, undefined, "Không thể đặt lịch trong thời gian nghỉ trưa (11:00 - 14:00)", 400);
    }

    // Check doctor exists, is active, and is verified
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId, isActive: true, isVerified: true },
      select: { id: true, consultingFee: true },
    });

    if (!doctor) {
      return apiResponse(false, null, undefined, "Bác sĩ không tồn tại hoặc chưa được duyệt", 404);
    }

    // Double-check slot availability
    const date = new Date(appointmentDate);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

    const existingSlot = await prisma.appointment.findFirst({
      where: {
        doctorId,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        slotTime,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    if (existingSlot) {
      return apiResponse(false, null, undefined, "Slot này đã được đặt, vui lòng chọn slot khác", 409);
    }

    // Create appointment with 24h expiry
    const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const appointment = await prisma.appointment.create({
      data: {
        patientId: session.user.patientId!,
        doctorId,
        appointmentDate: startOfDay,
        slotTime,
        symptoms,
        status: "PENDING",
        expiredAt,
        payment: {
          create: {
            amount: doctor.consultingFee,
            status: "UNPAID",
          },
        },
      },
    });

    // Notify doctor
    const doctorUser = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { user: { select: { id: true, name: true } } },
    });

    if (doctorUser) {
      await prisma.notification.create({
        data: {
          userId: doctorUser.user.id,
          title: "Lịch hẹn mới",
          message: `Bệnh nhân ${session.user.name} đã đặt lịch khám lúc ${slotTime}`,
          type: "CONFIRM",
        },
      });
    }

    return apiResponse(
      true,
      { appointmentId: appointment.id, status: "PENDING" },
      "Đặt lịch thành công, vui lòng thanh toán để hoàn tất",
      undefined,
      201
    );
  } catch (error) {
    console.error("Create appointment error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}
