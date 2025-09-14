import { Middleware } from "../framework/context";

export interface SecurityHeadersOptions {
  "X-Frame-Options"?: "DENY" | "SAMEORIGIN";
  "X-Content-Type-Options"?: "nosniff";
  "X-XSS-Protection"?: string;
  "Strict-Transport-Security"?: {
    maxAge: number;
    includeSubDomains?: boolean;
  };
  "Content-Security-Policy"?: Record<string, string[] | string>;
  "Referrer-Policy"?: string;
  "Permissions-Policy"?: string;
}

const defaultOptions: SecurityHeadersOptions = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
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
    "style-src": ["'self'"],
  },
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
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

    if (config["X-XSS-Protection"]) {
      ctx.response.setHeader("X-XSS-Protection", config["X-XSS-Protection"]);
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

    if (config["Referrer-Policy"]) {
      ctx.response.setHeader("Referrer-Policy", config["Referrer-Policy"]);
    }

    if (config["Permissions-Policy"]) {
      ctx.response.setHeader(
        "Permissions-Policy",
        config["Permissions-Policy"],
      );
    }

    await next();
  };
};
