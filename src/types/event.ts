import { z } from "zod";

export const createEventSchema = z.object({
  eventName: z.string(),
  eventDescription: z.string().optional(),
  expiresIn: z.date(),
});

export type CreateEventSchema = z.infer<typeof createEventSchema>;
