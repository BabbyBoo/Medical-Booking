import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BookingClient from "./BookingClient";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = { title: "Đặt lịch khám" };

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: { doctorId: string };
  searchParams: { date?: string; time?: string; previousAppointmentId?: string };
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

  const session = await getServerSession(authOptions);
  let hasActiveAppointment = false;
  if (session?.user?.patientId) {
    const activeAppt = await prisma.appointment.findFirst({
      where: {
        patientId: session.user.patientId,
        doctorId: params.doctorId,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });
    if (activeAppt) {
      hasActiveAppointment = true;
    }
  }

  return (
    <BookingClient
      doctor={doctor as any}
      initialDate={searchParams.date || ""}
      initialTime={searchParams.time || ""}
      hasActiveAppointment={hasActiveAppointment}
      previousAppointmentId={searchParams.previousAppointmentId || ""}
    />
  );
}
