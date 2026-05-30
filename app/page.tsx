import Link from "next/link";
import {
  Heart,
  Calendar,
  Star,
  Shield,
  Clock,
  Users,
  ChevronRight,
  Stethoscope,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  const specialties = [
    { name: "Tim mạch", icon: "🫀", count: "4 bác sĩ" },
    { name: "Nhi khoa", icon: "👶", count: "3 bác sĩ" },
    { name: "Nội tiêu hóa", icon: "🩺", count: "4 bác sĩ" },
    { name: "Da liễu", icon: "🧴", count: "2 bác sĩ" },
    { name: "Thần kinh", icon: "🧠", count: "3 bác sĩ" },
    { name: "Chỉnh hình", icon: "🦴", count: "2 bác sĩ" },
  ];

  const features = [
    {
      icon: Calendar,
      title: "Đặt lịch dễ dàng",
      desc: "Chọn bác sĩ, chọn thời gian và đặt lịch chỉ trong vài phút",
      color: "bg-cyan-50 text-cyan-600",
    },
    {
      icon: Shield,
      title: "An toàn & Bảo mật",
      desc: "Thông tin y tế của bạn được bảo mật tuyệt đối",
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      icon: Clock,
      title: "Nhắc lịch tự động",
      desc: "Nhận thông báo trước 24 giờ để không bỏ lỡ lịch hẹn",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      icon: Star,
      title: "Đánh giá bác sĩ",
      desc: "Chia sẻ trải nghiệm và đọc đánh giá từ bệnh nhân khác",
      color: "bg-amber-50 text-amber-600",
    },
  ];

  const stats = [
    { label: "Bác sĩ chuyên khoa", value: "50+", icon: Users },
    { label: "Lịch hẹn mỗi tháng", value: "1,000+", icon: Calendar },
    { label: "Bệnh nhân hài lòng", value: "98%", icon: Heart },
    { label: "Chuyên khoa", value: "12+", icon: Stethoscope },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900">MedBook</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-600 hover:text-cyan-600 transition-colors font-medium text-sm">
                Tính năng
              </a>
              <a href="#specialties" className="text-slate-600 hover:text-cyan-600 transition-colors font-medium text-sm">
                Chuyên khoa
              </a>
              <a href="#about" className="text-slate-600 hover:text-cyan-600 transition-colors font-medium text-sm">
                Về chúng tôi
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-slate-700 hover:text-cyan-600 font-medium text-sm transition-colors">
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="btn-primary text-sm"
              >
                Đăng ký ngay
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-20 pb-0 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5 pointer-events-none" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-cyan-50 to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-cyan-50 text-cyan-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                Hệ thống đặt lịch khám #1 Việt Nam
              </div>
              <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-6">
                Đặt lịch khám bệnh{" "}
                <span className="text-transparent bg-clip-text gradient-primary">
                  dễ dàng & nhanh chóng
                </span>
              </h1>
              <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                Kết nối với hàng trăm bác sĩ chuyên khoa hàng đầu. Đặt lịch hẹn,
                theo dõi lịch sử khám và nhận kết quả ngay trên điện thoại.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register" className="btn-primary flex items-center justify-center gap-2 py-3 px-6 text-base">
                  Bắt đầu ngay
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/login" className="btn-secondary flex items-center justify-center gap-2 py-3 px-6 text-base">
                  Tìm bác sĩ
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
              
              {/* Trust badges */}
              <div className="flex items-center gap-6 mt-10">
                {stats.slice(0, 3).map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                    <div className="text-xs text-slate-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-100 to-indigo-100 rounded-3xl transform rotate-3" />
              <div className="relative bg-white rounded-3xl p-6 shadow-2xl">
                {/* Mock doctor card */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                    BS
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">BS. Nguyễn Văn An</div>
                    <div className="text-sm text-cyan-600">Tim mạch • 10 năm KN</div>
                    <div className="flex items-center gap-1 mt-1">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                      <span className="text-xs text-slate-500 ml-1">(128)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                  <div className="text-sm font-semibold text-slate-700 mb-3">Chọn ngày khám</div>
                  <div className="grid grid-cols-5 gap-2">
                    {["T2", "T3", "T4", "T5", "T6"].map((d, i) => (
                      <Link
                        href="/register"
                        key={d}
                        className={`text-center p-2 rounded-xl text-xs font-medium transition-all ${
                          i === 2
                            ? "bg-cyan-600 text-white"
                            : "bg-white text-slate-600 hover:bg-cyan-50"
                        }`}
                      >
                        <div>{d}</div>
                        <div>{i + 3}/6</div>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="slot-grid mb-4">
                  {["08:00", "08:30", "09:00", "09:30", "10:00", "10:30"].map((t, i) => (
                    <Link
                      href="/register"
                      key={t}
                      className={`slot-btn block text-center ${i === 2 ? "selected" : i === 3 ? "booked" : "available"}`}
                    >
                      {t}
                    </Link>
                  ))}
                </div>

                <Link href="/register" className="w-full btn-primary py-3 block text-center font-semibold">
                  Đặt lịch ngay – 300.000đ
                </Link>

                {/* Notification badge */}
                <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  ✓ Đã xác minh
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-slate-400 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Tại sao chọn MedBook?
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Chúng tôi cam kết mang lại trải nghiệm đặt lịch khám bệnh tốt nhất cho bạn
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card p-6 text-center group hover:-translate-y-1 transition-transform duration-200">
                <div className={`w-12 h-12 ${f.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section id="specialties" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Chuyên khoa
            </h2>
            <p className="text-slate-500">
              Đội ngũ bác sĩ chuyên khoa giàu kinh nghiệm, tận tâm
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {specialties.map((s) => (
              <Link
                key={s.name}
                href="/login"
                className="card p-4 text-center hover:-translate-y-1 transition-transform duration-200 cursor-pointer"
              >
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="font-semibold text-sm text-slate-800">{s.name}</div>
                <div className="text-xs text-slate-500 mt-1">{s.count}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About Us */}
      <section id="about" className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column: Mission and Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-cyan-50 text-cyan-700 px-4 py-2 rounded-full text-sm font-medium">
                Về chúng tôi
              </div>
              <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                Sứ mệnh kết nối y tế thông minh của MedBook
              </h2>
              <p className="text-slate-500 leading-relaxed">
                MedBook được thành lập với mục tiêu đơn giản hóa quy trình khám chữa bệnh tại Việt Nam. Chúng tôi tin rằng dịch vụ chăm sóc sức khỏe chất lượng cao nên nằm trong tầm tay của tất cả mọi người.
              </p>
              <p className="text-slate-500 leading-relaxed">
                Thông qua nền tảng trực tuyến kết nối trực tiếp bệnh nhân với bác sĩ, chúng tôi giảm thiểu thời gian chờ đợi, minh bạch hóa chi phí khám, và số hóa toàn bộ lịch sử y khoa của bạn.
              </p>
              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900 mb-1 text-base">Tầm nhìn</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">Trở thành nền tảng chăm sóc sức khỏe số toàn diện hàng đầu tại Đông Nam Á.</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1 text-base">Giá trị cốt lõi</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">Tận tâm, Minh bạch, An toàn bảo mật thông tin và Tiên phong công nghệ.</p>
                </div>
              </div>
            </div>

            {/* Right Column: Visual card */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-100 to-indigo-100 rounded-3xl opacity-70 blur-lg" />
              <div className="relative bg-white border border-slate-100 rounded-3xl p-8 shadow-xl">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-cyan-50/50 rounded-2xl border border-cyan-100/50">
                    <div className="w-12 h-12 rounded-xl bg-cyan-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Đặt lịch nhanh chóng</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Đặt khám chỉ trong 3 bước đơn giản</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Bác sĩ chuyên môn cao</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Đội ngũ bác sĩ được xác minh thông tin nghiêm ngặt</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Hồ sơ sức khỏe số</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Lưu trữ đơn thuốc, kết quả chẩn đoán an toàn</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 gradient-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Sẵn sàng đặt lịch khám?
          </h2>
          <p className="text-cyan-100 mb-8">
            Đăng ký ngay hôm nay và trải nghiệm dịch vụ y tế đẳng cấp
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-cyan-700 font-bold px-8 py-4 rounded-xl hover:bg-cyan-50 transition-colors shadow-lg"
            >
              Đăng ký miễn phí
            </Link>
            <Link
              href="/login"
              className="border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-cyan-600 rounded-lg flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg">MedBook</span>
            </div>
            <p className="text-sm text-center">
              © 2026 MedBook. Hệ thống đặt lịch khám bệnh trực tuyến.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">Điều khoản</a>
              <a href="#" className="hover:text-white transition-colors">Bảo mật</a>
              <a href="#" className="hover:text-white transition-colors">Liên hệ</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
