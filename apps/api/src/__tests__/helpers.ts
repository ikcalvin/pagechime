import express from "express";

// Mock Supabase query builder
export function createMockSupabase(overrides: Record<string, any> = {}) {
  const chainable: Record<string, any> = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
  // Make every method return chainable for chaining
  Object.keys(chainable).forEach((key) => {
    if (
      typeof chainable[key] === "function" &&
      key !== "single" &&
      key !== "maybeSingle"
    ) {
      chainable[key].mockReturnValue(chainable);
    }
  });
  return chainable;
}

// Create a mock authenticated request
export function mockAuthMiddleware(userId = "test-user-id") {
  return (
    req: express.Request,
    _res: express.Response,
    next: express.NextFunction
  ) => {
    req.user = { id: userId } as any;
    req.supabase = createMockSupabase() as any;
    next();
  };
}
