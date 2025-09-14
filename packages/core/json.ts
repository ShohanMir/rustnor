import { Context, Middleware } from "./context";
import querystring from "querystring";

export interface JsonOptions {
  limit?: number; // bytes, default 100KB
  strict?: boolean; // only JSON, default true
}

const defaultOptions: Required<JsonOptions> = {
  limit: 1024 * 100, // 100KB
  strict: true,
};

export const json = (options: JsonOptions = {}): Middleware => {
  const config = { ...defaultOptions, ...options };

  return async (ctx, next) => {
    if (
      ctx.req.method === "POST" ||
      ctx.req.method === "PUT" ||
      ctx.req.method === "PATCH"
    ) {
      const contentType = ctx.req.headers["content-type"] || "";
      let body: any = null;

      if (contentType.includes("application/json")) {
        try {
          body = await parseJson(ctx.req, config.limit);
        } catch (err: any) {
          ctx.response.status(400).json({
            error: "Invalid JSON",
            message: err.message || "Failed to parse request body as JSON",
            details:
              process.env.NODE_ENV === "development" ? err.stack : undefined,
          });
          return;
        }
      } else if (
        !config.strict &&
        contentType.includes("application/x-www-form-urlencoded")
      ) {
        try {
          body = await parseForm(ctx.req, config.limit);
          // Flatten string[] to string for single values
          if (body) {
            Object.keys(body).forEach((key) => {
              if (Array.isArray(body[key]) && body[key].length === 1) {
                body[key] = body[key][0];
              }
            });
          }
        } catch (err: any) {
          ctx.response.status(400).json({
            error: "Invalid Form Data",
            message: err.message || "Failed to parse form body",
          });
          return;
        }
      }

      if (body !== null) {
        ctx.request.body = body;
      }
    }
    await next();
  };
};

async function parseJson(req: any, limit: number): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = "";
    let size = 0;

    req.on("data", (chunk: Buffer) => {
      data += chunk;
      size += chunk.length;
      if (size > limit) {
        req.destroy(new Error(`Request entity too large: ${size} > ${limit}`));
        return;
      }
    });

    req.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });

    req.on("error", reject);
  });
}

async function parseForm(
  req: any,
  limit: number,
): Promise<Record<string, string | string[]>> {
  return new Promise((resolve, reject) => {
    let data = "";
    let size = 0;

    req.on("data", (chunk: Buffer) => {
      data += chunk;
      size += chunk.length;
      if (size > limit) {
        req.destroy(new Error(`Request entity too large: ${size} > ${limit}`));
        return;
      }
    });

    req.on("end", () => {
      try {
        resolve(querystring.parse(data) as Record<string, string | string[]>);
      } catch (err) {
        reject(err);
      }
    });

    req.on("error", reject);
  });
}
