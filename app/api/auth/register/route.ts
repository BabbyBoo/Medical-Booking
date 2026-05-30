import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { apiResponse } from "@/lib/utils";
import bcrypt from "bcryptjs";
import { sendEmail, getWelcomeEmailHtml } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.safeParse(body);

    if (!validatedData.success) {
      return apiResponse(
        false,
        null,
        undefined,
        validatedData.error.issues[0].message,
        400
      );
    }

    const { name, email, password, phone, dateOfBirth, gender } =
      validatedData.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return apiResponse(false, null, undefined, "Email đã được sử dụng", 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user + patient profile
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender: gender as "MALE" | "FEMALE" | "OTHER" | undefined,
        role: "PATIENT",
        patientProfile: {
          create: {},
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Send welcome email (non-blocking)
    sendEmail({
      to: email,
      subject: "Chào mừng đến với MedBook!",
      html: getWelcomeEmailHtml(name),
    }).catch(console.error);

    return apiResponse(true, user, "Đăng ký thành công", undefined, 201);
  } catch (error) {
    console.error("Register error:", error);
    return apiResponse(
      false,
      null,
      undefined,
      "Đã xảy ra lỗi, vui lòng thử lại",
      500
    );
  }
}
