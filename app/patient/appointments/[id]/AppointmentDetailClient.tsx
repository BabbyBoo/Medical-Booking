"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Calendar, Clock, User, CreditCard, FileText,
  Star, AlertTriangle, CheckCircle, XCircle, Pill, RefreshCw, Loader2, Printer
} from "lucide-react";
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils";

interface Prescription {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
}

interface Appointment {
  id: string;
  appointmentDate: string;
  slotTime: string;
  status: string;
  symptoms: string | null;
  cancelReason: string | null;
  isFollowUp: boolean;
  doctor: {
    id: string;
    user: { name: string; phone: string | null };
    specialty: { name: string; icon: string | null };
  };
  patient: {
    user: { name: string; phone: string | null; dateOfBirth: Date | null; gender: string | null };
  };
  payment: {
    amount: string;
    status: string;
    method: string | null;
    transactionId: string | null;
    paidAt: Date | null;
  } | null;
  medicalRecord: {
    diagnosis: string;
    treatment: string | null;
    notes: string | null;
    followUpDate: Date | null;
    prescriptions: Prescription[];
  } | null;
  review: { id: string; rating: number; comment: string | null } | null;
}

interface Props {
  appointment: Appointment;
  currentRole: string;
  currentPatientId: string;
}

export default function AppointmentDetailClient({ appointment, currentRole, currentPatientId }: Props) {
  const router = useRouter();
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  const canCancel = ["PENDING", "CONFIRMED"].includes(appointment.status) &&
    currentRole === "PATIENT";

  const canReview = appointment.status === "COMPLETED" && !appointment.review && !reviewDone &&
    currentRole === "PATIENT";

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}/cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelReason }),
      });
      const json = await res.json();
      if (json.success) {
        router.refresh();
        setShowCancelModal(false);
      } else {
        alert(json.error);
      }
    } catch {}
    setCancelling(false);
  };

  const handleReview = async () => {
    if (!rating) return;
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment.id,
          rating,
          comment: comment || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setReviewDone(true);
      } else {
        alert(json.error);
      }
    } catch {}
    setSubmittingReview(false);
  };

  return (
    <div className="max-w-3xl animate-fade-in">
      <Link href="/patient/appointments" className="flex items-center gap-1 text-slate-500 hover:text-cyan-600 mb-4 text-sm">
        <ChevronLeft className="w-4 h-4" />
        Quay lại danh sách
      </Link>

      <div className="page-header flex items-start justify-between">
        <div>
          <h1>Chi tiết lịch hẹn</h1>
          <span className={`badge mt-1 ${getStatusColor(appointment.status)}`}>
            {getStatusLabel(appointment.status)}
          </span>
        </div>
        {canCancel && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="btn-danger flex items-center gap-2 text-sm"
          >
            <XCircle className="w-4 h-4" />
            Hủy lịch
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Appointment info */}
        <div className="card p-5">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-600" />
            Thông tin lịch hẹn
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-500">Bác sĩ</span>
              <p className="font-medium mt-0.5">{appointment.doctor.user.name}</p>
            </div>
            <div>
              <span className="text-slate-500">Chuyên khoa</span>
              <p className="font-medium mt-0.5">
                {appointment.doctor.specialty.icon} {appointment.doctor.specialty.name}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Ngày khám</span>
              <p className="font-medium mt-0.5">{formatDate(appointment.appointmentDate)}</p>
            </div>
            <div>
              <span className="text-slate-500">Giờ khám</span>
              <p className="font-medium mt-0.5">{appointment.slotTime}</p>
            </div>
            {appointment.symptoms && (
              <div className="sm:col-span-2">
                <span className="text-slate-500">Triệu chứng</span>
                <p className="font-medium mt-0.5 text-slate-700">{appointment.symptoms}</p>
              </div>
            )}
            {appointment.cancelReason && (
              <div className="sm:col-span-2 p-3 bg-red-50 rounded-xl">
                <span className="text-red-600 font-medium">Lý do hủy:</span>
                <p className="text-red-700 mt-0.5">{appointment.cancelReason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment */}
        {appointment.payment && (
          <div className="card p-5">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-cyan-600" />
              Thanh toán
            </h2>
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-slate-500">Phí khám</span>
                <p className="font-bold text-cyan-700 text-base mt-0.5">
                  {formatCurrency(parseFloat(appointment.payment.amount))}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Trạng thái</span>
                <p className={`badge mt-1 ${getStatusColor(appointment.payment.status)}`}>
                  {getStatusLabel(appointment.payment.status)}
                </p>
              </div>
              {appointment.payment.transactionId && (
                <div>
                  <span className="text-slate-500">Mã giao dịch</span>
                  <p className="font-mono text-xs mt-0.5">{appointment.payment.transactionId}</p>
                </div>
              )}
            </div>

            {appointment.payment.status === "UNPAID" && appointment.status !== "CANCELLED" && (
              <Link
                href={`/patient/payment/${appointment.id}`}
                className="btn-primary inline-flex items-center gap-2 mt-4 text-sm"
              >
                <CreditCard className="w-4 h-4" />
                Thanh toán ngay
              </Link>
            )}
          </div>
        )}

        {/* Medical record */}
        {appointment.medicalRecord && (
          <div className="card p-5" id="medical-record-print">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-600" />
                Kết quả khám
              </h2>
              <button
                onClick={() => window.print()}
                className="btn-secondary text-sm flex items-center gap-2 no-print"
              >
                <Printer className="w-4 h-4" />
                In đơn thuốc
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold text-slate-700">Chuẩn đoán</span>
                <p className="text-slate-600 mt-1">{appointment.medicalRecord.diagnosis}</p>
              </div>
              {appointment.medicalRecord.treatment && (
                <div>
                  <span className="font-semibold text-slate-700">Phương pháp điều trị</span>
                  <p className="text-slate-600 mt-1">{appointment.medicalRecord.treatment}</p>
                </div>
              )}
              {appointment.medicalRecord.notes && (
                <div>
                  <span className="font-semibold text-slate-700">Ghi chú</span>
                  <p className="text-slate-600 mt-1">{appointment.medicalRecord.notes}</p>
                </div>
              )}
              {appointment.medicalRecord.followUpDate && (
                <div>
                  <span className="font-semibold text-slate-700">Ngày tái khám</span>
                  <p className="text-slate-600 mt-1">{formatDate(appointment.medicalRecord.followUpDate)}</p>
                </div>
              )}

              {appointment.medicalRecord.prescriptions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 font-semibold text-slate-700 mb-2">
                    <Pill className="w-4 h-4 text-cyan-600" />
                    Đơn thuốc
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="px-3 py-2 text-left border border-slate-200">Tên thuốc</th>
                          <th className="px-3 py-2 text-left border border-slate-200">Liều dùng</th>
                          <th className="px-3 py-2 text-left border border-slate-200">Tần suất</th>
                          <th className="px-3 py-2 text-left border border-slate-200">Thời gian</th>
                          <th className="px-3 py-2 text-left border border-slate-200">Hướng dẫn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointment.medicalRecord.prescriptions.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2 border border-slate-200 font-medium">{p.medicineName}</td>
                            <td className="px-3 py-2 border border-slate-200">{p.dosage}</td>
                            <td className="px-3 py-2 border border-slate-200">{p.frequency}</td>
                            <td className="px-3 py-2 border border-slate-200">{p.duration}</td>
                            <td className="px-3 py-2 border border-slate-200 text-slate-500">{p.instructions || "–"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Re-book */}
        {appointment.status === "COMPLETED" && (
          <Link
            href={`/patient/appointments/book/${appointment.doctor.id}`}
            className="card p-4 flex items-center gap-3 hover:border-cyan-200 transition-colors"
          >
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="font-medium text-slate-900">Đặt lịch tái khám</div>
              <div className="text-sm text-slate-500">Đặt lại lịch với {appointment.doctor.user.name}</div>
            </div>
          </Link>
        )}

        {/* Review */}
        {canReview && (
          <div className="card p-5">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Đánh giá bác sĩ
            </h2>
            <div className="space-y-3">
              <div>
                <label className="label">Xếp hạng</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      onClick={() => setRating(i)}
                      className="text-2xl"
                    >
                      <Star
                        className={`w-8 h-8 ${i <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Nhận xét (không bắt buộc)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                />
              </div>
              <button
                onClick={handleReview}
                disabled={!rating || submittingReview}
                className="btn-primary flex items-center gap-2"
              >
                {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                Gửi đánh giá
              </button>
            </div>
          </div>
        )}

        {reviewDone && (
          <div className="card p-4 flex items-center gap-3 bg-emerald-50 border-emerald-200">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <p className="text-emerald-700 font-medium">Cảm ơn bạn đã đánh giá!</p>
          </div>
        )}

        {appointment.review && !reviewDone && (
          <div className="card p-4 bg-slate-50">
            <h3 className="font-medium text-slate-700 mb-2 text-sm">Đánh giá của bạn</h3>
            <div className="flex gap-0.5 mb-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className={`w-4 h-4 ${i <= appointment.review!.rating ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-200"}`} />
              ))}
            </div>
            {appointment.review.comment && (
              <p className="text-sm text-slate-600">{appointment.review.comment}</p>
            )}
          </div>
        )}
      </div>

      {/* Cancel modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Hủy lịch hẹn</h3>
                <p className="text-sm text-slate-500">Hành động này không thể hoàn tác</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="label">Lý do hủy *</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="input-field resize-none"
                placeholder="Nhập lý do hủy lịch..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="btn-secondary flex-1"
              >
                Đóng
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelReason.trim() || cancelling}
                className="btn-danger flex-1 flex items-center justify-center gap-2"
              >
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
