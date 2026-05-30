import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminPaymentsClient from "./AdminPaymentsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Quản lý thanh toán" };

export default async function AdminPaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const payments = await prisma.payment.findMany({
    include: {
      appointment: {
        include: {
          patient: { include: { user: { select: { name: true } } } },
          doctor: { include: { user: { select: { name: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return <AdminPaymentsClient initialPayments={JSON.parse(JSON.stringify(payments))} />;
}
