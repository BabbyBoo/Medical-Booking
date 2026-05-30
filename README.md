# 🏥 MedBook – Hệ Thống Đặt Lịch Khám Bệnh Trực Tuyến

MedBook là nền tảng đặt lịch khám bệnh trực tuyến toàn diện, hỗ trợ quản lý quy trình khám chữa bệnh đồng bộ từ đặt lịch, thanh toán, nhắc lịch, kê đơn thuốc cho đến đối soát giao dịch và thống kê báo cáo. 

Dự án được xây dựng trên mô hình phân quyền chặt chẽ với **4 Actor chính** và đáp ứng đầy đủ **27 Use Cases** chuẩn y tế.

---

## 🚀 Tính năng nổi bật theo Phân Quyền (Roles)

### 🏥 1. Phân hệ Bệnh nhân (Patient Portal)
* **Đăng ký/Đăng nhập:** Hỗ trợ đăng ký tài khoản tự động (mặc định vai trò Bệnh nhân) và đặt lại mật khẩu qua email token.
* **Tìm kiếm & Lọc Bác sĩ:** Tìm kiếm nhanh bác sĩ theo tên chuyên khoa, trình độ chuyên môn, mức giá khám và lượt đánh giá.
* **Đặt lịch 3 bước trực quan:** Quy trình đặt lịch theo từng bước (Chọn thời gian trống -> Nhập triệu chứng bệnh -> Xác nhận thông tin khám).
* **Thanh toán trực tuyến giả lập:** Tích hợp giao diện thanh toán an toàn, tự động kích hoạt sau khi đặt lịch.
* **Quản lý Lịch hẹn & Bệnh án:** Xem lịch hẹn sắp tới, hủy lịch trực tuyến (hạn trước giờ khám 2 giờ). Xem lịch sử khám bệnh và **In đơn thuốc** chuẩn phòng khám.
* **Hồ sơ sức khỏe cá nhân:** Cập nhật thông tin nhóm máu, dị ứng thuốc, bệnh lý nền và avatar trực quan.

### 🩺 2. Phân hệ Bác sĩ (Doctor Portal)
* **Thiết lập lịch làm việc:** Thiết lập linh hoạt khung giờ khám và thời lượng khám (15, 30, 45, 60 phút) cho từng ngày trong tuần.
* **Xác nhận/Từ chối lịch hẹn:** Tiếp nhận lịch khám mới, từ chối (yêu cầu nhập lý do chi tiết) hoặc chấp nhận lịch hẹn.
* **Kê đơn thuốc & Khám bệnh điện tử:** Nhập chẩn đoán, hướng điều trị và **bảng kê đơn thuốc động** (thêm/xóa thuốc, liều lượng, cách dùng). Hoàn thành cuộc khám để kết chuyển hồ sơ y tế.
* **Xem lịch sử bệnh án bệnh nhân:** Tra cứu toàn bộ lý lịch y khoa của các bệnh nhân đã từng khám tại phòng khám nhằm tối ưu phác đồ điều trị.

### 👑 3. Phân hệ Quản trị viên (Admin Portal)
* **Quản trị người dùng:** Tìm kiếm, Khóa/Mở khóa tài khoản ngay lập tức. Tính năng bảo mật ngăn chặn thay đổi vai trò (role) tùy ý để giữ đồng bộ dữ liệu.
* **Quản lý Bác sĩ & Chuyên khoa:** CRUD chuyên khoa khám bệnh (tên, mô tả, emoji icon). Xác minh (Verify) bác sĩ và tạo tài khoản bác sĩ mới (tự động điền email đuôi `@medbook.com`).
* **Hủy lịch khẩn cấp (Force Cancel):** Bắt buộc hủy lịch hẹn kèm lý do và tự động hoàn tiền đối với các lịch đã thanh toán trực tuyến.
* **Báo cáo & Thống kê thông minh:** Trực quan hóa số liệu doanh thu, lượt khám, và tỷ lệ lịch hẹn thông qua biểu đồ Recharts sinh động. Xuất báo cáo dữ liệu ra file CSV chuẩn UTF-8 hỗ trợ tiếng Việt.

### ⚙️ 4. Phân hệ Tự động hóa (System Cron Jobs)
* **Tự động nhắc lịch khám:** Quét và gửi email thông báo nhắc lịch cho bệnh nhân trước giờ khám **24 giờ** và **1 giờ**.
* **Hủy lịch hết hạn:** Tự động hủy (`EXPIRED`) các lịch hẹn ở trạng thái `PENDING` quá 24 giờ kể từ khi đặt mà bác sĩ chưa phê duyệt.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

* **Frontend & Backend Core:** [Next.js 14 (App Router)](https://nextjs.org/) & [TypeScript](https://www.typescriptlang.org/)
* **Cơ sở dữ liệu (Database):** [PostgreSQL 15](https://www.postgresql.org/)
* **ORM:** [Prisma ORM](https://www.prisma.io/) (Hỗ trợ transaction và bảo toàn ràng buộc khóa ngoại chặt chẽ)
* **Xác thực (Authentication):** [NextAuth.js v4](https://next-auth.js.org/) (JWT Callback & Role-Based Access Control)
* **Kiểu dữ liệu & Validation:** [Zod](https://zod.dev/) & [React Hook Form](https://react-hook-form.com/)
* **Biểu đồ hiển thị:** [Recharts](https://recharts.org/)
* **Thư viện Email:** [Nodemailer](https://nodemailer.com/)
* **Styling (CSS):** Vanilla CSS & Tailwind CSS tối ưu hiệu năng và giao diện mượt mà.

---

## 📂 Cấu trúc thư mục chính

```text
medical-booking/
├── app/                        # Next.js App Router
│   ├── admin/                  # Các trang chức năng của Quản trị viên
│   ├── doctor/                 # Các trang chức năng của Bác sĩ
│   ├── patient/                # Các trang chức năng của Bệnh nhân
│   ├── login/                  # Trang đăng nhập
│   ├── register/               # Trang đăng ký bệnh nhân
│   ├── forgot-password/        # Đặt lại mật khẩu
│   └── api/                    # Endpoints REST API backend
├── components/                 # Các UI Components tái sử dụng
├── lib/                        # Prisma Client, NextAuth Config, Validations, Utils
├── prisma/                     # Database Schema, Migrations và Seed data
└── docker-compose.yml          # Container PostgreSQL dựng sẵn
```

---

## 🔌 Hướng dẫn Cài đặt & Chạy ứng dụng

### 1. Chuẩn bị môi trường
Yêu cầu thiết bị cài đặt sẵn:
* [Node.js](https://nodejs.org/) (Phiên bản `>= 18.x`)
* [Docker](https://www.docker.com/) (Dùng cho khởi tạo PostgreSQL nhanh)

### 2. Nhân bản dự án và Cài đặt thư viện
```bash
# Cài đặt toàn bộ dependencies trong package.json
npm install
```

### 3. Dựng cơ sở dữ liệu PostgreSQL bằng Docker
Hệ thống đã chuẩn bị sẵn file `docker-compose.yml`. Bạn chỉ cần khởi chạy container:
```bash
docker-compose up -d
```
*Lưu ý: Cơ sở dữ liệu sẽ chạy ở cổng `5432` mặc định.*

### 4. Thiết lập biến môi trường (Environment Variables)
Tạo file `.env` tại thư mục gốc (hoặc chỉnh sửa file `.env` đã có sẵn):
```env
DATABASE_URL="postgresql://meduser:medpass123@localhost:5432/medical_booking"
NEXTAUTH_SECRET="medical-booking-secret-key-min-32-chars-abc123"
NEXTAUTH_URL="http://localhost:3000"

# Email Configuration (Dùng cho tính năng quên mật khẩu / nhắc lịch)
EMAIL_HOST="smtp.mailtrap.io"
EMAIL_PORT="587"
EMAIL_USER="your-email-username"
EMAIL_PASS="your-email-password"
EMAIL_FROM="no-reply@medicalbook.vn"
```

### 5. Tạo cấu trúc bảng & Nạp dữ liệu mẫu (Seed Data)
Đồng bộ Schema của Prisma vào PostgreSQL và nạp dữ liệu tài khoản thử nghiệm:
```bash
# Khởi tạo migrations
npx prisma migrate dev --name init

# Nạp dữ liệu mẫu
npx prisma db seed
```

### 6. Khởi chạy Server phát triển
```bash
npm run dev
```
Mở trình duyệt và truy cập [http://localhost:3000](http://localhost:3000) để trải nghiệm hệ thống.

---

## 🔑 Tài khoản dùng thử nghiệm (Mock Accounts)

Hệ thống đã tự động tạo sẵn các tài khoản thử nghiệm đầy đủ quyền hạn sau khi bạn chạy lệnh `npx prisma db seed`:

| Quyền hạn | Email đăng nhập | Mật khẩu mặc định |
| :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@medbook.vn` | `Admin@123` |
| **Bác sĩ (Doctor)** | `bs.an@medbook.vn` | `Doctor@123` |
| **Bệnh nhân (Patient)** | `mai@gmail.com` | `Patient@123` |

---

## 🔒 Cơ chế bảo vệ & Toàn vẹn dữ liệu
* **Ràng buộc xóa Chuyên khoa:** Hệ thống cấm xóa chuyên khoa đang có bác sĩ hoạt động (kể cả bác sĩ bị Vô hiệu hoặc Chờ duyệt) để tránh lỗi cơ sở dữ liệu và bảo đảm dữ liệu bệnh án lịch sử không bị hư hại.
* **Xác thực bảo mật nâng cao:** Các Route API được bảo vệ bằng middleware NextAuth. Bệnh nhân không thể can thiệp dữ liệu của bác sĩ hay truy cập trang quản trị admin.
