import { z } from "zod";

export const createUserSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Please provide a valid email address")
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters"),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  contractType: z.enum(["HOURLY", "MONTHLY_SALARY", "WORKLOAD_PERCENT"]).optional(),
  workloadPercent: z.number().min(0).max(100).optional(),
  hourlyRate: z.number().min(0).optional(),
  monthlySalary: z.number().min(0).optional(),
  contractedHoursMonthly: z.number().min(0).optional(),
  hireDate: z.string().datetime().optional(),
});

export const updateUserSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email address")
    .trim()
    .toLowerCase()
    .optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional(),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  contractType: z.enum(["HOURLY", "MONTHLY_SALARY", "WORKLOAD_PERCENT"]).optional(),
  workloadPercent: z.number().min(0).max(100).optional(),
  hourlyRate: z.number().min(0).optional(),
  monthlySalary: z.number().min(0).optional(),
  contractedHoursMonthly: z.number().min(0).optional(),
  hireDate: z.string().datetime().optional(),
  mustChangePassword: z.boolean().optional(),
});

export const userIdParamSchema = z.object({
  userId: z.string({ required_error: "User ID is required" }).min(1),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  isActive: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  search: z.string().trim().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
