import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "DOCTOR") {
      return apiResponse(false, null, undefined, "Không có quyền", 403);
    }

    const { reason } = await request.json();
    if (!reason?.trim()) {
      return apiResponse(false, null, undefined, "Vui lòng nhập lý do từ chối", 400);
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: {
        patient: { include: { user: { select: { id: true, name: true } } } },
        payment: true,
      },
    });

    if (!appointment) return apiResponse(false, null, undefined, "Không tìm thấy", 404);
    if (appointment.doctorId !== session.user.doctorId) {
      return apiResponse(false, null, undefined, "Không có quyền", 403);
    }

    if (appointment.status !== "PENDING") {
      return apiResponse(false, null, undefined, "Chỉ có thể từ chối lịch đang chờ", 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: params.id },
        data: { status: "CANCELLED", cancelReason: reason },
      });

      if (appointment.payment?.status === "PAID") {
        await tx.payment.update({
          where: { appointmentId: params.id },
          data: { status: "REFUNDED" },
        });
      }

      await tx.notification.create({
        data: {
          userId: appointment.patient.user.id,
          title: "Lịch khám đã bị từ chối",
          message: `Lịch khám của bạn đã bị từ chối. Lý do: ${reason}`,
          type: "CANCEL",
        },
      });
    });

    return apiResponse(true, null, "Đã từ chối lịch hẹn");
  } catch (error) {
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}
