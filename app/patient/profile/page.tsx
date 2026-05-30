import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Hồ sơ cá nhân" };

export default async function PatientProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      patientProfile: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return <ProfileClient user={JSON.parse(JSON.stringify(user))} />;
}
