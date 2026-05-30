"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Star, Calendar, Clock, Shield, ChevronLeft,
  Award, GraduationCap, MessageSquare, ArrowRight
} from "lucide-react";
import { formatDate, formatCurrency, getDayOfWeekLabel, generateTimeSlots, getDayOfWeekFromDate } from "@/lib/utils";
import { addDays, format, isSameDay, isToday, isTomorrow } from "date-fns";
import { vi } from "date-fns/locale";

interface Doctor {
  id: string;
  experience: number;
  consultingFee: string;
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  bio: string | null;
  education: string | null;
  user: { name: string; avatar: string | null; gender: string | null };
  specialty: { name: string; icon: string | null; description: string | null };
  schedules: Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    slotDuration: number;
    isActive: boolean;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    patient: { user: { name: string } };
  }>;
  _count: { reviews: number };
}

export default function DoctorProfileClient({ doctor }: { doctor: Doctor }) {
  const [activeTab, setActiveTab] = useState<"info" | "schedule" | "reviews">("info");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const next7Days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  const fetchSlots = async (date: Date) => {
    setLoadingSlots(true);
    try {
      const res = await fetch(
        `/api/doctors/${doctor.id}/available-slots?date=${format(date, "yyyy-MM-dd")}`
      );
      const json = await res.json();
      if (json.success) {
        setSlots(json.data.slots || []);
      } else {
        setSlots([]);
      }
    } catch {
      setSlots([]);
    }
    setLoadingSlots(false);
  };

  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate]);

  const getDayLabel = (date: Date) => {
    if (isToday(date)) return "Hôm nay";
    if (isTomorrow(date)) return "Ngày mai";
    return format(date, "EEE", { locale: vi });
  };

  const isWorkDay = (date: Date) => {
    const dayOfWeek = getDayOfWeekFromDate(date);
    return doctor.schedules.some(
      (s) => s.dayOfWeek === dayOfWeek && s.isActive
    );
  };

  return (
    <div className="animate-fade-in max-w-4xl">
      <Link href="/patient/doctors" className="flex items-center gap-1 text-slate-500 hover:text-cyan-600 mb-4 text-sm transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Quay lại danh sách
      </Link>

      {/* Hero card */}
      <div className="card mb-6 overflow-hidden">
        <div className="h-24 gradient-primary opacity-20" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex items-end gap-4 mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-lg flex-shrink-0">
              {doctor.user.name?.split(" ").pop()?.[0] || "B"}
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{doctor.user.name}</h1>
                {doctor.isVerified && (
                  <span className="badge bg-emerald-100 text-emerald-700 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Đã xác minh
                  </span>
                )}
              </div>
              <p className="text-cyan-600 font-medium text-sm">
                {doctor.specialty.icon} {doctor.specialty.name}
              </p>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4 text-amber-500" />
                  {doctor.experience} năm KN
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {doctor.rating.toFixed(1)} ({doctor._count.reviews} đánh giá)
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 rounded-2xl p-4">
            <div>
              <div className="text-sm text-slate-500">Phí khám</div>
              <div className="text-2xl font-bold text-cyan-700">
                {formatCurrency(parseFloat(doctor.consultingFee))}
              </div>
            </div>
            <Link
              href={`/patient/appointments/book/${doctor.id}`}
              className="btn-primary flex items-center gap-2 py-3 px-6"
            >
              <Calendar className="w-4 h-4" />
              Đặt lịch khám
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {(["info", "schedule", "reviews"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab === "info" && "Giới thiệu"}
            {tab === "schedule" && "Lịch làm việc"}
            {tab === "reviews" && `Đánh giá (${doctor._count.reviews})`}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "info" && (
        <div className="card p-6 space-y-6">
          {doctor.bio && (
            <div>
              <h2 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-600" />
                Giới thiệu
              </h2>
              <p className="text-slate-600 leading-relaxed">{doctor.bio}</p>
            </div>
          )}
          {doctor.education && (
            <div>
              <h2 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-cyan-600" />
                Học vấn & Chứng chỉ
              </h2>
              <p className="text-slate-600">{doctor.education}</p>
            </div>
          )}
          {doctor.specialty.description && (
            <div>
              <h2 className="font-bold text-slate-900 mb-2">Về chuyên khoa</h2>
              <p className="text-slate-600">{doctor.specialty.description}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "schedule" && (
        <div className="space-y-4">
          {/* Date picker */}
          <div className="card p-4">
            <h3 className="font-semibold text-slate-900 mb-3 text-sm">Chọn ngày khám</h3>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {next7Days.map((date) => {
                const isWork = isWorkDay(date);
                const isSelected = isSameDay(date, selectedDate);
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => isWork && setSelectedDate(date)}
                    disabled={!isWork}
                    className={`flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-xl text-sm transition-all border-2 min-w-[72px] ${
                      isSelected
                        ? "bg-cyan-600 text-white border-cyan-600"
                        : isWork
                        ? "bg-white text-slate-700 border-slate-200 hover:border-cyan-400"
                        : "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                    }`}
                  >
                    <span className="text-xs font-medium">{getDayLabel(date)}</span>
                    <span className="text-lg font-bold">{format(date, "d")}</span>
                    <span className="text-xs">{format(date, "MM/yyyy")}</span>
                    {!isWork && <span className="text-xs mt-1">Nghỉ</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slots */}
          <div className="card p-4">
            <h3 className="font-semibold text-slate-900 mb-3 text-sm">
              Slot trống – {format(selectedDate, "EEEE, dd/MM/yyyy", { locale: vi })}
            </h3>
            {loadingSlots ? (
              <div className="flex justify-center py-6">
                <div className="spinner w-6 h-6" />
              </div>
            ) : slots.length === 0 ? (
              <p className="text-slate-500 text-center py-4 text-sm">
                Bác sĩ không có lịch làm việc ngày này
              </p>
            ) : (
              <div className="slot-grid">
                {slots.map((slot) => (
                  <Link
                    key={slot.time}
                    href={
                      slot.available
                        ? `/patient/appointments/book/${doctor.id}?date=${format(selectedDate, "yyyy-MM-dd")}&time=${slot.time}`
                        : "#"
                    }
                    className={`slot-btn ${slot.available ? "available" : "booked"}`}
                    style={{ pointerEvents: slot.available ? "auto" : "none" }}
                  >
                    {slot.time}
                  </Link>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-3">
              <span className="inline-block w-3 h-3 bg-white border-2 border-slate-200 rounded-sm mr-1" />Còn trống
              <span className="inline-block w-3 h-3 bg-slate-100 border-2 border-slate-100 rounded-sm ml-3 mr-1" />Đã đặt
            </p>
          </div>
        </div>
      )}

      {activeTab === "reviews" && (
        <div className="space-y-4">
          {/* Rating summary */}
          <div className="card p-4 flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-900">{doctor.rating.toFixed(1)}</div>
              <div className="flex justify-center gap-0.5 my-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={`w-4 h-4 ${i <= Math.round(doctor.rating) ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-200"}`} />
                ))}
              </div>
              <div className="text-xs text-slate-500">{doctor._count.reviews} đánh giá</div>
            </div>
          </div>

          {doctor.reviews.length === 0 ? (
            <div className="card p-8 text-center text-slate-500">
              <Star className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Chưa có đánh giá nào</p>
            </div>
          ) : (
            doctor.reviews.map((review) => (
              <div key={review.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-slate-300 to-slate-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {review.patient.user.name?.[0]}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-slate-900">
                        {review.patient.user.name}
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className={`w-3 h-3 ${i <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-200"}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(review.createdAt)}</span>
                </div>
                {review.comment && (
                  <p className="text-sm text-slate-600 mt-2 ml-10">{review.comment}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
