"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Clock, CheckCircle, XCircle, ChevronRight, Search, Filter } from "lucide-react";
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils";

interface Appointment {
  id: string;
  appointmentDate: string;
  slotTime: string;
  status: string;
  symptoms: string | null;
  doctor: {
    user: { name: string };
    specialty: { name: string; icon: string | null };
  };
  payment: { amount: string; status: string } | null;
  review: { id: string } | null;
}

const STATUS_TABS = [
  { key: "", label: "Tất cả" },
  { key: "PENDING,CONFIRMED", label: "Sắp tới" },
  { key: "COMPLETED", label: "Đã hoàn thành" },
  { key: "CANCELLED,EXPIRED,NO_SHOW", label: "Đã hủy / Vắng mặt" },
];

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      const res = await fetch(`/api/appointments?${params}`);
      const json = await res.json();
      if (json.success) {
        setAppointments(json.data.appointments);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAppointments(); }, []);

  const filtered = appointments.filter((a) => {
    if (!activeTab) return true;
    const statuses = activeTab.split(",");
    return statuses.includes(a.status);
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Lịch hẹn của tôi</h1>
          <p>Theo dõi tất cả lịch khám của bạn</p>
        </div>
        <Link href="/patient/doctors" className="btn-primary text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Đặt lịch mới
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 flex gap-4">
              <div className="skeleton w-12 h-12 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium">Không có lịch hẹn nào</p>
          <Link href="/patient/doctors" className="text-cyan-600 text-sm font-medium mt-2 inline-block">
            Đặt lịch khám →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((appt) => (
            <Link
              key={appt.id}
              href={`/patient/appointments/${appt.id}`}
              className="card p-4 flex items-center gap-4 hover:border-cyan-200 transition-colors group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0">
                {appt.doctor.user.name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900">{appt.doctor.user.name}</div>
                <div className="text-sm text-slate-500">
                  {appt.doctor.specialty.icon} {appt.doctor.specialty.name}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(appt.appointmentDate)}
                  <span>•</span>
                  <Clock className="w-3.5 h-3.5" />
                  {appt.slotTime}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`badge ${getStatusColor(appt.status)}`}>
                  {getStatusLabel(appt.status)}
                </span>
                {appt.payment && (
                  <span className="text-xs text-slate-500">
                    {formatCurrency(parseFloat(appt.payment.amount))}
                  </span>
                )}
                {appt.status === "COMPLETED" && !appt.review && (
                  <span className="text-xs text-amber-600 font-medium">Chờ đánh giá</span>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-cyan-500 transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
