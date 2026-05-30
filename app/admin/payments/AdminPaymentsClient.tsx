"use client";

import { useState } from "react";
import { Search, Filter, AlertCircle, FileSpreadsheet, CreditCard, DollarSign } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

interface Payment {
  id: string;
  appointmentId: string;
  amount: string;
  status: string;
  method: string | null;
  transactionId: string | null;
  paidAt: string | null;
  createdAt: string;
  appointment: {
    patient: { user: { name: string } };
    doctor: { user: { name: string } };
  };
}

export default function AdminPaymentsClient({ initialPayments }: { initialPayments: Payment[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const handleExport = () => {
    window.open("/api/admin/reports/export?type=revenue", "_blank");
  };

  const filteredPayments = initialPayments.filter((payment) => {
    const patientName = payment.appointment.patient.user.name.toLowerCase();
    const docName = payment.appointment.doctor.user.name.toLowerCase();
    const txnId = (payment.transactionId || "").toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch = patientName.includes(search) || docName.includes(search) || txnId.includes(search);
    const matchesStatus = statusFilter === "ALL" || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "REFUNDED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PAID":
        return "Đã thanh toán";
      case "REFUNDED":
        return "Đã hoàn tiền";
      default:
        return "Chưa thanh toán";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1>Giao dịch thanh toán</h1>
          <p className="text-slate-500 text-sm">Theo dõi doanh thu phòng khám và đối chiếu hóa đơn giao dịch</p>
        </div>

        <button
          onClick={handleExport}
          className="btn-secondary py-2.5 text-xs flex items-center gap-1.5 text-slate-700 hover:border-cyan-500 hover:text-cyan-600 self-start"
        >
          <FileSpreadsheet className="w-4 h-4" /> Xuất báo cáo doanh thu (CSV)
        </button>
      </div>

      {/* Filter panel */}
      <div className="card p-4 grid sm:grid-cols-2 gap-4 items-center bg-white">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Tìm theo tên bệnh nhân, bác sĩ, mã giao dịch..."
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
            <option value="PAID">Đã thanh toán (PAID)</option>
            <option value="UNPAID">Chưa thanh toán (UNPAID)</option>
            <option value="REFUNDED">Đã hoàn tiền (REFUNDED)</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      {filteredPayments.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Không có giao dịch nào</h3>
          <p className="text-sm">Không tìm thấy bản ghi giao dịch thanh toán nào phù hợp.</p>
        </div>
      ) : (
        <div className="card overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-700 font-semibold">
                <tr>
                  <th className="p-4">Mã giao dịch</th>
                  <th className="p-4">Bệnh nhân</th>
                  <th className="p-4">Bác sĩ khám</th>
                  <th className="p-4">Số tiền</th>
                  <th className="p-4">Phương thức</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Ngày thanh toán</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Transaction ID */}
                    <td className="p-4 font-mono text-xs text-slate-500">
                      {payment.transactionId || (
                        <span className="text-slate-400 italic">MOCK_PENDING</span>
                      )}
                    </td>

                    {/* Patient Name */}
                    <td className="p-4">
                      <div className="font-semibold text-slate-900">
                        {payment.appointment.patient.user.name}
                      </div>
                    </td>

                    {/* Doctor Name */}
                    <td className="p-4">
                      <div className="font-medium text-slate-700">
                        {payment.appointment.doctor.user.name}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="p-4">
                      <div className="font-bold text-slate-900 flex items-center gap-0.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{formatCurrency(payment.amount)}</span>
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td className="p-4 text-xs font-semibold text-slate-500">
                      {payment.method === "MOCK_ONLINE" ? (
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5 text-cyan-600" />
                          Online
                        </span>
                      ) : (
                        payment.method || "Chưa có"
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">
                      <span className={`badge border ${getStatusBadge(payment.status)}`}>
                        {getStatusLabel(payment.status)}
                      </span>
                    </td>

                    {/* Paid At */}
                    <td className="p-4 text-xs text-slate-500">
                      {payment.paidAt ? (
                        formatDate(payment.paidAt)
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
