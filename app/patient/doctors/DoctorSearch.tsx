"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Star, Filter, Loader2, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Specialty {
  id: string;
  name: string;
  icon: string | null;
}

interface Doctor {
  id: string;
  experience: number;
  consultingFee: string;
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  clinicAddress: string | null;
  user: { name: string; avatar: string | null };
  specialty: { id: string; name: string; icon: string | null };
  _count: { reviews: number };
}

interface Props {
  specialties: Specialty[];
}

export default function DoctorSearch({ specialties }: Props) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [minRating, setMinRating] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "9",
      });
      if (selectedSpecialty) params.set("specialtyId", selectedSpecialty);
      if (search) params.set("name", search);
      if (minRating) params.set("rating", minRating);

      const res = await fetch(`/api/doctors?${params}`);
      const json = await res.json();
      if (json.success) {
        setDoctors(json.data.doctors);
        setTotalPages(json.data.totalPages);
        setTotal(json.data.total);
      }
    } catch {}
    setLoading(false);
  }, [page, selectedSpecialty, search, minRating]);

  useEffect(() => {
    const timer = setTimeout(fetchDoctors, 300);
    return () => clearTimeout(timer);
  }, [fetchDoctors]);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Tìm bác sĩ</h1>
        <p>Tìm kiếm bác sĩ phù hợp theo chuyên khoa và đặt lịch ngay</p>
      </div>

      {/* Specialty quick filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-thin">
        <button
          onClick={() => { setSelectedSpecialty(""); setPage(1); }}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            !selectedSpecialty
              ? "bg-cyan-600 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:border-cyan-300"
          }`}
        >
          Tất cả
        </button>
        {specialties.map((s) => (
          <button
            key={s.id}
            onClick={() => { setSelectedSpecialty(s.id); setPage(1); }}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedSpecialty === s.id
                ? "bg-cyan-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:border-cyan-300"
            }`}
          >
            {s.icon && <span>{s.icon}</span>}
            {s.name}
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên bác sĩ..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={minRating}
            onChange={(e) => { setMinRating(e.target.value); setPage(1); }}
            className="input-field w-auto"
          >
            <option value="">Tất cả đánh giá</option>
            <option value="4">Từ 4 sao</option>
            <option value="4.5">Từ 4.5 sao</option>
            <option value="5">5 sao</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-slate-500 mb-4">
        {loading ? "Đang tìm kiếm..." : `Tìm thấy ${total} bác sĩ`}
      </p>

      {/* Doctor grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5">
              <div className="flex gap-4 mb-4">
                <div className="skeleton w-16 h-16 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              </div>
              <div className="skeleton h-8 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <div className="card p-12 text-center">
          <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium">Không tìm thấy bác sĩ phù hợp</p>
          <p className="text-slate-400 text-sm mt-1">Thử thay đổi bộ lọc tìm kiếm</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doctor) => (
            <div key={doctor.id} className="card p-5 hover:-translate-y-0.5 transition-transform group">
              <div className="flex gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {doctor.user.name?.split(" ").pop()?.[0] || "B"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-bold text-slate-900 text-sm leading-tight">
                      {doctor.user.name}
                    </h3>
                    {doctor.isVerified && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full flex-shrink-0">✓</span>
                    )}
                  </div>
                  <p className="text-xs text-cyan-600 font-medium mt-0.5">
                    {doctor.specialty.icon} {doctor.specialty.name}
                  </p>
                  <p className="text-xs text-slate-500">{doctor.experience} năm kinh nghiệm</p>
                  {doctor.clinicAddress && (
                    <p className="text-xs text-slate-400 mt-1 truncate" title={doctor.clinicAddress}>
                      📍 {doctor.clinicAddress}
                    </p>
                  )}
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i <= Math.round(doctor.rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-200 fill-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  {doctor.rating.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400">
                  ({doctor._count.reviews} đánh giá)
                </span>
              </div>

              {/* Fee */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs text-slate-400">Phí khám</span>
                  <div className="font-bold text-cyan-700 text-sm">
                    {formatCurrency(parseFloat(doctor.consultingFee))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/patient/doctors/${doctor.id}`}
                  className="btn-secondary flex-1 py-2 text-sm text-center"
                >
                  Xem hồ sơ
                </Link>
                <Link
                  href={`/patient/appointments/book/${doctor.id}`}
                  className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-1"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Đặt lịch
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary p-2 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-600">
            Trang {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-secondary p-2 disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
