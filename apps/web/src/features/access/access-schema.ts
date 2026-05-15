import { z } from "zod";

export const roleFormSchema = z.object({
  description: z.string().max(240).optional(),
  key: z.string().min(3).max(64).optional(),
  name: z.string().min(2).max(120),
  permissionIds: z.array(z.string().uuid()).min(0)
});

export const userRolesFormSchema = z.object({
  roleIds: z.array(z.string().uuid()).min(1, "Select at least one role.")
});

export const invitationFormSchema = z.object({
  email: z.string().email(),
  roleIds: z.array(z.string().uuid()).min(1, "Select at least one role.")
});

export const invitationAccountSchema = z
  .object({
    password: z.string().min(8, "Password must contain at least 8 characters."),
    confirmPassword: z.string().min(8)
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"]
  });
