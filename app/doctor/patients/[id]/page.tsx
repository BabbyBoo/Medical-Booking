import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, User, Mail, Phone, Calendar, Heart, ShieldAlert, Award, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Hồ sơ bệnh nhân" };

export default async function DoctorPatientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "DOCTOR") {
    redirect("/login");
  }

  const doctorId = session.user.doctorId;
  if (!doctorId) {
    redirect("/login");
  }

  // Verification: Verify that the patient has at least one appointment with this doctor
  const appointmentsCount = await prisma.appointment.count({
    where: {
      patientId: params.id,
      doctorId: doctorId,
    },
  });

  if (appointmentsCount === 0) {
    // Return not found or unauthorized for security
    notFound();
  }

  // Fetch patient profile
  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          gender: true,
          dateOfBirth: true,
          address: true,
          avatar: true,
        },
      },
      appointments: {
        where: { doctorId },
        include: {
          medicalRecord: {
            include: { prescriptions: true },
          },
          payment: true,
        },
        orderBy: { appointmentDate: "desc" },
      },
    },
  });

  if (!patient) {
    notFound();
  }

  const user = patient.user;
  const dobString = user.dateOfBirth ? formatDate(user.dateOfBirth) : "Chưa cập nhật";
  const genderString =
    user.gender === "MALE" ? "Nam" : user.gender === "FEMALE" ? "Nữ" : "Khác";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/doctor/appointments"
          className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Chi tiết bệnh án bệnh nhân</h1>
          <p className="text-xs text-slate-500">Mã bệnh nhân: #{patient.id}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[300px_1fr] gap-6 items-start">
        {/* Patient Profile Card */}
        <div className="space-y-6">
          <div className="card p-6 text-center bg-white">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white font-bold flex items-center justify-center text-2xl mx-auto mb-4 border-4 border-slate-50 shadow-md">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                user.name[0]?.toUpperCase()
              )}
            </div>
            <h2 className="font-bold text-slate-900 text-base">{user.name}</h2>
            <p className="text-xs text-slate-500 mt-1">{user.email}</p>

            <div className="space-y-3.5 text-sm text-left border-t border-slate-100 pt-5 mt-5">
              <div className="flex justify-between">
                <span className="text-slate-500">Giới tính:</span>
                <span className="font-medium text-slate-800">{genderString}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ngày sinh:</span>
                <span className="font-medium text-slate-800">{dobString}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Điện thoại:</span>
                <span className="font-medium text-slate-800">{user.phone || "Chưa có"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Địa chỉ:</span>
                <span className="font-medium text-slate-800 truncate max-w-[150px]" title={user.address || ""}>
                  {user.address || "Chưa có"}
                </span>
              </div>
            </div>
          </div>

          {/* Health Information card */}
          <div className="card p-5 bg-white">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2.5 mb-4">
              Thông tin sức khỏe
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                <div>
                  <span className="text-xs text-slate-400 block">Nhóm máu</span>
                  <span className="font-bold text-slate-800">{patient.bloodType || "N/A"}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <span className="text-xs text-slate-400 block">Dị ứng</span>
                  <p className="text-xs text-slate-700 font-medium">
                    {patient.allergies || "Không ghi nhận dị ứng"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Award className="w-5 h-5 text-cyan-600 mt-0.5" />
                <div>
                  <span className="text-xs text-slate-400 block">Bệnh lý nền</span>
                  <p className="text-xs text-slate-700 font-medium">
                    {patient.chronicDiseases || "Không ghi nhận bệnh nền"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Treatment History Timeline */}
        <div className="card p-6 bg-white space-y-6">
          <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
            Lịch sử khám tại phòng khám của bạn
          </h3>

          <div className="space-y-6 relative before:absolute before:inset-0 before:right-auto before:left-[19px] before:w-[2px] before:bg-slate-100">
            {patient.appointments.map((appt) => (
              <div key={appt.id} className="relative pl-10 group">
                {/* Timeline node */}
                <div className="absolute left-3 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-cyan-500 bg-white group-hover:bg-cyan-500 transition-colors z-10" />

                <div className="space-y-3 p-4 rounded-xl border border-slate-100 bg-slate-50/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-50 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-950">Ngày {formatDate(appt.appointmentDate)}</span>
                      <span className="text-xs text-slate-400">• Ca {appt.slotTime}</span>
                    </div>
                    <span
                      className={`badge py-0.5 px-2 text-[10px] ${
                        appt.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800"
                          : appt.status === "CONFIRMED"
                          ? "bg-blue-100 text-blue-800"
                          : appt.status === "CANCELLED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {appt.status === "COMPLETED"
                        ? "Đã khám"
                        : appt.status === "CONFIRMED"
                        ? "Chờ khám"
                        : appt.status === "CANCELLED"
                        ? "Đã hủy"
                        : "Chờ xác nhận"}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-sm">
                    {appt.symptoms && (
                      <div>
                        <span className="text-xs text-slate-400 font-medium block">Triệu chứng khai báo:</span>
                        <p className="text-slate-600 text-xs italic">&ldquo;{appt.symptoms}&rdquo;</p>
                      </div>
                    )}

                    {appt.medicalRecord ? (
                      <div className="space-y-3 pt-2">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
                              Chuẩn đoán bệnh
                            </span>
                            <p className="text-slate-800 font-bold bg-white p-3 rounded-lg border border-slate-100">
                              {appt.medicalRecord.diagnosis}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
                              Phương pháp điều trị
                            </span>
                            <p className="text-slate-700 bg-white p-3 rounded-lg border border-slate-100">
                              {appt.medicalRecord.treatment || "N/A"}
                            </p>
                          </div>
                        </div>

                        {appt.medicalRecord.notes && (
                          <div>
                            <span className="text-xs text-slate-400 font-medium block">Dặn dò của bạn:</span>
                            <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-100">
                              &ldquo;{appt.medicalRecord.notes}&rdquo;
                            </p>
                          </div>
                        )}

                        {appt.medicalRecord.prescriptions.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                              Thuốc đã kê đơn
                            </span>
                            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden text-xs">
                              <table className="w-full text-left text-slate-600">
                                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-100">
                                  <tr>
                                    <th className="p-2">Tên thuốc</th>
                                    <th className="p-2">Liều lượng</th>
                                    <th className="p-2">Tần suất</th>
                                    <th className="p-2">Thời gian</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {appt.medicalRecord.prescriptions.map((p, idx) => (
                                    <tr key={p.id || idx}>
                                      <td className="p-2 font-medium text-slate-800">{p.medicineName}</td>
                                      <td className="p-2">{p.dosage}</td>
                                      <td className="p-2">{p.frequency}</td>
                                      <td className="p-2">{p.duration}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">
                        {appt.status === "CANCELLED"
                          ? "Lịch hẹn đã bị hủy"
                          : "Chưa ghi nhận bệnh án cho buổi khám này"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
