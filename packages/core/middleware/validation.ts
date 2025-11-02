import { Middleware } from "../framework/context";

export interface ValidationOptions {
  sanitizeQuery?: boolean;
  sanitizeBody?: boolean;
  sanitizeHeaders?: boolean;
  customSanitizer?: (input: string) => string;
  skip?: (ctx: any) => boolean;
}

const defaultOptions: Required<ValidationOptions> = {
  sanitizeQuery: true,
  sanitizeBody: true,
  sanitizeHeaders: false,
  customSanitizer: defaultSanitizer,
  skip: () => false,
};

// Basic XSS sanitizer - removes potentially dangerous tags and attributes
function defaultSanitizer(input: string): string {
  if (typeof input !== "string") return input;

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "")
    .replace(/on\w+=[^>\s]+/gi, "");
}

function sanitizeObject(obj: any, sanitizer: (input: string) => string): any {
  if (typeof obj === "string") {
    return sanitizer(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, sanitizer));
  }
  if (obj && typeof obj === "object") {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value, sanitizer);
    }
    return sanitized;
  }
  return obj;
}

export const validateInput = (options: ValidationOptions = {}): Middleware => {
  const config = { ...defaultOptions, ...options };

  return async (ctx, next) => {
    if (config.skip(ctx)) {
      await next();
      return;
    }

    const sanitizer = config.customSanitizer;

    if (config.sanitizeQuery && ctx.query) {
      ctx.query = sanitizeObject(ctx.query, sanitizer);
    }

    if (config.sanitizeBody && ctx.body) {
      ctx.body = sanitizeObject(ctx.body, sanitizer);
    }

    if (config.sanitizeHeaders && ctx.req.headers) {
      // Note: Headers are read-only in Node.js, so we can't modify them directly
      // This is just for awareness - actual sanitization would need to be handled differently
      console.warn(
        "Header sanitization is not supported as headers are read-only",
      );
    }

    await next();
  };
};
