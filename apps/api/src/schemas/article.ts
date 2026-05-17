import { z } from "zod";

export const createArticleSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  collectionId: z.string().uuid().optional().nullable(),
});

export const updateArticleSchema = z.object({
  is_archived: z.boolean().optional(),
  is_deleted: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  collection_id: z.string().uuid().optional().nullable(),
});
