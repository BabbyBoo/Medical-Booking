"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCheck, Calendar, AlertCircle, Info, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatTimeAgo } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const router = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data || []);
        setUnread((json.data || []).filter((n: Notification) => !n.isRead).length);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = async () => {
    setLoading(true);
    try {
      await fetch("/api/notifications/read-all", { method: "PUT" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch {}
    setLoading(false);
  };

  const handleNotificationClick = async (n: Notification) => {
    // 1. Mark as read on the server
    if (!n.isRead) {
      try {
        await fetch(`/api/notifications/${n.id}`, { method: "PUT" });
        // Update local state
        setNotifications((prev) =>
          prev.map((notif) => (notif.id === n.id ? { ...notif, isRead: true } : notif))
        );
        setUnread((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }

    // 2. Close the notifications dropdown
    setOpen(false);

    // 3. Redirect to the correct page based on role and notification type
    const role = session?.user?.role;
    if (role === "PATIENT") {
      if (n.type === "RECORD" || n.title.includes("Kết quả")) {
        router.push("/patient/medical-records");
      } else if (["REMINDER", "CONFIRM", "CANCEL"].includes(n.type)) {
        router.push("/patient/appointments");
      } else {
        router.push("/patient/dashboard");
      }
    } else if (role === "DOCTOR") {
      if (["REMINDER", "CONFIRM", "CANCEL"].includes(n.type)) {
        router.push("/doctor/appointments");
      } else {
        router.push("/doctor/dashboard");
      }
    } else if (role === "ADMIN") {
      if (["REMINDER", "CONFIRM", "CANCEL"].includes(n.type)) {
        router.push("/admin/appointments");
      } else {
        router.push("/admin/dashboard");
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "RECORD": return <FileText className="w-4 h-4 text-indigo-500" />;
      case "REMINDER": return <Calendar className="w-4 h-4 text-blue-500" />;
      case "CANCEL": return <X className="w-4 h-4 text-red-500" />;
      case "CONFIRM": return <CheckCheck className="w-4 h-4 text-emerald-500" />;
      default: return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
        aria-label="Thông báo"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div>
              <h3 className="font-semibold text-slate-900">Thông báo</h3>
              {unread > 0 && (
                <p className="text-xs text-slate-500">{unread} chưa đọc</p>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                disabled={loading}
                className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
              >
                Đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Không có thông báo
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer text-left ${
                    !n.isRead ? "bg-blue-50/50" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center mt-0.5">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug text-slate-900 ${!n.isRead ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{formatTimeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && (
                      <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
