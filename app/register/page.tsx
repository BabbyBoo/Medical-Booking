"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Heart, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterInput } from "@/lib/validations";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || "Đăng ký thất bại");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch {
      setError("Đã xảy ra lỗi, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-indigo-50 flex">
      {/* Left branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center p-12">
        <div className="text-white max-w-md">
          <Link href="/" className="inline-flex items-center gap-3 mb-8 hover:opacity-90 transition-opacity">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">MedBook</span>
          </Link>
          <h2 className="text-4xl font-bold mb-4">Tham gia MedBook!</h2>
          <p className="text-cyan-100 text-lg leading-relaxed mb-8">
            Tạo tài khoản miễn phí và bắt đầu hành trình chăm sóc sức khỏe của bạn.
          </p>
          <div className="space-y-4">
            {[
              "✓ Miễn phí hoàn toàn cho bệnh nhân",
              "✓ Đặt lịch 24/7 không giới hạn",
              "✓ Lưu trữ hồ sơ sức khỏe an toàn",
              "✓ Nhận đơn thuốc & kết quả online",
            ].map((item) => (
              <div key={item} className="text-cyan-100">{item}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md py-6 animate-fade-in">
          {/* Mobile logo */}
          <Link href="/" className="flex lg:hidden items-center justify-center gap-2 mb-6 hover:opacity-90 transition-opacity">
            <div className="w-9 h-9 bg-cyan-600 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">MedBook</span>
          </Link>

          <div className="card p-8">
            <div className="mb-6">
              <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-cyan-600 transition-colors mb-4 group font-medium">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Quay lại trang chủ
              </Link>
              <h1 className="text-2xl font-bold text-slate-900">Đăng ký tài khoản</h1>
              <p className="text-slate-500 mt-1 text-sm">
                Đã có tài khoản?{" "}
                <Link href="/login" className="text-cyan-600 hover:text-cyan-700 font-medium">
                  Đăng nhập
                </Link>
              </p>
            </div>

            {success && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-700 text-sm animate-fade-in">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Đăng ký thành công! Đang chuyển hướng...</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-700 text-sm animate-fade-in">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Họ và tên *</label>
                <input
                  {...register("name")}
                  type="text"
                  placeholder="Nguyễn Văn A"
                  className="input-field"
                  autoComplete="name"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="label">Email *</label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="your@email.com"
                  className="input-field"
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="label">Số điện thoại *</label>
                <input
                  {...register("phone")}
                  type="tel"
                  placeholder="0912 345 678"
                  className="input-field"
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Ngày sinh</label>
                  <input
                    {...register("dateOfBirth")}
                    type="date"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Giới tính</label>
                  <select {...register("gender")} className="input-field">
                    <option value="">Chọn...</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Mật khẩu *</label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Ít nhất 8 ký tự"
                    className="input-field pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="label">Xác nhận mật khẩu *</label>
                <div className="relative">
                  <input
                    {...register("confirmPassword")}
                    type={showConfirm ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu"
                    className="input-field pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || success}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang đăng ký...
                  </>
                ) : (
                  "Tạo tài khoản"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
