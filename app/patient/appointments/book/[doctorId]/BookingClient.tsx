"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Calendar, Clock, FileText, CheckCircle, Loader2, ChevronRight } from "lucide-react";
import { format, addDays, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";
import { formatCurrency, getDayOfWeekFromDate, parseLocalDate } from "@/lib/utils";

interface Doctor {
  id: string;
  consultingFee: string;
  clinicAddress: string | null;
  user: { name: string };
  specialty: { name: string; icon: string | null };
  schedules: Array<{ dayOfWeek: string; isActive: boolean }>;
}

interface Props {
  doctor: Doctor;
  initialDate: string;
  initialTime: string;
  hasActiveAppointment?: boolean;
  previousAppointmentId?: string;
}

const STEPS = ["Chọn thời gian", "Triệu chứng", "Xác nhận"];

export default function BookingClient({
  doctor,
  initialDate,
  initialTime,
  hasActiveAppointment = false,
  previousAppointmentId = "",
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    initialDate ? parseLocalDate(initialDate) : null
  );
  const [selectedTime, setSelectedTime] = useState(initialTime);
  const [symptoms, setSymptoms] = useState("");
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const next7Days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  const isWorkDay = (date: Date) => {
    const dayOfWeek = getDayOfWeekFromDate(date);
    return doctor.schedules.some((s) => s.dayOfWeek === dayOfWeek && s.isActive);
  };

  const fetchSlots = async (date: Date) => {
    setLoadingSlots(true);
    try {
      const res = await fetch(
        `/api/doctors/${doctor.id}/available-slots?date=${format(date, "yyyy-MM-dd")}`
      );
      const json = await res.json();
      const slotsData = json.success ? json.data.slots || [] : [];
      setSlots(slotsData);

      // Reset selectedTime if it is no longer available in the newly loaded slots
      if (selectedTime) {
        const isStillAvailable = slotsData.some(
          (s: any) => s.time === selectedTime && s.available
        );
        if (!isStillAvailable) {
          setSelectedTime("");
        }
      }
    } catch {
      setSlots([]);
    }
    setLoadingSlots(false);
  };

  useEffect(() => {
    if (selectedDate) fetchSlots(selectedDate);
  }, [selectedDate]);

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return;

    // Validate slot time is not in the past
    const slotDateTime = new Date(`${format(selectedDate, "yyyy-MM-dd")}T${selectedTime}:00+07:00`);
    if (slotDateTime < new Date()) {
      setError("Không thể đặt lịch hẹn trong quá khứ. Vui lòng chọn khung giờ khác.");
      setStep(1);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: doctor.id,
          appointmentDate: format(selectedDate, "yyyy-MM-dd"),
          slotTime: selectedTime,
          symptoms: symptoms || undefined,
          previousAppointmentId: previousAppointmentId || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        router.push(`/patient/payment/${json.data.appointmentId}`);
      } else {
        setError(json.error || "Đặt lịch thất bại");
        setStep(1);
      }
    } catch {
      setError("Đã xảy ra lỗi");
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <Link href={`/patient/doctors/${doctor.id}`} className="flex items-center gap-1 text-slate-500 hover:text-cyan-600 mb-4 text-sm">
        <ChevronLeft className="w-4 h-4" />
        Quay lại hồ sơ bác sĩ
      </Link>

      <div className="page-header">
        <h1>Đặt lịch khám</h1>
        <p>
          {doctor.specialty.icon} {doctor.specialty.name} – {doctor.user.name}
        </p>
      </div>

      {/* Stepper */}
      <div className="card p-4 mb-6">
        <div className="stepper">
          {STEPS.map((label, i) => {
            const num = i + 1;
            const isActive = num === step;
            const isDone = num < step;
            return (
              <div key={label} className="stepper-item">
                <div className="flex flex-col items-center">
                  <div
                    className={`stepper-number w-9 h-9 text-sm ${
                      isDone
                        ? "bg-emerald-500 text-white"
                        : isActive
                        ? "bg-cyan-600 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isDone ? "✓" : num}
                  </div>
                  <span className={`text-xs mt-1 font-medium ${isActive ? "text-cyan-700" : "text-slate-400"}`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`stepper-line mx-2 ${num < step ? "active" : ""}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {hasActiveAppointment && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm flex flex-col gap-2">
          <div className="flex items-start gap-2 font-bold text-amber-900">
            <span>⚠️</span>
            <span>Không thể đặt lịch hẹn mới</span>
          </div>
          <p>
            Bạn đang có một lịch hẹn ở trạng thái <strong>Chờ duyệt</strong> hoặc <strong>Đã xác nhận</strong> với bác sĩ này. Theo quy định, mỗi bệnh nhân chỉ có thể đặt tối đa 1 lịch hẹn hoạt động với mỗi bác sĩ. Vui lòng hoàn thành buổi khám hiện tại hoặc hủy lịch khám cũ trước khi tiếp tục đặt lịch mới.
          </p>
          <div className="mt-2">
            <Link href="/patient/appointments" className="text-cyan-700 hover:text-cyan-800 underline font-medium text-xs">
              Quản lý lịch hẹn của tôi &rarr;
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Date + Time */}
      {step === 1 && (
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-600" />
            Chọn ngày và giờ khám
          </h2>

          {/* Date */}
          <div>
            <p className="label">Ngày khám</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {next7Days.map((date) => {
                const isWork = isWorkDay(date) && !hasActiveAppointment;
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => { if (isWork) { setSelectedDate(date); setSelectedTime(""); } }}
                    disabled={!isWork || hasActiveAppointment}
                    className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border-2 min-w-[60px] text-xs transition-all ${
                      isSelected ? "bg-cyan-600 text-white border-cyan-600" :
                      isWork ? "bg-white text-slate-700 border-slate-200 hover:border-cyan-400" :
                      "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                    }`}
                  >
                    <span>{format(date, "EEE", { locale: vi })}</span>
                    <span className="font-bold text-base">{format(date, "d")}</span>
                    <span>{format(date, "dd/MM")}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slots */}
          {selectedDate && (
            <div>
              <p className="label">Giờ khám</p>
              {loadingSlots ? (
                <div className="flex justify-center py-4"><div className="spinner w-6 h-6" /></div>
              ) : slots.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">Không có slot trống</p>
              ) : (
                <div className="slot-grid">
                  {slots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => slot.available && !hasActiveAppointment && setSelectedTime(slot.time)}
                      disabled={!slot.available || hasActiveAppointment}
                      className={`slot-btn ${
                        selectedTime === slot.time ? "selected" : slot.available ? "available" : "booked"
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => {
              if (selectedDate && selectedTime && !hasActiveAppointment) {
                const slotDateTime = new Date(`${format(selectedDate, "yyyy-MM-dd")}T${selectedTime}:00+07:00`);
                if (slotDateTime < new Date()) {
                  setError("Không thể chọn khung giờ đã qua. Vui lòng chọn khung giờ khác.");
                  setSelectedTime("");
                  fetchSlots(selectedDate);
                  return;
                }
                setStep(2);
              }
            }}
            disabled={!selectedDate || !selectedTime || hasActiveAppointment}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            Tiếp theo <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 2: Symptoms */}
      {step === 2 && (
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-600" />
            Mô tả triệu chứng
          </h2>

          <div>
            <label className="label">
              Triệu chứng / Lý do khám <span className="text-slate-400 font-normal">(không bắt buộc)</span>
            </label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={5}
              maxLength={500}
              placeholder="Mô tả triệu chứng của bạn để bác sĩ chuẩn bị tốt hơn..."
              className="input-field resize-none"
            />
            <p className="text-xs text-slate-400 text-right mt-1">{symptoms.length}/500</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">
              Quay lại
            </button>
            <button onClick={() => setStep(3)} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
              Tiếp theo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-cyan-600" />
            Xác nhận thông tin
          </h2>

          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Bác sĩ</span>
              <span className="font-medium text-slate-900">{doctor.user.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Chuyên khoa</span>
              <span className="font-medium text-slate-900">{doctor.specialty.icon} {doctor.specialty.name}</span>
            </div>
            {doctor.clinicAddress && (
              <div className="flex justify-between text-sm gap-4">
                <span className="text-slate-500 flex-shrink-0">Địa chỉ khám</span>
                <span className="font-medium text-slate-900 text-right">{doctor.clinicAddress}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Ngày khám</span>
              <span className="font-medium text-slate-900">
                {selectedDate && format(selectedDate, "EEEE, dd/MM/yyyy", { locale: vi })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Giờ khám</span>
              <span className="font-medium text-slate-900">{selectedTime}</span>
            </div>
            {symptoms && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 text-sm">Triệu chứng:</span>
                <p className="text-sm text-slate-700 mt-1">{symptoms}</p>
              </div>
            )}
            <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-900">Phí khám</span>
              <span className="font-bold text-cyan-700 text-base">
                {formatCurrency(parseFloat(doctor.consultingFee))}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center">
            Sau khi đặt lịch, bạn sẽ được chuyển đến trang thanh toán.
            Lịch hẹn sẽ hết hạn sau 24 giờ nếu không được xác nhận.
          </p>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn-secondary flex-1 py-3">
              Quay lại
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
              ) : (
                <>Xác nhận & Đặt lịch</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
