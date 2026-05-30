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

      // --- 1. REMIND 24H BEFORE ---
      const remind24h = await prisma.appointment.findMany({
        where: {
          status: "CONFIRMED",
          appointmentDate: {
            gte: new Date(now.getTime() + 23 * 60 * 60 * 1000), // ~23-25 hours from now
            lte: new Date(now.getTime() + 25 * 60 * 60 * 1000),
          },
          reminders: {
            none: { type: "24H" }, // Not reminded yet
          },
        },
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } },
        },
      });

      for (const appt of remind24h) {
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
      const remind1h = await prisma.appointment.findMany({
        where: {
          status: "CONFIRMED",
          appointmentDate: {
            gte: new Date(now.getTime() + 30 * 60 * 1000), // ~30-90 minutes from now
            lte: new Date(now.getTime() + 90 * 60 * 1000),
          },
          reminders: {
            none: { type: "1H" }, // Not reminded yet
          },
        },
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } },
        },
      });

      for (const appt of remind1h) {
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
