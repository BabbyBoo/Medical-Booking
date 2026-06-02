import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
    confirmPassword: z.string(),
    phone: z.string()
      .min(1, "Số điện thoại là bắt buộc")
      .regex(/^0[0-9]{9}$/, "Số điện thoại không hợp lệ (phải gồm 10 chữ số và bắt đầu bằng số 0)"),
    dateOfBirth: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string(),
    newPassword: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  address: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  chronicDiseases: z.string().optional(),
  emergencyContact: z.string().optional(),
});

export const bookingSchema = z.object({
  doctorId: z.string().cuid(),
  appointmentDate: z.string(),
  slotTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Giờ không hợp lệ"),
  symptoms: z.string().max(500, "Tối đa 500 ký tự").optional(),
  previousAppointmentId: z.string().cuid().optional(),
});

export const cancelSchema = z.object({
  cancelReason: z.string().min(5, "Vui lòng nhập lý do hủy (ít nhất 5 ký tự)"),
});

export const medicalRecordSchema = z.object({
  appointmentId: z.string().cuid(),
  diagnosis: z.string().min(1, "Vui lòng nhập chuẩn đoán"),
  treatment: z.string().optional(),
  notes: z.string().optional(),
  followUpDate: z.string().optional(),
  prescriptions: z
    .array(
      z.object({
        medicineName: z.string().min(1, "Tên thuốc là bắt buộc"),
        dosage: z.string().min(1, "Liều dùng là bắt buộc"),
        frequency: z.string().min(1, "Tần suất là bắt buộc"),
        duration: z.string().min(1, "Thời gian là bắt buộc"),
        instructions: z.string().optional(),
      })
    )
    .optional(),
});

export const reviewSchema = z.object({
  appointmentId: z.string().cuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export const doctorScheduleSchema = z.array(
  z.object({
    dayOfWeek: z.enum([
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ]),
    startTime: z.string(),
    endTime: z.string(),
    slotDuration: z.number().int().min(15).max(60),
    isActive: z.boolean(),
    disabledSlots: z.array(z.string()).optional(),
  })
);

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type MedicalRecordInput = z.infer<typeof medicalRecordSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
