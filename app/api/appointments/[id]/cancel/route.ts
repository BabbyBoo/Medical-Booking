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
    if (!session || session.user.role !== "PATIENT") {
      return apiResponse(false, null, undefined, "Không có quyền", 403);
    }

    const { cancelReason } = await request.json();
    if (!cancelReason?.trim()) {
      return apiResponse(false, null, undefined, "Vui lòng nhập lý do hủy", 400);
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: {
        payment: true,
        doctor: { include: { user: { select: { id: true } } } },
      },
    });

    if (!appointment) return apiResponse(false, null, undefined, "Không tìm thấy", 404);
    if (appointment.patientId !== session.user.patientId) {
      return apiResponse(false, null, undefined, "Không có quyền", 403);
    }

    if (!["PENDING", "CONFIRMED"].includes(appointment.status)) {
      return apiResponse(false, null, undefined, "Không thể hủy lịch này", 400);
    }

    // Check 2 hours before (timezone-neutral UTC calculation for Vietnam GMT+7)
    const now = new Date();
    const [h, m] = appointment.slotTime.split(":").map(Number);
    const year = appointment.appointmentDate.getUTCFullYear();
    const month = appointment.appointmentDate.getUTCMonth();
    const day = appointment.appointmentDate.getUTCDate();
    const apptTime = new Date(Date.UTC(year, month, day, h - 7, m, 0, 0));

    if (apptTime.getTime() - now.getTime() < 2 * 60 * 60 * 1000) {
      return apiResponse(false, null, undefined, "Không thể hủy lịch trong vòng 2 giờ trước giờ khám", 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: params.id },
        data: { status: "CANCELLED", cancelReason },
      });

      // Refund if paid
      if (appointment.payment?.status === "PAID") {
        await tx.payment.update({
          where: { appointmentId: params.id },
          data: { status: "REFUNDED" },
        });
      }

      // Notify doctor
      await tx.notification.create({
        data: {
          userId: appointment.doctor.user.id,
          title: "Lịch hẹn bị hủy",
          message: `Bệnh nhân đã hủy lịch khám lúc ${appointment.slotTime}. Lý do: ${cancelReason}`,
          type: "CANCEL",
        },
      });
    });

    return apiResponse(true, null, "Hủy lịch thành công");
  } catch (error) {
    console.error("Cancel error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}
