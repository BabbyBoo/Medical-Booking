import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

// GET /api/admin/specialties
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return apiResponse(false, null, undefined, "Không có quyền truy cập", 403);
    }

    const specialties = await prisma.specialty.findMany({
      orderBy: { name: "asc" },
    });

    return apiResponse(true, specialties);
  } catch (error) {
    console.error("Get specialties error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}

// POST /api/admin/specialties
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return apiResponse(false, null, undefined, "Không có quyền truy cập", 403);
    }

    const { name, description, icon } = await request.json();
    if (!name?.trim()) {
      return apiResponse(false, null, undefined, "Tên chuyên khoa không được để trống", 400);
    }

    const existing = await prisma.specialty.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return apiResponse(false, null, undefined, "Chuyên khoa đã tồn tại", 400);
    }

    const specialty = await prisma.specialty.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon?.trim() || null,
        isActive: true,
      },
    });

    return apiResponse(true, specialty, "Tạo chuyên khoa thành công", undefined, 201);
  } catch (error) {
    console.error("Create specialty error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}
