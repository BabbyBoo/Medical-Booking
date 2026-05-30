"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Smartphone, Building2, Loader2, AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

interface Appointment {
  id: string;
  appointmentDate: string;
  slotTime: string;
  doctor: {
    user: { name: string };
    specialty: { name: string; icon: string | null };
  };
  payment: {
    amount: string;
    status: string;
  } | null;
}

export default function PaymentClient({ appointment }: { appointment: Appointment }) {
  const router = useRouter();
  const [method, setMethod] = useState<"card" | "transfer" | "ewallet">("card");
  const [cardNumber, setCardNumber] = useState("4111 1111 1111 1111");
  const [expiry, setExpiry] = useState("12/28");
  const [cvv, setCvv] = useState("123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePay = async () => {
    setLoading(true);
    setError("");

    // Simulate 2 second processing
    await new Promise((r) => setTimeout(r, 2000));

    try {
      const res = await fetch(`/api/payments/${appointment.id}/mock-pay`, {
        method: "POST",
      });
      const json = await res.json();

      if (json.success) {
        router.push(`/patient/appointments/${appointment.id}?paid=true`);
      } else {
        setError(json.error || "Thanh toán thất bại");
      }
    } catch {
      setError("Đã xảy ra lỗi");
    }
    setLoading(false);
  };

  const amount = parseFloat(appointment.payment?.amount || "0");

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <div className="page-header">
        <h1>Thanh toán lịch khám</h1>
      </div>

      {/* Demo banner */}
      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-800 text-sm">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span className="font-medium">CHẾ ĐỘ DEMO – Không phải thanh toán thật</span>
      </div>

      {/* Appointment summary */}
      <div className="card p-5 mb-4">
        <h2 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wide text-slate-500">
          Thông tin lịch hẹn
        </h2>
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Bác sĩ</span>
            <span className="font-medium">{appointment.doctor.user.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Chuyên khoa</span>
            <span className="font-medium">
              {appointment.doctor.specialty.icon} {appointment.doctor.specialty.name}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Ngày khám</span>
            <span className="font-medium">{formatDate(appointment.appointmentDate)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Giờ khám</span>
            <span className="font-medium">{appointment.slotTime}</span>
          </div>
          <div className="flex justify-between pt-2.5 border-t border-slate-100">
            <span className="font-bold text-slate-900">Tổng thanh toán</span>
            <span className="font-bold text-cyan-700 text-lg">{formatCurrency(amount)}</span>
          </div>
        </div>
      </div>

      {/* Payment method */}
      <div className="card p-5 mb-4">
        <h2 className="font-bold text-slate-900 mb-3 text-sm">Phương thức thanh toán</h2>
        <div className="space-y-2">
          {[
            { key: "card", label: "[MOCK] Thẻ tín dụng / Ghi nợ", icon: CreditCard },
            { key: "transfer", label: "[MOCK] Chuyển khoản ngân hàng", icon: Building2 },
            { key: "ewallet", label: "[MOCK] Ví điện tử", icon: Smartphone },
          ].map((m) => (
            <label
              key={m.key}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                method === m.key ? "border-cyan-500 bg-cyan-50" : "border-slate-200 hover:border-cyan-300"
              }`}
            >
              <input
                type="radio"
                value={m.key}
                checked={method === m.key}
                onChange={(e) => setMethod(e.target.value as typeof method)}
                className="accent-cyan-600"
              />
              <m.icon className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">{m.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Card form (mock) */}
      {method === "card" && (
        <div className="card p-5 mb-4 space-y-3">
          <div>
            <label className="label">Số thẻ (Mock)</label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="input-field font-mono"
              maxLength={19}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">MM/YY</label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="input-field"
                placeholder="12/28"
              />
            </div>
            <div>
              <label className="label">CVV</label>
              <input
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                className="input-field"
                placeholder="123"
                maxLength={3}
              />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={loading}
        className="btn-primary w-full py-4 text-base flex items-center justify-center gap-3"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Đang xử lý thanh toán...
          </>
        ) : (
          <>
            <ShieldCheck className="w-5 h-5" />
            Thanh toán {formatCurrency(amount)}
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5" />
        Giao dịch được mã hóa và bảo mật [DEMO]
      </div>
    </div>
  );
}
