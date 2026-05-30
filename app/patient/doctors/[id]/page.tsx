import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import DoctorProfileClient from "./DoctorProfileClient";
import type { Metadata } from "next";

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

  return <DoctorProfileClient doctor={doctor as any} />;
}
