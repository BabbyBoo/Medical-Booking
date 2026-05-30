"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  User,
  Phone,
  FileText,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Printer,
  ChevronLeft,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils";

interface Prescription {
  id?: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface PatientUser {
  name: string;
  email: string;
  phone: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  address: string | null;
  avatar: string | null;
}

interface Patient {
  id: string;
  bloodType: string | null;
  allergies: string | null;
  chronicDiseases: string | null;
  emergencyContact: string | null;
  user: PatientUser;
}

interface Payment {
  id: string;
  amount: string;
  status: string;
}

interface MedicalRecord {
  id: string;
  diagnosis: string;
  treatment: string | null;
  notes: string | null;
  followUpDate: string | null;
  prescriptions: Prescription[];
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
  medicalRecord: MedicalRecord | null;
}

export default function DoctorAppointmentDetailClient({
  appointment,
}: {
  appointment: Appointment;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Medical Record Form state (for CONFIRMED status)
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  const handleAddPrescriptionRow = () => {
    setPrescriptions((prev) => [
      ...prev,
      { medicineName: "", dosage: "", frequency: "", duration: "", instructions: "" },
    ]);
  };

  const handleRemovePrescriptionRow = (index: number) => {
    setPrescriptions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handlePrescriptionChange = (index: number, field: keyof Prescription, value: string) => {
    setPrescriptions((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleConfirm = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}/confirm`, {
        method: "PUT",
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Đã xác nhận lịch khám thành công!");
        router.refresh();
      } else {
        setErrorMsg(data.error || "Đã xảy ra lỗi");
      }
    } catch (err) {
      setErrorMsg("Lỗi kết nối máy chủ");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Đã từ chối lịch khám thành công!");
        setShowRejectModal(false);
        router.refresh();
      } else {
        setErrorMsg(data.error || "Đã xảy ra lỗi");
      }
    } catch (err) {
      setErrorMsg("Lỗi kết nối máy chủ");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveMedicalRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      setErrorMsg("Vui lòng nhập chuẩn đoán của ca bệnh");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Filter out incomplete prescription rows
    const activePrescriptions = prescriptions.filter(
      (p) => p.medicineName.trim() && p.dosage.trim() && p.frequency.trim() && p.duration.trim()
    );

    try {
      const res = await fetch(`/api/medical-records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment.id,
          diagnosis,
          treatment,
          notes,
          followUpDate: followUpDate || undefined,
          prescriptions: activePrescriptions,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Lưu kết quả khám và hoàn thành ca bệnh thành công!");
        router.refresh();
      } else {
        setErrorMsg(data.error || "Có lỗi xảy ra khi lưu");
      }
    } catch (err) {
      setErrorMsg("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !appointment.medicalRecord) return;

    const patient = appointment.patient.user;
    const dobString = patient.dateOfBirth
      ? formatDate(patient.dateOfBirth)
      : "Chưa cập nhật";
    const genderString =
      patient.gender === "MALE"
        ? "Nam"
        : patient.gender === "FEMALE"
        ? "Nữ"
        : "Khác";

    const prescriptionsHtml = appointment.medicalRecord.prescriptions
      .map(
        (p, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px; font-weight: 600; color: #1e293b;">${idx + 1}. ${p.medicineName}</td>
          <td style="padding: 12px; color: #475569;">${p.dosage}</td>
          <td style="padding: 12px; color: #475569;">${p.frequency}</td>
          <td style="padding: 12px; color: #475569;">${p.duration}</td>
          <td style="padding: 12px; color: #64748b; font-style: italic;">${p.instructions || "Không có"}</td>
        </tr>
      `
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Đơn thuốc - ${patient.name}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #334155; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0891b2; padding-bottom: 20px; margin-bottom: 30px; }
            .clinic-info h1 { font-size: 24px; color: #0891b2; margin: 0 0 5px 0; }
            .clinic-info p { margin: 0; font-size: 14px; color: #64748b; }
            .prescription-title { text-align: center; text-transform: uppercase; font-size: 22px; color: #0f172a; margin-bottom: 30px; font-weight: bold; letter-spacing: 1px; }
            .section { margin-bottom: 25px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .field { font-size: 15px; margin-bottom: 6px; }
            .field-label { font-weight: 600; color: #475569; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; padding: 12px; text-align: left; font-weight: 600; color: #334155; }
            .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-start; }
            .signature { text-align: center; width: 250px; }
            .signature-title { font-weight: 600; margin-bottom: 80px; color: #475569; }
            .signature-name { font-weight: bold; color: #0f172a; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="clinic-info">
              <h1>HỆ THỐNG PHÒNG KHÁM MEDBOOK</h1>
              <p>Hotline: 1900 8198 • Email: contact@medbook.vn</p>
              <p>Địa chỉ: 123 Đường Ba Tháng Hai, Quận 10, TP. Hồ Chí Minh</p>
            </div>
            <div style="text-align: right; color: #64748b; font-size: 14px;">
              <p>Mã đơn: DH-${appointment.medicalRecord.id.substring(appointment.medicalRecord.id.length - 6).toUpperCase()}</p>
              <p>Ngày khám: ${formatDate(appointment.appointmentDate)}</p>
            </div>
          </div>
          
          <div class="prescription-title">Đơn Thuốc Tây Y</div>
          
          <div class="section">
            <div class="grid">
              <div class="field"><span class="field-label">Họ và tên bệnh nhân:</span> ${patient.name}</div>
              <div class="field"><span class="field-label">Ngày sinh:</span> ${dobString}</div>
              <div class="field"><span class="field-label">Giới tính:</span> ${genderString}</div>
              <div class="field"><span class="field-label">SĐT liên hệ:</span> ${patient.phone || "Không có"}</div>
            </div>
            <div class="field" style="margin-top: 10px;"><span class="field-label">Địa chỉ:</span> ${patient.address || "Chưa cập nhật"}</div>
            <div class="field" style="margin-top: 10px;"><span class="field-label">Chẩn đoán:</span> <strong>${appointment.medicalRecord.diagnosis}</strong></div>
            ${appointment.medicalRecord.treatment ? `<div class="field"><span class="field-label">Phương pháp điều trị:</span> ${appointment.medicalRecord.treatment}</div>` : ""}
          </div>
          
          <div class="section">
            <h3 style="border-left: 4px solid #0891b2; padding-left: 10px; color: #0f172a; margin-bottom: 10px;">Chỉ Định Thuốc</h3>
            <table>
              <thead>
                <tr>
                  <th>Tên thuốc / Biệt dược</th>
                  <th>Liều dùng</th>
                  <th>Tần suất</th>
                  <th>Thời gian</th>
                  <th>Hướng dẫn sử dụng</th>
                </tr>
              </thead>
              <tbody>
                ${prescriptionsHtml || '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #94a3b8;">Không có thuốc được kê toa</td></tr>'}
              </tbody>
            </table>
          </div>
          
          ${appointment.medicalRecord.notes ? `
          <div class="section" style="margin-top: 20px; background-color: #f8fafc; padding: 15px; border-radius: 8px;">
            <span class="field-label">Ghi chú dặn dò:</span>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #475569;">${appointment.medicalRecord.notes}</p>
          </div>
          ` : ""}

          ${appointment.medicalRecord.followUpDate ? `
          <div class="section" style="margin-top: 15px; border: 1px dashed #0891b2; padding: 12px; border-radius: 8px; display: inline-block;">
            <span class="field-label" style="color: #0891b2;">Hẹn tái khám:</span>
            <span>Ngày ${formatDate(appointment.medicalRecord.followUpDate)}</span>
          </div>
          ` : ""}
          
          <div class="footer">
            <div>
              <p style="font-size: 12px; color: #94a3b8; font-style: italic;">Lưu ý: Uống thuốc đúng liều lượng và thời gian theo chỉ dẫn của bác sĩ.</p>
            </div>
            <div class="signature">
              <div class="signature-title">BÁC SĨ ĐIỀU TRỊ</div>
              <div style="height: 60px;"></div>
              <div class="signature-name">${sessionStorage.getItem("doctorName") || "Bác sĩ điều trị"}</div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const patient = appointment.patient;
  const user = patient.user;
  const dobString = user.dateOfBirth ? formatDate(user.dateOfBirth) : "N/A";
  const genderString = user.gender === "MALE" ? "Nam" : user.gender === "FEMALE" ? "Nữ" : "Khác";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/doctor/appointments"
          className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Chi tiết lịch hẹn</h1>
          <p className="text-xs text-slate-500">Mã lịch hẹn: #{appointment.id}</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-800 text-sm flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Main Content Area */}
        <div className="space-y-6">
          {/* Patient medical summary / symptoms */}
          <div className="card p-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              Lý do khám & Triệu chứng bệnh
            </h2>
            <div className="bg-slate-50 p-4 rounded-xl text-slate-700 text-sm italic">
              &ldquo;{appointment.symptoms || "Không có mô tả triệu chứng cụ thể"}&rdquo;
            </div>
          </div>

          {/* Pending actions */}
          {appointment.status === "PENDING" && (
            <div className="card p-6 border-amber-200/50 bg-amber-50/10">
              <h2 className="text-base font-bold text-slate-900 pb-2">Xử lý lịch khám</h2>
              <p className="text-sm text-slate-500 mb-6">
                Vui lòng xem thông tin bệnh nhân và phản hồi lịch khám này trong vòng 24 giờ.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleConfirm}
                  disabled={actionLoading}
                  className="btn-primary bg-cyan-600 flex items-center gap-1.5 px-6"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Chấp nhận lịch hẹn
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="btn-danger flex items-center gap-1.5 px-6"
                >
                  <XCircle className="w-4 h-4" />
                  Từ chối lịch hẹn
                </button>
              </div>
            </div>
          )}

          {/* Checkup form (CONFIRMED) */}
          {appointment.status === "CONFIRMED" && (
            <div className="card p-6">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-6">
                Báo cáo kết quả khám & Đơn thuốc
              </h2>
              <form onSubmit={handleSaveMedicalRecord} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="label">
                      Chuẩn đoán lâm sàng <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="VD: Cảm cúm cấp tính, Đau đầu mạn tính..."
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label">Phương pháp điều trị / Chỉ định khác</label>
                    <textarea
                      rows={3}
                      placeholder="VD: Nghỉ ngơi tại nhà, uống nhiều nước ấm..."
                      value={treatment}
                      onChange={(e) => setTreatment(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="label">Ngày hẹn tái khám (nếu có)</label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label">Ghi chú lời dặn bệnh nhân</label>
                    <input
                      type="text"
                      placeholder="VD: Uống thuốc đúng giờ, tránh vận động mạnh..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Prescription UI */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Kê đơn thuốc</h3>
                    <button
                      type="button"
                      onClick={handleAddPrescriptionRow}
                      className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 border-dashed border-cyan-300 text-cyan-700 bg-cyan-50/20 hover:bg-cyan-50/50"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm thuốc
                    </button>
                  </div>

                  <div className="space-y-3">
                    {prescriptions.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/40 text-slate-400 text-xs">
                        Không có đơn thuốc (Bấm "+ Thêm thuốc" nếu cần kê đơn)
                      </div>
                    ) : (
                      prescriptions.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-slate-100 bg-slate-50/20 grid grid-cols-2 md:grid-cols-[2fr_1.2fr_1.2fr_1.2fr_3fr_auto] gap-3 items-end animate-fade-in"
                        >
                          <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                              Tên thuốc
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="VD: Paracetamol"
                              value={item.medicineName}
                              onChange={(e) =>
                                handlePrescriptionChange(idx, "medicineName", e.target.value)
                              }
                              className="input-field py-2 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                              Liều lượng
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="VD: 500mg"
                              value={item.dosage}
                              onChange={(e) =>
                                handlePrescriptionChange(idx, "dosage", e.target.value)
                              }
                              className="input-field py-2 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                              Tần suất
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="VD: 2 lần/ngày"
                              value={item.frequency}
                              onChange={(e) =>
                                handlePrescriptionChange(idx, "frequency", e.target.value)
                              }
                              className="input-field py-2 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                              Thời gian
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="VD: 7 ngày"
                              value={item.duration}
                              onChange={(e) =>
                                handlePrescriptionChange(idx, "duration", e.target.value)
                              }
                              className="input-field py-2 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                              Cách dùng (optional)
                            </label>
                            <input
                              type="text"
                              placeholder="VD: Uống sau khi ăn no"
                              value={item.instructions}
                              onChange={(e) =>
                                handlePrescriptionChange(idx, "instructions", e.target.value)
                              }
                              className="input-field py-2 text-xs"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePrescriptionRow(idx)}
                            className="p-2.5 rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex items-center gap-2 bg-cyan-600"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    Lưu kết quả & Hoàn thành khám
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Read-only Medical Record (COMPLETED) */}
          {appointment.status === "COMPLETED" && appointment.medicalRecord && (
            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-6">
                  <h2 className="text-base font-bold text-slate-900">
                    Kết quả bệnh án lâm sàng
                  </h2>
                  <button
                    onClick={handlePrint}
                    className="btn-secondary py-1.5 px-3.5 text-xs flex items-center gap-1.5 text-slate-700"
                  >
                    <Printer className="w-4 h-4" /> In đơn thuốc
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-400 uppercase">
                        Chuẩn đoán lâm sàng
                      </span>
                      <p className="bg-slate-50 p-4 rounded-xl text-slate-800 text-sm font-medium">
                        {appointment.medicalRecord.diagnosis}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-400 uppercase">
                        Phương án điều trị / Chỉ định
                      </span>
                      <p className="bg-slate-50 p-4 rounded-xl text-slate-800 text-sm">
                        {appointment.medicalRecord.treatment || "Không có chỉ định cụ thể"}
                      </p>
                    </div>
                  </div>

                  {appointment.medicalRecord.notes && (
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-400 uppercase">
                        Lời dặn bác sĩ
                      </span>
                      <p className="bg-slate-50 p-4 rounded-xl text-slate-800 text-sm italic">
                        &ldquo;{appointment.medicalRecord.notes}&rdquo;
                      </p>
                    </div>
                  )}

                  {appointment.medicalRecord.followUpDate && (
                    <div className="inline-flex items-center gap-2 p-3 rounded-xl border border-cyan-100 bg-cyan-50/30 text-cyan-800 text-sm">
                      <Calendar className="w-4 h-4 text-cyan-600" />
                      <span>Hẹn khám lại ngày:</span>
                      <strong className="text-slate-900">
                        {formatDate(appointment.medicalRecord.followUpDate)}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Prescription list */}
              <div className="card p-6">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
                  Đơn thuốc đã kê
                </h2>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="p-3">Tên thuốc</th>
                        <th className="p-3">Liều lượng</th>
                        <th className="p-3">Tần suất</th>
                        <th className="p-3">Thời gian</th>
                        <th className="p-3">Cách dùng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {appointment.medicalRecord.prescriptions.map((p, idx) => (
                        <tr key={p.id || idx}>
                          <td className="p-3 font-semibold text-slate-900">{p.medicineName}</td>
                          <td className="p-3">{p.dosage}</td>
                          <td className="p-3">{p.frequency}</td>
                          <td className="p-3">{p.duration}</td>
                          <td className="p-3 text-xs text-slate-500 italic">
                            {p.instructions || "Không dặn"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info Area */}
        <div className="space-y-6">
          {/* Patient Card */}
          <div className="card p-5">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 mb-4">
              Thông tin bệnh nhân
            </h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 text-white font-bold rounded-2xl flex items-center justify-center text-lg flex-shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  user.name[0]?.toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 truncate">{user.name}</div>
                <div className="text-xs text-slate-500 truncate">{user.email}</div>
              </div>
            </div>

            <div className="space-y-3 text-sm border-t border-slate-50 pt-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Giới tính:</span>
                <span className="font-medium text-slate-800">{genderString}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ngày sinh:</span>
                <span className="font-medium text-slate-800">{dobString}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Điện thoại:</span>
                <span className="font-medium text-slate-800">{user.phone || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Địa chỉ:</span>
                <span className="font-medium text-slate-800 truncate max-w-[180px]" title={user.address || ""}>
                  {user.address || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Medical background */}
          <div className="card p-5">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 mb-4">
              Hồ sơ sức khỏe bệnh nhân
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Nhóm máu</span>
                <span className="font-bold text-slate-800">{patient.bloodType || "N/A"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Dị ứng</span>
                <p className="text-slate-700 text-xs bg-slate-50 p-2.5 rounded-lg">
                  {patient.allergies || "Không ghi nhận"}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Bệnh lý mãn tính</span>
                <p className="text-slate-700 text-xs bg-slate-50 p-2.5 rounded-lg">
                  {patient.chronicDiseases || "Không ghi nhận"}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Liên hệ khẩn cấp</span>
                <span className="text-slate-800 font-medium">{patient.emergencyContact || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Appointment detail Card */}
          <div className="card p-5">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 mb-4">
              Lịch khám dự định
            </h2>
            <div className="space-y-3.5 text-sm">
              <div className="flex items-center gap-2 text-slate-800">
                <Calendar className="w-4 h-4 text-cyan-600" />
                <span>{formatDate(appointment.appointmentDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-800">
                <Clock className="w-4 h-4 text-cyan-600" />
                <span>Ca khám: {appointment.slotTime}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                <span className="text-slate-500">Trạng thái:</span>
                <span className={`badge ${getStatusColor(appointment.status)}`}>
                  {getStatusLabel(appointment.status)}
                </span>
              </div>
              {appointment.payment && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Giá khám:</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(appointment.payment.amount)}
                  </span>
                </div>
              )}
              {appointment.payment && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Thanh toán:</span>
                  <span
                    className={`font-semibold ${
                      appointment.payment.status === "PAID"
                        ? "text-emerald-600"
                        : appointment.payment.status === "REFUNDED"
                        ? "text-purple-600"
                        : "text-amber-600"
                    }`}
                  >
                    {appointment.payment.status === "PAID"
                      ? "Đã thanh toán"
                      : appointment.payment.status === "REFUNDED"
                      ? "Đã hoàn tiền"
                      : "Chưa thanh toán"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-2xl p-6 space-y-4 animate-scale-in">
            <h3 className="text-base font-bold text-slate-950">Từ chối lịch hẹn khám</h3>
            <p className="text-xs text-slate-500">
              Vui lòng nhập lý do từ chối. Bệnh nhân sẽ nhận được thông báo này.
            </p>
            <textarea
              rows={3}
              required
              placeholder="Nhập lý do chi tiết..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="input-field"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="btn-secondary py-2"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="btn-danger py-2 flex items-center gap-1 bg-red-600 text-white"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
