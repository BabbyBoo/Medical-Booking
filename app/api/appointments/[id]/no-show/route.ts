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
        payment: true,
      },
    });

    if (!appointment) return apiResponse(false, null, undefined, "Không tìm thấy lịch hẹn", 404);
    if (appointment.doctorId !== session.user.doctorId) {
      return apiResponse(false, null, undefined, "Không có quyền thực hiện trên lịch hẹn này", 403);
    }

    if (appointment.status !== "CONFIRMED") {
      return apiResponse(false, null, undefined, "Chỉ có thể đánh dấu lịch đã xác nhận là bệnh nhân không đến", 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: params.id },
        data: { status: "NO_SHOW" },
      });

      // Refund if paid
      if (appointment.payment?.status === "PAID") {
        await tx.payment.update({
          where: { appointmentId: params.id },
          data: { status: "REFUNDED" },
        });
      }
    });

    // Notify patient
    await prisma.notification.create({
      data: {
        userId: appointment.patient.user.id,
        title: "Thông báo vắng mặt lịch khám ⚠",
        message: `Lịch khám lúc ${appointment.slotTime} với BS. ${appointment.doctor.user.name} đã được ghi nhận là Bệnh nhân không đến.`,
        type: "REJECT",
      },
    });

    // Send email
    sendEmail({
      to: appointment.patient.user.email,
      subject: "Thông báo vắng mặt lịch khám - Medical Booking",
      html: `
        <h3>Thông báo vắng mặt lịch khám</h3>
        <p>Xin chào ${appointment.patient.user.name},</p>
        <p>Lịch hẹn của bạn lúc <strong>${appointment.slotTime}</strong> với BS. <strong>${appointment.doctor.user.name}</strong> đã bị ghi nhận trạng thái là <strong>Bệnh nhân không đến (No-show)</strong>.</p>
        <p>Nếu có bất kỳ nhầm lẫn nào hoặc cần đặt lại lịch khám mới, vui lòng liên hệ tổng đài phòng khám hoặc truy cập ứng dụng của chúng tôi.</p>
      `,
    }).catch(console.error);

    return apiResponse(true, null, "Đã ghi nhận bệnh nhân không đến thành công");
  } catch (error) {
    console.error("No-show error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}
