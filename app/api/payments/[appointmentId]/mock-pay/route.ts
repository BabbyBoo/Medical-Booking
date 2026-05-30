import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";

// POST /api/payments/[appointmentId]/mock-pay
export async function POST(
  request: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "PATIENT") {
      return apiResponse(false, null, undefined, "Không có quyền", 403);
    }

    const { searchParams } = new URL(request.url);
    const fail = searchParams.get("fail") === "true";

    if (fail) {
      return apiResponse(false, null, undefined, "Thanh toán thất bại (demo)", 400);
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.appointmentId },
      include: { payment: true },
    });

    if (!appointment) {
      return apiResponse(false, null, undefined, "Không tìm thấy lịch hẹn", 404);
    }

    if (appointment.patientId !== session.user.patientId) {
      return apiResponse(false, null, undefined, "Không có quyền", 403);
    }

    if (appointment.payment?.status === "PAID") {
      return apiResponse(false, null, undefined, "Lịch hẹn đã được thanh toán", 400);
    }

    if (["CANCELLED", "NO_SHOW", "EXPIRED"].includes(appointment.status)) {
      return apiResponse(false, null, undefined, "Không thể thanh toán cho lịch hẹn đã hủy, vắng mặt hoặc hết hạn", 400);
    }

    const transactionId = "TXN" + Date.now();

    await prisma.payment.update({
      where: { appointmentId: params.appointmentId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        method: "MOCK_ONLINE",
        transactionId,
      },
    });

    return apiResponse(
      true,
      { transactionId },
      "Thanh toán thành công! [CHẾ ĐỘ DEMO]"
    );
  } catch (error) {
    console.error("Mock pay error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}
