import { z } from "zod";

export const toggleSourceSchema = z.object({
  is_active: z.boolean({ required_error: "is_active (boolean) is required" }),
});

export const generateBriefingSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format")
    .optional(),
});

export const webhookNewsletterSchema = z.object({
  forwardingHash: z.string().min(1),
  senderEmail: z.string().email(),
  senderName: z.string().optional(),
  subject: z.string().optional(),
  htmlBody: z.string().optional(),
  textBody: z.string().optional(),
});
