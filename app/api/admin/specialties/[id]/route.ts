import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";

// PUT /api/admin/specialties/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return apiResponse(false, null, undefined, "Không có quyền truy cập", 403);
    }

    const { name, description, icon, isActive } = await request.json();

    const existing = await prisma.specialty.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return apiResponse(false, null, undefined, "Chuyên khoa không tồn tại", 404);
    }

    // Check if name is being changed and is unique
    if (name && name.trim() !== existing.name) {
      const duplicate = await prisma.specialty.findUnique({
        where: { name: name.trim() },
      });
      if (duplicate) {
        return apiResponse(false, null, undefined, "Tên chuyên khoa đã được sử dụng", 400);
      }
    }

    const specialty = await prisma.specialty.update({
      where: { id: params.id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        description: description !== undefined ? description?.trim() : undefined,
        icon: icon !== undefined ? icon?.trim() : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    return apiResponse(true, specialty, "Cập nhật chuyên khoa thành công");
  } catch (error) {
    console.error("Update specialty error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}

// DELETE /api/admin/specialties/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return apiResponse(false, null, undefined, "Không có quyền truy cập", 403);
    }

    const existing = await prisma.specialty.findUnique({
      where: { id: params.id },
      include: { _count: { select: { doctors: true } } },
    });

    if (!existing) {
      return apiResponse(false, null, undefined, "Chuyên khoa không tồn tại", 404);
    }

    if (existing._count.doctors > 0) {
      return apiResponse(
        false,
        null,
        undefined,
        "Không thể xóa chuyên khoa đang có bác sĩ hoạt động. Hãy vô hiệu hóa thay thế.",
        400
      );
    }

    await prisma.specialty.delete({
      where: { id: params.id },
    });

    return apiResponse(true, null, "Xóa chuyên khoa thành công");
  } catch (error) {
    console.error("Delete specialty error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}
