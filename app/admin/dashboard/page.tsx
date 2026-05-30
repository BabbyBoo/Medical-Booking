import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Quản trị viên – Tổng quan" };

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const [
    totalPatients,
    totalDoctors,
    totalAppointments,
    paidPayments,
    recentAppointments,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.doctor.count({ where: { isActive: true } }),
    prisma.appointment.count(),
    prisma.payment.findMany({
      where: { status: "PAID" },
      select: { amount: true },
    }),
    prisma.appointment.findMany({
      include: {
        patient: { include: { user: { select: { name: true } } } },
        doctor: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalRevenue = paidPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

  const stats = {
    totalPatients,
    totalDoctors,
    totalAppointments,
    totalRevenue,
  };

  return (
    <AdminDashboardClient
      stats={stats}
      recentAppointments={JSON.parse(JSON.stringify(recentAppointments))}
    />
  );
}
