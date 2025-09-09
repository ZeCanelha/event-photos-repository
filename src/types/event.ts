import { z } from "zod";

export const createEventSchema = z.object({
  eventName: z.string(),
  eventDescription: z.string().optional(),
  expiresIn: z.date(),
  metadata: z.object({
    watermarkPosition: z.enum([
      "top",
      "center",
      "bottom",
      "top-right",
      "top-left",
      "bottom-right",
      "bottom-left",
    ]),
  }),
});

export type CreateEventSchema = z.infer<typeof createEventSchema>;

export type ListEventSchema = {
  id: string;
  eventName: string;
  eventDescription?: string;
  active: boolean;
  expiresIn: Date;
};

export type EventMidia = {
  id: string;
  filename: string;
  url: string;
};

export type EventSchema = {
  id: string;
  eventName: string;
  eventDescription?: string;
  active: boolean;
  expiresIn: Date;
  eventMedia: EventMidia[];
};

export type EventMetadata = {
  position:
    | "top"
    | "center"
    | "bottom"
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left";
  size: string;
  mode: string;
};

export type EventId = {
  id: string;
};
