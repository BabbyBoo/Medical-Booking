import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BookingClient from "./BookingClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Đặt lịch khám" };

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: { doctorId: string };
  searchParams: { date?: string; time?: string };
}) {
  const doctor = await prisma.doctor.findUnique({
    where: { id: params.doctorId, isActive: true },
    include: {
      user: { select: { name: true, avatar: true } },
      specialty: { select: { name: true, icon: true } },
      schedules: { where: { isActive: true } },
    },
  });

  if (!doctor) notFound();

  return (
    <BookingClient
      doctor={doctor as any}
      initialDate={searchParams.date || ""}
      initialTime={searchParams.time || ""}
    />
  );
}
