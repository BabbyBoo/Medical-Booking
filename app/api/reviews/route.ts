import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import { reviewSchema } from "@/lib/validations";

// POST /api/reviews
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "PATIENT") {
      return apiResponse(false, null, undefined, "Không có quyền", 403);
    }

    const body = await request.json();
    const validatedData = reviewSchema.safeParse(body);

    if (!validatedData.success) {
      return apiResponse(false, null, undefined, validatedData.error.issues[0].message, 400);
    }

    const { appointmentId, rating, comment } = validatedData.data;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) return apiResponse(false, null, undefined, "Không tìm thấy", 404);
    if (appointment.patientId !== session.user.patientId) {
      return apiResponse(false, null, undefined, "Không có quyền", 403);
    }
    if (appointment.status !== "COMPLETED") {
      return apiResponse(false, null, undefined, "Chỉ đánh giá lịch đã hoàn thành", 400);
    }

    const existingReview = await prisma.review.findUnique({ where: { appointmentId } });
    if (existingReview) {
      return apiResponse(false, null, undefined, "Bạn đã đánh giá lịch này rồi", 400);
    }

    const review = await prisma.$transaction(async (tx) => {
      const r = await tx.review.create({
        data: {
          patientId: session.user.patientId!,
          doctorId: appointment.doctorId,
          appointmentId,
          rating,
          comment,
        },
      });

      // Recalculate doctor rating
      const avg = await tx.review.aggregate({
        where: { doctorId: appointment.doctorId },
        _avg: { rating: true },
        _count: true,
      });

      await tx.doctor.update({
        where: { id: appointment.doctorId },
        data: {
          rating: avg._avg.rating || 0,
          totalReviews: avg._count,
        },
      });

      return r;
    });

    return apiResponse(true, review, "Cảm ơn bạn đã đánh giá!", undefined, 201);
  } catch (error) {
    console.error("Create review error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}
