import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: {
    default: "MedBook – Đặt lịch khám bệnh trực tuyến",
    template: "%s | MedBook",
  },
  description:
    "Hệ thống đặt lịch khám bệnh trực tuyến. Tìm bác sĩ, đặt lịch hẹn, thanh toán và nhận kết quả khám nhanh chóng.",
  keywords: ["đặt lịch khám", "bác sĩ", "y tế", "lịch hẹn", "bệnh viện"],
  icons: {
    icon: "/icon?v=1",
    shortcut: "/icon?v=1",
    apple: "/icon?v=1",
  },
  openGraph: {
    title: "MedBook – Đặt lịch khám bệnh trực tuyến",
    description: "Hệ thống đặt lịch khám bệnh trực tuyến tiện lợi",
    type: "website",
    locale: "vi_VN",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="vi">
      <body>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
