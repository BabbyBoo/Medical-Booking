import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DoctorProfileClient from "./DoctorProfileClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Hồ sơ bác sĩ" };

export default async function DoctorProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "DOCTOR") {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      doctorProfile: {
        include: { specialty: true },
      },
    },
  });

  if (!user || !user.doctorProfile) {
    redirect("/login");
  }

  return <DoctorProfileClient user={JSON.parse(JSON.stringify(user))} />;
}
