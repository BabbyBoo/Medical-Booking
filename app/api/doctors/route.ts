import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

// GET /api/doctors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialtyId = searchParams.get("specialtyId");
    const name = searchParams.get("name");
    const minRating = searchParams.get("rating");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      isActive: true,
      isVerified: true,
    };

    if (specialtyId) where.specialtyId = specialtyId;
    if (name) {
      where.user = { name: { contains: name, mode: "insensitive" } };
    }
    if (minRating) {
      where.rating = { gte: parseFloat(minRating) };
    }

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        include: {
          user: { select: { name: true, avatar: true, phone: true } },
          specialty: { select: { id: true, name: true, icon: true } },
          _count: { select: { reviews: true, appointments: true } },
        },
        skip,
        take: limit,
        orderBy: { rating: "desc" },
      }),
      prisma.doctor.count({ where }),
    ]);

    return apiResponse(true, {
      doctors,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get doctors error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}
