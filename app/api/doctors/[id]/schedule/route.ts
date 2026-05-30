import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import { doctorScheduleSchema } from "@/lib/validations";

// GET /api/doctors/[id]/schedule
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const schedules = await prisma.doctorSchedule.findMany({
      where: { doctorId: params.id },
      orderBy: { dayOfWeek: "asc" },
    });

    return apiResponse(true, schedules);
  } catch (error) {
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}

// PUT /api/doctors/[id]/schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return apiResponse(false, null, undefined, "Chưa đăng nhập", 401);
    }

    if (session.user.role !== "ADMIN" && session.user.doctorId !== params.id) {
      return apiResponse(false, null, undefined, "Không có quyền", 403);
    }

    const body = await request.json();
    const validatedData = doctorScheduleSchema.safeParse(body);

    if (!validatedData.success) {
      return apiResponse(false, null, undefined, validatedData.error.issues[0].message, 400);
    }

    // Upsert each schedule
    const results = await Promise.all(
      validatedData.data.map((schedule) =>
        prisma.doctorSchedule.upsert({
          where: {
            doctorId_dayOfWeek: {
              doctorId: params.id,
              dayOfWeek: schedule.dayOfWeek,
            },
          },
          create: {
            doctorId: params.id,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            slotDuration: schedule.slotDuration,
            isActive: schedule.isActive,
          },
          update: {
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            slotDuration: schedule.slotDuration,
            isActive: schedule.isActive,
          },
        })
      )
    );

    return apiResponse(true, results, "Cập nhật lịch làm việc thành công");
  } catch (error) {
    console.error("Update schedule error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}
