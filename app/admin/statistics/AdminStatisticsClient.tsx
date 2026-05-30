"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  Stethoscope,
  Calendar,
  CreditCard,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";
import { formatCurrency, getStatusLabel } from "@/lib/utils";

interface StatsOverview {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  totalRevenue: number;
}

interface MonthlyData {
  month: string;
  count: number;
}

interface RevenueData {
  month: string;
  amount: number;
}

interface StatusData {
  status: string;
  count: number;
}

interface DoctorData {
  doctor: string;
  appointments: number;
}

interface StatisticsData {
  overview: StatsOverview;
  appointmentsByMonth: MonthlyData[];
  revenueByMonth: RevenueData[];
  appointmentsByStatus: StatusData[];
  topDoctors: DoctorData[];
}

const COLORS = ["#0891b2", "#6366f1", "#10b981", "#ef4444", "#f59e0b", "#64748b"];

export default function AdminStatisticsClient({ data }: { data: StatisticsData }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleExport = (type: string) => {
    window.open(`/api/admin/reports/export?type=${type}`, "_blank");
  };

  if (!isMounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-1/4 bg-slate-200 rounded-lg"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 rounded-2xl"></div>
          <div className="h-80 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // Format Status labels for chart legend
  const formattedStatusData = data.appointmentsByStatus.map((s) => ({
    name: getStatusLabel(s.status),
    value: s.count,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1>Báo cáo & Thống kê</h1>
          <p className="text-slate-500 text-sm">Biểu đồ tổng quan tình trạng lịch hẹn, doanh thu phòng khám và bác sĩ</p>
        </div>

        {/* Quick export triggers */}
        <div className="flex gap-2">
          <button
            onClick={() => handleExport("revenue")}
            className="btn-secondary py-2 text-xs flex items-center gap-1.5 text-slate-700 hover:border-cyan-500 hover:text-cyan-600"
          >
            <FileSpreadsheet className="w-4 h-4" /> Xuất doanh thu
          </button>
          <button
            onClick={() => handleExport("doctors")}
            className="btn-secondary py-2 text-xs flex items-center gap-1.5 text-slate-700 hover:border-cyan-500 hover:text-cyan-600"
          >
            <FileSpreadsheet className="w-4 h-4" /> Xuất danh sách BS
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card bg-white">
          <div className="stat-icon bg-blue-50">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{data.overview.totalPatients}</div>
            <div className="text-xs text-slate-500">Bệnh nhân đăng ký</div>
          </div>
        </div>

        <div className="stat-card bg-white">
          <div className="stat-icon bg-cyan-50">
            <Stethoscope className="w-6 h-6 text-cyan-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{data.overview.totalDoctors}</div>
            <div className="text-xs text-slate-500">Bác sĩ hoạt động</div>
          </div>
        </div>

        <div className="stat-card bg-white">
          <div className="stat-icon bg-indigo-50">
            <Calendar className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{data.overview.totalAppointments}</div>
            <div className="text-xs text-slate-500">Tổng lịch hẹn</div>
          </div>
        </div>

        <div className="stat-card bg-white">
          <div className="stat-icon bg-emerald-50">
            <CreditCard className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(data.overview.totalRevenue)}
            </div>
            <div className="text-xs text-slate-500">Doanh thu thanh toán</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Appointments by Month */}
        <div className="card p-5 bg-white space-y-4">
          <h2 className="font-bold text-slate-900 text-sm">Lịch hẹn theo tháng</h2>
          <div className="h-80 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.appointmentsByMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff" }}
                />
                <Bar dataKey="count" fill="#0891b2" radius={[4, 4, 0, 0]} name="Số cuộc hẹn" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Month */}
        <div className="card p-5 bg-white space-y-4">
          <h2 className="font-bold text-slate-900 text-sm">Doanh thu phòng khám</h2>
          <div className="h-80 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff" }}
                  formatter={(val) => formatCurrency(val as number)}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#6366f1"
                  strokeWidth={3}
                  activeDot={{ r: 8 }}
                  name="Doanh thu"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appointments by Status */}
        <div className="card p-5 bg-white space-y-4 flex flex-col justify-between">
          <h2 className="font-bold text-slate-900 text-sm">Phân bổ trạng thái lịch hẹn</h2>
          {formattedStatusData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-slate-400">Không có dữ liệu lịch hẹn</div>
          ) : (
            <div className="grid sm:grid-cols-[1fr_180px] items-center gap-6">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formattedStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {formattedStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 text-xs">
                {formattedStatusData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="text-slate-600 font-medium truncate">{item.name}:</span>
                    <span className="font-bold text-slate-900 ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top Doctors by Booking */}
        <div className="card p-5 bg-white space-y-4">
          <h2 className="font-bold text-slate-900 text-sm">Top 5 bác sĩ nhận lịch nhiều nhất</h2>
          <div className="divide-y divide-slate-100">
            {data.topDoctors.length === 0 ? (
              <div className="p-8 text-center text-slate-400">Không có dữ liệu bác sĩ</div>
            ) : (
              data.topDoctors.map((doc, idx) => (
                <div key={doc.doctor} className="py-3.5 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-cyan-600">#{idx + 1}</span>
                    <span className="font-semibold text-slate-800">{doc.doctor}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-950">{doc.appointments}</span>
                    <span className="text-xs text-slate-400">lịch khám</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
