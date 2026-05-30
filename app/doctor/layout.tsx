import Sidebar from "@/components/shared/Sidebar";
import NotificationBell from "@/components/shared/NotificationBell";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Bác sĩ",
    template: "%s | Bác sĩ – MedBook",
  },
};

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "DOCTOR") {
    redirect("/login");
  }

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                {session.user.name?.[0]?.toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-slate-900">{session.user.name}</div>
                <div className="text-xs text-slate-500">Bác sĩ</div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
