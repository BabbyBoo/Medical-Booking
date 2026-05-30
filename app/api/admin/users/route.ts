import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

// GET /api/admin/users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return apiResponse(false, null, undefined, "Không có quyền truy cập", 403);
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const isActiveStr = searchParams.get("isActive");
    const search = searchParams.get("search") || "";

    const where: Record<string, any> = {};

    if (role && role !== "ALL") {
      where.role = role;
    }

    if (isActiveStr !== null && isActiveStr !== undefined && isActiveStr !== "") {
      where.isActive = isActiveStr === "true";
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        gender: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return apiResponse(true, users);
  } catch (error) {
    console.error("Admin get users error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}
