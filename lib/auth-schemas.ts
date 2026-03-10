import { z } from "zod";

export const signupBodySchema = z.object({
  fullName: z.string(),
  stageName: z.string(),
  email: z.string(),
  password: z.string(),
});

export const emailBodySchema = z.object({
  email: z.string(),
});

export const updateEmailBodySchema = z.object({
  currentEmail: z.string().optional(),
  newEmail: z.string(),
});

export const resetPasswordBodySchema = z.object({
  token: z.string(),
  password: z.string(),
});

export const tokenBodySchema = z.object({
  token: z.string(),
});

export const changePasswordBodySchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string(),
});
