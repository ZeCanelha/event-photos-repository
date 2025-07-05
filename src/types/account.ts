import { z } from "zod";

export const createuserSchema = z.object({
  username: z.string().min(1, "Name is requried"),
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must have at least 8 digits")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(
      /[@$!%*?&#]/,
      "Password must contain at least one special character"
    ),
  inviteId: z.string().uuid(),
  role: z.enum(["guest", "collaborator", "owner"]),
});

export type CreateUserRequestBody = z.infer<typeof createuserSchema>;
