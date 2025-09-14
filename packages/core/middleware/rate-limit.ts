import { Middleware } from "../framework/context";

export interface RateLimitStore {
  get(key: string): Promise<number[] | undefined>;
  set(key: string, timestamps: number[]): Promise<void>;
  delete(key: string): Promise<void>;
  cleanup?(): Promise<void>;
}

export interface RateLimitOptions {
  windowMs?: number; // milliseconds
  max?: number; // max requests per windowMs
  message?: string;
  statusCode?: number;
  skip?: (ctx: any) => boolean;
  keyGenerator?: (ctx: any) => string;
  store?: RateLimitStore; // external store for multi-instance support
}

const defaultOptions: Required<Omit<RateLimitOptions, "store">> & {
  store?: RateLimitStore;
} = {
  windowMs: 60 * 1000,
  max: 5,
  message: "Too many requests, please try again later.",
  statusCode: 429,
  skip: () => false,
  keyGenerator: (ctx) => ctx.req.socket.remoteAddress as string,
};

// In-memory store implementation
class RateLimitMemoryStore implements RateLimitStore {
  private data = new Map<string, number[]>();

  async get(key: string): Promise<number[] | undefined> {
    return this.data.get(key);
  }

  async set(key: string, timestamps: number[]): Promise<void> {
    this.data.set(key, timestamps);
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  async cleanup(): Promise<void> {
    // Cleanup is handled by the middleware
  }
}

export { RateLimitMemoryStore };

export const rateLimit = (options: RateLimitOptions = {}): Middleware => {
  const config = { ...defaultOptions, ...options };
  const store = config.store || new RateLimitMemoryStore();

  // Clean up periodically if using memory store
  let interval: NodeJS.Timeout | undefined;
  if (!config.store) {
    interval = setInterval(async () => {
      // For memory store, we can't easily cleanup all keys
      // In production, consider using a proper store
    }, config.windowMs * 2);

    process.on("exit", () => {
      if (interval) clearInterval(interval);
    });
  }

  return async (ctx, next) => {
    if (config.skip(ctx)) {
      return next();
    }

    const key = config.keyGenerator(ctx);
    const now = Date.now();
    let timestamps = (await store.get(key)) || [];

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
    await store.set(key, recentTimestamps);

    await next();
  };
};
