"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Stethoscope,
  BookOpen,
  Edit2,
  Trash2,
  X,
  ShieldAlert,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface User {
  isActive: boolean;
  name: string;
  email: string;
  phone: string | null;
  gender: string | null;
  avatar: string | null;
}

interface Specialty {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
}

interface Doctor {
  id: string;
  userId: string;
  specialtyId: string;
  licenseNumber: string;
  experience: number;
  consultingFee: string;
  isVerified: boolean;
  isActive: boolean;
  clinicAddress: string | null;
  user: User;
  specialty: Specialty;
}

export default function AdminDoctorsClient({
  initialDoctors,
  initialSpecialties,
}: {
  initialDoctors: Doctor[];
  initialSpecialties: Specialty[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"doctors" | "specialties">("doctors");

  // State lists
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [specialties, setSpecialties] = useState<Specialty[]>(initialSpecialties);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("ALL");

  // Modals state
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);

  // Loading & Message states
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Doctor Form State
  const [doctorForm, setDoctorForm] = useState({
    name: "",
    email: "",
    password: "",
    gender: "MALE",
    phone: "",
    specialtyId: initialSpecialties[0]?.id || "",
    licenseNumber: "",
    experience: "0",
    consultingFee: "200000",
    education: "",
    bio: "",
    clinicAddress: "",
  });

  // Specialty Form State
  const [specialtyForm, setSpecialtyForm] = useState({
    name: "",
    description: "",
    icon: "🩺",
  });

  const handleToggleVerify = async (docId: string, currentVerified: boolean) => {
    setActionLoadingId(docId);
    try {
      const res = await fetch(`/api/admin/doctors/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: !currentVerified }),
      });
      const data = await res.json();
      if (data.success) {
        setDoctors((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, isVerified: !currentVerified } : d))
        );
        router.refresh();
      } else {
        alert(data.error || "Không thể cập nhật trạng thái");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleActive = async (docId: string, currentActive: boolean) => {
    setActionLoadingId(docId);
    try {
      const res = await fetch(`/api/admin/doctors/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      const data = await res.json();
      if (data.success) {
        setDoctors((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, isActive: !currentActive } : d))
        );
        router.refresh();
      } else {
        alert(data.error || "Không thể cập nhật trạng thái");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    try {
      const res = await fetch("/api/admin/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...doctorForm,
          email: doctorForm.email.includes("@")
            ? doctorForm.email
            : `${doctorForm.email}@medbook.vn`,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setShowDoctorModal(false);
        // Reset form
        setDoctorForm({
          name: "",
          email: "",
          password: "",
          gender: "MALE",
          phone: "",
          specialtyId: initialSpecialties[0]?.id || "",
          licenseNumber: "",
          experience: "0",
          consultingFee: "200000",
          education: "",
          bio: "",
          clinicAddress: "",
        });
        // Trigger page refresh to fetch the new doctor with full relations
        router.refresh();
      } else {
        setModalError(data.error || "Tạo bác sĩ thất bại");
      }
    } catch (err) {
      setModalError("Lỗi kết nối máy chủ");
    } finally {
      setModalLoading(false);
    }
  };

  const handleSpecialtySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    const isEdit = !!editingSpecialty;
    const url = isEdit ? `/api/admin/specialties/${editingSpecialty.id}` : "/api/admin/specialties";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...specialtyForm,
          isActive: isEdit ? editingSpecialty.isActive : true,
        }),
      });
      const data = await res.json();

      if (data.success) {
        if (isEdit) {
          setSpecialties((prev) =>
            prev.map((s) => (s.id === editingSpecialty.id ? data.data : s))
          );
        } else {
          setSpecialties((prev) => [...prev, data.data]);
        }
        setShowSpecialtyModal(false);
        setEditingSpecialty(null);
        setSpecialtyForm({ name: "", description: "", icon: "🩺" });
        router.refresh();
      } else {
        setModalError(data.error || "Thao tác thất bại");
      }
    } catch (err) {
      setModalError("Lỗi kết nối máy chủ");
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenEditSpecialty = (spec: Specialty) => {
    setEditingSpecialty(spec);
    setSpecialtyForm({
      name: spec.name,
      description: spec.description || "",
      icon: spec.icon || "🩺",
    });
    setModalError(null);
    setShowSpecialtyModal(true);
  };

  const handleDeleteSpecialty = async (specId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa chuyên khoa này?")) return;

    try {
      const res = await fetch(`/api/admin/specialties/${specId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setSpecialties((prev) => prev.filter((s) => s.id !== specId));
        router.refresh();
      } else {
        alert(data.error || "Không thể xóa chuyên khoa");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ");
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const drName = doc.user.name.toLowerCase();
    const license = doc.licenseNumber.toLowerCase();
    const email = doc.user.email.toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch = drName.includes(search) || license.includes(search) || email.includes(search);
    const matchesSpecialty = specialtyFilter === "ALL" || doc.specialtyId === specialtyFilter;

    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="space-y-6">
      {/* Header with Switch Tabs & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bác sĩ & Chuyên khoa</h1>
          <p className="text-slate-500 text-sm">Duyệt hồ sơ bác sĩ và tạo các chuyên khoa khám bệnh</p>
        </div>

        <div className="flex gap-2">
          {activeTab === "doctors" ? (
            <button
              onClick={() => setShowDoctorModal(true)}
              className="btn-primary py-2.5 text-xs flex items-center gap-1.5 bg-cyan-600 text-white"
            >
              <Plus className="w-4 h-4" /> Thêm bác sĩ
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingSpecialty(null);
                setSpecialtyForm({ name: "", description: "", icon: "🩺" });
                setModalError(null);
                setShowSpecialtyModal(true);
              }}
              className="btn-primary py-2.5 text-xs flex items-center gap-1.5 bg-cyan-600 text-white"
            >
              <Plus className="w-4 h-4" /> Thêm chuyên khoa
            </button>
          )}
        </div>
      </div>

      {/* Tabs bar */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("doctors")}
          className={`pb-3 px-4 text-sm font-semibold transition-colors relative ${
            activeTab === "doctors"
              ? "text-cyan-600 border-b-2 border-cyan-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Danh sách bác sĩ
        </button>
        <button
          onClick={() => setActiveTab("specialties")}
          className={`pb-3 px-4 text-sm font-semibold transition-colors relative ${
            activeTab === "specialties"
              ? "text-cyan-600 border-b-2 border-cyan-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Danh mục chuyên khoa
        </button>
      </div>

      {/* TAB 1: Doctors Grid */}
      {activeTab === "doctors" && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="card p-4 grid md:grid-cols-2 gap-4 items-center bg-white">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Tìm bác sĩ theo tên, chứng chỉ, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            <div>
              <select
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="input-field"
              >
                <option value="ALL">Tất cả chuyên khoa</option>
                {specialties.map((spec) => (
                  <option key={spec.id} value={spec.id}>
                    {spec.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredDoctors.length === 0 ? (
            <div className="card p-12 text-center text-slate-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-800 mb-1">Không tìm thấy bác sĩ nào</h3>
              <p className="text-sm">Không tìm thấy bác sĩ phù hợp.</p>
            </div>
          ) : (
            <div className="card overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-700 font-semibold">
                    <tr>
                      <th className="p-4">Bác sĩ</th>
                      <th className="p-4">Chuyên khoa</th>
                      <th className="p-4">Mã chứng chỉ</th>
                      <th className="p-4">Giá khám</th>
                      <th className="p-4">Xác minh</th>
                      <th className="p-4">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDoctors.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 overflow-hidden flex items-center justify-center text-white font-bold text-sm">
                              {doc.user.avatar ? (
                                <img src={doc.user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                doc.user.name[0]?.toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{doc.user.name}</div>
                              <div className="text-xs text-slate-400">{doc.user.email}</div>
                              {doc.clinicAddress && (
                                <div className="text-[11px] text-cyan-600 font-medium mt-0.5">📍 {doc.clinicAddress}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-medium text-slate-800">
                          {doc.specialty.name}
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-500">
                          {doc.licenseNumber}
                        </td>
                        <td className="p-4 font-semibold text-slate-900">
                          {formatCurrency(doc.consultingFee)}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleVerify(doc.id, doc.isVerified)}
                            disabled={actionLoadingId === doc.id}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-colors ${
                              doc.isVerified
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                            }`}
                          >
                            {doc.isVerified ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Đã duyệt</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Chờ duyệt</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleActive(doc.id, doc.isActive)}
                            disabled={actionLoadingId === doc.id}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-colors ${
                              doc.isActive
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                            }`}
                          >
                            {doc.isActive ? "Hoạt động" : "Vô hiệu"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Specialties Grid */}
      {activeTab === "specialties" && (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {specialties.map((spec) => (
            <div key={spec.id} className="card p-5 bg-white space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-xl">
                    {spec.icon || "🩺"}
                  </div>
                  <span
                    className={`badge ${
                      spec.isActive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {spec.isActive ? "Hoạt động" : "Tạm ngưng"}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">{spec.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-3 min-h-[50px]">
                  {spec.description || "Không có mô tả chi tiết."}
                </p>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  onClick={() => handleOpenEditSpecialty(spec)}
                  className="btn-secondary p-2 py-1.5 text-xs inline-flex items-center gap-1 text-slate-600 hover:text-cyan-600"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Sửa
                </button>
                <button
                  onClick={() => handleDeleteSpecialty(spec.id)}
                  className="btn-danger p-2 py-1.5 text-xs inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: Create Doctor */}
      {showDoctorModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
              <h3 className="font-bold text-slate-950">Đăng ký tài khoản bác sĩ mới</h3>
              <button
                onClick={() => setShowDoctorModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDoctorSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {modalError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-800 text-xs flex gap-2 items-center">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs">Họ và tên bác sĩ *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: BS. Nguyễn Văn A"
                    value={doctorForm.name}
                    onChange={(e) => setDoctorForm((p) => ({ ...p, name: e.target.value }))}
                    className="input-field py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="label text-xs">Email đăng nhập *</label>
                  <div className="flex items-center rounded-lg border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-cyan-400 focus-within:border-cyan-400 transition-all overflow-hidden">
                    <input
                      type="text"
                      required
                      placeholder="doctor.nam"
                      value={doctorForm.email}
                      onChange={(e) => {
                        // Strip @... if user pastes full email
                        const val = e.target.value.replace(/@.*$/, "");
                        setDoctorForm((p) => ({ ...p, email: val }));
                      }}
                      className="flex-1 min-w-0 px-3 py-2 text-xs bg-transparent outline-none text-slate-800 placeholder-slate-400"
                    />
                    <span className="px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-50 border-l border-slate-200 whitespace-nowrap select-none">
                      @medbook.vn
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Chỉ nhập tên tài khoản, đuôi @medbook.vn được thêm tự động
                  </p>
                </div>

                <div>
                  <label className="label text-xs">Mật khẩu ban đầu *</label>
                  <input
                    type="password"
                    required
                    placeholder="Tối thiểu 8 ký tự..."
                    value={doctorForm.password}
                    onChange={(e) => setDoctorForm((p) => ({ ...p, password: e.target.value }))}
                    className="input-field py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="label text-xs">Điện thoại liên hệ</label>
                  <input
                    type="tel"
                    placeholder="Số điện thoại di động..."
                    value={doctorForm.phone}
                    onChange={(e) => setDoctorForm((p) => ({ ...p, phone: e.target.value }))}
                    className="input-field py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="label text-xs">Giới tính</label>
                  <select
                    value={doctorForm.gender}
                    onChange={(e) => setDoctorForm((p) => ({ ...p, gender: e.target.value }))}
                    className="input-field py-2 text-xs"
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="label text-xs">Chuyên khoa chuyên môn *</label>
                  <select
                    value={doctorForm.specialtyId}
                    onChange={(e) => setDoctorForm((p) => ({ ...p, specialtyId: e.target.value }))}
                    className="input-field py-2 text-xs"
                  >
                    {specialties.map((spec) => (
                      <option key={spec.id} value={spec.id}>
                        {spec.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label text-xs">Số chứng chỉ hành nghề *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: CCHN12345"
                    value={doctorForm.licenseNumber}
                    onChange={(e) => setDoctorForm((p) => ({ ...p, licenseNumber: e.target.value }))}
                    className="input-field py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="label text-xs">Kinh nghiệm lâm nghiệp (Năm)</label>
                  <input
                    type="number"
                    min={0}
                    value={doctorForm.experience}
                    onChange={(e) => setDoctorForm((p) => ({ ...p, experience: e.target.value }))}
                    className="input-field py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="label text-xs">Giá tiền mỗi ca khám (VND)</label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={doctorForm.consultingFee}
                    onChange={(e) => setDoctorForm((p) => ({ ...p, consultingFee: e.target.value }))}
                    className="input-field py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="label text-xs">Trình độ học vấn</label>
                <textarea
                  rows={2}
                  placeholder="VD: Thạc sĩ Y khoa Đại học Y Hà Nội..."
                  value={doctorForm.education}
                  onChange={(e) => setDoctorForm((p) => ({ ...p, education: e.target.value }))}
                  className="input-field py-2 text-xs resize-none"
                />
              </div>

              <div>
                <label className="label text-xs">Tiểu sử nghề nghiệp</label>
                <textarea
                  rows={3}
                  placeholder="Tiểu sử và giới thiệu về bản thân..."
                  value={doctorForm.bio}
                  onChange={(e) => setDoctorForm((p) => ({ ...p, bio: e.target.value }))}
                  className="input-field py-2 text-xs resize-none"
                />
              </div>

              <div>
                <label className="label text-xs">Địa chỉ phòng khám</label>
                <input
                  type="text"
                  placeholder="VD: Phòng khám số 12, Tầng 2, MedBook Ba Tháng Hai..."
                  value={doctorForm.clinicAddress}
                  onChange={(e) => setDoctorForm((p) => ({ ...p, clinicAddress: e.target.value }))}
                  className="input-field py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDoctorModal(false)}
                  className="btn-secondary py-2 text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="btn-primary py-2 text-xs flex items-center gap-1 bg-cyan-600"
                >
                  {modalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Đăng ký tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create/Edit Specialty */}
      {showSpecialtyModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-950">
                {editingSpecialty ? "Sửa thông tin chuyên khoa" : "Thêm chuyên khoa mới"}
              </h3>
              <button
                onClick={() => setShowSpecialtyModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSpecialtySubmit} className="p-5 space-y-4">
              {modalError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-800 text-xs flex gap-2 items-center">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="label text-xs">Biểu tượng (Icon - Emojis)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: 🩺, 🫀, 🧠, 👶..."
                  value={specialtyForm.icon}
                  onChange={(e) => setSpecialtyForm((p) => ({ ...p, icon: e.target.value }))}
                  className="input-field py-2 text-xs"
                />
              </div>

              <div>
                <label className="label text-xs">Tên chuyên khoa *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Tim mạch"
                  value={specialtyForm.name}
                  onChange={(e) => setSpecialtyForm((p) => ({ ...p, name: e.target.value }))}
                  className="input-field py-2 text-xs"
                />
              </div>

              <div>
                <label className="label text-xs">Mô tả chuyên khoa</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả chức năng khám điều trị của chuyên khoa..."
                  value={specialtyForm.description}
                  onChange={(e) => setSpecialtyForm((p) => ({ ...p, description: e.target.value }))}
                  className="input-field py-2 text-xs resize-none"
                />
              </div>

              {editingSpecialty && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="specActive"
                    checked={editingSpecialty.isActive}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setEditingSpecialty((p) => (p ? { ...p, isActive: val } : null));
                      // sync to form so it gets sent in PUT body
                      // Wait, we can't write to form inside update if editingSpecialty isActive is used directly,
                      // let's pass a special toggle state.
                    }}
                    className="rounded text-cyan-600 focus:ring-cyan-500"
                  />
                  <label htmlFor="specActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Trạng thái hoạt động
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSpecialtyModal(false)}
                  className="btn-secondary py-2 text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="btn-primary py-2 text-xs flex items-center gap-1 bg-cyan-600"
                >
                  {modalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingSpecialty ? "Cập nhật" : "Tạo chuyên khoa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
