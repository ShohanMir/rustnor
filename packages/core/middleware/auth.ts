import { Middleware } from "../framework/context";

export interface BasicAuthOptions {
  hashedUsers?: Record<string, string>; // username -> hashed password mapping
  realm?: string;
  skip?: (ctx: any) => boolean;
  customAuth?: (
    username: string,
    password: string
  ) => Promise<boolean> | boolean;
}

const defaultOptions: Required<BasicAuthOptions> = {
  hashedUsers: {},
  realm: "Protected Area",
  skip: () => false,
  customAuth: () => false,
};

export const basicAuth = (options: BasicAuthOptions = {}): Middleware => {
  const config = { ...defaultOptions, ...options };

  return async (ctx, next) => {
    // Skip authentication if configured
    if (config.skip(ctx)) {
      await next();
      return;
    }

    const authHeader = ctx.req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return sendAuthRequired(ctx, config.realm);
    }

    const base64Credentials = authHeader.slice(6); // Remove "Basic "
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "ascii"
    );
    const [username, password] = credentials.split(":");

    if (!username || !password) {
      return sendAuthRequired(ctx, config.realm);
    }

    // Check authentication
    let isAuthenticated = false;

    if (config.customAuth) {
      isAuthenticated = await config.customAuth(username, password);
    } else {
      // For development/testing only - requires pre-hashed passwords
      const hashedPassword = config.hashedUsers[username];
      if (hashedPassword) {
        isAuthenticated = hashPassword(password) === hashedPassword;
      }
    }

    if (!isAuthenticated) {
      return sendAuthRequired(ctx, config.realm);
    }

    // Store user info in context
    (ctx as any).state.user = { username };

    await next();
  };
};

function sendAuthRequired(ctx: any, realm: string) {
  ctx.response.setHeader("WWW-Authenticate", `Basic realm="${realm}"`);
  ctx.response.status(401).send("Authentication required");
}

// Helper function to hash passwords (for storing in users object)
export function hashPassword(password: string): string {
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Helper function to create users object with hashed passwords
// WARNING: This is for development/testing only. Use proper password hashing in production.
export function createUsers(
  users: Record<string, string>
): Record<string, string> {
  console.warn(
    "⚠️  WARNING: createUsers() uses weak hashing and is for development/testing only!"
  );
  console.warn(
    "⚠️  Do not use this in production. Implement proper password hashing with salt."
  );

  const hashedUsers: Record<string, string> = {};
  for (const [username, password] of Object.entries(users)) {
    hashedUsers[username] = hashPassword(password);
  }
  return hashedUsers;
}
