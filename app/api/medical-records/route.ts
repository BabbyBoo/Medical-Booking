import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import { medicalRecordSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

// GET /api/medical-records
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return apiResponse(false, null, undefined, "Chưa đăng nhập", 401);
    }

    const { searchParams } = new URL(request.url);
    const patientIdParam = searchParams.get("patientId");

    const role = session.user.role;
    let where: Record<string, any> = {};

    if (role === "PATIENT") {
      where = {
        appointment: {
          patientId: session.user.patientId,
        },
      };
    } else if (role === "DOCTOR") {
      if (patientIdParam) {
        where = {
          appointment: {
            patientId: patientIdParam,
            doctorId: session.user.doctorId,
          },
        };
      } else {
        where = {
          appointment: {
            doctorId: session.user.doctorId,
          },
        };
      }
    } else if (role === "ADMIN") {
      if (patientIdParam) {
        where = {
          appointment: {
            patientId: patientIdParam,
          },
        };
      }
    }

    const medicalRecords = await prisma.medicalRecord.findMany({
      where,
      include: {
        appointment: {
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
          },
        },
        prescriptions: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return apiResponse(true, medicalRecords);
  } catch (error) {
    console.error("Get medical records error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}

// POST /api/medical-records
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "DOCTOR") {
      return apiResponse(false, null, undefined, "Không có quyền", 403);
    }

    const body = await request.json();
    const validatedData = medicalRecordSchema.safeParse(body);

    if (!validatedData.success) {
      return apiResponse(false, null, undefined, validatedData.error.issues[0].message, 400);
    }

    const { appointmentId, diagnosis, treatment, notes, followUpDate, prescriptions } = validatedData.data;

    // Check appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { include: { user: { select: { id: true } } } },
      },
    });

    if (!appointment) return apiResponse(false, null, undefined, "Không tìm thấy lịch hẹn", 404);
    if (appointment.doctorId !== session.user.doctorId) {
      return apiResponse(false, null, undefined, "Không có quyền", 403);
    }
    if (appointment.status !== "CONFIRMED") {
      return apiResponse(false, null, undefined, "Lịch hẹn phải ở trạng thái đã xác nhận", 400);
    }

    // Check not already have record
    const existingRecord = await prisma.medicalRecord.findUnique({
      where: { appointmentId },
    });
    if (existingRecord) {
      return apiResponse(false, null, undefined, "Kết quả khám đã được tạo", 400);
    }

    const medicalRecord = await prisma.$transaction(async (tx) => {
      const record = await tx.medicalRecord.create({
        data: {
          appointmentId,
          diagnosis,
          treatment,
          notes,
          followUpDate: followUpDate ? new Date(followUpDate) : undefined,
          prescriptions: {
            create: prescriptions || [],
          },
        },
        include: { prescriptions: true },
      });

      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: "COMPLETED" },
      });

      await tx.notification.create({
        data: {
          userId: appointment.patient.user.id,
          title: "Kết quả khám đã sẵn sàng",
          message: "Bác sĩ đã ghi nhận kết quả khám của bạn. Xem ngay trong lịch sử khám.",
          type: "RECORD",
        },
      });

      return record;
    });

    // Invalidate Next.js cache for real-time updates on patient and doctor screens
    revalidatePath("/patient/medical-records");
    revalidatePath("/patient/dashboard");
    revalidatePath("/doctor/dashboard");
    revalidatePath("/doctor/appointments");

    return apiResponse(true, medicalRecord, "Kết quả khám đã được lưu thành công", undefined, 201);
  } catch (error) {
    console.error("Create medical record error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}
