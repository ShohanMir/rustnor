import { Middleware } from "./context";
import * as crypto from "crypto";

export interface SessionOptions {
  name?: string;
  secret?: string;
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  store?: SessionStore;
}

export interface SessionStore {
  get(sid: string): Promise<any> | any;
  set(sid: string, session: any, maxAge?: number): Promise<void> | void;
  destroy(sid: string): Promise<void> | void;
}

class MemoryStore implements SessionStore {
  private sessions: Map<string, { data: any; expires: number }> = new Map();

  get(sid: string) {
    const session = this.sessions.get(sid);
    if (!session) return null;

    if (Date.now() > session.expires) {
      this.sessions.delete(sid);
      return null;
    }

    return session.data;
  }

  set(sid: string, session: any, maxAge: number = 86400000) {
    this.sessions.set(sid, {
      data: session,
      expires: Date.now() + maxAge,
    });
  }

  destroy(sid: string) {
    this.sessions.delete(sid);
  }
}

const defaultOptions: Required<SessionOptions> = {
  name: "rustnor.sid",
  secret: crypto.randomBytes(16).toString("hex"),
  maxAge: 86400000, // 24 hours
  httpOnly: true,
  secure: false,
  sameSite: "lax",
  store: new MemoryStore(),
};

export const session = (options: SessionOptions = {}): Middleware => {
  const config = { ...defaultOptions, ...options };

  return async (ctx, next) => {
    let sid = getSessionId(ctx, config.name);

    if (!sid) {
      sid = generateSessionId();
      setSessionCookie(ctx, sid, config);
    }

    // Load session data
    (ctx as any).state.session = (await config.store.get(sid)) || {};

    // Save original session for comparison
    const originalSession = JSON.stringify((ctx as any).state.session);

    await next();

    // Save session if modified
    const currentSession = JSON.stringify((ctx as any).state.session);
    if (currentSession !== originalSession) {
      await config.store.set(sid, (ctx as any).state.session, config.maxAge);
    }
  };
};

function getSessionId(ctx: any, name: string): string | null {
  const cookies = parseCookies(ctx.req.headers.cookie || "");
  return cookies[name] || null;
}

function setSessionCookie(
  ctx: any,
  sid: string,
  config: Required<SessionOptions>,
) {
  const cookieOptions = [
    `${config.name}=${sid}`,
    `Max-Age=${config.maxAge / 1000}`,
    `HttpOnly${config.httpOnly ? "" : "; HttpOnly=false"}`,
    `SameSite=${config.sameSite}`,
  ];

  if (config.secure) {
    cookieOptions.push("Secure");
  }

  ctx.response.setHeader("Set-Cookie", cookieOptions.join("; "));
}

function generateSessionId(): string {
  return crypto.randomBytes(16).toString("hex");
}

function parseCookies(cookieHeader: string): Record<string, string> {
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

// Export the MemoryStore for custom implementations
export { MemoryStore };
