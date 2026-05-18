import { z } from "zod";

export const createCollectionSchema = z.object({
  name: z.string().min(1, "Collection name is required").max(100),
});

export const updateCollectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});
