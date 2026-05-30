import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Stethoscope,
  ChevronRight,
  Plus,
} from "lucide-react";
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Tổng quan" };

export default async function PatientDashboard() {
  const session = await getServerSession(authOptions);
  const patientId = session?.user?.patientId;

  if (!patientId) {
    redirect("/api/auth/signout");
  }

  const [appointments, stats] = await Promise.all([
    prisma.appointment.findMany({
      where: { patientId: patientId! },
      include: {
        doctor: {
          include: {
            user: { select: { name: true, avatar: true } },
            specialty: { select: { name: true, icon: true } },
          },
        },
        payment: { select: { status: true, amount: true } },
      },
      orderBy: { appointmentDate: "desc" },
      take: 5,
    }),
    prisma.appointment.groupBy({
      by: ["status"],
      where: { patientId: patientId! },
      _count: true,
    }),
  ]);

  const statMap = stats.reduce((acc, s) => ({ ...acc, [s.status]: s._count }), {} as Record<string, number>);
  const totalAppointments = appointments.length;
  const upcoming = appointments.filter(a => a.status === "CONFIRMED" || a.status === "PENDING").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>Xin chào, {session?.user?.name?.split(" ").slice(-1)[0]}! 👋</h1>
        <p>Quản lý lịch khám và theo dõi sức khỏe của bạn</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-icon bg-blue-50">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{statMap["PENDING"] || 0}</div>
            <div className="text-sm text-slate-500">Chờ xác nhận</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-emerald-50">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{statMap["CONFIRMED"] || 0}</div>
            <div className="text-sm text-slate-500">Đã xác nhận</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-violet-50">
            <Clock className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{statMap["COMPLETED"] || 0}</div>
            <div className="text-sm text-slate-500">Đã hoàn thành</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-red-50">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{statMap["CANCELLED"] || 0}</div>
            <div className="text-sm text-slate-500">Đã hủy</div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href="/patient/doctors"
          className="card p-5 flex items-center gap-4 group hover:-translate-y-0.5 transition-transform"
        >
          <div className="w-12 h-12 bg-cyan-50 rounded-2xl flex items-center justify-center group-hover:bg-cyan-100 transition-colors">
            <Stethoscope className="w-6 h-6 text-cyan-600" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-slate-900">Đặt lịch khám mới</div>
            <div className="text-sm text-slate-500">Tìm bác sĩ phù hợp</div>
          </div>
          <Plus className="w-5 h-5 text-slate-400 group-hover:text-cyan-600 transition-colors" />
        </Link>

        <Link
          href="/patient/appointments"
          className="card p-5 flex items-center gap-4 group hover:-translate-y-0.5 transition-transform"
        >
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
            <Calendar className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-slate-900">Lịch hẹn của tôi</div>
            <div className="text-sm text-slate-500">{upcoming} lịch sắp tới</div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
        </Link>
      </div>

      {/* Recent appointments */}
      <div className="card">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Lịch hẹn gần đây</h2>
          <Link href="/patient/appointments" className="text-sm text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1">
            Xem tất cả <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="divide-y divide-slate-50">
          {appointments.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Chưa có lịch hẹn nào</p>
              <Link href="/patient/doctors" className="text-cyan-600 text-sm font-medium mt-2 inline-block">
                Đặt lịch ngay →
              </Link>
            </div>
          ) : (
            appointments.map((appt) => (
              <Link
                key={appt.id}
                href={`/patient/appointments/${appt.id}`}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {appt.doctor.user.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 truncate">{appt.doctor.user.name}</div>
                  <div className="text-sm text-slate-500">
                    {appt.doctor.specialty.icon} {appt.doctor.specialty.name} •{" "}
                    {appt.slotTime} {formatDate(appt.appointmentDate)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`badge ${getStatusColor(appt.status)}`}>
                    {getStatusLabel(appt.status)}
                  </span>
                  {appt.payment && (
                    <span className="text-xs text-slate-500">
                      {formatCurrency(appt.payment.amount.toString())}
                    </span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
