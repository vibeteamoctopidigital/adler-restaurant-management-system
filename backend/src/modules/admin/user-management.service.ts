import { prisma } from "../../config/db";
import { hashPassword } from "../../utils/bcrypt";
import { AppError } from "../../utils/AppError";
import type { CreateUserInput, UpdateUserInput } from "./user-management.validation";
import type { Prisma } from "../../generated/prisma/client";

// ─── Create User ─────────────────────────────────────────────────
const createUser = async (data: CreateUserInput) => {
  // 1. Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existingUser) {
    throw new AppError("A user with this email already exists.", 409);
  }

  // 2. Hash password
  const passwordHash = await hashPassword(data.password);

  // 3. Build create payload — only include fields that are provided
  //    (exactOptionalPropertyTypes forbids passing undefined to nullable Prisma fields)
  const createData: Prisma.UserCreateInput = {
    email: data.email,
    passwordHash,
    mustChangePassword: true,
  };

  if (data.firstName !== undefined) createData.firstName = data.firstName;
  if (data.lastName !== undefined) createData.lastName = data.lastName;
  if (data.phone !== undefined) createData.phone = data.phone;
  if (data.contractType !== undefined) createData.contractType = data.contractType;
  if (data.workloadPercent !== undefined) createData.workloadPercent = data.workloadPercent;
  if (data.hourlyRate !== undefined) createData.hourlyRate = data.hourlyRate;
  if (data.monthlySalary !== undefined) createData.monthlySalary = data.monthlySalary;
  if (data.contractedHoursMonthly !== undefined) createData.contractedHoursMonthly = data.contractedHoursMonthly;
  if (data.hireDate !== undefined) createData.hireDate = new Date(data.hireDate);

  // 4. Create user
  const user = await prisma.user.create({
    data: createData,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      contractType: true,
      workloadPercent: true,
      hourlyRate: true,
      monthlySalary: true,
      contractedHoursMonthly: true,
      hireDate: true,
      isActive: true,
      mustChangePassword: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};

// ─── Update User ─────────────────────────────────────────────────
const updateUser = async (userId: string, data: UpdateUserInput) => {
  // 1. Check user exists
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    throw new AppError("User not found.", 404);
  }

  // 2. If email is changing, check uniqueness
  if (data.email && data.email !== existingUser.email) {
    const emailTaken = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (emailTaken) {
      throw new AppError("A user with this email already exists.", 409);
    }
  }

  // 3. Build update payload
  const updateData: Prisma.UserUpdateInput = {};

  if (data.email !== undefined) updateData.email = data.email;
  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.contractType !== undefined) updateData.contractType = data.contractType;
  if (data.workloadPercent !== undefined) updateData.workloadPercent = data.workloadPercent;
  if (data.hourlyRate !== undefined) updateData.hourlyRate = data.hourlyRate;
  if (data.monthlySalary !== undefined) updateData.monthlySalary = data.monthlySalary;
  if (data.contractedHoursMonthly !== undefined) updateData.contractedHoursMonthly = data.contractedHoursMonthly;
  if (data.hireDate !== undefined) updateData.hireDate = new Date(data.hireDate);
  if (data.mustChangePassword !== undefined) updateData.mustChangePassword = data.mustChangePassword;

  // 4. If password is being updated, hash it
  if (data.password) {
    updateData.passwordHash = await hashPassword(data.password);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      contractType: true,
      workloadPercent: true,
      hourlyRate: true,
      monthlySalary: true,
      contractedHoursMonthly: true,
      hireDate: true,
      isActive: true,
      mustChangePassword: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};

// ─── Delete User ─────────────────────────────────────────────────
const deleteUser = async (userId: string) => {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    throw new AppError("User not found.", 404);
  }

  await prisma.user.delete({ where: { id: userId } });
};

// ─── Deactivate User ─────────────────────────────────────────────
const deactivateUser = async (userId: string) => {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    throw new AppError("User not found.", 404);
  }

  if (!existingUser.isActive) {
    throw new AppError("User is already deactivated.", 400);
  }

  // Revoke all active refresh tokens when deactivating
  await prisma.userRefreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: false,
      deactivatedAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      deactivatedAt: true,
    },
  });

  return user;
};

// ─── Activate User ───────────────────────────────────────────────
const activateUser = async (userId: string) => {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    throw new AppError("User not found.", 404);
  }

  if (existingUser.isActive) {
    throw new AppError("User is already active.", 400);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: true,
      deactivatedAt: null,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
    },
  });

  return user;
};

// ─── Get All Users ───────────────────────────────────────────────
const getAllUsers = async (query: {
  page: number;
  limit: number;
  isActive?: boolean;
  search?: string;
}) => {
  const { page, limit, isActive, search } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {};

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        contractType: true,
        isActive: true,
        lastLoginAt: true,
        hireDate: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ─── Get User By ID ──────────────────────────────────────────────
const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      contractType: true,
      workloadPercent: true,
      hourlyRate: true,
      monthlySalary: true,
      contractedHoursMonthly: true,
      hireDate: true,
      isActive: true,
      mustChangePassword: true,
      lastLoginAt: true,
      deactivatedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  return user;
};

export const userManagementServices = {
  createUser,
  updateUser,
  deleteUser,
  deactivateUser,
  activateUser,
  getAllUsers,
  getUserById,
};
