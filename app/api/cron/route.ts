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
    // --- 1. REMIND CONFIRMED APPOINTMENTS T-24H ---
    const remind24h = await prisma.appointment.findMany({
      where: {
        status: "CONFIRMED",
        appointmentDate: {
          gte: new Date(now.getTime() + 23 * 60 * 60 * 1000),
          lte: new Date(now.getTime() + 25 * 60 * 60 * 1000),
        },
        reminders: { none: { type: "24H" } },
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
      },
    });

    for (const appt of remind24h) {
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
    }
    summary.reminded24hCount = remind24h.length;

    // --- 2. REMIND CONFIRMED APPOINTMENTS T-1H ---
    const remind1h = await prisma.appointment.findMany({
      where: {
        status: "CONFIRMED",
        appointmentDate: {
          gte: new Date(now.getTime() + 30 * 60 * 1000),
          lte: new Date(now.getTime() + 90 * 60 * 1000),
        },
        reminders: { none: { type: "1H" } },
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
      },
    });

    for (const appt of remind1h) {
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
    }
    summary.reminded1hCount = remind1h.length;

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
