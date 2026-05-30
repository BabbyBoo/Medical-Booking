"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Heart,
  LayoutDashboard,
  Calendar,
  Users,
  UserCog,
  ClipboardList,
  Star,
  BarChart3,
  CreditCard,
  Settings,
  LogOut,
  Stethoscope,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const patientNav: NavItem[] = [
  { href: "/patient/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/patient/doctors", label: "Tìm bác sĩ", icon: Stethoscope },
  { href: "/patient/appointments", label: "Lịch hẹn của tôi", icon: Calendar },
  { href: "/patient/medical-records", label: "Lịch sử khám", icon: ClipboardList },
  { href: "/patient/profile", label: "Hồ sơ cá nhân", icon: UserCog },
];

const doctorNav: NavItem[] = [
  { href: "/doctor/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/doctor/appointments", label: "Lịch hẹn", icon: Calendar },
  { href: "/doctor/schedule", label: "Lịch làm việc", icon: Settings },
  { href: "/doctor/profile", label: "Hồ sơ bác sĩ", icon: UserCog },
];

const adminNav: NavItem[] = [
  { href: "/admin/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/users", label: "Người dùng", icon: Users },
  { href: "/admin/doctors", label: "Bác sĩ & Chuyên khoa", icon: Stethoscope },
  { href: "/admin/appointments", label: "Lịch hẹn", icon: Calendar },
  { href: "/admin/statistics", label: "Thống kê", icon: BarChart3 },
  { href: "/admin/payments", label: "Thanh toán", icon: CreditCard },
];

function getRoleNav(role: string) {
  if (role === "DOCTOR") return doctorNav;
  if (role === "ADMIN") return adminNav;
  return patientNav;
}

function getRoleLabel(role: string) {
  if (role === "DOCTOR") return "Bác sĩ";
  if (role === "ADMIN") return "Quản trị viên";
  return "Bệnh nhân";
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role || "PATIENT";
  const navItems = getRoleNav(role);
  const dashboardLink = `/${role.toLowerCase()}/dashboard`;

  return (
    <aside className="bg-white border-r border-slate-100 flex flex-col h-screen sticky top-0 w-[260px]">
      {/* Logo */}
      <div className="p-5 border-b border-slate-100">
        <Link href={dashboardLink} className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <div className="w-9 h-9 bg-cyan-600 rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-slate-900">MedBook</span>
        </Link>
      </div>

      {/* Role badge */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2 px-3 py-2 bg-cyan-50 rounded-xl">
          <div className="w-2 h-2 bg-cyan-500 rounded-full" />
          <span className="text-xs font-semibold text-cyan-700">{getRoleLabel(role)}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== `/${role.toLowerCase()}/dashboard` && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive ? "active" : ""}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* User info + Logout */}
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm text-slate-900 truncate">
              {session?.user?.name || "User"}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {session?.user?.email}
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-medium text-sm"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
