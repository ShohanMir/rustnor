import { Context, Middleware } from "./context";

export const json = (): Middleware => {
  return async (ctx, next) => {
    if (
      ctx.req.method === "POST" ||
      ctx.req.method === "PUT" ||
      ctx.req.method === "PATCH"
    ) {
      if (ctx.req.headers["content-type"] === "application/json") {
        try {
          const body = await new Promise((resolve, reject) => {
            let data = "";
            ctx.req.on("data", (chunk) => {
              data += chunk;
            });
            ctx.req.on("end", () => {
              try {
                resolve(JSON.parse(data));
              } catch (parseErr) {
                reject(parseErr);
              }
            });
            ctx.req.on("error", (err) => {
              reject(err);
            });
          });
          ctx.request.body = body;
        } catch (err: any) {
          ctx.response.status(400).json({
            error: "Invalid JSON",
            message: err.message || "Failed to parse request body as JSON",
            details:
              process.env.NODE_ENV === "development" ? err.stack : undefined,
          });
          return;
        }
      }
    }
    await next();
  };
};
