# Middleware

NorthernJS provides a rich set of built-in middleware to handle common web application needs. All middleware follows the same async/await pattern and can be composed together.

## Core Concepts

Middleware in NorthernJS are functions that have access to the `Context` object and can:

- Modify the request/response
- Call the next middleware in the chain
- End the request-response cycle
- Handle errors

```typescript
type Middleware = (ctx: Context, next: () => Promise<void>) => Promise<void>;
```

## Built-in Middleware

### JSON Body Parser (`json`)

Parses JSON request bodies and makes them available as `ctx.request.body`.

```typescript
import { App, json } from "northernjs";

const app = new App();
app.use(json()); // Parses application/json requests

router.post("/users", (ctx) => {
  const user = ctx.request.body; // Parsed JSON object
  ctx.response.json({ received: user });
});
```

**Options:**

- `limit` (number): Maximum body size in bytes (default: 100KB)
- `strict` (boolean): Only parse `application/json` content type
- `reviver` (function): JSON.parse reviver function

### CORS (`cors`)

Enable Cross-Origin Resource Sharing with flexible configuration.

```typescript
import { App, cors } from "northernjs";

const app = new App();
app.use(
  cors({
    origin: ["http://localhost:3000", "https://myapp.com"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    maxAge: 86400,
  }),
);
```

**Options:**

- `origin`: Allowed origins (string, array, or function)
- `methods`: Allowed HTTP methods
- `allowedHeaders`: Request headers to allow
- `exposedHeaders`: Response headers to expose
- `credentials`: Allow credentials
- `maxAge`: Preflight cache duration

### Request Logging (`logger`)

Comprehensive request logging with multiple output formats.

```typescript
import { App, logger } from "northernjs";

const app = new App();
app.use(
  logger({
    level: "info", // error, warn, info
    format: "dev", // combined, common, dev, short, tiny, json
    skip: (ctx) => ctx.req.url?.includes("/health"),
  }),
);
```

**Available Formats:**

- `combined`: Apache combined log format
- `common`: Apache common log format
- `dev`: Colored development format
- `short`: Minimal format
- `tiny`: Ultra-minimal format
- `json`: Structured JSON output

### Response Compression (`compress`)

Automatic gzip/deflate compression for better performance.

```typescript
import { App, compress } from "northernjs";

const app = new App();
app.use(
  compress({
    threshold: 1024, // Minimum size to compress (bytes)
    level: 6, // Compression level (1-9)
    types: ["text/plain", "application/json", "text/html"],
  }),
);
```

### Static File Serving (`staticMiddleware`)

Serve static files from a directory.

```typescript
import { App, staticMiddleware } from "northernjs";

const app = new App();
app.use(staticMiddleware("public")); // Serve files from ./public/
```

### Session Management (`session`)

Cookie-based session storage with customizable stores.

```typescript
import { App, session, MemoryStore } from "northernjs";

const app = new App();
app.use(
  session({
    name: "myapp.sid",
    secret: "your-secret-key",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    store: new MemoryStore(), // or RedisStore, etc.
  }),
);

router.get("/visit", (ctx) => {
  const count = ctx.state.session.visits || 0;
  ctx.state.session.visits = count + 1;
  ctx.response.json({ visits: ctx.state.session.visits });
});
```

> **⚠️ Production Warning:** The built-in `MemoryStore` is designed for development and testing only. All session data will be lost when the server restarts. For production use, you must implement a persistent session store (Redis, MongoDB, PostgreSQL, etc.) by creating a class that implements the `SessionStore` interface.
>
> **Example Redis Store:**
>
> ```typescript
> import { Redis } from "ioredis";
>
> class RedisStore implements SessionStore {
>   constructor(private redis: Redis) {}
>
>   async get(sid: string): Promise<any> {
>     const data = await this.redis.get(`session:${sid}`);
>     return data ? JSON.parse(data) : null;
>   }
>
>   async set(sid: string, session: any, maxAge?: number): Promise<void> {
>     await this.redis.setex(
>       `session:${sid}`,
>       maxAge / 1000,
>       JSON.stringify(session),
>     );
>   }
>
>   async destroy(sid: string): Promise<void> {
>     await this.redis.del(`session:${sid}`);
>   }
> }
> ```

### Basic Authentication (`basicAuth`)

HTTP Basic authentication middleware for development and testing.

> **⚠️ Production Warning:** This basic auth implementation uses simple SHA256 hashing without salt and is intended for development/testing only. It is NOT secure for production use. For production applications, implement proper authentication with salted password hashing (bcrypt, argon2) and consider using JWT, OAuth, or other secure authentication methods.

```typescript
import { App, basicAuth, createUsers } from "northernjs";

const app = new App();

// Development/Testing only - uses pre-hashed passwords
const users = createUsers({
  admin: "password123",
  user: "secret456",
});

app.use(
  basicAuth({
    hashedUsers: users, // Use pre-hashed passwords only
    realm: "Admin Area",
    skip: (ctx) => ctx.req.url === "/public",
    // For production, use customAuth instead:
    // customAuth: async (username, password) => {
    //   // Implement proper authentication logic here
    //   return await verifyUser(username, password);
    // }
  }),
);

router.get("/admin", (ctx) => {
  ctx.response.json({ user: ctx.state.user });
});
```

### Rate Limiting (`rateLimit`)

Prevent abuse with configurable request limits.

```typescript
import { App, rateLimit } from "northernjs";

const app = new App();
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: "Too many requests",
    statusCode: 429,
  }),
);
```

**Options:**

- `windowMs`: Time window in milliseconds
- `max`: Maximum requests per window
- `store`: Custom store (defaults to memory)
- `keyGenerator`: Function to generate keys
- `skip`: Function to skip rate limiting

### Security Headers (`security`)

Set security headers to protect against common web vulnerabilities.

```typescript
import { App, security } from "northernjs";

const app = new App();
app.use(
  security({
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'"],
    },
  }),
);
```

**Available Headers:**

- `X-Frame-Options`
- `X-Content-Type-Options`
- `X-XSS-Protection`
- `Strict-Transport-Security`
- `Content-Security-Policy`
- `Referrer-Policy`
- `Permissions-Policy`

### HTTPS Enforcement (`enforceHTTPS`)

Redirect HTTP requests to HTTPS.

```typescript
import { App, enforceHTTPS } from "northernjs";

const app = new App();
app.use(
  enforceHTTPS({
    redirectPort: 443,
    redirectStatus: 301, // or 302
    skip: (ctx) => process.env.NODE_ENV === "development",
  }),
);
```

### Input Validation (`validateInput`)

Sanitize and validate user inputs to prevent XSS and injection attacks.

```typescript
import { App, validateInput } from "northernjs";

const app = new App();
app.use(
  validateInput({
    sanitizeQuery: true,
    sanitizeBody: true,
    sanitizeHeaders: false,
  }),
);
```

### Error Handler (`errorHandler`)

Global error handling middleware.

```typescript
import { App, errorHandler } from "northernjs";

const app = new App();
app.use(
  errorHandler({
    log: true,
    html: (err, ctx) => `<h1>Error ${err.status}</h1><p>${err.message}</p>`,
    json: (err, ctx) => ({ error: err.message, status: err.status }),
  }),
);
```

## Custom Middleware

Create your own middleware by following this pattern:

```typescript
import { Middleware } from "northernjs";

const myMiddleware: Middleware = async (ctx, next) => {
  // Do something before
  console.log(`${ctx.req.method} ${ctx.req.url}`);

  await next(); // Call next middleware

  // Do something after
  console.log(`Response status: ${ctx.response.statusCode}`);
};

app.use(myMiddleware);
```

## Middleware Order

The order of middleware registration matters:

```typescript
const app = new App();

// 1. Security first
app.use(security());
app.use(cors());

// 2. Request processing
app.use(logger());
app.use(json());

// 3. Rate limiting (after parsing)
app.use(rateLimit());

// 4. Routes
app.use(router.getRoutes());

// 5. Error handling (last)
app.use(errorHandler());
```

## Conditional Middleware

Use functions to conditionally apply middleware:

```typescript
app.use((ctx, next) => {
  if (ctx.req.url?.startsWith("/api")) {
    return cors()(ctx, next);
  }
  return next();
});
```

## Composing Middleware

Combine multiple middleware into one:

```typescript
import { compose } from "northernjs/utils";

const apiMiddleware = compose([cors(), json(), rateLimit(), validateInput()]);

app.use(apiMiddleware);
```
