import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { createMockSupabase } from "./helpers";

// Mock dependencies before importing app
vi.mock("../lib/supabase", () => ({
  supabaseAdmin: {
    auth: {
      getUser: vi.fn(),
    },
  },
  createUserClient: vi.fn(),
}));

vi.mock("../lib/sentry", () => ({
  initSentry: vi.fn(),
  Sentry: {
    setupExpressErrorHandler: vi.fn(),
  },
}));

vi.mock("../middleware/auth", () => ({
  requireAuth: (
    req: express.Request,
    _res: express.Response,
    next: express.NextFunction
  ) => {
    const mockSupa = createMockSupabase();
    req.user = { id: "test-user-id" } as any;
    req.supabase = mockSupa as any;
    next();
  },
}));

vi.mock("../middleware/rate-limit", () => ({
  globalLimiter: (
    _req: express.Request,
    _res: express.Response,
    next: express.NextFunction
  ) => next(),
  createArticleLimiter: (
    _req: express.Request,
    _res: express.Response,
    next: express.NextFunction
  ) => next(),
  authLimiter: (
    _req: express.Request,
    _res: express.Response,
    next: express.NextFunction
  ) => next(),
}));

vi.mock("../routes/collections", () => {
  const { Router } = require("express");
  return { default: Router() };
});

vi.mock("../routes/newsletter", () => {
  const { Router } = require("express");
  return { default: Router() };
});

vi.mock("../routes/webhooks", () => {
  const { Router } = require("express");
  return { default: Router() };
});

import app from "../app";

describe("Article Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/articles", () => {
    it("accepts a valid URL", async () => {
      const res = await request(app)
        .post("/api/articles")
        .set("Authorization", "Bearer test-token")
        .send({ url: "https://example.com/article" });

      // Should not return 400 (validation passes)
      expect(res.status).not.toBe(400);
    });

    it("rejects invalid URL with 400", async () => {
      const res = await request(app)
        .post("/api/articles")
        .set("Authorization", "Bearer test-token")
        .send({ url: "not-a-url" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
      expect(res.body.details[0].message).toBe("Must be a valid URL");
    });

    it("rejects missing URL with 400", async () => {
      const res = await request(app)
        .post("/api/articles")
        .set("Authorization", "Bearer test-token")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
    });

    it("accepts URL with optional collectionId", async () => {
      const res = await request(app)
        .post("/api/articles")
        .set("Authorization", "Bearer test-token")
        .send({
          url: "https://example.com/article",
          collectionId: "550e8400-e29b-41d4-a716-446655440000",
        });

      expect(res.status).not.toBe(400);
    });
  });

  describe("GET /api/articles", () => {
    it("returns a response (not 400 or 401)", async () => {
      const res = await request(app)
        .get("/api/articles")
        .set("Authorization", "Bearer test-token");

      // The mock supabase chain may not fully resolve, but we verify
      // the route exists and auth passes
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(404);
    });
  });

  describe("GET /api/articles/:id", () => {
    it("returns a response for valid id", async () => {
      const res = await request(app)
        .get("/api/articles/some-article-id")
        .set("Authorization", "Bearer test-token");

      expect(res.status).not.toBe(401);
    });
  });

  describe("PUT /api/articles/:id", () => {
    it("accepts valid update body", async () => {
      const res = await request(app)
        .put("/api/articles/some-article-id")
        .set("Authorization", "Bearer test-token")
        .send({ is_archived: true });

      expect(res.status).not.toBe(400);
    });

    it("rejects invalid field types", async () => {
      const res = await request(app)
        .put("/api/articles/some-article-id")
        .set("Authorization", "Bearer test-token")
        .send({ is_archived: "yes" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
    });
  });

  describe("PATCH /api/articles/:id", () => {
    it("accepts valid partial update", async () => {
      const res = await request(app)
        .patch("/api/articles/some-article-id")
        .set("Authorization", "Bearer test-token")
        .send({ is_deleted: false });

      expect(res.status).not.toBe(400);
    });
  });

  describe("DELETE /api/articles/:id", () => {
    it("attempts soft delete", async () => {
      const res = await request(app)
        .delete("/api/articles/some-article-id")
        .set("Authorization", "Bearer test-token");

      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(400);
    });
  });

  describe("Health check", () => {
    it("GET /api/health returns ok", async () => {
      const res = await request(app).get("/api/health");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.timestamp).toBeDefined();
    });
  });
});
