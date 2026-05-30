"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  AlertCircle,
  XCircle,
  FileDown,
  Loader2,
  X,
  UserCheck,
  FileText,
} from "lucide-react";
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils";

interface Doctor {
  id: string;
  user: { name: string };
}

interface Specialty {
  id: string;
  name: string;
}

interface Appointment {
  id: string;
  patientId: string;
  appointmentDate: string;
  slotTime: string;
  status: string;
  cancelReason: string | null;
  patient: { user: { name: string; phone: string | null } };
  doctor: { id: string; user: { name: string } };
  payment: { amount: string; status: string } | null;
}

export default function AdminAppointmentsClient({
  initialAppointments,
  doctors,
  specialties,
}: {
  initialAppointments: Appointment[];
  doctors: Doctor[];
  specialties: Specialty[];
}) {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [doctorFilter, setDoctorFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");

  // Cancel state
  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Details Modal state
  const [detailsApptId, setDetailsApptId] = useState<string | null>(null);
  const [apptDetails, setApptDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const handleOpenDetails = async (apptId: string) => {
    setDetailsApptId(apptId);
    setApptDetails(null);
    setDetailsError(null);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/appointments/${apptId}`);
      const json = await res.json();
      if (json.success) {
        setApptDetails(json.data);
      } else {
        setDetailsError(json.error || "Không thể tải thông tin chi tiết");
      }
    } catch {
      setDetailsError("Lỗi kết nối máy chủ");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleForceCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApptId || !cancelReason.trim()) return;

    setCancelLoading(true);
    setCancelError(null);

    try {
      const res = await fetch(`/api/admin/appointments/${selectedApptId}/force-cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();

      if (data.success) {
        setAppointments((prev) =>
          prev.map((appt) =>
            appt.id === selectedApptId
              ? {
                  ...appt,
                  status: "CANCELLED",
                  cancelReason: `[Admin hủy] ${cancelReason}`,
                  payment: appt.payment ? { ...appt.payment, status: "REFUNDED" } : null,
                }
              : appt
          )
        );
        setSelectedApptId(null);
        setCancelReason("");
        router.refresh();
      } else {
        setCancelError(data.error || "Hủy lịch hẹn thất bại");
      }
    } catch (err) {
      setCancelError("Lỗi kết nối máy chủ");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleExport = () => {
    window.open("/api/admin/reports/export?type=appointments", "_blank");
  };

  const filteredAppointments = appointments.filter((appt) => {
    const patientName = appt.patient.user.name.toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch = patientName.includes(search) || appt.id.includes(search);
    const matchesStatus = statusFilter === "ALL" || appt.status === statusFilter;
    const matchesDoctor = doctorFilter === "ALL" || appt.doctor.id === doctorFilter;
    const matchesDate = !dateFilter || appt.appointmentDate.startsWith(dateFilter);

    return matchesSearch && matchesStatus && matchesDoctor && matchesDate;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1>Quản lý lịch hẹn</h1>
          <p className="text-slate-500 text-sm">Theo dõi trạng thái, thanh toán và hủy lịch hẹn khi cần thiết</p>
        </div>

        <button
          onClick={handleExport}
          className="btn-secondary py-2.5 text-xs flex items-center gap-1.5 text-slate-700 hover:border-cyan-500 hover:text-cyan-600 self-start"
        >
          <FileDown className="w-4 h-4" /> Xuất báo cáo CSV
        </button>
      </div>

      {/* Filter panel */}
      <div className="card p-4 grid sm:grid-cols-2 md:grid-cols-4 gap-4 items-center bg-white">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Tìm theo tên bệnh nhân, mã..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 text-xs py-2"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field text-xs py-2"
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
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="input-field text-xs py-2"
          >
            <option value="ALL">Tất cả bác sĩ</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.user.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input-field text-xs py-2"
          />
        </div>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Không tìm thấy lịch hẹn</h3>
          <p className="text-sm">Không tìm thấy lịch hẹn phù hợp với bộ lọc tìm kiếm.</p>
        </div>
      ) : (
        <div className="card overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-700 font-semibold">
                <tr>
                  <th className="p-4">Bệnh nhân</th>
                  <th className="p-4">Bác sĩ khám</th>
                  <th className="p-4">Lịch khám</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Thanh toán</th>
                  <th className="p-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Patient Name */}
                    <td className="p-4">
                      <div>
                        <div className="font-semibold text-slate-900">{appt.patient.user.name}</div>
                        <div className="text-xs text-slate-400">{appt.patient.user.phone || "Không có SĐT"}</div>
                      </div>
                    </td>

                    {/* Doctor Name */}
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{appt.doctor.user.name}</div>
                    </td>

                    {/* Date Time */}
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-900 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-cyan-600" />
                          <span>{appt.slotTime}</span>
                        </div>
                        <div className="text-xs text-slate-400">
                          {formatDate(appt.appointmentDate)}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span className={`badge ${getStatusColor(appt.status)}`}>
                        {getStatusLabel(appt.status)}
                      </span>
                      {appt.cancelReason && (
                        <div className="text-[10px] text-red-500 mt-1 max-w-[150px] truncate" title={appt.cancelReason}>
                          Lý do: {appt.cancelReason}
                        </div>
                      )}
                    </td>

                    {/* Payment status */}
                    <td className="p-4">
                      {appt.payment ? (
                        <div className="space-y-0.5">
                          <span
                            className={`badge ${
                              appt.payment.status === "PAID"
                                ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                                : appt.payment.status === "REFUNDED"
                                ? "bg-purple-50 border border-purple-100 text-purple-700"
                                : "bg-amber-50 border border-amber-100 text-amber-700"
                            }`}
                          >
                            {appt.payment.status === "PAID"
                              ? "Đã thanh toán"
                              : appt.payment.status === "REFUNDED"
                              ? "Đã hoàn"
                              : "Chưa thanh toán"}
                          </span>
                          <div className="text-[10px] text-slate-500 font-semibold pl-1">
                            {formatCurrency(appt.payment.amount)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">N/A</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenDetails(appt.id)}
                          className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center gap-1 hover:border-cyan-500 hover:text-cyan-600"
                        >
                          <FileText className="w-3.5 h-3.5" /> Chi tiết
                        </button>
                        {appt.status !== "CANCELLED" && appt.status !== "COMPLETED" && (
                          <button
                            onClick={() => setSelectedApptId(appt.id)}
                            className="btn-danger p-1.5 px-3 text-xs inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Hủy lịch
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Force Cancel Modal */}
      {selectedApptId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-950">Bắt buộc hủy lịch hẹn</h3>
                <p className="text-xs text-slate-500 mt-0.5">Mã lịch hẹn: #{selectedApptId}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApptId(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleForceCancelSubmit} className="p-5 space-y-4">
              {cancelError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-800 text-xs flex gap-2 items-center">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{cancelError}</span>
                </div>
              )}

              <div>
                <label className="label text-xs">Lý do hủy lịch (bắt buộc) *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Nhập lý do chi tiết..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="input-field py-2 text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedApptId(null)}
                  className="btn-secondary py-2 text-xs"
                >
                  Bỏ qua
                </button>
                <button
                  type="submit"
                  disabled={cancelLoading || !cancelReason.trim()}
                  className="btn-primary py-2 text-xs flex items-center gap-1 bg-red-600 text-white hover:bg-red-700"
                >
                  {cancelLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Bắt buộc hủy lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Appointment Details & Prescriptions Modal */}
      {detailsApptId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-950">Chi tiết lịch hẹn & đơn thuốc</h3>
                <p className="text-xs text-slate-500 mt-0.5">Mã lịch hẹn: #{detailsApptId}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailsApptId(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4">
              {loadingDetails ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
                </div>
              ) : detailsError ? (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-800 text-xs flex gap-2 items-center">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{detailsError}</span>
                </div>
              ) : apptDetails ? (
                <div className="space-y-4 text-xs">
                  {/* General Info Grid */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-4">
                    <div>
                      <span className="text-slate-400">Bệnh nhân:</span>
                      <p className="font-semibold text-slate-900">{apptDetails.patient.user.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {apptDetails.patient.user.gender === "MALE" ? "Nam" : apptDetails.patient.user.gender === "FEMALE" ? "Nữ" : "Khác"} • DOB: {apptDetails.patient.user.dateOfBirth ? formatDate(apptDetails.patient.user.dateOfBirth) : "Chưa cập nhật"}
                      </p>
                      <p className="text-[10px] text-slate-500">SĐT: {apptDetails.patient.user.phone || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Bác sĩ khám:</span>
                      <p className="font-semibold text-slate-950">{apptDetails.doctor.user.name}</p>
                      <p className="text-[10px] text-slate-500">{apptDetails.doctor.specialty?.name}</p>
                      <p className="text-[10px] text-slate-500">GP hành nghề: {apptDetails.doctor.licenseNumber}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Thời gian khám:</span>
                      <p className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-cyan-600" />
                        {apptDetails.slotTime} - {formatDate(apptDetails.appointmentDate)}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Trạng thái & Thanh toán:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`badge ${getStatusColor(apptDetails.status)}`}>
                          {getStatusLabel(apptDetails.status)}
                        </span>
                        {apptDetails.payment && (
                          <span
                            className={`badge ${
                              apptDetails.payment.status === "PAID"
                                ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                                : apptDetails.payment.status === "REFUNDED"
                                ? "bg-purple-50 border border-purple-100 text-purple-700"
                                : "bg-amber-50 border border-amber-100 text-amber-700"
                            }`}
                          >
                            {apptDetails.payment.status === "PAID" ? "Đã thanh toán" : apptDetails.payment.status === "REFUNDED" ? "Đã hoàn" : "Chưa thanh toán"} ({formatCurrency(apptDetails.payment.amount)})
                          </span>
                        )}
                      </div>
                    </div>
                    {apptDetails.symptoms && (
                      <div className="col-span-2 border-t border-slate-200/60 pt-2">
                        <span className="text-slate-400">Lý do khám / Triệu chứng:</span>
                        <p className="font-medium text-slate-700 mt-0.5">{apptDetails.symptoms}</p>
                      </div>
                    )}
                  </div>

                  {/* Medical Record & Prescription Section */}
                  {apptDetails.medicalRecord ? (
                    <div className="space-y-3 pt-2">
                      <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-cyan-600" />
                        Kết quả khám bệnh & Đơn thuốc
                      </h4>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <span className="text-slate-400 font-semibold">Chẩn đoán bệnh:</span>
                          <p className="font-medium text-slate-800 bg-cyan-50/30 p-2.5 rounded-xl border border-cyan-100/50 mt-1">{apptDetails.medicalRecord.diagnosis}</p>
                        </div>
                        {apptDetails.medicalRecord.treatment && (
                          <div className="col-span-2">
                            <span className="text-slate-400 font-semibold">Hướng điều trị:</span>
                            <p className="font-medium text-slate-700 mt-0.5">{apptDetails.medicalRecord.treatment}</p>
                          </div>
                        )}
                        {apptDetails.medicalRecord.notes && (
                          <div>
                            <span className="text-slate-400 font-semibold">Lời dặn của bác sĩ:</span>
                            <p className="font-medium text-slate-700 mt-0.5">{apptDetails.medicalRecord.notes}</p>
                          </div>
                        )}
                        {apptDetails.medicalRecord.followUpDate && (
                          <div>
                            <span className="text-slate-400 font-semibold">Hẹn ngày tái khám:</span>
                            <p className="font-semibold text-cyan-700 mt-0.5">{formatDate(apptDetails.medicalRecord.followUpDate)}</p>
                          </div>
                        )}
                      </div>

                      {/* Prescription Table */}
                      {apptDetails.medicalRecord.prescriptions && apptDetails.medicalRecord.prescriptions.length > 0 ? (
                        <div className="mt-4 space-y-2">
                          <span className="text-slate-400 font-semibold">Đơn thuốc được kê:</span>
                          <div className="border border-slate-100 rounded-xl overflow-hidden">
                            <table className="w-full text-left border-collapse text-xs text-slate-600">
                              <thead className="bg-slate-50 border-b border-slate-100 text-slate-700 font-semibold">
                                <tr>
                                  <th className="p-2.5">Tên thuốc</th>
                                  <th className="p-2.5">Liều lượng</th>
                                  <th className="p-2.5">Tần suất</th>
                                  <th className="p-2.5">Thời gian</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {apptDetails.medicalRecord.prescriptions.map((pres: any) => (
                                  <tr key={pres.id} className="hover:bg-slate-50/30">
                                    <td className="p-2.5 font-medium text-slate-900">
                                      <div>{pres.medicineName}</div>
                                      {pres.instructions && <div className="text-[10px] text-slate-400 mt-0.5">HD: {pres.instructions}</div>}
                                    </td>
                                    <td className="p-2.5">{pres.dosage}</td>
                                    <td className="p-2.5">{pres.frequency}</td>
                                    <td className="p-2.5">{pres.duration}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-400 italic mt-2">Bác sĩ không kê đơn thuốc.</p>
                      )}
                    </div>
                  ) : apptDetails.status === "COMPLETED" ? (
                    <p className="text-slate-400 italic text-center py-4">Chưa cập nhật thông tin bệnh án.</p>
                  ) : (
                    <p className="text-slate-400 italic text-center py-4">Kết quả khám và đơn thuốc sẽ hiển thị sau khi lịch hẹn hoàn thành.</p>
                  )}
                </div>
              ) : null}

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDetailsApptId(null)}
                  className="btn-secondary py-2 px-4 text-xs"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
