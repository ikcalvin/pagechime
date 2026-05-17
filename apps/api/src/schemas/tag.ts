import { z } from "zod";

export const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50),
});

export const addTagToArticleSchema = z.object({
  tagId: z.string().uuid("Must be a valid tag ID"),
});
