import { z } from 'zod';

// Regex patterns for strict format enforcement
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\+?[0-9\s\-]{10,15}$/;
const NAME_REGEX = /^[a-zA-Z\s.'\-]+$/;
const UTR_REGEX = /^[a-zA-Z0-9]{6,24}$/;
const SAFE_ID_REGEX = /^[a-zA-Z0-9\-_]+$/;

/**
 * 1. Authentication Schemas (Strict: Type, Length, Format, No Extra Keys)
 */
export const LoginSchema = z
  .object({
    email: z
      .string()
      .min(5, { message: 'Email must be at least 5 characters long' })
      .max(100, { message: 'Email cannot exceed 100 characters' })
      .regex(EMAIL_REGEX, { message: 'Email must be a valid email format (e.g. user@example.com)' }),
    password: z
      .string()
      .min(4, { message: 'Password must be at least 4 characters long' })
      .max(128, { message: 'Password cannot exceed 128 characters' }),
    role: z
      .enum(['student', 'mentor', 'admin'])
      .optional(),
  })
  .strict();

export const StudentSignupSchema = z
  .object({
    fullName: z
      .string()
      .min(2, { message: 'Full Name must be at least 2 characters long' })
      .max(100, { message: 'Full Name cannot exceed 100 characters' })
      .regex(NAME_REGEX, { message: 'Full Name can only contain letters, spaces, dots, and hyphens' }),
    email: z
      .string()
      .min(5, { message: 'Email must be at least 5 characters long' })
      .max(100, { message: 'Email cannot exceed 100 characters' })
      .regex(EMAIL_REGEX, { message: 'Email must be a valid email format' }),
    phone: z
      .string()
      .min(10, { message: 'Phone number must be at least 10 digits' })
      .max(15, { message: 'Phone number cannot exceed 15 digits' })
      .regex(PHONE_REGEX, { message: 'Phone number must be a valid 10 to 15 digit telephone number' }),
    course: z
      .string()
      .min(3, { message: 'Course identifier must be at least 3 characters' })
      .max(100, { message: 'Course identifier cannot exceed 100 characters' }),
    password: z
      .string()
      .min(4, { message: 'Password must be at least 4 characters long' })
      .max(128, { message: 'Password cannot exceed 128 characters' }),
    qualification: z
      .string()
      .max(100, { message: 'Qualification cannot exceed 100 characters' })
      .optional(),
    learningMode: z
      .string()
      .max(100, { message: 'Learning mode cannot exceed 100 characters' })
      .optional(),
  })
  .strict();

export const MentorSignupSchema = z
  .object({
    fullName: z
      .string()
      .min(2, { message: 'Full Name must be at least 2 characters long' })
      .max(100, { message: 'Full Name cannot exceed 100 characters' })
      .regex(NAME_REGEX, { message: 'Full Name can only contain letters, spaces, dots, and hyphens' }),
    email: z
      .string()
      .min(5, { message: 'Email must be at least 5 characters long' })
      .max(100, { message: 'Email cannot exceed 100 characters' })
      .regex(EMAIL_REGEX, { message: 'Email must be a valid email format' }),
    phone: z
      .string()
      .min(10, { message: 'Phone number must be at least 10 digits' })
      .max(15, { message: 'Phone number cannot exceed 15 digits' })
      .regex(PHONE_REGEX, { message: 'Phone number must be a valid 10 to 15 digit telephone number' }),
    domain: z
      .string()
      .min(2, { message: 'Domain must be at least 2 characters' })
      .max(100, { message: 'Domain cannot exceed 100 characters' }),
    currentRole: z
      .string()
      .max(100, { message: 'Current role cannot exceed 100 characters' })
      .optional(),
    company: z
      .string()
      .max(100, { message: 'Company cannot exceed 100 characters' })
      .optional(),
    experience: z
      .string()
      .max(50, { message: 'Experience cannot exceed 50 characters' })
      .optional(),
    password: z
      .string()
      .min(4, { message: 'Password must be at least 4 characters long' })
      .max(128, { message: 'Password cannot exceed 128 characters' }),
    bio: z
      .string()
      .max(1000, { message: 'Bio cannot exceed 1000 characters' })
      .optional(),
  })
  .strict();

export const ResetPasswordSchema = z
  .object({
    email: z
      .string()
      .min(5, { message: 'Email must be at least 5 characters long' })
      .max(100, { message: 'Email cannot exceed 100 characters' })
      .regex(EMAIL_REGEX, { message: 'Email must be a valid email format' }),
    newPassword: z
      .string()
      .min(4, { message: 'New password must be at least 4 characters' })
      .max(128, { message: 'New password cannot exceed 128 characters' })
      .optional(),
    otp: z
      .string()
      .min(4, { message: 'OTP must be at least 4 digits' })
      .max(10, { message: 'OTP cannot exceed 10 characters' })
      .optional(),
  })
  .strict();

/**
 * 2. Public Lead Submission Schema
 */
export const SubmitLeadSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: 'Name must be at least 2 characters long' })
      .max(100, { message: 'Name cannot exceed 100 characters' })
      .regex(NAME_REGEX, { message: 'Name must contain only letters, spaces, dots, and hyphens' }),
    phone: z
      .string()
      .min(10, { message: 'Phone number must be at least 10 digits' })
      .max(15, { message: 'Phone number cannot exceed 15 digits' })
      .regex(PHONE_REGEX, { message: 'Phone number must be a valid 10 to 15 digit telephone format' }),
    course: z
      .string()
      .min(2, { message: 'Course must be at least 2 characters' })
      .max(100, { message: 'Course cannot exceed 100 characters' })
      .optional(),
  })
  .strict();

/**
 * 3. AI Chat Assistant Schema
 */
export const ChatMessageSchema = z
  .object({
    sender: z.enum(['user', 'ai', 'model', 'assistant']),
    text: z
      .string()
      .max(2000, { message: 'Chat history text cannot exceed 2000 characters' }),
  })
  .strict();

export const ChatRequestSchema = z
  .object({
    message: z
      .string()
      .min(1, { message: 'Message cannot be empty' })
      .max(2000, { message: 'Message cannot exceed 2000 characters' }),
    history: z
      .array(ChatMessageSchema)
      .max(20, { message: 'History cannot exceed 20 past turns' })
      .optional(),
  })
  .strict();

/**
 * 4. Payment Schemas
 */
export const CreateOrderSchema = z
  .object({
    courseId: z
      .string()
      .min(3, { message: 'Course ID must be at least 3 characters' })
      .max(64, { message: 'Course ID cannot exceed 64 characters' })
      .regex(SAFE_ID_REGEX, { message: 'Course ID can only contain alphanumeric characters, underscores, and hyphens' }),
    studentEmail: z
      .string()
      .min(5)
      .max(100)
      .regex(EMAIL_REGEX, { message: 'Student Email must be a valid email format' })
      .optional(),
    studentName: z
      .string()
      .min(2)
      .max(100)
      .regex(NAME_REGEX, { message: 'Student Name must contain valid characters' })
      .optional(),
    studentPhone: z
      .string()
      .min(10)
      .max(15)
      .regex(PHONE_REGEX, { message: 'Student Phone must be a valid phone format' })
      .optional(),
    amount: z
      .number()
      .positive({ message: 'Amount must be greater than zero' })
      .max(1000000, { message: 'Amount exceeds maximum permitted transaction limit' })
      .optional(),
  })
  .strict();

export const VerifyUpiSchema = z
  .object({
    utrNumber: z
      .string()
      .min(6, { message: 'UTR Number must be at least 6 characters' })
      .max(24, { message: 'UTR Number cannot exceed 24 characters' })
      .regex(UTR_REGEX, { message: 'UTR Number must be alphanumeric without spaces or special symbols' }),
    courseId: z
      .string()
      .max(64)
      .optional(),
    amount: z
      .number()
      .positive()
      .optional(),
    appName: z
      .string()
      .max(50)
      .optional(),
  })
  .strict();

export const VerifyRazorpaySchema = z
  .object({
    razorpay_order_id: z
      .string()
      .min(6, { message: 'Order ID must be at least 6 characters' })
      .max(64),
    razorpay_payment_id: z
      .string()
      .min(6, { message: 'Payment ID must be at least 6 characters' })
      .max(64),
    razorpay_signature: z
      .string()
      .min(10, { message: 'Signature must be at least 10 characters' })
      .max(128),
  })
  .strict();
