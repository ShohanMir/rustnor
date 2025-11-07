import { Context } from "@northernjs";

export default async function healthCheck(ctx: Context) {
  ctx.response.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: "1.0.0",
  });
}
