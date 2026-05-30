import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import { sendEmail } from "@/lib/email";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "DOCTOR") {
      return apiResponse(false, null, undefined, "Không có quyền", 403);
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: {
        patient: { include: { user: { select: { id: true, name: true, email: true } } } },
        doctor: { include: { user: { select: { name: true } } } },
      },
    });

    if (!appointment) return apiResponse(false, null, undefined, "Không tìm thấy", 404);
    if (appointment.doctorId !== session.user.doctorId) {
      return apiResponse(false, null, undefined, "Không có quyền", 403);
    }

    if (appointment.status !== "PENDING") {
      return apiResponse(false, null, undefined, "Chỉ có thể xác nhận lịch đang chờ", 400);
    }

    await prisma.appointment.update({
      where: { id: params.id },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
    });

    // Notify patient
    await prisma.notification.create({
      data: {
        userId: appointment.patient.user.id,
        title: "Lịch khám đã được xác nhận ✓",
        message: `BS. ${appointment.doctor.user.name} đã xác nhận lịch khám lúc ${appointment.slotTime}`,
        type: "CONFIRM",
      },
    });

    // Send email
    sendEmail({
      to: appointment.patient.user.email,
      subject: "Lịch khám của bạn đã được xác nhận",
      html: `<p>Lịch khám lúc ${appointment.slotTime} với BS. ${appointment.doctor.user.name} đã được xác nhận.</p>`,
    }).catch(console.error);

    return apiResponse(true, null, "Xác nhận lịch thành công");
  } catch (error) {
    console.error("Confirm error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}
