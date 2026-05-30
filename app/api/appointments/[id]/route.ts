import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";

// GET /api/appointments/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiResponse(false, null, undefined, "Chưa đăng nhập", 401);

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: {
        doctor: {
          include: {
            user: { select: { name: true, avatar: true, email: true, phone: true } },
            specialty: true,
          },
        },
        patient: {
          include: {
            user: { select: { name: true, avatar: true, phone: true, dateOfBirth: true, gender: true } },
          },
        },
        payment: true,
        medicalRecord: { include: { prescriptions: true } },
        review: true,
      },
    });

    if (!appointment) return apiResponse(false, null, undefined, "Không tìm thấy", 404);

    // Auth check
    const role = session.user.role;
    if (role === "PATIENT" && appointment.patientId !== session.user.patientId) {
      return apiResponse(false, null, undefined, "Không có quyền", 403);
    }
    if (role === "DOCTOR" && appointment.doctorId !== session.user.doctorId) {
      return apiResponse(false, null, undefined, "Không có quyền", 403);
    }


    return apiResponse(true, appointment);
  } catch (error) {
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}
