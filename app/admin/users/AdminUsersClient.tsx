"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  UserCheck,
  UserX,
  Key,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle,
  Edit2,
  X,
  User,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  gender: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Props {
  initialUsers: User[];
  currentUserId: string;
}

export default function AdminUsersClient({ initialUsers, currentUserId }: Props) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Editing state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editPassword, setEditPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalMsg, setModalMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Detailed profile state for admin view
  const [fullUserDetails, setFullUserDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    setActionLoadingId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });

      const res = await response.json();

      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: !currentActive } : u))
        );
        router.refresh();
      } else {
        alert(res.error || "Không thể cập nhật trạng thái");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối đến máy chủ");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenEdit = async (user: User) => {
    setSelectedUser(user);
    setEditPassword("");
    setModalMsg(null);
    setFullUserDetails(null);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/users/${user.id}`);
      const json = await res.json();
      if (json.success) {
        setFullUserDetails(json.data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingDetails(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setLoading(true);
    setModalMsg(null);

    const updatePayload: Record<string, any> = {};

    if (editPassword.trim()) {
      if (editPassword.trim().length < 8) {
        setModalMsg({ type: "error", text: "Mật khẩu mới phải có ít nhất 8 ký tự" });
        setLoading(false);
        return;
      }
      updatePayload.newPassword = editPassword.trim();
    }

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      const res = await response.json();

      if (res.success) {
        setModalMsg({ type: "success", text: "Đặt lại mật khẩu thành công!" });
        setEditPassword("");
        router.refresh();
      } else {
        setModalMsg({ type: "error", text: res.error || "Cập nhật thất bại" });
      }
    } catch (err) {
      setModalMsg({ type: "error", text: "Lỗi kết nối máy chủ" });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm));
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && u.isActive) ||
      (statusFilter === "INACTIVE" && !u.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800";
      case "DOCTOR":
        return "bg-cyan-100 text-cyan-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1>Quản lý người dùng</h1>
        <p>Tìm kiếm, khóa/mở khóa tài khoản, đổi quyền hạn và quản trị thông tin đăng nhập</p>
      </div>

      {/* Filter panel */}
      <div className="card p-4 grid md:grid-cols-3 gap-4 items-center bg-white">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Tìm theo tên, email, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-field"
          >
            <option value="ALL">Tất cả chức vụ</option>
            <option value="PATIENT">Bệnh nhân (Patient)</option>
            <option value="DOCTOR">Bác sĩ (Doctor)</option>
            <option value="ADMIN">Quản trị viên (Admin)</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động (Active)</option>
            <option value="INACTIVE">Bị khóa (Blocked)</option>
          </select>
        </div>
      </div>

      {/* User Listing Table */}
      {filteredUsers.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Không tìm thấy người dùng</h3>
          <p className="text-sm">Không tìm thấy tài khoản nào phù hợp với bộ lọc.</p>
        </div>
      ) : (
        <div className="card overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-700 font-semibold">
                <tr>
                  <th className="p-4">Người dùng</th>
                  <th className="p-4">Điện thoại</th>
                  <th className="p-4">Chức vụ</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Ngày đăng ký</th>
                  <th className="p-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div>
                        <div className="font-semibold text-slate-900">{u.name}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </div>
                    </td>
                    <td className="p-4">{u.phone || <span className="text-slate-400 italic">Chưa cập nhật</span>}</td>
                    <td className="p-4">
                      <span className={`badge ${getRoleBadgeColor(u.role)}`}>
                        {u.role === "ADMIN" ? "Quản trị viên" : u.role === "DOCTOR" ? "Bác sĩ" : "Bệnh nhân"}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleActive(u.id, u.isActive)}
                        disabled={actionLoadingId === u.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                          u.isActive
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                            : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                        }`}
                      >
                        {actionLoadingId === u.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : u.isActive ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Hoạt động</span>
                          </>
                        ) : (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span>Bị khóa</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-4">{formatDate(u.createdAt)}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center gap-1 hover:border-cyan-500 hover:text-cyan-600"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Quản lý
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-xl w-full shadow-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-950">Thiết lập tài khoản</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedUser.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              {modalMsg && (
                <div
                  className={`p-3 rounded-xl border text-xs flex gap-2 items-start ${
                    modalMsg.type === "success"
                      ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                      : "bg-red-50 border-red-100 text-red-800"
                  }`}
                >
                  {modalMsg.type === "success" ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <span className="font-medium">{modalMsg.text}</span>
                </div>
              )}

              <div>
                <label className="label text-xs">Vai trò quyền hạn</label>
                <div className="input-field py-2 text-xs bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed select-none">
                  {selectedUser.role === "ADMIN" ? "Quản trị viên (ADMIN)" : selectedUser.role === "DOCTOR" ? "Bác sĩ (DOCTOR)" : "Bệnh nhân (PATIENT)"}
                </div>
              </div>

              <div className="border-t border-slate-50 pt-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 mb-2">
                  <Key className="w-4 h-4 text-slate-500" />
                  Đặt lại mật khẩu
                </div>
                {selectedUser.role === "ADMIN" && selectedUser.id !== currentUserId ? (
                  <p className="text-xs text-red-500 italic">Không được phép đổi mật khẩu của tài khoản Quản trị viên khác.</p>
                ) : (
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu mới (bỏ trống nếu không đổi)..."
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="input-field py-2 text-xs"
                  />
                )}
              </div>

              {/* Profile Details Section */}
              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-xs font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-cyan-600" />
                  Thông tin hồ sơ chi tiết
                </h4>
                {loadingDetails ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
                  </div>
                ) : !fullUserDetails ? (
                  <p className="text-xs text-slate-400 italic">Không thể tải thông tin hồ sơ.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">Ngày sinh:</span>
                      <p className="font-medium text-slate-700">
                        {fullUserDetails.dateOfBirth ? formatDate(fullUserDetails.dateOfBirth) : "Chưa cập nhật"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Giới tính:</span>
                      <p className="font-medium text-slate-700">
                        {fullUserDetails.gender === "MALE" ? "Nam" : fullUserDetails.gender === "FEMALE" ? "Nữ" : fullUserDetails.gender === "OTHER" ? "Khác" : "Chưa cập nhật"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400">Địa chỉ:</span>
                      <p className="font-medium text-slate-700">{fullUserDetails.address || "Chưa cập nhật"}</p>
                    </div>

                    {/* Patient Profile */}
                    {fullUserDetails.role === "PATIENT" && fullUserDetails.patientProfile && (
                      <>
                        <div className="col-span-2 border-t border-slate-100 pt-2 mt-1">
                          <span className="font-semibold text-cyan-700">Thông tin y tế bệnh nhân</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Nhóm máu:</span>
                          <p className="font-medium text-slate-700">{fullUserDetails.patientProfile.bloodType || "Chưa cập nhật"}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Liên hệ khẩn cấp:</span>
                          <p className="font-medium text-slate-700">{fullUserDetails.patientProfile.emergencyContact || "Chưa cập nhật"}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400">Dị ứng:</span>
                          <p className="font-medium text-slate-700">{fullUserDetails.patientProfile.allergies || "Không có"}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400">Bệnh lý nền:</span>
                          <p className="font-medium text-slate-700">{fullUserDetails.patientProfile.chronicDiseases || "Không có"}</p>
                        </div>
                      </>
                    )}

                    {/* Doctor Profile */}
                    {fullUserDetails.role === "DOCTOR" && fullUserDetails.doctorProfile && (
                      <>
                        <div className="col-span-2 border-t border-slate-100 pt-2 mt-1">
                          <span className="font-semibold text-cyan-700">Thông tin bác sĩ</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Chuyên khoa:</span>
                          <p className="font-medium text-slate-700">{fullUserDetails.doctorProfile.specialty?.name || "Chưa cập nhật"}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Mã GP hành nghề:</span>
                          <p className="font-medium text-slate-700">{fullUserDetails.doctorProfile.licenseNumber || "Chưa cập nhật"}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Số năm kinh nghiệm:</span>
                          <p className="font-medium text-slate-700">{fullUserDetails.doctorProfile.experience} năm</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Phí khám lâm sàng:</span>
                          <p className="font-medium text-slate-700 font-semibold text-cyan-700">
                            {formatCurrency(parseFloat(fullUserDetails.doctorProfile.consultingFee))}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400">Địa chỉ phòng khám:</span>
                          <p className="font-medium text-slate-700">{fullUserDetails.doctorProfile.clinicAddress || "Chưa cập nhật"}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400">Học văn & Bằng cấp:</span>
                          <p className="font-medium text-slate-700">{fullUserDetails.doctorProfile.education || "Chưa cập nhật"}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400">Giới thiệu bản thân:</span>
                          <p className="font-medium text-slate-700 leading-relaxed">{fullUserDetails.doctorProfile.bio || "Chưa cập nhật"}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="btn-secondary py-2 text-xs"
                >
                  Đóng
                </button>
                {selectedUser.role !== "ADMIN" || selectedUser.id === currentUserId ? (
                  <button
                    type="submit"
                    disabled={loading || !editPassword.trim()}
                    title={!editPassword.trim() ? "Nhập mật khẩu mới để lưu" : undefined}
                    className="btn-primary py-2 text-xs flex items-center gap-1 bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Lưu mật khẩu mới
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
