import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";

// PUT /api/appointments/[id]/mark-paid
// Doctor marks a payment as PAID (e.g. patient paid cash at clinic)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiResponse(false, null, undefined, "Chưa đăng nhập", 401);
    if (session.user.role !== "DOCTOR" && session.user.role !== "ADMIN") {
      return apiResponse(false, null, undefined, "Không có quyền", 403);
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: { payment: true },
    });

    if (!appointment) return apiResponse(false, null, undefined, "Không tìm thấy lịch hẹn", 404);

    // Doctor can only mark their own appointments
    if (session.user.role === "DOCTOR" && appointment.doctorId !== session.user.doctorId) {
      return apiResponse(false, null, undefined, "Không có quyền", 403);
    }

    if (!appointment.payment) {
      return apiResponse(false, null, undefined, "Lịch hẹn chưa có thông tin thanh toán", 400);
    }

    if (appointment.payment.status === "PAID") {
      return apiResponse(false, null, undefined, "Lịch hẹn này đã được thanh toán", 400);
    }

    // Update payment to PAID
    const updatedPayment = await prisma.payment.update({
      where: { appointmentId: params.id },
      data: {
        status: "PAID",
        method: "CASH",
        paidAt: new Date(),
        transactionId: `CASH-${Date.now()}`,
      },
    });

    // Notify patient
    await prisma.notification.create({
      data: {
        userId: appointment.patientId
          ? (await prisma.patient.findUnique({ where: { id: appointment.patientId }, select: { userId: true } }))?.userId ?? ""
          : "",
        title: "Thanh toán được xác nhận",
        message: `Bác sĩ đã xác nhận thanh toán tiền mặt cho lịch khám ngày ${new Date(appointment.appointmentDate).toLocaleDateString("vi-VN")}.`,
        type: "PAYMENT",
      },
    });

    return apiResponse(true, updatedPayment, "Đã cập nhật trạng thái thanh toán thành công");
  } catch (error) {
    console.error("Mark paid error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}
