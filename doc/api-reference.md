# API Reference

Complete API documentation for Rustnor framework components.

## Core Classes

### App

The main application class that handles middleware composition and server lifecycle.

```typescript
class App {
  constructor();
  use(middleware: Middleware): App;
  onError(handler: (err: any, ctx: Context) => void): void;
  listen(port?: number, hostname?: string, callback?: () => void): Server;
  listen(port?: number, callback?: () => void): Server;
  getListener(): (req: IncomingMessage, res: ServerResponse) => void;
}
```

**Methods:**

- `constructor()` - Creates a new application instance
- `use(middleware)` - Registers middleware function
- `onError(handler)` - Sets global error handler
- `listen(port?, hostname?, callback?)` - Starts HTTP server
- `getListener()` - Returns request handler for testing

### Router

Handles route registration and matching.

```typescript
class Router {
  constructor();
  get(path: string, handler: Middleware): void;
  post(path: string, handler: Middleware): void;
  put(path: string, handler: Middleware): void;
  patch(path: string, handler: Middleware): void;
  delete(path: string, handler: Middleware): void;
  head(path: string, handler: Middleware): void;
  options(path: string, handler: Middleware): void;
  getRoutes(): Middleware;
}
```

### FileRouter

File-based routing system inspired by Next.js.

```typescript
class FileRouter {
  constructor(options?: FileRouteOptions);
  scanRoutes(): Promise<Router>;
}
```

## Interfaces

### Context

The context object passed to all middleware and route handlers.

```typescript
interface Context<StateT = {}, BodyT = any> {
  req: IncomingMessage;
  res: ServerResponse;
  request: Request<BodyT>;
  response: Response;
  app: App;
  query: ParsedUrlQuery;
  params: Record<string, string>;
  state: StateT;
  [key: string]: any;
}
```

### Request

Parsed request object with body and utilities.

```typescript
interface Request<BodyT = any> {
  body: BodyT;
  query: ParsedUrlQuery;
  params: Record<string, string>;
}
```

### Response

Response object with helper methods.

```typescript
interface Response {
  status(code: number): Response;
  send(body: any): void;
  json(body: any): void;
  setHeader(name: string, value: string | string[]): void;
  getHeader(name: string): string | string[] | undefined;
  removeHeader(name: string): void;
  body: any;
  statusCode: number;
  headersSent: boolean;
  res: ServerResponse;
}
```

### Middleware

Function signature for middleware.

```typescript
type Middleware<StateT = {}, BodyT = any> = (
  ctx: Context<StateT, BodyT>,
  next: () => Promise<void>,
) => Promise<void> | void;
```

## Middleware Functions

### JSON Body Parser

```typescript
function json(options?: JsonOptions): Middleware;
```

**Options:**

```typescript
interface JsonOptions {
  limit?: number; // Max body size in bytes (default: 100KB)
  strict?: boolean; // Only parse application/json (default: true)
  reviver?: (key: string, value: any) => any;
}
```

### Fast JSON Parser

```typescript
function fastJson(options?: FastJsonOptions): Middleware;
```

**Options:**

```typescript
interface FastJsonOptions {
  limit?: number; // Max body size (default: 1MB)
  strict?: boolean; // Security validation (default: true)
  reviver?: (key: string, value: any) => any;
  streamThreshold?: number; // Streaming threshold (default: 64KB)
}
```

### Body Parser

```typescript
function bodyParser(options?: BodyParserOptions): Middleware;
```

**Options:**

```typescript
interface BodyParserOptions {
  limit?: number;
  strict?: boolean;
  multipart?: boolean;
  customParsers?: {
    multipart?: (ctx: Context, limit: number) => Promise<any>;
  };
}
```

### CORS

```typescript
function cors(options?: CORSOptions): Middleware;
```

**Options:**

```typescript
interface CORSOptions {
  origin?: string | string[] | ((origin: string | null) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}
```

### Request Logging

```typescript
function logger(options?: LoggerOptions): Middleware;
```

**Options:**

```typescript
interface LoggerOptions {
  level?: "info" | "warn" | "error";
  format?: "combined" | "common" | "dev" | "short" | "tiny" | "json";
  skip?: (ctx: Context) => boolean;
}
```

### Response Compression

```typescript
function compress(options?: CompressOptions): Middleware;
```

**Options:**

```typescript
interface CompressOptions {
  threshold?: number; // Min size to compress (default: 1KB)
  level?: number; // Compression level 1-9 (default: 6)
  types?: string[]; // Content types to compress
  encodings?: string[]; // Supported encodings
}
```

### Static File Serving

```typescript
function staticMiddleware(root: string, options?: StaticOptions): Middleware;
```

**Options:**

```typescript
interface StaticOptions {
  maxAge?: number; // Cache max age in ms
  immutable?: boolean; // Immutable caching
  index?: string; // Index file (default: index.html)
  extensions?: string[]; // Fallback extensions
}
```

### Session Management

```typescript
function session(options?: SessionOptions): Middleware;
```

**Options:**

```typescript
interface SessionOptions {
  name?: string;
  secret?: string;
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  store?: SessionStore;
}
```

**SessionStore Interface:**

```typescript
interface SessionStore {
  get(sid: string): Promise<any> | any;
  set(sid: string, session: any, maxAge?: number): Promise<void> | void;
  destroy(sid: string): Promise<void> | void;
}
```

### Basic Authentication

```typescript
function basicAuth(options?: BasicAuthOptions): Middleware;
```

**Options:**

```typescript
interface BasicAuthOptions {
  users?: Record<string, string>;
  realm?: string;
  skip?: (ctx: Context) => boolean;
  customAuth?: (
    username: string,
    password: string,
  ) => Promise<boolean> | boolean;
}
```

### Rate Limiting

```typescript
function rateLimit(options?: RateLimitOptions): Middleware;
```

**Options:**

```typescript
interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  statusCode?: number;
  skip?: (ctx: Context) => boolean;
  keyGenerator?: (ctx: Context) => string;
  store?: RateLimitStore;
}
```

**RateLimitStore Interface:**

```typescript
interface RateLimitStore {
  get(key: string): Promise<number[] | undefined>;
  set(key: string, timestamps: number[]): Promise<void>;
  delete(key: string): Promise<void>;
  cleanup?(): Promise<void>;
}
```

### Security Headers

```typescript
function security(options?: SecurityHeadersOptions): Middleware;
```

**Options:**

```typescript
interface SecurityHeadersOptions {
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
```

### HTTPS Enforcement

```typescript
function enforceHTTPS(options?: HTTPSEnforceOptions): Middleware;
```

**Options:**

```typescript
interface HTTPSEnforceOptions {
  redirectPort?: number;
  redirectStatus?: 301 | 302;
  skip?: (ctx: Context) => boolean;
}
```

### Input Validation

```typescript
function validateInput(options?: ValidationOptions): Middleware;
```

**Options:**

```typescript
interface ValidationOptions {
  sanitizeQuery?: boolean;
  sanitizeBody?: boolean;
  sanitizeHeaders?: boolean;
  customSanitizer?: (input: string) => string;
  skip?: (ctx: Context) => boolean;
}
```

### Error Handler

```typescript
function errorHandler(options?: ErrorHandlerOptions): Middleware;
```

**Options:**

```typescript
interface ErrorHandlerOptions {
  log?: boolean | ((err: any, ctx: Context) => void);
  html?: boolean | ((err: any, ctx: Context) => string);
  json?: boolean | ((err: any, ctx: Context) => object);
}
```

## Routing Functions

### File-Based Routing

```typescript
function createFileRouter(options?: FileRouteOptions): Promise<Router>;
```

**Options:**

```typescript
interface FileRouteOptions {
  routesDir?: string;
  basePath?: string;
  fileExtensions?: string[];
}
```

## Utility Functions

### Cookie Parser

```typescript
function cookieParser(options?: CookieParserOptions): Middleware;
```

**Options:**

```typescript
interface CookieParserOptions {
  secret?: string | string[];
}
```

### Compose Middleware

```typescript
function compose(middleware: Middleware[]): Middleware;
```

## Type Definitions

### Generic Context Types

```typescript
// Context with typed state and body
Context<StateType, BodyType>;

// Example: User creation endpoint
router.post("/users", async (ctx: Context<{}, CreateUserBody>) => {
  const user = ctx.request.body; // Fully typed
  // ...
});
```

### HTTP Methods

```typescript
type HTTPMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";
```

### Route Definition

```typescript
interface Route {
  path: string;
  method: string;
  handler: Middleware;
  keys: string[];
  regexp: RegExp;
}
```

## Error Classes

### Framework Errors

```typescript
class RustnorError extends Error {
  constructor(message: string, statusCode?: number);
  statusCode: number;
}
```

## Constants

### Default Values

```typescript
// JSON parser defaults
const DEFAULT_JSON_LIMIT = 102400; // 100KB

// Compression defaults
const DEFAULT_COMPRESSION_LEVEL = 6;
const DEFAULT_COMPRESSION_THRESHOLD = 1024; // 1KB

// Rate limiting defaults
const DEFAULT_WINDOW_MS = 60000; // 1 minute
const DEFAULT_MAX_REQUESTS = 5;

// Session defaults
const DEFAULT_SESSION_MAX_AGE = 86400000; // 24 hours
const DEFAULT_SESSION_NAME = "rustnor.sid";
```

## Environment Variables

### Configuration

- `NODE_ENV` - Environment mode ("development", "production")
- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: "localhost")

### Performance Tuning

- `UV_THREADPOOL_SIZE` - Libuv thread pool size
- `NODE_OPTIONS` - Node.js runtime options

## Events

### Application Events

```typescript
app.on("error", (err: Error, ctx: Context) => {
  // Handle application errors
});

app.on("listening", () => {
  // Server started
});
```

### Request Events

```typescript
// In middleware
app.use((ctx, next) => {
  ctx.req.on("data", (chunk) => {
    // Handle request data
  });

  ctx.req.on("end", () => {
    // Request complete
  });

  return next();
});
```

## Examples

### Complete Application Setup

```typescript
import {
  App,
  json,
  cors,
  logger,
  compress,
  session,
  rateLimit,
  security,
  Router,
} from "rustnor";

const app = new App();
const router = new Router();

// Security middleware
app.use(security());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
  }),
);

// Performance middleware
app.use(compress());
app.use(logger({ format: "dev" }));

// Request processing
app.use(json());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
  }),
);

// Session management
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-secret",
    maxAge: 24 * 60 * 60 * 1000,
  }),
);

// Routes
router.get("/health", (ctx) => {
  ctx.response.json({ status: "ok", timestamp: new Date() });
});

router.get("/api/users", (ctx) => {
  // Implementation
});

app.use(router.getRoutes());

// Error handling
app.onError((err, ctx) => {
  console.error("Application error:", err);
  ctx.response.status(500).json({
    error: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

export default app;
```

This API reference covers all public interfaces. For internal implementation details, see the source code.
