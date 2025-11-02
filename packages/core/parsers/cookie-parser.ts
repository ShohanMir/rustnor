import { Middleware } from "../framework/context";
import * as crypto from "crypto";

export interface CookieParserOptions {
  secret?: string | string[];
}

export const cookieParser = (options: CookieParserOptions = {}): Middleware => {
  const secrets = Array.isArray(options.secret)
    ? options.secret
    : [options.secret || ""];

  return async (ctx, next) => {
    const cookieHeader = ctx.req.headers.cookie || "";
    (ctx as any).cookies = parse(cookieHeader);
    (ctx as any).signedCookies = unsign(cookieHeader, secrets);

    await next();
  };
};

function parse(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(";").forEach((cookie) => {
    const [name, value] = cookie.trim().split("=");
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });

  return cookies;
}

function unsign(
  cookieHeader: string,
  secrets: string[],
): Record<string, string> {
  const signedCookies: Record<string, string> = {};
  if (!cookieHeader) return signedCookies;

  const cookies = parse(cookieHeader);

  for (const [name, value] of Object.entries(cookies)) {
    if (value.includes(".")) {
      const [val, sig] = value.split(".");
      for (const secret of secrets) {
        if (sign(val, secret) === sig) {
          signedCookies[name] = val;
          break;
        }
      }
    }
  }

  return signedCookies;
}

function sign(value: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(value)
    .digest("base64")
    .replace(/\=+/g, "");
}
