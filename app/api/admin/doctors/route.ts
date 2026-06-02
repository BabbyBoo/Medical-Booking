import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// GET /api/admin/doctors
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return apiResponse(false, null, undefined, "Không có quyền truy cập", 403);
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const specialtyId = searchParams.get("specialtyId") || "";

    const where: Record<string, any> = {};

    if (specialtyId) {
      where.specialtyId = specialtyId;
    }

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true, isActive: true } },
        specialty: true,
      },
      orderBy: { user: { name: "asc" } },
    });

    return apiResponse(true, doctors);
  } catch (error) {
    console.error("Admin get doctors error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}

// POST /api/admin/doctors
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return apiResponse(false, null, undefined, "Không có quyền truy cập", 403);
    }

    const body = await request.json();
    const {
      name,
      email,
      password,
      gender,
      phone,
      specialtyId,
      licenseNumber,
      experience,
      consultingFee,
      education,
      bio,
      clinicAddress,
    } = body;

    // Validation
    if (!name?.trim() || !email?.trim() || !password?.trim() || !specialtyId || !licenseNumber?.trim()) {
      return apiResponse(false, null, undefined, "Vui lòng điền đầy đủ các thông tin bắt buộc", 400);
    }

    let finalEmail = email.trim();
    if (!finalEmail.includes("@")) {
      finalEmail = `${finalEmail}@medbook.vn`;
    }

    // Check duplicate email
    const duplicateEmail = await prisma.user.findUnique({
      where: { email: finalEmail },
    });

    if (duplicateEmail) {
      return apiResponse(false, null, undefined, "Email đã được sử dụng", 400);
    }

    // Check duplicate license number
    const duplicateLicense = await prisma.doctor.findUnique({
      where: { licenseNumber: licenseNumber.trim() },
    });

    if (duplicateLicense) {
      return apiResponse(false, null, undefined, "Số chứng chỉ hành nghề đã tồn tại", 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const doctor = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: finalEmail,
          password: hashedPassword,
          phone: phone?.trim() || null,
          gender: gender || "MALE",
          role: "DOCTOR",
        },
      });

      // Create doctor profile
      const doc = await tx.doctor.create({
        data: {
          userId: user.id,
          specialtyId,
          licenseNumber: licenseNumber.trim(),
          experience: experience ? parseInt(experience) : 0,
          consultingFee: consultingFee ? parseFloat(consultingFee) : 0,
          education: education?.trim() || null,
          bio: bio?.trim() || null,
          clinicAddress: clinicAddress?.trim() || null,
          isVerified: true, // Default to true when created by admin
          isActive: true,
        },
      });

      // Create default schedules for Mon-Fri (8:00 - 17:00, 30 min duration)
      const workDays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
      for (const day of workDays) {
        await tx.doctorSchedule.create({
          data: {
            doctorId: doc.id,
            dayOfWeek: day as any,
            startTime: "08:00",
            endTime: "17:00",
            slotDuration: 30,
          },
        });
      }

      return doc;
    });

    return apiResponse(true, doctor, "Tạo tài khoản bác sĩ thành công", undefined, 201);
  } catch (error) {
    console.error("Admin create doctor error:", error);
    return apiResponse(false, null, undefined, "Đã xảy ra lỗi", 500);
  }
}
