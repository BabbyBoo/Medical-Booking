import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminDoctorsClient from "./AdminDoctorsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bác sĩ & Chuyên khoa" };

export default async function AdminDoctorsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const [doctors, specialties] = await Promise.all([
    prisma.doctor.findMany({
      include: {
        user: { select: { name: true, email: true, phone: true, gender: true, isActive: true, avatar: true } },
        specialty: true,
      },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.specialty.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <AdminDoctorsClient
      initialDoctors={JSON.parse(JSON.stringify(doctors))}
      initialSpecialties={JSON.parse(JSON.stringify(specialties))}
    />
  );
}
