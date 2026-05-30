import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ScheduleClient from "./ScheduleClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Thiết lập lịch làm việc" };

export default async function DoctorSchedulePage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "DOCTOR") {
    redirect("/login");
  }

  const doctorId = session.user.doctorId;
  if (!doctorId) {
    redirect("/login");
  }

  const schedules = await prisma.doctorSchedule.findMany({
    where: { doctorId },
    orderBy: { dayOfWeek: "asc" },
  });

  return (
    <ScheduleClient
      doctorId={doctorId}
      initialSchedules={JSON.parse(JSON.stringify(schedules))}
    />
  );
}
