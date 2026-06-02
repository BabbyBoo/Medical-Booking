import cron from "node-cron";
import { prisma } from "./prisma";
import { sendEmail } from "./email";

// Cron job running every 30 minutes to remind patient 24h and 1h before appointment
export function initCronJobs() {
  console.log("⚙️  Initializing system cron jobs...");

  // UC26: Remind patient T-24h and T-1h
  cron.schedule("*/30 * * * *", async () => {
    try {
      const now = new Date();

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

      for (const appt of appointments) {
        const dateStr = appt.appointmentDate.toISOString().split("T")[0];
        const apptDateTime = new Date(`${dateStr}T${appt.slotTime}:00+07:00`);
        const diffMs = apptDateTime.getTime() - now.getTime();

        // --- 1. REMIND 24H BEFORE ---
        const has24hReminder = appt.reminders.some((r) => r.type === "24H");
        if (diffMs >= 23 * 60 * 60 * 1000 && diffMs <= 25 * 60 * 60 * 1000 && !has24hReminder) {
          // Send email notification
          await sendEmail({
            to: appt.patient.user.email,
            subject: "Nhắc nhở: Lịch khám bệnh của bạn vào ngày mai ✓",
            text: `Xin chào ${appt.patient.user.name},\n\nBạn có lịch khám bệnh lúc ${appt.slotTime} ngày mai với BS. ${appt.doctor.user.name}.\nVui lòng đến đúng giờ hẹn.\n\nTrân trọng,\nMedBook.`,
            html: `<p>Xin chào <strong>${appt.patient.user.name}</strong>,</p>
                   <p>Bạn có lịch khám bệnh lúc <strong>${appt.slotTime} ngày mai</strong> với <strong>BS. ${appt.doctor.user.name}</strong>.</p>
                   <p>Vui lòng đến đúng giờ hẹn tại phòng khám.</p>
                   <p>Trân trọng,<br/>Đội ngũ MedBook.</p>`,
          });

          // Create in-app notification
          await prisma.notification.create({
            data: {
              userId: appt.patient.user.id,
              title: "Nhắc lịch khám ngày mai",
              message: `Lịch khám lúc ${appt.slotTime} ngày mai với BS. ${appt.doctor.user.name}`,
              type: "REMINDER",
            },
          });

          // Mark as reminded
          await prisma.appointmentReminder.create({
            data: {
              appointmentId: appt.id,
              type: "24H",
            },
          });
        }

        // --- 2. REMIND 1H BEFORE ---
        const has1hReminder = appt.reminders.some((r) => r.type === "1H");
        if (diffMs >= 30 * 60 * 1000 && diffMs <= 90 * 60 * 1000 && !has1hReminder) {
          // Send email notification
          await sendEmail({
            to: appt.patient.user.email,
            subject: "Nhắc nhở: Lịch khám của bạn sắp diễn ra trong 1 giờ tới",
            text: `Xin chào ${appt.patient.user.name},\n\nLịch khám bệnh của bạn với BS. ${appt.doctor.user.name} sẽ bắt đầu lúc ${appt.slotTime} (trong khoảng 1 giờ nữa).\n\nTrân trọng,\nMedBook.`,
            html: `<p>Xin chào <strong>${appt.patient.user.name}</strong>,</p>
                   <p>Lịch khám bệnh của bạn với <strong>BS. ${appt.doctor.user.name}</strong> sẽ diễn ra vào lúc <strong>${appt.slotTime}</strong> (khoảng 1 giờ nữa).</p>
                   <p>Trân trọng,<br/>Đội ngũ MedBook.</p>`,
          });

          // Create in-app notification
          await prisma.notification.create({
            data: {
              userId: appt.patient.user.id,
              title: "Lịch khám sắp diễn ra",
              message: `Lịch khám lúc ${appt.slotTime} với BS. ${appt.doctor.user.name} sẽ bắt đầu trong 1 giờ tới.`,
              type: "REMINDER",
            },
          });

          // Mark as reminded
          await prisma.appointmentReminder.create({
            data: {
              appointmentId: appt.id,
              type: "1H",
            },
          });
        }
      }
    } catch (error) {
      console.error("Error running reminder cron job:", error);
    }
  });

  // UC27: Auto-cancel expired pending appointments (every 15 minutes)
  cron.schedule("*/15 * * * *", async () => {
    try {
      const now = new Date();

      // Find pending appointments where expiredAt <= now
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
          // Update status to EXPIRED
          await tx.appointment.updateMany({
            where: {
              id: { in: expired.map((e) => e.id) },
            },
            data: {
              status: "EXPIRED",
              cancelReason: "Tự động hủy do bác sĩ không xác nhận trong vòng 24 giờ kể từ khi đặt lịch",
            },
          });

          // Create notification for each patient
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

        console.log(`[CRON] Auto-expired ${expired.length} appointments`);
      }
    } catch (error) {
      console.error("Error running expiration cron job:", error);
    }
  });
}
