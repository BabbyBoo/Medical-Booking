import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import DoctorAppointmentDetailClient from "./DoctorAppointmentDetailClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Chi tiết lịch khám" };

export default async function DoctorAppointmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "DOCTOR") {
    redirect("/login");
  }

  const doctorId = session.user.doctorId;
  if (!doctorId) {
    redirect("/login");
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      patient: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
              gender: true,
              dateOfBirth: true,
              address: true,
              avatar: true,
            },
          },
        },
      },
      payment: true,
      medicalRecord: {
        include: {
          prescriptions: true,
        },
      },
    },
  });

  if (!appointment || appointment.doctorId !== doctorId) {
    notFound();
  }

  return (
    <DoctorAppointmentDetailClient
      appointment={JSON.parse(JSON.stringify(appointment))}
    />
  );
}
