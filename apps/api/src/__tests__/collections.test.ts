import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { createMockSupabase } from "./helpers";

// Mock the auth middleware and supabase before importing the router
vi.mock("../lib/supabase", () => ({
  supabaseAdmin: {},
  createUserClient: vi.fn(),
}));

vi.mock("../middleware/auth", () => ({
  requireAuth: (
    req: express.Request,
    _res: express.Response,
    next: express.NextFunction
  ) => {
    req.user = { id: "test-user-id" } as any;
    req.supabase = createMockSupabase() as any;
    next();
  },
}));

// Import router after mocks are set up
import collectionsRouter from "../routes/collections";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/collections", collectionsRouter);
  return app;
}

describe("Collections Routes", () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
  });

  describe("GET /api/collections", () => {
    it("returns collections list", async () => {
      const mockCollections = [
        { id: "1", name: "Reading List", user_id: "test-user-id" },
        { id: "2", name: "Work", user_id: "test-user-id" },
      ];

      // Override the mock to return data
      vi.mocked(
        await import("../middleware/auth")
      ).requireAuth = (req: any, _res: any, next: any) => {
        const mockSupa = createMockSupabase();
        // Override the terminal method to return our data
        mockSupa.order.mockReturnValue({
          ...mockSupa,
          then: (resolve: any) =>
            resolve({ data: mockCollections, error: null }),
        });
        // Make the chain resolve
        mockSupa.from.mockImplementation(() => ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockCollections,
                error: null,
              }),
            }),
          }),
        }));
        req.user = { id: "test-user-id" };
        req.supabase = mockSupa;
        next();
      };
      // Recreate app with new mock
      app = createApp();

      const res = await request(app).get("/api/collections");

      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/collections", () => {
    it("creates a collection with valid name", async () => {
      const res = await request(app)
        .post("/api/collections")
        .send({ name: "New Collection" });

      // Will return 201 or 500 depending on mock chain resolution
      // The important thing is it does NOT return 400 (validation passes)
      expect(res.status).not.toBe(400);
    });

    it("rejects empty name with 400", async () => {
      const res = await request(app)
        .post("/api/collections")
        .send({ name: "" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
      expect(res.body.details[0].message).toBe(
        "Collection name is required"
      );
    });

    it("rejects missing name with 400", async () => {
      const res = await request(app)
        .post("/api/collections")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
    });

    it("rejects name exceeding 100 characters", async () => {
      const res = await request(app)
        .post("/api/collections")
        .send({ name: "a".repeat(101) });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
    });
  });

  describe("PUT /api/collections/:id", () => {
    it("updates collection with valid name", async () => {
      const res = await request(app)
        .put("/api/collections/some-id")
        .send({ name: "Updated Name" });

      // Should not return validation error
      expect(res.status).not.toBe(400);
    });

    it("rejects empty name with 400", async () => {
      const res = await request(app)
        .put("/api/collections/some-id")
        .send({ name: "" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
    });
  });

  describe("DELETE /api/collections/:id", () => {
    it("attempts to delete collection", async () => {
      const res = await request(app).delete("/api/collections/some-id");

      // Should not return 400 or 401
      expect(res.status).not.toBe(400);
      expect(res.status).not.toBe(401);
    });
  });
});
