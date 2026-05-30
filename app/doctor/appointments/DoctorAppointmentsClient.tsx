"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter, Calendar, Clock, User, ChevronRight, FileText } from "lucide-react";
import { formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";

interface PatientUser {
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
}

interface Patient {
  user: PatientUser;
}

interface Payment {
  id: string;
  amount: string;
  status: string;
}

interface Appointment {
  id: string;
  patientId: string;
  appointmentDate: string;
  slotTime: string;
  status: string;
  symptoms: string | null;
  patient: Patient;
  payment: Payment | null;
  medicalRecord: { id: string } | null;
}

export default function DoctorAppointmentsClient({
  initialAppointments,
}: {
  initialAppointments: Appointment[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");

  const filteredAppointments = initialAppointments.filter((appt) => {
    const patientName = appt.patient.user.name.toLowerCase();
    const matchesSearch = patientName.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || appt.status === statusFilter;
    const matchesDate = !dateFilter || appt.appointmentDate.startsWith(dateFilter);

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>Lịch hẹn của tôi</h1>
        <p>Quản lý tất cả danh sách đăng ký lịch khám của bệnh nhân</p>
      </div>

      {/* Filter bar */}
      <div className="card p-4 grid md:grid-cols-3 gap-4 items-center bg-white">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Tìm theo tên bệnh nhân..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xác nhận</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="COMPLETED">Đã hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
            <option value="EXPIRED">Đã hết hạn</option>
          </select>
        </div>

        <div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input-field"
          />
        </div>
      </div>

      {/* Appointments List/Table */}
      {filteredAppointments.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Không có lịch hẹn nào</h3>
          <p className="text-sm">Không tìm thấy lịch hẹn nào khớp với bộ lọc tìm kiếm.</p>
        </div>
      ) : (
        <div className="card overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-700 font-semibold">
                <tr>
                  <th className="p-4">Bệnh nhân</th>
                  <th className="p-4">Thời gian khám</th>
                  <th className="p-4">Triệu chứng</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Thanh toán</th>
                  <th className="p-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Patient Name & Phone */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
                          {appt.patient.user.avatar ? (
                            <img
                              src={appt.patient.user.avatar}
                              alt="Avatar"
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            appt.patient.user.name[0]?.toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{appt.patient.user.name}</div>
                          <div className="text-xs text-slate-500">{appt.patient.user.phone || "Không có SĐT"}</div>
                        </div>
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-950 font-medium">
                          <Clock className="w-4 h-4 text-cyan-600" />
                          <span>{appt.slotTime}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatDate(appt.appointmentDate)}
                        </div>
                      </div>
                    </td>

                    {/* Symptoms */}
                    <td className="p-4 max-w-[220px]">
                      <div className="text-slate-600 truncate" title={appt.symptoms || "Không có"}>
                        {appt.symptoms || <span className="text-slate-400 italic">Không có triệu chứng ghi nhận</span>}
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="p-4">
                      <span className={`badge ${getStatusColor(appt.status)}`}>
                        {getStatusLabel(appt.status)}
                      </span>
                    </td>

                    {/* Payment status */}
                    <td className="p-4">
                      {appt.payment ? (
                        <div className="space-y-0.5">
                          <span
                            className={`badge ${
                              appt.payment.status === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : appt.payment.status === "REFUNDED"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {appt.payment.status === "PAID"
                              ? "Đã trả"
                              : appt.payment.status === "REFUNDED"
                              ? "Đã hoàn"
                              : "Chưa trả"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Miễn phí</span>
                      )}
                    </td>

                    {/* Action button */}
                    <td className="p-4 text-right">
                      <Link
                        href={`/doctor/appointments/${appt.id}`}
                        className="btn-secondary py-1.5 px-3.5 text-xs inline-flex items-center gap-1 hover:border-cyan-500 hover:text-cyan-600"
                      >
                        Chi tiết <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
