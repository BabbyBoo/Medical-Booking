import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiResponse, getDayOfWeekFromDate, getDayOfWeekLabel } from "@/lib/utils";
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

    // Check if updating schedules conflicts with existing active appointments
    // Get all pending/confirmed appointments for this doctor starting from today
    const nowInVN = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    const todayStr = nowInVN.toISOString().split("T")[0];
    const startOfToday = new Date(`${todayStr}T00:00:00.000Z`);

    const activeAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: params.id,
        status: { in: ["PENDING", "CONFIRMED"] },
        appointmentDate: { gte: startOfToday },
      },
      select: {
        id: true,
        appointmentDate: true,
        slotTime: true,
      },
    });

    for (const schedule of validatedData.data) {
      // Find appointments on this schedule's day of week
      const conflicts = activeAppointments.filter((appt) => {
        const apptDay = getDayOfWeekFromDate(appt.appointmentDate, true);
        if (apptDay !== schedule.dayOfWeek) return false;

        // If the day is deactivated
        if (!schedule.isActive) return true;

        // If the slot is disabled
        if (schedule.disabledSlots && schedule.disabledSlots.includes(appt.slotTime)) {
          return true;
        }

        // If the slot time is outside the new start/end time window
        const [apptH, apptM] = appt.slotTime.split(":").map(Number);
        const [startH, startM] = schedule.startTime.split(":").map(Number);
        const [endH, endM] = schedule.endTime.split(":").map(Number);

        const apptMinutes = apptH * 60 + apptM;
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        if (apptMinutes < startMinutes || apptMinutes >= endMinutes) {
          return true;
        }

        return false;
      });

      if (conflicts.length > 0) {
        return apiResponse(
          false,
          null,
          undefined,
          `Không thể cập nhật lịch do đang có lịch hẹn của bệnh nhân trùng hoặc nằm ngoài khung giờ mới vào ${getDayOfWeekLabel(schedule.dayOfWeek)}. Vui lòng xử lý các lịch hẹn trước.`,
          400
        );
      }
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
            disabledSlots: schedule.disabledSlots ? JSON.stringify(schedule.disabledSlots) : null,
          },
          update: {
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            slotDuration: schedule.slotDuration,
            isActive: schedule.isActive,
            disabledSlots: schedule.disabledSlots ? JSON.stringify(schedule.disabledSlots) : null,
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
