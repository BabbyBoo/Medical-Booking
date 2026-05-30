import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return apiResponse(false, null, undefined, "Token và mật khẩu mới là bắt buộc", 400);
    }

    if (newPassword.length < 8) {
      return apiResponse(false, null, undefined, "Mật khẩu phải có ít nhất 8 ký tự", 400);
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      return apiResponse(false, null, undefined, "Token không hợp lệ hoặc đã hết hạn", 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return apiResponse(true, null, "Đặt lại mật khẩu thành công");
  } catch (error) {
    console.error("Reset password error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}
