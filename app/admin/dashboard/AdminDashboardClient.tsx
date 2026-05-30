"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Stethoscope,
  Calendar,
  CreditCard,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils";

interface Stats {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  totalRevenue: number;
}

interface Appointment {
  id: string;
  patient: { user: { name: string } };
  doctor: { user: { name: string } };
  appointmentDate: string;
  slotTime: string;
  status: string;
}

export default function AdminDashboardClient({
  stats,
  recentAppointments,
}: {
  stats: Stats;
  recentAppointments: Appointment[];
}) {
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Broadcast form states
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetRole, setTargetRole] = useState("ALL");

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setNotifyLoading(true);
    setNotifyMessage(null);

    try {
      const res = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, targetRole }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifyMessage({ type: "success", text: data.message });
        setTitle("");
        setMessage("");
      } else {
        setNotifyMessage({ type: "error", text: data.error || "Gửi thất bại" });
      }
    } catch (err) {
      setNotifyMessage({ type: "error", text: "Lỗi kết nối máy chủ" });
    } finally {
      setNotifyLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>Tổng quan quản trị</h1>
        <p>Quản lý hệ thống, thống kê doanh thu và gửi thông báo chung</p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card bg-white">
          <div className="stat-icon bg-blue-50">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalPatients}</div>
            <div className="text-sm text-slate-500">Bệnh nhân</div>
          </div>
        </div>

        <div className="stat-card bg-white">
          <div className="stat-icon bg-cyan-50">
            <Stethoscope className="w-6 h-6 text-cyan-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalDoctors}</div>
            <div className="text-sm text-slate-500">Bác sĩ chuyên khoa</div>
          </div>
        </div>

        <div className="stat-card bg-white">
          <div className="stat-icon bg-indigo-50">
            <Calendar className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalAppointments}</div>
            <div className="text-sm text-slate-500">Lịch hẹn đã đặt</div>
          </div>
        </div>

        <div className="stat-card bg-white">
          <div className="stat-icon bg-emerald-50">
            <CreditCard className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <div className="text-sm text-slate-500">Tổng doanh thu</div>
          </div>
        </div>
      </div>

      {/* Dashboard Main layout */}
      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        {/* Left column - Recent appointments & links */}
        <div className="space-y-6">
          {/* Quick links grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Link
              href="/admin/users"
              className="card p-4 text-center hover:border-cyan-500 transition-colors flex flex-col items-center justify-center gap-2 group"
            >
              <Users className="w-6 h-6 text-slate-600 group-hover:text-cyan-600 transition-colors" />
              <span className="text-sm font-semibold text-slate-700">Quản lý người dùng</span>
            </Link>

            <Link
              href="/admin/doctors"
              className="card p-4 text-center hover:border-cyan-500 transition-colors flex flex-col items-center justify-center gap-2 group"
            >
              <Stethoscope className="w-6 h-6 text-slate-600 group-hover:text-cyan-600 transition-colors" />
              <span className="text-sm font-semibold text-slate-700">Bác sĩ & Chuyên khoa</span>
            </Link>

            <Link
              href="/admin/appointments"
              className="card p-4 text-center hover:border-cyan-500 transition-colors flex flex-col items-center justify-center gap-2 group"
            >
              <Calendar className="w-6 h-6 text-slate-600 group-hover:text-cyan-600 transition-colors" />
              <span className="text-sm font-semibold text-slate-700">Quản lý lịch hẹn</span>
            </Link>

            <Link
              href="/admin/statistics"
              className="card p-4 text-center hover:border-cyan-500 transition-colors flex flex-col items-center justify-center gap-2 group"
            >
              <BarChart3 className="w-6 h-6 text-slate-600 group-hover:text-cyan-600 transition-colors" />
              <span className="text-sm font-semibold text-slate-700">Báo cáo & Thống kê</span>
            </Link>

            <Link
              href="/admin/payments"
              className="card p-4 text-center hover:border-cyan-500 transition-colors flex flex-col items-center justify-center gap-2 group"
            >
              <CreditCard className="w-6 h-6 text-slate-600 group-hover:text-cyan-600 transition-colors" />
              <span className="text-sm font-semibold text-slate-700">Giao dịch thanh toán</span>
            </Link>
          </div>

          {/* Recent Appointments */}
          <div className="card">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-sm">Hoạt động đặt lịch gần đây</h2>
              <Link
                href="/admin/appointments"
                className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold inline-flex items-center gap-0.5"
              >
                Xem chi tiết <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {recentAppointments.length === 0 ? (
                <div className="p-8 text-center text-slate-400">Không có hoạt động gần đây</div>
              ) : (
                recentAppointments.map((appt) => (
                  <div key={appt.id} className="p-4 flex items-center justify-between gap-4 text-sm">
                    <div>
                      <span className="font-semibold text-slate-900">{appt.patient.user.name}</span>
                      <span className="text-slate-400"> đặt lịch khám với </span>
                      <span className="font-semibold text-slate-900">{appt.doctor.user.name}</span>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Ngày {formatDate(appt.appointmentDate)} vào lúc {appt.slotTime}
                      </div>
                    </div>
                    <span className={`badge ${getStatusColor(appt.status)}`}>
                      {getStatusLabel(appt.status)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column - Broadcast form */}
        <div className="card p-6 bg-white self-start space-y-4">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Gửi thông báo hệ thống</h2>
            <p className="text-xs text-slate-500 mt-1">
              Gửi tin nhắn trực tiếp đến chuông thông báo (Notification Center) của các tài khoản trên hệ thống.
            </p>
          </div>

          {notifyMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex gap-2 items-start ${
                notifyMessage.type === "success"
                  ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                  : "bg-red-50 border-red-100 text-red-800"
              }`}
            >
              {notifyMessage.type === "success" ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              )}
              <span className="font-medium">{notifyMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <label className="label text-xs">Đối tượng nhận tin</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="input-field py-2 text-xs"
              >
                <option value="ALL">Tất cả người dùng (All)</option>
                <option value="PATIENT">Chỉ Bệnh nhân (Patients)</option>
                <option value="DOCTOR">Chỉ Bác sĩ (Doctors)</option>
              </select>
            </div>

            <div>
              <label className="label text-xs">Tiêu đề thông báo</label>
              <input
                type="text"
                required
                placeholder="VD: Bảo trì hệ thống tối nay..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field py-2 text-xs"
              />
            </div>

            <div>
              <label className="label text-xs">Nội dung thông báo</label>
              <textarea
                rows={4}
                required
                placeholder="Nhập thông tin thông báo chi tiết..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="input-field py-2 text-xs resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={notifyLoading || !title.trim() || !message.trim()}
              className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-1.5"
            >
              {notifyLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Phát sóng thông báo
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
