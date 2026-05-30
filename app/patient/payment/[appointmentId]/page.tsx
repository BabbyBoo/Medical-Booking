import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import PaymentClient from "./PaymentClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Thanh toán" };

export default async function PaymentPage({ params }: { params: { appointmentId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const appointment = await prisma.appointment.findUnique({
    where: { id: params.appointmentId },
    include: {
      doctor: {
        include: {
          user: { select: { name: true } },
          specialty: { select: { name: true, icon: true } },
        },
      },
      payment: true,
    },
  });

  if (!appointment || appointment.patientId !== session.user.patientId) notFound();
  if (appointment.payment?.status === "PAID") {
    redirect(`/patient/appointments/${params.appointmentId}`);
  }

  return <PaymentClient appointment={appointment as any} />;
}
