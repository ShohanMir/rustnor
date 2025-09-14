// TypeScript Developer Experience Comparison: Rustnor vs Express.js

// ===== EXPRESS.JS EXAMPLE =====
// Express has limited TypeScript support out of the box
import express from "express";

interface User {
  id: number;
  name: string;
  email: string;
}

const expressApp = express();
expressApp.use(express.json());

// Route handler - no type safety for request body
expressApp.post("/users", (req, res) => {
  // req.body is 'any' - no type checking
  const user = req.body as User; // Manual casting required

  // No type safety for response
  res.json({ created: user });
});

// ===== RUSTNOR EXAMPLE =====
// Rustnor provides full TypeScript integration
import { App, json, Context } from "../packages/core";
import { Router } from "../packages/router";

interface CreateUserRequest {
  name: string;
  email: string;
}

interface UserResponse {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

const rustnorApp = new App();
const router = new Router();

// Middleware with type safety
rustnorApp.use(json());

// Route handler with full type safety
router.post("/users", async (ctx: Context<{}, CreateUserRequest>) => {
  // ctx.request.body is fully typed!
  const { name, email } = ctx.request.body;

  // Type-safe response
  const user: UserResponse = {
    id: Date.now(),
    name,
    email,
    createdAt: new Date().toISOString(),
  };

  ctx.response.status(201).json(user);
});

rustnorApp.use(router.getRoutes());

// ===== ADVANCED TYPESCRIPT FEATURES =====

// Generic Context types for different request/response shapes
interface AuthenticatedContext<T = {}> extends Context {
  user?: {
    id: number;
    role: string;
  };
  request: Context["request"] & T;
}

// Type-safe route with authenticated context
router.get("/profile", async (ctx: AuthenticatedContext) => {
  // ctx.user is fully typed - no casting needed
  if (!ctx.user) {
    ctx.response.status(401).json({ error: "Not authenticated" });
    return;
  }

  // Response is also type-safe
  ctx.response.json({
    user: ctx.user,
    profile: {
      name: "John Doe",
      email: "john@example.com",
    },
  });
});

export { expressApp, rustnorApp };
