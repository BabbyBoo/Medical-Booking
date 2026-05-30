import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";

// PUT /api/admin/doctors/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return apiResponse(false, null, undefined, "Không có quyền truy cập", 403);
    }

    const { isVerified, isActive } = await request.json();

    const doctor = await prisma.doctor.findUnique({
      where: { id: params.id },
    });

    if (!doctor) {
      return apiResponse(false, null, undefined, "Không tìm thấy bác sĩ", 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const doc = await tx.doctor.update({
        where: { id: params.id },
        data: {
          isVerified: isVerified !== undefined ? isVerified : undefined,
          isActive: isActive !== undefined ? isActive : undefined,
        },
      });

      if (isActive !== undefined) {
        // Also update user's active state
        await tx.user.update({
          where: { id: doctor.userId },
          data: { isActive },
        });
      }

      return doc;
    });

    return apiResponse(true, updated, "Cập nhật thông tin bác sĩ thành công");
  } catch (error) {
    console.error("Admin update doctor error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}
