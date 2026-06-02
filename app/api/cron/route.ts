import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { initCronJobs } from "@/lib/cron";

export const dynamic = "force-dynamic";

// Global variable to ensure local cron only initializes once in local development
let localCronStarted = false;

// GET /api/cron
// Triggers the cron logic immediately on request (useful for serverless Vercel Cron or curl testing)
export async function GET(request: NextRequest) {
  // Start the background cron daemon for local development if not already started
  if (!localCronStarted && process.env.NODE_ENV === "development") {
    initCronJobs();
    localCronStarted = true;
  }

  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  // Optional: check secret key for Vercel Cron security
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const summary: Record<string, any> = {};

  try {
    // Get dates in Vietnam timezone (+07:00)
    const nowInVN = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const todayStr = nowInVN.toISOString().split("T")[0]; // "yyyy-MM-dd"
    
    const tomorrowInVN = new Date(nowInVN.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = tomorrowInVN.toISOString().split("T")[0];

    // Query appointments for today and tomorrow
    const appointments = await prisma.appointment.findMany({
      where: {
        status: "CONFIRMED",
        appointmentDate: {
          in: [
            new Date(`${todayStr}T00:00:00.000Z`),
            new Date(`${tomorrowStr}T00:00:00.000Z`),
          ],
        },
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        reminders: true,
      },
    });

    let reminded24hCount = 0;
    let reminded1hCount = 0;

    for (const appt of appointments) {
      const dateStr = appt.appointmentDate.toISOString().split("T")[0];
      const apptDateTime = new Date(`${dateStr}T${appt.slotTime}:00+07:00`);
      const diffMs = apptDateTime.getTime() - now.getTime();

      // --- 1. REMIND 24H BEFORE ---
      const has24hReminder = appt.reminders.some((r) => r.type === "24H");
      if (diffMs >= 23 * 60 * 60 * 1000 && diffMs <= 25 * 60 * 60 * 1000 && !has24hReminder) {
        await sendEmail({
          to: appt.patient.user.email,
          subject: "Nhắc nhở: Lịch khám bệnh của bạn vào ngày mai ✓",
          text: `Xin chào ${appt.patient.user.name},\n\nBạn có lịch khám bệnh lúc ${appt.slotTime} ngày mai với BS. ${appt.doctor.user.name}.\nVui lòng đến đúng giờ hẹn.\n\nTrân trọng,\nMedBook.`,
          html: `<p>Xin chào <strong>${appt.patient.user.name}</strong>,</p>
                 <p>Bạn có lịch khám bệnh lúc <strong>${appt.slotTime} ngày mai</strong> với <strong>BS. ${appt.doctor.user.name}</strong>.</p>
                 <p>Vui lòng đến đúng giờ hẹn tại phòng khám.</p>
                 <p>Trân trọng,<br/>Đội ngũ MedBook.</p>`,
        });

        await prisma.notification.create({
          data: {
            userId: appt.patient.user.id,
            title: "Nhắc lịch khám ngày mai",
            message: `Lịch khám lúc ${appt.slotTime} ngày mai với BS. ${appt.doctor.user.name}`,
            type: "REMINDER",
          },
        });

        await prisma.appointmentReminder.create({
          data: { appointmentId: appt.id, type: "24H" },
        });

        reminded24hCount++;
      }

      // --- 2. REMIND 1H BEFORE ---
      const has1hReminder = appt.reminders.some((r) => r.type === "1H");
      if (diffMs >= 30 * 60 * 1000 && diffMs <= 90 * 60 * 1000 && !has1hReminder) {
        await sendEmail({
          to: appt.patient.user.email,
          subject: "Nhắc nhở: Lịch khám của bạn sắp diễn ra trong 1 giờ tới",
          text: `Xin chào ${appt.patient.user.name},\n\nLịch khám bệnh của bạn với BS. ${appt.doctor.user.name} sẽ bắt đầu lúc ${appt.slotTime} (trong khoảng 1 giờ nữa).\n\nTrân trọng,\nMedBook.`,
          html: `<p>Xin chào <strong>${appt.patient.user.name}</strong>,</p>
                 <p>Lịch khám bệnh của bạn với <strong>BS. ${appt.doctor.user.name}</strong> sẽ diễn ra vào lúc <strong>${appt.slotTime}</strong> (khoảng 1 giờ nữa).</p>
                 <p>Trân trọng,<br/>Đội ngũ MedBook.</p>`,
        });

        await prisma.notification.create({
          data: {
            userId: appt.patient.user.id,
            title: "Lịch khám sắp diễn ra",
            message: `Lịch khám lúc ${appt.slotTime} với BS. ${appt.doctor.user.name} sẽ bắt đầu trong 1 giờ tới.`,
            type: "REMINDER",
          },
        });

        await prisma.appointmentReminder.create({
          data: { appointmentId: appt.id, type: "1H" },
        });

        reminded1hCount++;
      }
    }
    summary.reminded24hCount = reminded24hCount;
    summary.reminded1hCount = reminded1hCount;

    // --- 3. AUTO EXPIRE UNCONFIRMED APPOINTMENTS ---
    const expired = await prisma.appointment.findMany({
      where: {
        status: "PENDING",
        expiredAt: { lte: now },
      },
      include: {
        patient: { include: { user: { select: { id: true } } } },
      },
    });

    if (expired.length > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.appointment.updateMany({
          where: { id: { in: expired.map((e) => e.id) } },
          data: {
            status: "EXPIRED",
            cancelReason: "Tự động hủy do bác sĩ không xác nhận trong vòng 24 giờ kể từ khi đặt lịch",
          },
        });

        for (const appt of expired) {
          await tx.notification.create({
            data: {
              userId: appt.patient.user.id,
              title: "Lịch hẹn đã hết hạn xác nhận 🗙",
              message: `Lịch khám lúc ${appt.slotTime} đã tự động hết hạn do bác sĩ không xác nhận kịp thời.`,
              type: "SYSTEM",
            },
          });
        }
      });
    }
    summary.expiredCount = expired.length;

    return Response.json({ success: true, message: "Cron triggered successfully", summary });
  } catch (error) {
    console.error("Cron handler error:", error);
    return Response.json({ success: false, error: "Cron execution error" }, { status: 500 });
  }
}
