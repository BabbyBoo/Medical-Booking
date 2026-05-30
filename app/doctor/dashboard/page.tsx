import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Calendar, Clock, CheckCircle, Users, ChevronRight } from "lucide-react";
import { formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Tổng quan" };

export default async function DoctorDashboard() {
  const session = await getServerSession(authOptions);
  const doctorId = session?.user?.doctorId;

  if (!doctorId) {
    redirect("/api/auth/signout");
  }

  const [todayAppointments, stats] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        doctorId: doctorId!,
        appointmentDate: {
          gte: (() => {
            const nowUtc = new Date();
            const nowGmt7 = new Date(nowUtc.getTime() + 7 * 60 * 60 * 1000);
            return new Date(Date.UTC(nowGmt7.getUTCFullYear(), nowGmt7.getUTCMonth(), nowGmt7.getUTCDate(), 0, 0, 0, 0));
          })(),
          lte: (() => {
            const nowUtc = new Date();
            const nowGmt7 = new Date(nowUtc.getTime() + 7 * 60 * 60 * 1000);
            return new Date(Date.UTC(nowGmt7.getUTCFullYear(), nowGmt7.getUTCMonth(), nowGmt7.getUTCDate(), 23, 59, 59, 999));
          })(),
        },
      },
      include: {
        patient: { include: { user: { select: { name: true } } } },
      },
      orderBy: { slotTime: "asc" },
    }),
    prisma.appointment.groupBy({
      by: ["status"],
      where: { doctorId: doctorId! },
      _count: true,
    }),
  ]);

  const statMap = stats.reduce((acc, s) => ({ ...acc, [s.status]: s._count }), {} as Record<string, number>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>Xin chào, {session?.user?.name}! 👋</h1>
        <p>Quản lý lịch hẹn và bệnh nhân của bạn</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-icon bg-amber-50"><Calendar className="w-6 h-6 text-amber-600" /></div>
          <div>
            <div className="text-2xl font-bold">{statMap["PENDING"] || 0}</div>
            <div className="text-sm text-slate-500">Chờ xác nhận</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-blue-50"><Clock className="w-6 h-6 text-blue-600" /></div>
          <div>
            <div className="text-2xl font-bold">{statMap["CONFIRMED"] || 0}</div>
            <div className="text-sm text-slate-500">Đã xác nhận</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-emerald-50"><CheckCircle className="w-6 h-6 text-emerald-600" /></div>
          <div>
            <div className="text-2xl font-bold">{statMap["COMPLETED"] || 0}</div>
            <div className="text-sm text-slate-500">Đã hoàn thành</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-cyan-50"><Users className="w-6 h-6 text-cyan-600" /></div>
          <div>
            <div className="text-2xl font-bold">{todayAppointments.length}</div>
            <div className="text-sm text-slate-500">Hôm nay</div>
          </div>
        </div>
      </div>

      {/* Today's appointments */}
      <div className="card">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Lịch hẹn hôm nay</h2>
          <Link href="/doctor/appointments" className="text-sm text-cyan-600 font-medium flex items-center gap-1">
            Xem tất cả <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="divide-y divide-slate-50">
          {todayAppointments.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Không có lịch hẹn hôm nay</p>
            </div>
          ) : (
            todayAppointments.map((appt) => (
              <Link
                key={appt.id}
                href={`/doctor/appointments/${appt.id}`}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {appt.slotTime}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{appt.patient.user.name}</div>
                  <div className="text-sm text-slate-500">Lúc {appt.slotTime}</div>
                </div>
                <span className={`badge ${getStatusColor(appt.status)}`}>
                  {getStatusLabel(appt.status)}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
