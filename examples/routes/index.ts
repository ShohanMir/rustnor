import { Context } from "../../packages/core";

export default async function homeHandler(ctx: Context) {
  ctx.response.json({
    message: "Welcome to Rustnor File-Based Routing!",
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
