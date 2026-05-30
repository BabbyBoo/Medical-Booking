"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  User as UserIcon,
  Award,
  Lock,
  Save,
  Loader2,
  Upload,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface Specialty {
  name: string;
}

interface DoctorProfile {
  id: string;
  specialtyId: string;
  licenseNumber: string;
  experience: number;
  education: string | null;
  bio: string | null;
  consultingFee: string; // Decimal from prisma serializes as string
  clinicAddress: string | null;
  specialty: Specialty;
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
  doctorProfile: DoctorProfile | null;
}

export default function DoctorProfileClient({ user }: { user: UserData }) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [activeTab, setActiveTab] = useState<"personal" | "professional" | "security">("personal");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const doctorProfile = user.doctorProfile;

  // Form states
  const [formData, setFormData] = useState({
    name: user.name || "",
    phone: user.phone || "",
    dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : "",
    gender: user.gender || "MALE",
    address: user.address || "",
    avatar: user.avatar || "",
    // Doctor specific
    education: doctorProfile?.education || "",
    experience: doctorProfile?.experience || 0,
    bio: doctorProfile?.bio || "",
    consultingFee: doctorProfile?.consultingFee || "0",
    clinicAddress: doctorProfile?.clinicAddress || "",
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
      if (activeTab === "personal" || activeTab === "security") {
        // Update user account details
        const response = await fetch(`/api/users/${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const res = await response.json();

        if (res.success) {
          setMessage({ type: "success", text: "Cập nhật hồ sơ tài khoản thành công!" });
          setFormData((prev) => ({
            ...prev,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          }));
          await updateSession({ name: formData.name, avatar: formData.avatar });
          router.refresh();
        } else {
          setMessage({ type: "error", text: res.error || "Có lỗi xảy ra" });
        }
      } else if (activeTab === "professional" && doctorProfile) {
        // Update professional details
        const response = await fetch(`/api/doctors/${doctorProfile.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bio: formData.bio,
            education: formData.education,
            experience: formData.experience,
            consultingFee: formData.consultingFee,
            clinicAddress: formData.clinicAddress,
          }),
        });

        const res = await response.json();

        if (res.success) {
          setMessage({ type: "success", text: "Cập nhật hồ sơ chuyên môn thành công!" });
          router.refresh();
        } else {
          setMessage({ type: "error", text: res.error || "Có lỗi xảy ra" });
        }
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
        <h1>Hồ sơ bác sĩ</h1>
        <p>Quản lý thông tin liên hệ, bằng cấp học vấn, phí khám bệnh và bảo mật tài khoản</p>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-6 items-start">
        {/* Navigation Sidebar */}
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
            onClick={() => { setActiveTab("professional"); setMessage(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm text-left ${
              activeTab === "professional"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Award className="w-5 h-5 flex-shrink-0" />
            <span>Hồ sơ chuyên môn</span>
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
            <div className="text-xs text-slate-400">Chuyên khoa</div>
            <div className="text-sm font-semibold text-cyan-700">
              {doctorProfile?.specialty.name || "Chưa xác định"}
            </div>
            <div className="text-xs text-slate-400 mt-2">Mã số chứng chỉ</div>
            <div className="text-xs font-mono text-slate-600">
              {doctorProfile?.licenseNumber || "N/A"}
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
                    <h3 className="text-lg font-bold text-slate-800">Ảnh chân dung</h3>
                    <p className="text-sm text-slate-500">Chấp nhận JPG, PNG hoặc GIF. Dung lượng tối đa 2MB.</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label" htmlFor="name">Họ và tên bác sĩ <span className="text-red-500">*</span></label>
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
                </div>
              </div>
            )}

            {/* TAB 2: Professional Profile */}
            {activeTab === "professional" && (
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label" htmlFor="experience">Kinh nghiệm lâm nghiệp (Năm)</label>
                    <input
                      id="experience"
                      name="experience"
                      type="number"
                      min={0}
                      value={formData.experience}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="label" htmlFor="consultingFee">Phí khám bệnh (VND)</label>
                    <input
                      id="consultingFee"
                      name="consultingFee"
                      type="number"
                      min={0}
                      step={10000}
                      value={formData.consultingFee}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label" htmlFor="clinicAddress">Địa chỉ phòng khám (Nơi bệnh nhân đến khám)</label>
                    <input
                      id="clinicAddress"
                      name="clinicAddress"
                      type="text"
                      placeholder="VD: Phòng khám số 12, Tầng 2, MedBook Ba Tháng Hai, Quận 10, TP. HCM..."
                      value={formData.clinicAddress}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label" htmlFor="education">Trình độ học vấn / Bằng cấp chuyên khoa</label>
                    <textarea
                      id="education"
                      name="education"
                      rows={3}
                      placeholder="VD: Thạc sĩ Y khoa Đại học Y Hà Nội, Bác sĩ chuyên khoa I Nhi khoa..."
                      value={formData.education}
                      onChange={handleInputChange}
                      className="input-field resize-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label" htmlFor="bio">Tiểu sử nghề nghiệp & Kinh nghiệm</label>
                    <textarea
                      id="bio"
                      name="bio"
                      rows={4}
                      placeholder="Giới thiệu chi tiết về chuyên môn khám và nghiên cứu y học của bản thân..."
                      value={formData.bio}
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
