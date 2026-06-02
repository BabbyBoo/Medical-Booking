import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, generateTimeSlots, getDayOfWeekFromDate } from "@/lib/utils";

// GET /api/doctors/[id]/available-slots?date=2024-01-15
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) {
      return apiResponse(false, null, undefined, "Thiếu tham số date", 400);
    }

    const date = new Date(dateStr);
    const dayOfWeek = getDayOfWeekFromDate(date, true);

    // Get doctor schedule for that day
    const schedule = await prisma.doctorSchedule.findFirst({
      where: {
        doctorId: params.id,
        dayOfWeek: dayOfWeek as "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY",
        isActive: true,
      },
    });

    if (!schedule) {
      return apiResponse(true, { slots: [], available: false });
    }

    // Generate all slots
    const allSlots = generateTimeSlots(
      schedule.startTime,
      schedule.endTime,
      schedule.slotDuration
    );

    // Get booked slots (timezone-neutral UTC range)
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: params.id,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { slotTime: true },
    });

    const bookedSlots = new Set(bookedAppointments.map((a) => a.slotTime));

    const disabledSlotsSet = new Set<string>();
    if (schedule.disabledSlots) {
      try {
        const parsed = JSON.parse(schedule.disabledSlots) as string[];
        parsed.forEach((t) => disabledSlotsSet.add(t));
      } catch (err) {
        console.error("Parse disabledSlots error:", err);
      }
    }

    const slots = allSlots.map((time) => {
      const slotDateTime = new Date(`${dateStr}T${time}:00+07:00`);
      const isPast = slotDateTime < new Date();
      const isDisabled = disabledSlotsSet.has(time);
      return {
        time,
        available: !bookedSlots.has(time) && !isPast && !isDisabled,
      };
    });

    return apiResponse(true, { slots, schedule });
  } catch (error) {
    console.error("Get slots error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}
