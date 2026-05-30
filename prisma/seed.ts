import { PrismaClient, Role, Gender, DayOfWeek } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = (pw: string) => bcrypt.hashSync(pw, 12);

  console.log("🌱 Seeding database...");

  // === ADMIN ===
  await prisma.user.upsert({
    where: { email: "admin@medbook.vn" },
    update: {},
    create: {
      email: "admin@medbook.vn",
      password: hash("Admin@123"),
      name: "Quản trị viên",
      role: Role.ADMIN,
    },
  });

  // === SPECIALTIES ===
  const specialtyData = [
    { name: "Tim mạch", icon: "🫀", description: "Chẩn đoán và điều trị các bệnh lý tim mạch" },
    { name: "Nhi khoa", icon: "👶", description: "Chăm sóc sức khỏe trẻ em từ 0-16 tuổi" },
    { name: "Nội tiêu hóa", icon: "🩺", description: "Điều trị các bệnh về tiêu hóa và gan mật" },
    { name: "Da liễu", icon: "🧴", description: "Điều trị các bệnh về da và thẩm mỹ da" },
    { name: "Thần kinh", icon: "🧠", description: "Chẩn đoán các bệnh về hệ thần kinh" },
    { name: "Chỉnh hình", icon: "🦴", description: "Điều trị xương khớp và cơ xương" },
  ];

  const specialties = await Promise.all(
    specialtyData.map((s) =>
      prisma.specialty.upsert({
        where: { name: s.name },
        update: {},
        create: s,
      })
    )
  );

  console.log("✅ Specialties created");

  // === DOCTORS ===
  const doctorData = [
    {
      name: "BS. Nguyễn Văn An",
      email: "bs.an@medbook.vn",
      specialtyIdx: 0,
      exp: 10,
      fee: 300000,
      bio: "Chuyên gia tim mạch với 10 năm kinh nghiệm. Đã điều trị cho hơn 5000 bệnh nhân.",
      education: "Đại học Y Hà Nội, Tiến sĩ Y khoa",
      gender: Gender.MALE,
    },
    {
      name: "BS. Trần Thị Bình",
      email: "bs.binh@medbook.vn",
      specialtyIdx: 0,
      exp: 8,
      fee: 250000,
      bio: "Bác sĩ chuyên khoa tim mạch, giỏi về can thiệp tim mạch không phẫu thuật.",
      education: "Đại học Y Dược TP.HCM",
      gender: Gender.FEMALE,
    },
    {
      name: "BS. Lê Minh Cường",
      email: "bs.cuong@medbook.vn",
      specialtyIdx: 1,
      exp: 15,
      fee: 200000,
      bio: "Bác sĩ nhi khoa với 15 năm kinh nghiệm, chuyên điều trị trẻ sơ sinh.",
      education: "Bệnh viện Nhi Trung ương, Thạc sĩ Nhi khoa",
      gender: Gender.MALE,
    },
    {
      name: "BS. Phạm Thị Dung",
      email: "bs.dung@medbook.vn",
      specialtyIdx: 2,
      exp: 12,
      fee: 350000,
      bio: "Chuyên gia nội tiêu hóa, giỏi nội soi và điều trị bệnh đại tràng.",
      education: "Đại học Y Hà Nội",
      gender: Gender.FEMALE,
    },
    {
      name: "BS. Hoàng Văn Minh",
      email: "bs.minh@medbook.vn",
      specialtyIdx: 3,
      exp: 7,
      fee: 280000,
      bio: "Bác sĩ da liễu, chuyên điều trị mụn, nám và các bệnh về da.",
      education: "Bệnh viện Da liễu Trung ương",
      gender: Gender.MALE,
    },
  ];

  for (const d of doctorData) {
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: {
        email: d.email,
        password: hash("Doctor@123"),
        name: d.name,
        role: Role.DOCTOR,
        gender: d.gender,
      },
    });

    const licenseNum = `BS${Math.floor(10000 + Math.random() * 90000)}`;
    const doctor = await prisma.doctor.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        specialtyId: specialties[d.specialtyIdx].id,
        licenseNumber: licenseNum,
        experience: d.exp,
        consultingFee: d.fee,
        isVerified: true,
        bio: d.bio,
        education: d.education,
        rating: 4.5 + Math.random() * 0.5,
        totalReviews: Math.floor(50 + Math.random() * 100),
      },
    });

    // Work schedule Mon-Fri
    const workDays = [
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
    ];

    for (const day of workDays) {
      await prisma.doctorSchedule.upsert({
        where: { doctorId_dayOfWeek: { doctorId: doctor.id, dayOfWeek: day } },
        update: {},
        create: {
          doctorId: doctor.id,
          dayOfWeek: day,
          startTime: "08:00",
          endTime: "17:00",
          slotDuration: 30,
        },
      });
    }
  }

  console.log("✅ Doctors created");

  // === PATIENTS ===
  const patientData = [
    {
      name: "Nguyễn Thị Mai",
      email: "mai@gmail.com",
      gender: Gender.FEMALE,
      bloodType: "O+",
      phone: "0912345678",
    },
    {
      name: "Trần Văn Hùng",
      email: "hung@gmail.com",
      gender: Gender.MALE,
      bloodType: "A+",
      phone: "0987654321",
    },
    {
      name: "Lê Thị Hoa",
      email: "hoa@gmail.com",
      gender: Gender.FEMALE,
      bloodType: "B+",
      phone: "0956789012",
    },
  ];

  for (const p of patientData) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        email: p.email,
        password: hash("Patient@123"),
        name: p.name,
        role: Role.PATIENT,
        gender: p.gender,
        phone: p.phone,
      },
    });

    await prisma.patient.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        bloodType: p.bloodType,
      },
    });
  }

  console.log("✅ Patients created");
  console.log("\n📋 Demo Accounts:");
  console.log("  Admin:    admin@medbook.vn   / Admin@123");
  console.log("  Doctor:   bs.an@medbook.vn   / Doctor@123");
  console.log("  Patient:  mai@gmail.com       / Patient@123");
  console.log("\n✨ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
