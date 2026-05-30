import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import bcrypt from "bcryptjs";

// PUT /api/admin/users/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return apiResponse(false, null, undefined, "Không có quyền truy cập", 403);
    }

    const { isActive, newPassword } = await request.json();

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return apiResponse(false, null, undefined, "Không tìm thấy người dùng", 404);
    }

    // Admins cannot deactivate themselves
    if (user.id === session.user.id && isActive === false) {
      return apiResponse(false, null, undefined, "Không thể tự vô hiệu hóa chính mình", 400);
    }

    // Admins cannot change the password of other admins
    if (user.role === "ADMIN" && user.id !== session.user.id && newPassword?.trim()) {
      return apiResponse(false, null, undefined, "Không thể đặt lại mật khẩu cho tài khoản Quản trị viên khác", 400);
    }

    const data: Record<string, any> = {};

    if (isActive !== undefined) data.isActive = isActive;
    if (newPassword?.trim()) {
      if (newPassword.trim().length < 8) {
        return apiResponse(false, null, undefined, "Mật khẩu mới phải có ít nhất 8 ký tự", 400);
      }
      data.password = await bcrypt.hash(newPassword.trim(), 12);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: params.id },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });

      if (isActive !== undefined && u.role === "DOCTOR") {
        const doctor = await tx.doctor.findFirst({
          where: { userId: u.id },
        });
        if (doctor) {
          await tx.doctor.update({
            where: { id: doctor.id },
            data: { isActive },
          });
        }
      }

      return u;
    });

    return apiResponse(true, updated, "Cập nhật tài khoản thành công");
  } catch (error) {
    console.error("Admin update user error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}
