import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";

// PUT /api/admin/appointments/[id]/force-cancel
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return apiResponse(false, null, undefined, "Không có quyền truy cập", 403);
    }

    const { reason } = await request.json();
    if (!reason?.trim()) {
      return apiResponse(false, null, undefined, "Vui lòng nhập lý do hủy lịch", 400);
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: {
        payment: true,
        patient: { include: { user: { select: { id: true, name: true } } } },
        doctor: { include: { user: { select: { id: true } } } },
      },
    });

    if (!appointment) {
      return apiResponse(false, null, undefined, "Không tìm thấy lịch hẹn", 404);
    }

    if (appointment.status === "CANCELLED" || appointment.status === "COMPLETED") {
      return apiResponse(false, null, undefined, "Lịch hẹn đã hoàn thành hoặc đã bị hủy trước đó", 400);
    }

    await prisma.$transaction(async (tx) => {
      // Cancel appointment
      await tx.appointment.update({
        where: { id: params.id },
        data: {
          status: "CANCELLED",
          cancelReason: `[Admin hủy] ${reason}`,
        },
      });

      // Refund if paid
      if (appointment.payment?.status === "PAID") {
        await tx.payment.update({
          where: { appointmentId: params.id },
          data: { status: "REFUNDED" },
        });
      }

      // Notify Patient
      await tx.notification.create({
        data: {
          userId: appointment.patient.user.id,
          title: "Lịch hẹn bị hủy bởi quản trị viên",
          message: `Lịch khám của bạn lúc ${appointment.slotTime} ngày ${appointment.appointmentDate.toLocaleDateString()} đã bị hủy bởi quản trị viên. Lý do: ${reason}`,
          type: "CANCEL",
        },
      });

      // Notify Doctor
      await tx.notification.create({
        data: {
          userId: appointment.doctor.user.id,
          title: "Lịch hẹn bị hủy bởi quản trị viên",
          message: `Lịch khám lúc ${appointment.slotTime} ngày ${appointment.appointmentDate.toLocaleDateString("vi-VN")} của bệnh nhân ${appointment.patient.user.name} đã bị hủy bởi quản trị viên. Lý do: ${reason}`,
          type: "CANCEL",
        },
      });
    });

    return apiResponse(true, null, "Hủy lịch hẹn thành công");
  } catch (error) {
    console.error("Admin force cancel error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}
