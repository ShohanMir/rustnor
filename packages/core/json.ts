import { Context, Middleware } from "./context";

export const json = (): Middleware => {
  return async (ctx, next) => {
    if (ctx.req.method === "POST" || ctx.req.method === "PUT" || ctx.req.method === "PATCH") {
      if (ctx.req.headers["content-type"] === "application/json") {
        try {
          const body = await new Promise((resolve, reject) => {
            let data = "";
            ctx.req.on("data", (chunk) => {
              data += chunk;
            });
            ctx.req.on("end", () => {
              resolve(JSON.parse(data));
            });
            ctx.req.on("error", (err) => {
              reject(err);
            });
          });
          ctx.request.body = body;
        } catch (err) {
          ctx.response.status(400).send("Invalid JSON");
          return;
        }
      }
    }
    await next();
  };
};