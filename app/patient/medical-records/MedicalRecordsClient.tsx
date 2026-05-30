"use client";

import { useState } from "react";
import {
  FileText,
  Calendar,
  User,
  Printer,
  ChevronDown,
  ChevronUp,
  Search,
  Clipboard,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Prescription {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
}

interface DoctorUser {
  name: string;
  avatar: string | null;
}

interface DoctorSpecialty {
  name: string;
  icon: string | null;
}

interface Doctor {
  user: DoctorUser;
  specialty: DoctorSpecialty;
}

interface Appointment {
  id: string;
  appointmentDate: string;
  slotTime: string;
  doctor: Doctor;
  patient: {
    user: {
      name: string;
      dateOfBirth: string | null;
      gender: string | null;
      phone: string | null;
      address: string | null;
    };
  };
}

interface MedicalRecord {
  id: string;
  appointmentId: string;
  diagnosis: string;
  treatment: string | null;
  notes: string | null;
  followUpDate: string | null;
  createdAt: string;
  appointment: Appointment;
  prescriptions: Prescription[];
}

export default function MedicalRecordsClient({
  initialRecords,
}: {
  initialRecords: MedicalRecord[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(
    initialRecords[0]?.id || null
  );

  const toggleExpand = (id: string) => {
    setExpandedRecordId((prev) => (prev === id ? null : id));
  };

  const filteredRecords = initialRecords.filter((record) => {
    const drName = record.appointment.doctor.user.name.toLowerCase();
    const diagnosis = record.diagnosis.toLowerCase();
    const search = searchTerm.toLowerCase();
    return drName.includes(search) || diagnosis.includes(search);
  });

  const handlePrint = (record: MedicalRecord) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const patient = record.appointment.patient?.user || {
      name: "N/A",
      dateOfBirth: null,
      gender: null,
      phone: null,
      address: null,
    };
    
    const dobString = patient.dateOfBirth
      ? formatDate(patient.dateOfBirth)
      : "Chưa cập nhật";
    const genderString =
      patient.gender === "MALE"
        ? "Nam"
        : patient.gender === "FEMALE"
        ? "Nữ"
        : "Khác";

    const prescriptionsHtml = record.prescriptions
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
          <title>Đơn thuốc - ${record.appointment.doctor.user.name}</title>
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
              .no-print { display: none; }
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
              <p>Mã đơn: DH-${record.id.substring(record.id.length - 6).toUpperCase()}</p>
              <p>Ngày khám: ${formatDate(record.appointment.appointmentDate)}</p>
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
            <div class="field" style="margin-top: 10px;"><span class="field-label">Chẩn đoán:</span> <strong>${record.diagnosis}</strong></div>
            ${record.treatment ? `<div class="field"><span class="field-label">Phương pháp điều trị:</span> ${record.treatment}</div>` : ""}
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
          
          ${record.notes ? `
          <div class="section" style="margin-top: 20px; background-color: #f8fafc; padding: 15px; border-radius: 8px;">
            <span class="field-label">Ghi chú dặn dò:</span>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #475569;">${record.notes}</p>
          </div>
          ` : ""}

          ${record.followUpDate ? `
          <div class="section" style="margin-top: 15px; border: 1px dashed #0891b2; padding: 12px; border-radius: 8px; display: inline-block;">
            <span class="field-label" style="color: #0891b2;">Hẹn tái khám:</span>
            <span>Ngày ${formatDate(record.followUpDate)} (Vui lòng mang theo đơn thuốc này)</span>
          </div>
          ` : ""}
          
          <div class="footer">
            <div>
              <p style="font-size: 12px; color: #94a3b8; font-style: italic;">Lưu ý: Uống thuốc đúng liều lượng và thời gian theo chỉ dẫn của bác sĩ.</p>
            </div>
            <div class="signature">
              <div class="signature-title">BÁC SĨ ĐIỀU TRỊ</div>
              <div style="height: 60px;"></div>
              <div class="signature-name">${record.appointment.doctor.user.name}</div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              // Optional: Close window after printing
              // window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1>Lịch sử khám & Đơn thuốc</h1>
          <p>Xem lại lịch sử chuẩn đoán, phương án điều trị và đơn thuốc đã kê</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Tìm theo tên bác sĩ, chuẩn đoán..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Không tìm thấy bệnh án nào</h3>
          <p className="text-sm">Bạn chưa có lịch sử khám bệnh hoặc không tìm thấy kết quả phù hợp.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => {
            const isExpanded = expandedRecordId === record.id;
            return (
              <div
                key={record.id}
                className={`card overflow-hidden transition-all duration-200 ${
                  isExpanded ? "ring-2 ring-cyan-500/10 border-cyan-500/20" : ""
                }`}
              >
                {/* Header Collapsible Trigger */}
                <div
                  onClick={() => toggleExpand(record.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center flex-shrink-0">
                      <Clipboard className="w-6 h-6 text-cyan-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
                        Chuẩn đoán: {record.diagnosis}
                      </h3>
                      <div className="text-sm text-slate-500 flex flex-wrap gap-x-4 gap-y-1 mt-0.5">
                        <span className="flex items-center gap-1.5">
                          <User className="w-4 h-4" /> BS. {record.appointment.doctor.user.name}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" /> Ngày khám: {formatDate(record.appointment.appointmentDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-0 pt-3 sm:pt-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrint(record);
                      }}
                      className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
                    >
                      <Printer className="w-4 h-4" />
                      In đơn thuốc
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="px-5 pb-6 border-t border-slate-100 bg-slate-50/30 space-y-6 pt-5 animate-fade-in">
                    {/* Diagnosis & Treatment Details */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Chi tiết chuẩn đoán & bệnh lý
                        </h4>
                        <div className="bg-white p-4 rounded-xl border border-slate-100 text-sm text-slate-700 min-h-[80px]">
                          {record.diagnosis}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Phương pháp điều trị / Chỉ định
                        </h4>
                        <div className="bg-white p-4 rounded-xl border border-slate-100 text-sm text-slate-700 min-h-[80px]">
                          {record.treatment || "Chưa ghi nhận phương án điều trị cụ thể"}
                        </div>
                      </div>
                    </div>

                    {/* Prescriptions Table */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Đơn thuốc đã kê toa
                      </h4>
                      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-100">
                              <tr>
                                <th className="p-3">Tên thuốc</th>
                                <th className="p-3">Liều dùng</th>
                                <th className="p-3">Tần suất</th>
                                <th className="p-3">Thời gian</th>
                                <th className="p-3">Hướng dẫn</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {record.prescriptions.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="p-4 text-center text-slate-400">
                                    Không có thuốc nào được kê toa
                                  </td>
                                </tr>
                              ) : (
                                record.prescriptions.map((p) => (
                                  <tr key={p.id} className="hover:bg-slate-50/50">
                                    <td className="p-3 font-medium text-slate-900">
                                      {p.medicineName}
                                    </td>
                                    <td className="p-3">{p.dosage}</td>
                                    <td className="p-3">{p.frequency}</td>
                                    <td className="p-3">{p.duration}</td>
                                    <td className="p-3 text-xs text-slate-500 italic">
                                      {p.instructions || "Không có"}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Follow up & notes */}
                    {(record.notes || record.followUpDate) && (
                      <div className="grid md:grid-cols-[1fr_260px] gap-4 items-start">
                        {record.notes && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Lời dặn của bác sĩ
                            </h4>
                            <div className="bg-white p-4 rounded-xl border border-slate-100 text-sm text-slate-600 italic">
                              &ldquo;{record.notes}&rdquo;
                            </div>
                          </div>
                        )}
                        {record.followUpDate && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Hẹn ngày tái khám
                            </h4>
                            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/40 p-4 rounded-xl border border-cyan-100 text-cyan-800 flex items-center gap-3">
                              <Calendar className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                              <div>
                                <div className="text-xs text-cyan-600 font-medium">Hẹn tái khám lúc</div>
                                <div className="font-bold text-slate-900">
                                  {formatDate(record.followUpDate)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
