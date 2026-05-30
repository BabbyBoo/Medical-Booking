import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MedicalRecordsClient from "./MedicalRecordsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Lịch sử khám & Đơn thuốc" };

export default async function PatientMedicalRecordsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PATIENT") {
    redirect("/login");
  }

  const medicalRecords = await prisma.medicalRecord.findMany({
    where: {
      appointment: {
        patientId: session.user.patientId!,
      },
    },
    include: {
      appointment: {
        include: {
          patient: {
            include: {
              user: {
                select: {
                  name: true,
                  dateOfBirth: true,
                  gender: true,
                  phone: true,
                  address: true,
                },
              },
            },
          },
          doctor: {
            include: {
              user: { select: { name: true, avatar: true } },
              specialty: { select: { name: true, icon: true } },
            },
          },
        },
      },
      prescriptions: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return <MedicalRecordsClient initialRecords={JSON.parse(JSON.stringify(medicalRecords))} />;
}
