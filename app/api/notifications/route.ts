import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";

// GET /api/notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiResponse(false, null, undefined, "Chưa đăng nhập", 401);

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return apiResponse(true, notifications);
  } catch (error) {
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}
