import { prisma } from "@/lib/prisma";
import DoctorSearch from "./DoctorSearch";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tìm bác sĩ" };

export default async function DoctorsPage() {
  const specialties = await prisma.specialty.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return <DoctorSearch specialties={specialties} />;
}
