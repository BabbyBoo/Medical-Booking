"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Heart, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/lib/validations";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const fillDemoAccount = (email: string, password: string) => {
    setValue("email", email, { shouldValidate: true });
    setValue("password", password, { shouldValidate: true });
  };

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        // Get session to determine redirect
        const response = await fetch("/api/auth/session");
        const session = await response.json();
        const role = session?.user?.role;

        if (role === "PATIENT") router.push("/patient/dashboard");
        else if (role === "DOCTOR") router.push("/doctor/dashboard");
        else if (role === "ADMIN") router.push("/admin/dashboard");
        else router.push("/");

        router.refresh();
      }
    } catch {
      setError("Đã xảy ra lỗi, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-indigo-50 flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center p-12">
        <div className="text-white max-w-md">
          <Link href="/" className="inline-flex items-center gap-3 mb-8 hover:opacity-90 transition-opacity">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">MedBook</span>
          </Link>
          <h2 className="text-4xl font-bold mb-4">
            Chào mừng trở lại!
          </h2>
          <p className="text-cyan-100 text-lg leading-relaxed mb-8">
            Đăng nhập để quản lý lịch khám, xem kết quả khám và đặt lịch hẹn mới.
          </p>
          <div className="space-y-4">
            {[
              "✓ Đặt lịch với 50+ bác sĩ chuyên khoa",
              "✓ Xem kết quả khám & đơn thuốc online",
              "✓ Nhắc lịch tự động qua email",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-cyan-100">
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <Link href="/" className="flex lg:hidden items-center justify-center gap-2 mb-8 hover:opacity-90 transition-opacity">
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
              <h1 className="text-2xl font-bold text-slate-900">Đăng nhập</h1>
              <p className="text-slate-500 mt-1 text-sm">
                Chưa có tài khoản?{" "}
                <Link href="/register" className="text-cyan-600 hover:text-cyan-700 font-medium">
                  Đăng ký ngay
                </Link>
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-700 text-sm animate-fade-in">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Email</label>
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
                <label className="label">Mật khẩu</label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    className="input-field pr-12"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-cyan-600" />
                  <span className="text-sm text-slate-600">Ghi nhớ đăng nhập</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">
                  Quên mật khẩu?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  "Đăng nhập"
                )}
              </button>
            </form>

            {/* Demo accounts */}
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></span>
                Tài khoản demo (Bấm vào để tự điền)
              </p>
              <div className="space-y-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => fillDemoAccount("mai@gmail.com", "Patient@123")}
                  className="w-full flex justify-between p-2 rounded-lg hover:bg-cyan-50 hover:text-cyan-700 transition-all text-left text-slate-600 group"
                >
                  <span className="font-medium group-hover:translate-x-0.5 transition-transform">Bệnh nhân:</span>
                  <span className="font-mono text-slate-500 group-hover:text-cyan-600">mai@gmail.com / Patient@123</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount("bs.an@medbook.vn", "Doctor@123")}
                  className="w-full flex justify-between p-2 rounded-lg hover:bg-cyan-50 hover:text-cyan-700 transition-all text-left text-slate-600 group"
                >
                  <span className="font-medium group-hover:translate-x-0.5 transition-transform">Bác sĩ:</span>
                  <span className="font-mono text-slate-500 group-hover:text-cyan-600">bs.an@medbook.vn / Doctor@123</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount("admin@medbook.vn", "Admin@123")}
                  className="w-full flex justify-between p-2 rounded-lg hover:bg-cyan-50 hover:text-cyan-700 transition-all text-left text-slate-600 group"
                >
                  <span className="font-medium group-hover:translate-x-0.5 transition-transform">Admin:</span>
                  <span className="font-mono text-slate-500 group-hover:text-cyan-600">admin@medbook.vn / Admin@123</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
