import { Middleware } from "../framework/context";

export interface HTTPSEnforceOptions {
  redirectPort?: number;
  redirectStatus?: 301 | 302;
  skip?: (ctx: any) => boolean;
}

const defaultOptions: Required<HTTPSEnforceOptions> = {
  redirectPort: 443,
  redirectStatus: 301,
  skip: () => false,
};

export const enforceHTTPS = (options: HTTPSEnforceOptions = {}): Middleware => {
  const config = { ...defaultOptions, ...options };

  return async (ctx, next) => {
    if (config.skip(ctx)) {
      await next();
      return;
    }

    // Check if request is already HTTPS
    const proto =
      (ctx.req.headers["x-forwarded-proto"] as string) ||
      (ctx.req.socket as any)?.encrypted
        ? "https"
        : "http";

    if (proto === "https") {
      await next();
      return;
    }

    // Redirect to HTTPS
    const host = ctx.req.headers.host as string;
    const url = `https://${host}${ctx.req.url}`;
    ctx.response
      .status(config.redirectStatus)
      .setHeader("Location", url)
      .send("");
  };
};
