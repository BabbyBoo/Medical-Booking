import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AppointmentDetailClient from "./AppointmentDetailClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Chi tiết lịch hẹn" };

export default async function AppointmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      doctor: {
        include: {
          user: { select: { name: true, avatar: true, phone: true } },
          specialty: { select: { name: true, icon: true } },
        },
      },
      patient: {
        include: {
          user: { select: { name: true, phone: true, dateOfBirth: true, gender: true } },
        },
      },
      payment: true,
      medicalRecord: { include: { prescriptions: true } },
      review: true,
    },
  });

  if (!appointment) notFound();

  // Auth check
  if (
    session?.user?.role === "PATIENT" &&
    appointment.patientId !== session?.user?.patientId
  ) {
    notFound();
  }

  return (
    <AppointmentDetailClient
      appointment={appointment as any}
      currentRole={session?.user?.role || "PATIENT"}
      currentPatientId={session?.user?.patientId || ""}
    />
  );
}
