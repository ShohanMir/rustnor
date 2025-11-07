import { Context } from "@northernjs";

export default async function homeHandler(ctx: Context) {
  ctx.response.json({
    message: "Welcome to NorthernJS File-Based Routing!",
    routes: [
      "GET /",
      "GET /users",
      "GET /users/[id]",
      "POST /users",
      "GET /posts",
      "GET /api/health",
    ],
  });
}
