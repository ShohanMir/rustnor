import { Middleware } from "./context";

export interface SecurityHeadersOptions {
  "X-Frame-Options"?: "DENY" | "SAMEORIGIN";
  "X-Content-Type-Options"?: "nosniff";
  "Strict-Transport-Security"?: {
    maxAge: number;
    includeSubDomains?: boolean;
  };
  "Content-Security-Policy"?: Record<string, string[] | string>;
}

const defaultOptions: SecurityHeadersOptions = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Strict-Transport-Security": {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
  },
  "Content-Security-Policy": {
    "default-src": ["'self'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "script-src": ["'self'"],
    "style-src": ["'self'", "'unsafe-inline'"],
  },
};

export const security = (options: SecurityHeadersOptions = {}): Middleware => {
  const config = { ...defaultOptions, ...options };

  return async (ctx, next) => {
    if (config["X-Frame-Options"]) {
      ctx.response.setHeader("X-Frame-Options", config["X-Frame-Options"]);
    }

    if (config["X-Content-Type-Options"]) {
      ctx.response.setHeader(
        "X-Content-Type-Options",
        config["X-Content-Type-Options"],
      );
    }

    if (config["Strict-Transport-Security"]) {
      const { maxAge, includeSubDomains } = config["Strict-Transport-Security"];
      let hsts = `max-age=${maxAge}`;
      if (includeSubDomains) {
        hsts += "; includeSubDomains";
      }
      ctx.response.setHeader("Strict-Transport-Security", hsts);
    }

    if (config["Content-Security-Policy"]) {
      const csp = Object.entries(config["Content-Security-Policy"])
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return `${key} ${value.join(" ")}`;
          }
          return `${key} ${value}`;
        })
        .join("; ");
      ctx.response.setHeader("Content-Security-Policy", csp);
    }

    await next();
  };
};
