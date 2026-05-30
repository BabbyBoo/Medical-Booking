import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";

// POST /api/admin/notifications/broadcast
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return apiResponse(false, null, undefined, "Không có quyền truy cập", 403);
    }

    const { title, message, targetRole } = await request.json();

    if (!title?.trim() || !message?.trim() || !targetRole) {
      return apiResponse(false, null, undefined, "Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo", 400);
    }

    const usersWhere: Record<string, any> = { isActive: true };
    if (targetRole !== "ALL") {
      usersWhere.role = targetRole;
    }

    const users = await prisma.user.findMany({
      where: usersWhere,
      select: { id: true },
    });

    if (users.length === 0) {
      return apiResponse(true, { count: 0 }, "Không có người nhận phù hợp");
    }

    // Bulk create notifications using a transaction or createMany
    const notificationData = users.map((u) => ({
      userId: u.id,
      title: title.trim(),
      message: message.trim(),
      type: "SYSTEM",
      isRead: false,
    }));

    await prisma.notification.createMany({
      data: notificationData,
    });

    return apiResponse(
      true,
      { count: users.length },
      `Đã gửi thông báo thành công tới ${users.length} người dùng`
    );
  } catch (error) {
    console.error("Broadcast notification error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}
