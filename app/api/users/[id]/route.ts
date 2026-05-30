import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import bcrypt from "bcryptjs";

// GET /api/users/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return apiResponse(false, null, undefined, "Chưa đăng nhập", 401);
    }

    // Users can only view their own profile (admin can view any)
    if (session.user.id !== params.id && session.user.role !== "ADMIN") {
      return apiResponse(false, null, undefined, "Không có quyền truy cập", 403);
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        patientProfile: true,
        doctorProfile: {
          include: { specialty: true },
        },
      },
    });

    if (!user) {
      return apiResponse(false, null, undefined, "Người dùng không tồn tại", 404);
    }

    const { password: _pw1, ...userWithoutPassword } = user;
    return apiResponse(true, userWithoutPassword);
  } catch (error) {
    console.error("Get user error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}

// PUT /api/users/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return apiResponse(false, null, undefined, "Chưa đăng nhập", 401);
    }

    if (session.user.id !== params.id && session.user.role !== "ADMIN") {
      return apiResponse(false, null, undefined, "Không có quyền truy cập", 403);
    }

    const body = await request.json();
    const {
      name,
      phone,
      dateOfBirth,
      gender,
      address,
      avatar,
      // Patient fields
      bloodType,
      allergies,
      chronicDiseases,
      emergencyContact,
      // Password change
      currentPassword,
      newPassword,
    } = body;

    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) {
      return apiResponse(false, null, undefined, "Người dùng không tồn tại", 404);
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return apiResponse(false, null, undefined, "Vui lòng nhập mật khẩu hiện tại", 400);
      }
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return apiResponse(false, null, undefined, "Mật khẩu hiện tại không đúng", 400);
      }
      if (newPassword.length < 8) {
        return apiResponse(false, null, undefined, "Mật khẩu mới phải có ít nhất 8 ký tự", 400);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        name: name ?? user.name,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        address,
        avatar,
        ...(newPassword
          ? { password: await bcrypt.hash(newPassword, 12) }
          : {}),
        ...(user.role === "PATIENT" && {
          patientProfile: {
            upsert: {
              create: {
                bloodType,
                allergies,
                chronicDiseases,
                emergencyContact,
              },
              update: {
                bloodType,
                allergies,
                chronicDiseases,
                emergencyContact,
              },
            },
          },
        }),
      },
      include: {
        patientProfile: true,
      },
    });

    const { password: _pw2, ...userWithoutPassword } = updatedUser;
    return apiResponse(true, userWithoutPassword, "Cập nhật hồ sơ thành công");
  } catch (error) {
    console.error("Update user error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}
