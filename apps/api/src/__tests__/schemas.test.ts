import { describe, it, expect } from "vitest";
import {
  createArticleSchema,
  updateArticleSchema,
} from "../schemas/article";
import {
  createCollectionSchema,
} from "../schemas/collection";
import { createTagSchema, addTagToArticleSchema } from "../schemas/tag";
import {
  toggleSourceSchema,
  webhookNewsletterSchema,
} from "../schemas/newsletter";

describe("createArticleSchema", () => {
  it("accepts a valid URL", () => {
    const result = createArticleSchema.safeParse({
      url: "https://example.com/article",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a URL with optional collectionId", () => {
    const result = createArticleSchema.safeParse({
      url: "https://example.com/article",
      collectionId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null collectionId", () => {
    const result = createArticleSchema.safeParse({
      url: "https://example.com",
      collectionId: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing URL", () => {
    const result = createArticleSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects invalid URL", () => {
    const result = createArticleSchema.safeParse({ url: "not-a-url" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Must be a valid URL");
    }
  });
});

describe("updateArticleSchema", () => {
  it("accepts boolean fields", () => {
    const result = updateArticleSchema.safeParse({
      is_archived: true,
      is_deleted: false,
    });
    expect(result.success).toBe(true);
  });

  it("accepts sort_order as integer", () => {
    const result = updateArticleSchema.safeParse({ sort_order: 5 });
    expect(result.success).toBe(true);
  });

  it("accepts collection_id as UUID", () => {
    const result = updateArticleSchema.safeParse({
      collection_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (all fields optional)", () => {
    const result = updateArticleSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects wrong type for is_archived", () => {
    const result = updateArticleSchema.safeParse({
      is_archived: "yes",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer sort_order", () => {
    const result = updateArticleSchema.safeParse({
      sort_order: 3.5,
    });
    expect(result.success).toBe(false);
  });
});

describe("createCollectionSchema", () => {
  it("accepts a valid name", () => {
    const result = createCollectionSchema.safeParse({
      name: "My Collection",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = createCollectionSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe(
        "Collection name is required"
      );
    }
  });

  it("rejects a name that is too long", () => {
    const result = createCollectionSchema.safeParse({
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

describe("createTagSchema", () => {
  it("accepts a valid tag name", () => {
    const result = createTagSchema.safeParse({ name: "javascript" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty tag name", () => {
    const result = createTagSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Tag name is required");
    }
  });

  it("rejects a tag name that is too long", () => {
    const result = createTagSchema.safeParse({ name: "a".repeat(51) });
    expect(result.success).toBe(false);
  });
});

describe("addTagToArticleSchema", () => {
  it("accepts a valid UUID", () => {
    const result = addTagToArticleSchema.safeParse({
      tagId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid UUID", () => {
    const result = addTagToArticleSchema.safeParse({
      tagId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Must be a valid tag ID");
    }
  });
});

describe("toggleSourceSchema", () => {
  it("accepts boolean true", () => {
    const result = toggleSourceSchema.safeParse({ is_active: true });
    expect(result.success).toBe(true);
  });

  it("accepts boolean false", () => {
    const result = toggleSourceSchema.safeParse({ is_active: false });
    expect(result.success).toBe(true);
  });

  it("rejects non-boolean value", () => {
    const result = toggleSourceSchema.safeParse({ is_active: "true" });
    expect(result.success).toBe(false);
  });

  it("rejects missing is_active", () => {
    const result = toggleSourceSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("webhookNewsletterSchema", () => {
  it("accepts a valid payload", () => {
    const result = webhookNewsletterSchema.safeParse({
      forwardingHash: "abc123",
      senderEmail: "newsletter@example.com",
      senderName: "Daily News",
      subject: "Today's Digest",
      htmlBody: "<h1>Hello</h1>",
      textBody: "Hello",
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal required fields", () => {
    const result = webhookNewsletterSchema.safeParse({
      forwardingHash: "abc123",
      senderEmail: "newsletter@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing forwardingHash", () => {
    const result = webhookNewsletterSchema.safeParse({
      senderEmail: "newsletter@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing senderEmail", () => {
    const result = webhookNewsletterSchema.safeParse({
      forwardingHash: "abc123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = webhookNewsletterSchema.safeParse({
      forwardingHash: "abc123",
      senderEmail: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});
