"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Calendar, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { getDayOfWeekLabel } from "@/lib/utils";

type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

interface ScheduleItem {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
}

const DAYS_OF_WEEK: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export default function ScheduleClient({
  doctorId,
  initialSchedules,
}: {
  doctorId: string;
  initialSchedules: ScheduleItem[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Initialize schedule for all days, prefilling with db values
  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => {
    return DAYS_OF_WEEK.map((day) => {
      const dbItem = initialSchedules.find((s) => s.dayOfWeek === day);
      return {
        dayOfWeek: day,
        startTime: dbItem?.startTime || "08:00",
        endTime: dbItem?.endTime || "17:00",
        slotDuration: dbItem?.slotDuration || 30,
        isActive: dbItem ? dbItem.isActive : false,
      };
    });
  });

  const handleToggleActive = (index: number) => {
    setSchedules((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, isActive: !item.isActive } : item))
    );
  };

  const handleFieldChange = (index: number, field: keyof ScheduleItem, value: any) => {
    setSchedules((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validate times (start must be before end)
    for (const schedule of schedules) {
      if (schedule.isActive) {
        const [startH, startM] = schedule.startTime.split(":").map(Number);
        const [endH, endM] = schedule.endTime.split(":").map(Number);
        if (startH * 60 + startM >= endH * 60 + endM) {
          setMessage({
            type: "error",
            text: `Thời gian bắt đầu phải trước thời gian kết thúc ở ngày ${getDayOfWeekLabel(
              schedule.dayOfWeek
            )}`,
          });
          setLoading(false);
          return;
        }
      }
    }

    try {
      const response = await fetch(`/api/doctors/${doctorId}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedules),
      });

      const res = await response.json();

      if (res.success) {
        setMessage({ type: "success", text: "Cập nhật lịch làm việc thành công!" });
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.error || "Có lỗi xảy ra khi cập nhật" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Không thể kết nối đến máy chủ" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>Lịch làm việc</h1>
        <p>Thiết lập thời gian làm việc hàng tuần và thời gian tư vấn cho mỗi ca khám</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 border ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-100 text-emerald-800"
              : "bg-red-50 border-red-100 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="card divide-y divide-slate-100 overflow-hidden">
          {schedules.map((schedule, idx) => (
            <div
              key={schedule.dayOfWeek}
              className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                schedule.isActive ? "bg-white" : "bg-slate-50/50"
              }`}
            >
              {/* Day & Toggle Checkbox */}
              <div className="flex items-center gap-4 min-w-[200px]">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={schedule.isActive}
                    onChange={() => handleToggleActive(idx)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
                <div>
                  <span className="font-bold text-slate-800 block">
                    {getDayOfWeekLabel(schedule.dayOfWeek)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {schedule.isActive ? "Đang nhận bệnh nhân" : "Nghỉ làm việc"}
                  </span>
                </div>
              </div>

              {/* Time Configuration (Visible if active) */}
              {schedule.isActive ? (
                <div className="flex flex-wrap items-center gap-4 flex-1 justify-start md:justify-end">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Bắt đầu:</span>
                    <input
                      type="time"
                      value={schedule.startTime}
                      onChange={(e) => handleFieldChange(idx, "startTime", e.target.value)}
                      className="input-field py-1.5 px-3 max-w-[120px] text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Kết thúc:</span>
                    <input
                      type="time"
                      value={schedule.endTime}
                      onChange={(e) => handleFieldChange(idx, "endTime", e.target.value)}
                      className="input-field py-1.5 px-3 max-w-[120px] text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Thời gian khám:</span>
                    <select
                      value={schedule.slotDuration}
                      onChange={(e) =>
                        handleFieldChange(idx, "slotDuration", parseInt(e.target.value))
                      }
                      className="input-field py-1.5 px-3 max-w-[140px] text-sm"
                    >
                      <option value={15}>15 phút</option>
                      <option value={20}>20 phút</option>
                      <option value={30}>30 phút</option>
                      <option value={45}>45 phút</option>
                      <option value={60}>60 phút</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-400 italic flex-1 text-left md:text-right">
                  Nghỉ ngơi / Lịch nghỉ định kỳ
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Lưu lịch làm việc
          </button>
        </div>
      </form>
    </div>
  );
}
