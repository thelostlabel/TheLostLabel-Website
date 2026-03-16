import { z } from "zod";

export const signupBodySchema = z.object({
  fullName: z.string().min(1).max(100),
  stageName: z.string().min(1).max(100),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

export const emailBodySchema = z.object({
  email: z.string().email().max(254),
});

export const updateEmailBodySchema = z.object({
  currentEmail: z.string().email().max(254).optional(),
  newEmail: z.string().email().max(254),
});

export const resetPasswordBodySchema = z.object({
  token: z.string().min(1).max(256),
  password: z.string().min(8).max(128),
});

export const tokenBodySchema = z.object({
  token: z.string().min(1).max(256),
});

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});
