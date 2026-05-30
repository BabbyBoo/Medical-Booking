"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  User as UserIcon,
  Activity,
  Lock,
  Save,
  Loader2,
  Upload,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface PatientProfile {
  bloodType: string | null;
  allergies: string | null;
  chronicDiseases: string | null;
  emergencyContact: string | null;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  address: string | null;
  avatar: string | null;
  patientProfile: PatientProfile | null;
}

export default function ProfileClient({ user }: { user: UserData }) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [activeTab, setActiveTab] = useState<"personal" | "medical" | "security">("personal");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: user.name || "",
    phone: user.phone || "",
    dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : "",
    gender: user.gender || "MALE",
    address: user.address || "",
    avatar: user.avatar || "",
    // Patient specific
    bloodType: user.patientProfile?.bloodType || "",
    allergies: user.patientProfile?.allergies || "",
    chronicDiseases: user.patientProfile?.chronicDiseases || "",
    emergencyContact: user.patientProfile?.emergencyContact || "",
    // Password change
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: "error", text: "Kích thước ảnh tối đa là 2MB" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Basic password confirmation check
    if (activeTab === "security" && formData.newPassword) {
      if (formData.newPassword.length < 8) {
        setMessage({ type: "error", text: "Mật khẩu mới phải có ít nhất 8 ký tự" });
        setLoading(false);
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setMessage({ type: "error", text: "Mật khẩu xác nhận không trùng khớp" });
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const res = await response.json();

      if (res.success) {
        setMessage({ type: "success", text: res.message || "Cập nhật hồ sơ thành công!" });
        // Clear passwords
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
        
        // Update next-auth session
        await updateSession({ name: formData.name, avatar: formData.avatar });
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.error || "Đã xảy ra lỗi khi cập nhật" });
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
        <h1>Hồ sơ cá nhân</h1>
        <p>Quản lý thông tin tài khoản, hồ sơ y tế và mật khẩu bảo mật</p>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-6 items-start">
        {/* Navigation Sidebar Cards */}
        <div className="card p-4 space-y-2">
          <button
            onClick={() => { setActiveTab("personal"); setMessage(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm text-left ${
              activeTab === "personal"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <UserIcon className="w-5 h-5 flex-shrink-0" />
            <span>Thông tin cá nhân</span>
          </button>

          <button
            onClick={() => { setActiveTab("medical"); setMessage(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm text-left ${
              activeTab === "medical"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Activity className="w-5 h-5 flex-shrink-0" />
            <span>Thông tin y tế</span>
          </button>

          <button
            onClick={() => { setActiveTab("security"); setMessage(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm text-left ${
              activeTab === "security"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Lock className="w-5 h-5 flex-shrink-0" />
            <span>Đổi mật khẩu</span>
          </button>

          <div className="border-t border-slate-100 my-4 pt-4 px-4 text-center">
            <div className="text-xs text-slate-400">Email tài khoản</div>
            <div className="text-sm font-medium text-slate-800 truncate" title={user.email}>
              {user.email}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="card p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* TAB 1: Personal Info */}
            {activeTab === "personal" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 overflow-hidden flex items-center justify-center text-white text-3xl font-bold border-4 border-slate-50 shadow-md">
                      {formData.avatar ? (
                        <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        formData.name?.[0]?.toUpperCase() || "U"
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 bg-white text-slate-700 p-2 rounded-xl border border-slate-200 shadow-lg hover:bg-slate-50 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  <div className="text-center sm:text-left space-y-1">
                    <h3 className="text-lg font-bold text-slate-800">Ảnh đại diện</h3>
                    <p className="text-sm text-slate-500">Chấp nhận JPG, PNG hoặc GIF. Dung lượng tối đa 2MB.</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label" htmlFor="name">Họ và tên <span className="text-red-500">*</span></label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="label" htmlFor="phone">Số điện thoại</label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="label" htmlFor="dateOfBirth">Ngày sinh</label>
                    <input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="label" htmlFor="gender">Giới tính</label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label" htmlFor="address">Địa chỉ</label>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Medical Info */}
            {activeTab === "medical" && (
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label" htmlFor="bloodType">Nhóm máu</label>
                    <input
                      id="bloodType"
                      name="bloodType"
                      type="text"
                      placeholder="VD: O+, A-, B+..."
                      value={formData.bloodType}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="label" htmlFor="emergencyContact">Liên hệ khẩn cấp (SĐT)</label>
                    <input
                      id="emergencyContact"
                      name="emergencyContact"
                      type="text"
                      placeholder="Tên - SĐT liên hệ"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label" htmlFor="allergies">Dị ứng thuốc / thức ăn</label>
                    <textarea
                      id="allergies"
                      name="allergies"
                      rows={3}
                      placeholder="Ghi rõ các dị ứng nếu có..."
                      value={formData.allergies}
                      onChange={handleInputChange}
                      className="input-field resize-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label" htmlFor="chronicDiseases">Bệnh lý mãn tính</label>
                    <textarea
                      id="chronicDiseases"
                      name="chronicDiseases"
                      rows={3}
                      placeholder="VD: Huyết áp cao, Tiểu đường, Tim mạch..."
                      value={formData.chronicDiseases}
                      onChange={handleInputChange}
                      className="input-field resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Change Password */}
            {activeTab === "security" && (
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="label" htmlFor="currentPassword">Mật khẩu hiện tại</label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label" htmlFor="newPassword">Mật khẩu mới</label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label" htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
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
                Lưu thay đổi
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
