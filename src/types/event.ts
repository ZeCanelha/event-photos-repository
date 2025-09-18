import { z } from "zod";

const blendModes = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "hard-light",
  "soft-light",
  "difference",
  "exclusion",
  "hue",
  "saturation",
  "color",
  "luminosity",
] as const;

const positions = ["top", "center", "bottom"] as const;

export const createEventSchema = z.object({
  eventName: z.string(),
  eventDescription: z.string().optional(),
  expiresIn: z.date(),
  blendMode: z.enum(blendModes),
  position: z.enum(positions),
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
