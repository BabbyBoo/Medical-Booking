import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminAppointmentsClient from "./AdminAppointmentsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Quản lý lịch hẹn" };

export default async function AdminAppointmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const [appointments, doctors, specialties] = await Promise.all([
    prisma.appointment.findMany({
      include: {
        patient: { include: { user: { select: { name: true, phone: true } } } },
        doctor: { include: { user: { select: { name: true } } } },
        payment: true,
      },
      orderBy: { appointmentDate: "desc" },
    }),
    prisma.doctor.findMany({
      include: { user: { select: { name: true } } },
    }),
    prisma.specialty.findMany(),
  ]);

  return (
    <AdminAppointmentsClient
      initialAppointments={JSON.parse(JSON.stringify(appointments))}
      doctors={JSON.parse(JSON.stringify(doctors))}
      specialties={JSON.parse(JSON.stringify(specialties))}
    />
  );
}
