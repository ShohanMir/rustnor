import { Middleware } from "./context";

export interface RateLimitOptions {
  windowMs?: number; // milliseconds
  max?: number; // max requests per windowMs
  message?: string;
  statusCode?: number;
  skip?: (ctx: any) => boolean;
  keyGenerator?: (ctx: any) => string;
}

const defaultOptions: Required<RateLimitOptions> = {
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: "Too many requests, please try again later.",
  statusCode: 429,
  skip: () => false,
  keyGenerator: (ctx) => ctx.req.socket.remoteAddress as string,
};

const hits = new Map<string, number[]>();

export const rateLimit = (options: RateLimitOptions = {}): Middleware => {
  const config = { ...defaultOptions, ...options };

  // Clean up hits periodically
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of hits.entries()) {
      const recentTimestamps = timestamps.filter(
        (timestamp) => timestamp > now - config.windowMs,
      );
      if (recentTimestamps.length > 0) {
        hits.set(key, recentTimestamps);
      } else {
        hits.delete(key);
      }
    }
  }, config.windowMs * 2);

  // Stop the interval on process exit
  process.on("exit", () => clearInterval(interval));

  return async (ctx, next) => {
    if (config.skip(ctx)) {
      return next();
    }

    const key = config.keyGenerator(ctx);
    const now = Date.now();
    const timestamps = hits.get(key) || [];

    // Remove timestamps outside the window
    const recentTimestamps = timestamps.filter(
      (timestamp) => timestamp > now - config.windowMs,
    );

    if (recentTimestamps.length >= config.max) {
      ctx.response.status(config.statusCode).send(config.message);
      return;
    }

    // Add current request timestamp
    recentTimestamps.push(now);
    hits.set(key, recentTimestamps);

    await next();
  };
};
