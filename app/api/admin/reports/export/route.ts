import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return new Response("Unauthorized", { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "appointments";

    let csvContent = "";
    let filename = "report.csv";

    // Adding UTF-8 BOM so Excel decodes Vietnamese characters correctly
    const BOM = "\uFEFF";

    if (type === "appointments") {
      filename = "danh_sach_lich_hen.csv";
      const appointments = await prisma.appointment.findMany({
        include: {
          patient: { include: { user: { select: { name: true } } } },
          doctor: { include: { user: { select: { name: true } } } },
        },
        orderBy: { appointmentDate: "desc" },
      });

      csvContent = "Mã lịch hẹn,Bệnh nhân,Bác sĩ,Ngày khám,Giờ khám,Trạng thái\n";
      appointments.forEach((appt) => {
        const row = [
          appt.id,
          `"${appt.patient.user.name}"`,
          `"${appt.doctor.user.name}"`,
          appt.appointmentDate.toLocaleDateString("vi-VN"),
          appt.slotTime,
          appt.status,
        ];
        csvContent += row.join(",") + "\n";
      });
    } else if (type === "revenue") {
      filename = "bao_cao_doanh_thu.csv";
      const payments = await prisma.payment.findMany({
        include: {
          appointment: {
            include: {
              patient: { include: { user: { select: { name: true } } } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      csvContent = "Mã thanh toán,Bệnh nhân,Số tiền,Trạng thái,Phương thức,Ngày thanh toán\n";
      payments.forEach((payment) => {
        const row = [
          payment.id,
          `"${payment.appointment.patient.user.name}"`,
          payment.amount.toString(),
          payment.status,
          payment.method || "N/A",
          payment.paidAt ? payment.paidAt.toLocaleDateString("vi-VN") : "N/A",
        ];
        csvContent += row.join(",") + "\n";
      });
    } else if (type === "doctors") {
      filename = "danh_sach_bac_si.csv";
      const doctors = await prisma.doctor.findMany({
        include: {
          user: { select: { name: true, email: true } },
          specialty: true,
        },
      });

      csvContent = "Mã bác sĩ,Họ và tên,Email,Chuyên khoa,Số chứng chỉ,Giá khám,Đánh giá\n";
      doctors.forEach((doc) => {
        const row = [
          doc.id,
          `"${doc.user.name}"`,
          doc.user.email,
          `"${doc.specialty.name}"`,
          doc.licenseNumber,
          doc.consultingFee.toString(),
          doc.rating.toString(),
        ];
        csvContent += row.join(",") + "\n";
      });
    } else {
      return apiResponse(false, null, undefined, "Loại báo cáo không hợp lệ", 400);
    }

    return new Response(BOM + csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=${filename}`,
      },
    });
  } catch (error) {
    console.error("Export report error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
