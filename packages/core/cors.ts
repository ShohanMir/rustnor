import { Middleware } from "./context";

export interface CORSOptions {
  origin?: string | string[] | ((origin: string) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

const defaultOptions: Required<CORSOptions> = {
  origin: "*",
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: [],
  credentials: false,
  maxAge: 86400,
};

export const cors = (options: CORSOptions = {}): Middleware => {
  const config = { ...defaultOptions, ...options };

  return async (ctx, next) => {
    const origin = ctx.req.headers.origin;

    // Handle preflight requests
    if (ctx.req.method === "OPTIONS") {
      // Set CORS headers for preflight
      setCorsHeaders(ctx, config, origin);
      ctx.response.status(200).send("");
      return;
    }

    // Set CORS headers for actual requests
    setCorsHeaders(ctx, config, origin);

    await next();
  };
};

function setCorsHeaders(
  ctx: any,
  config: Required<CORSOptions>,
  origin?: string,
) {
  // Origin
  if (config.origin === "*") {
    ctx.response.setHeader("Access-Control-Allow-Origin", "*");
  } else if (typeof config.origin === "string") {
    ctx.response.setHeader("Access-Control-Allow-Origin", config.origin);
  } else if (Array.isArray(config.origin)) {
    if (origin && config.origin.includes(origin)) {
      ctx.response.setHeader("Access-Control-Allow-Origin", origin);
    }
  } else if (typeof config.origin === "function" && origin) {
    if (config.origin(origin)) {
      ctx.response.setHeader("Access-Control-Allow-Origin", origin);
    }
  }

  // Methods
  ctx.response.setHeader(
    "Access-Control-Allow-Methods",
    config.methods.join(", "),
  );

  // Headers
  ctx.response.setHeader(
    "Access-Control-Allow-Headers",
    config.allowedHeaders.join(", "),
  );

  // Exposed headers
  if (config.exposedHeaders.length > 0) {
    ctx.response.setHeader(
      "Access-Control-Expose-Headers",
      config.exposedHeaders.join(", "),
    );
  }

  // Credentials
  if (config.credentials) {
    ctx.response.setHeader("Access-Control-Allow-Credentials", "true");
  }

  // Max age for preflight
  ctx.response.setHeader("Access-Control-Max-Age", config.maxAge.toString());
}
