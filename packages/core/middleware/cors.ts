import { Middleware } from "../framework/context";

export interface CORSOptions {
  origin?: string | string[] | ((origin: string | null) => boolean);
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

  // Warn on invalid credentials + wildcard
  if (config.credentials && config.origin === "*") {
    console.warn(
      'Warning: "credentials: true" with "origin: *" is insecure and may be blocked by browsers. Use specific origins.',
    );
  }

  return async (ctx, next) => {
    let origin = ctx.req.headers.origin as string | null;

    // Handle preflight requests
    if (ctx.req.method === "OPTIONS") {
      setCorsHeaders(ctx, config, origin);
      ctx.response.status(200).send("");
      return;
    }

    setCorsHeaders(ctx, config, origin);

    await next();
  };
};

function setCorsHeaders(
  ctx: any,
  config: Required<CORSOptions>,
  origin?: string | null,
) {
  let allowOrigin = false;
  let setOrigin = "";

  // Origin
  if (config.origin === "*") {
    setOrigin = "*";
    allowOrigin = true;
  } else if (typeof config.origin === "string") {
    setOrigin = config.origin;
    allowOrigin = true;
  } else if (Array.isArray(config.origin)) {
    if (origin && config.origin.includes(origin)) {
      setOrigin = origin;
      allowOrigin = true;
    }
  } else if (typeof config.origin === "function" && origin !== undefined) {
    if (config.origin(origin)) {
      setOrigin = origin || "";
      allowOrigin = true;
    }
  }

  if (allowOrigin) {
    ctx.response.setHeader("Access-Control-Allow-Origin", setOrigin);
    // Vary header for dynamic origins
    if (typeof config.origin !== "string" && origin) {
      ctx.response.setHeader("Vary", "Origin");
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
