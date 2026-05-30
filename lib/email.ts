import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.mailtrap.io",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailOptions) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[EMAIL MOCK] To: ${to}, Subject: ${subject}`);
    return { success: true, mocked: true };
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "no-reply@medicalbook.vn",
      to,
      subject,
      text,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error };
  }
}

export function getWelcomeEmailHtml(name: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0891b2;">Chào mừng đến với MedBook!</h2>
      <p>Xin chào <strong>${name}</strong>,</p>
      <p>Tài khoản của bạn đã được tạo thành công.</p>
      <p>Bạn có thể đăng nhập và bắt đầu đặt lịch khám tại hệ thống của chúng tôi.</p>
      <p>Trân trọng,<br/>Đội ngũ MedBook</p>
    </div>
  `;
}

export function getAppointmentConfirmEmailHtml(data: {
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0891b2;">Xác nhận đặt lịch khám</h2>
      <p>Xin chào <strong>${data.patientName}</strong>,</p>
      <p>Lịch khám của bạn đã được đặt thành công:</p>
      <ul>
        <li><strong>Bác sĩ:</strong> ${data.doctorName}</li>
        <li><strong>Ngày:</strong> ${data.date}</li>
        <li><strong>Giờ:</strong> ${data.time}</li>
      </ul>
      <p>Trân trọng,<br/>Đội ngũ MedBook</p>
    </div>
  `;
}
