import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import DoctorProfileClient from "./DoctorProfileClient";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const doctor = await prisma.doctor.findUnique({
    where: { id: params.id },
    include: { user: { select: { name: true } }, specialty: true },
  });
  return {
    title: doctor?.user.name || "Hồ sơ bác sĩ",
  };
}

export default async function DoctorProfilePage({ params }: Props) {
  const doctor = await prisma.doctor.findUnique({
    where: { id: params.id, isActive: true },
    include: {
      user: { select: { name: true, avatar: true, phone: true, email: true, gender: true } },
      specialty: true,
      schedules: { where: { isActive: true } },
      reviews: {
        where: { isPublic: true },
        include: {
          patient: { include: { user: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      _count: { select: { reviews: true, appointments: true } },
    },
  });

  if (!doctor) notFound();

  const session = await getServerSession(authOptions);
  let hasActiveAppointment = false;
  if (session?.user?.patientId) {
    const activeAppt = await prisma.appointment.findFirst({
      where: {
        patientId: session.user.patientId,
        doctorId: params.id,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });
    if (activeAppt) {
      hasActiveAppointment = true;
    }
  }

  return <DoctorProfileClient doctor={doctor as any} hasActiveAppointment={hasActiveAppointment} />;
}
