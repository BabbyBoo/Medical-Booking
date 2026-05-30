import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistance } from "date-fns";
import { vi } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, pattern = "dd/MM/yyyy") {
  return format(new Date(date), pattern, { locale: vi });
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), "HH:mm - dd/MM/yyyy", { locale: vi });
}

export function formatCurrency(amount: number | string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(num);
}

export function formatTimeAgo(date: Date | string) {
  return formatDistance(new Date(date), new Date(), {
    addSuffix: true,
    locale: vi,
  });
}

export function getDayOfWeekLabel(day: string): string {
  const labels: Record<string, string> = {
    MONDAY: "Thứ 2",
    TUESDAY: "Thứ 3",
    WEDNESDAY: "Thứ 4",
    THURSDAY: "Thứ 5",
    FRIDAY: "Thứ 6",
    SATURDAY: "Thứ 7",
    SUNDAY: "Chủ nhật",
  };
  return labels[day] ?? day;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    CANCELLED: "Đã hủy",
    COMPLETED: "Hoàn thành",
    EXPIRED: "Hết hạn",
    NO_SHOW: "Bệnh nhân không đến",
    PAID: "Đã thanh toán",
    UNPAID: "Chưa thanh toán",
    REFUNDED: "Đã hoàn tiền",
  };
  return labels[status] ?? status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    CANCELLED: "bg-red-100 text-red-800",
    COMPLETED: "bg-emerald-100 text-emerald-800",
    EXPIRED: "bg-gray-100 text-gray-800",
    NO_SHOW: "bg-rose-100 text-rose-800",
    PAID: "bg-emerald-100 text-emerald-800",
    UNPAID: "bg-amber-100 text-amber-800",
    REFUNDED: "bg-purple-100 text-purple-800",
  };
  return colors[status] ?? "bg-gray-100 text-gray-800";
}

export function generateTimeSlots(
  startTime: string,
  endTime: string,
  duration: number
): string[] {
  const slots: string[] = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (currentMinutes < endMinutes) {
    // Exclude lunch break from 11:00 to 14:00 (11 * 60 to 14 * 60 minutes)
    if (currentMinutes >= 11 * 60 && currentMinutes < 14 * 60) {
      currentMinutes += duration;
      continue;
    }
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    slots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    currentMinutes += duration;
  }

  return slots;
}

export function getDayOfWeekFromDate(date: Date, useUTC = false): string {
  const days = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  return days[useUTC ? date.getUTCDay() : date.getDay()];
}

export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}


export function apiResponse(
  success: boolean,
  data?: unknown,
  message?: string,
  error?: string,
  status = 200
) {
  return Response.json({ success, data, message, error }, { status });
}
