import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";
import bcrypt from "bcryptjs";

// POST /api/auth/forgot-password
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return apiResponse(false, null, undefined, "Email là bắt buộc", 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return apiResponse(true, null, "Kiểm tra hộp thư email của bạn");
    }

    // Create reset token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    await sendEmail({
      to: email,
      subject: "Đặt lại mật khẩu MedBook",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0891b2;">Đặt lại mật khẩu</h2>
          <p>Nhấn vào link bên dưới để đặt lại mật khẩu của bạn:</p>
          <a href="${resetLink}" style="background: #0891b2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Đặt lại mật khẩu</a>
          <p>Link có hiệu lực trong 1 giờ. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
        </div>
      `,
    });

    return apiResponse(true, null, "Kiểm tra hộp thư email của bạn");
  } catch (error) {
    console.error("Forgot password error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}
