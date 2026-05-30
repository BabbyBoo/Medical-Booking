import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DoctorAppointmentsClient from "./DoctorAppointmentsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Danh sách lịch hẹn" };

export default async function DoctorAppointmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "DOCTOR") {
    redirect("/login");
  }

  const doctorId = session.user.doctorId;
  if (!doctorId) {
    redirect("/login");
  }

  const appointments = await prisma.appointment.findMany({
    where: { doctorId },
    include: {
      patient: {
        include: {
          user: { select: { name: true, email: true, phone: true, avatar: true } },
        },
      },
      payment: true,
      medicalRecord: { select: { id: true } },
    },
    orderBy: { appointmentDate: "desc" },
  });

  return (
    <DoctorAppointmentsClient
      initialAppointments={JSON.parse(JSON.stringify(appointments))}
    />
  );
}
