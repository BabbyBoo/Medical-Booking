import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiResponse, getDayOfWeekFromDate } from "@/lib/utils";
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

    const { doctorId, appointmentDate, slotTime, symptoms, previousAppointmentId } = validatedData.data;

    // Check if the patient already has an active (PENDING or CONFIRMED) appointment with this doctor
    const activeAppointment = await prisma.appointment.findFirst({
      where: {
        patientId: session.user.patientId!,
        doctorId,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    if (activeAppointment) {
      return apiResponse(
        false,
        null,
        undefined,
        "Bạn đã có một lịch hẹn chưa hoàn thành với bác sĩ này. Vui lòng hoàn thành hoặc hủy lịch hẹn cũ trước khi đặt lịch mới.",
        400
      );
    }

    // Validate slot time is not in the past (using Vietnam local timezone offset +07:00)
    const slotDateTime = new Date(`${appointmentDate}T${slotTime}:00+07:00`);
    if (slotDateTime < new Date()) {
      return apiResponse(false, null, undefined, "Không thể đặt lịch hẹn trong quá khứ", 400);
    }

    // Validate booking date is within 7 days
    const maxBookingDate = new Date();
    maxBookingDate.setDate(maxBookingDate.getDate() + 7);
    maxBookingDate.setHours(23, 59, 59, 999);
    if (slotDateTime > maxBookingDate) {
      return apiResponse(false, null, undefined, "Chỉ có thể đặt lịch khám trong vòng 7 ngày tới", 400);
    }

    // Validate that doctor works on this day and the slot is not disabled
    const date = new Date(appointmentDate);
    const dayOfWeek = getDayOfWeekFromDate(date, true);
    const schedule = await prisma.doctorSchedule.findFirst({
      where: {
        doctorId,
        dayOfWeek: dayOfWeek as "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY",
        isActive: true,
      },
    });

    if (!schedule) {
      return apiResponse(false, null, undefined, "Bác sĩ không có lịch làm việc vào ngày này", 400);
    }

    if (schedule.disabledSlots) {
      try {
        const disabledSlots = JSON.parse(schedule.disabledSlots) as string[];
        if (disabledSlots.includes(slotTime)) {
          return apiResponse(false, null, undefined, "Khung giờ này bác sĩ nghỉ hoặc không nhận lịch hẹn", 400);
        }
      } catch (err) {
        console.error("Parse schedule disabledSlots error:", err);
      }
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
        isFollowUp: !!previousAppointmentId,
        previousAppointmentId: previousAppointmentId || null,
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
