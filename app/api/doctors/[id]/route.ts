import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";

// GET /api/doctors/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            name: true,
            avatar: true,
            phone: true,
            email: true,
            gender: true,
          },
        },
        specialty: true,
        schedules: { where: { isActive: true }, orderBy: { dayOfWeek: "asc" } },
        reviews: {
          where: { isPublic: true },
          include: {
            patient: {
              include: {
                user: { select: { name: true, avatar: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: { select: { reviews: true, appointments: true } },
      },
    });

    if (!doctor) {
      return apiResponse(false, null, undefined, "Không tìm thấy bác sĩ", 404);
    }

    return apiResponse(true, doctor);
  } catch (error) {
    console.error("Get doctor error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}

// PUT /api/doctors/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return apiResponse(false, null, undefined, "Chưa đăng nhập", 401);
    }

    // Check authorization
    const doctor = await prisma.doctor.findUnique({ where: { id: params.id } });
    if (!doctor) {
      return apiResponse(false, null, undefined, "Không tìm thấy bác sĩ", 404);
    }

    if (session.user.role !== "ADMIN" && session.user.doctorId !== params.id) {
      return apiResponse(false, null, undefined, "Không có quyền", 403);
    }

    const body = await request.json();
    const { bio, education, experience, consultingFee } = body;

    const updated = await prisma.doctor.update({
      where: { id: params.id },
      data: {
        bio,
        education,
        experience: experience ? parseInt(experience) : undefined,
        consultingFee: consultingFee ? parseFloat(consultingFee) : undefined,
      },
    });

    return apiResponse(true, updated, "Cập nhật hồ sơ thành công");
  } catch (error) {
    console.error("Update doctor error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}
