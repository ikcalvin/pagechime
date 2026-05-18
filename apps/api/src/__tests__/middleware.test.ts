import { describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";
import { z } from "zod";
import { validateBody } from "../middleware/validate";

function createTestApp(schema: z.ZodSchema) {
  const app = express();
  app.use(express.json());
  app.post("/test", validateBody(schema), (_req, res) => {
    res.json({ success: true, body: _req.body });
  });
  return app;
}

describe("validateBody middleware", () => {
  const testSchema = z.object({
    name: z.string().min(1, "Name is required"),
    age: z.number().int().positive().optional(),
  });

  it("passes valid body through to handler", async () => {
    const app = createTestApp(testSchema);

    const res = await request(app)
      .post("/test")
      .send({ name: "Alice", age: 30 })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.body).toEqual({ name: "Alice", age: 30 });
  });

  it("passes valid body with only required fields", async () => {
    const app = createTestApp(testSchema);

    const res = await request(app)
      .post("/test")
      .send({ name: "Bob" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.body.name).toBe("Bob");
  });

  it("returns 400 for invalid body", async () => {
    const app = createTestApp(testSchema);

    const res = await request(app)
      .post("/test")
      .send({ name: "", age: -5 })
      .expect(400);

    expect(res.body.error).toBe("Validation failed");
    expect(res.body.details).toBeInstanceOf(Array);
    expect(res.body.details.length).toBeGreaterThan(0);
    expect(res.body.details[0]).toHaveProperty("field");
    expect(res.body.details[0]).toHaveProperty("message");
  });

  it("returns 400 for empty body", async () => {
    const app = createTestApp(testSchema);

    const res = await request(app)
      .post("/test")
      .send({})
      .expect(400);

    expect(res.body.error).toBe("Validation failed");
    expect(res.body.details).toBeInstanceOf(Array);
  });

  it("strips unknown fields from body", async () => {
    const app = createTestApp(testSchema);

    const res = await request(app)
      .post("/test")
      .send({ name: "Alice", unknownField: "value" })
      .expect(200);

    expect(res.body.body).not.toHaveProperty("unknownField");
  });

  it("includes field path in error details", async () => {
    const nestedSchema = z.object({
      user: z.object({
        email: z.string().email(),
      }),
    });
    const app = createTestApp(nestedSchema);

    const res = await request(app)
      .post("/test")
      .send({ user: { email: "invalid" } })
      .expect(400);

    expect(res.body.details[0].field).toBe("user.email");
  });
});
