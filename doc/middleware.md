# Middleware

Rustnor provides a rich set of built-in middleware to handle common web application needs. All middleware follows the same async/await pattern and can be composed together.

## Core Concepts

Middleware in Rustnor are functions that have access to the `Context` object and can:

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
import { App, json } from "rustnor";

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

### Fast JSON Parser (`fastJson`)

High-performance JSON parser optimized for large payloads with streaming support.

```typescript
import { App, fastJson } from "rustnor";

const app = new App();
app.use(
  fastJson({
    limit: 1024 * 1024, // 1MB limit
    streamThreshold: 64 * 1024, // Use streaming for >64KB
    strict: true, // Security validation
  }),
);
```

**Performance Benefits:**

- 47-52% faster than standard JSON parsing
- Memory-efficient streaming for large payloads
- Built-in security validations

### Body Parser (`bodyParser`)

Advanced body parser supporting JSON, form data, and multipart uploads.

```typescript
import { App, bodyParser } from "rustnor";

const app = new App();
app.use(
  bodyParser({
    limit: 1024 * 100, // 100KB
    multipart: true, // Enable file uploads
    strict: false, // Allow non-JSON content types
  }),
);
```

### CORS (`cors`)

Enable Cross-Origin Resource Sharing with flexible configuration.

```typescript
import { App, cors } from "rustnor";

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
import { App, logger } from "rustnor";

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
import { App, compress } from "rustnor";

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
import { App, staticMiddleware } from "rustnor";

const app = new App();
app.use(staticMiddleware("public")); // Serve files from ./public/
```

### Session Management (`session`)

Cookie-based session storage with customizable stores.

```typescript
import { App, session, MemoryStore } from "rustnor";

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

### Basic Authentication (`basicAuth`)

HTTP Basic authentication middleware.

```typescript
import { App, basicAuth } from "rustnor";

const app = new App();
app.use(
  basicAuth({
    users: { admin: "password123" },
    realm: "Admin Area",
    skip: (ctx) => ctx.req.url === "/public",
  }),
);

router.get("/admin", (ctx) => {
  ctx.response.json({ user: ctx.state.user });
});
```

### Rate Limiting (`rateLimit`)

Prevent abuse with configurable request limits.

```typescript
import { App, rateLimit } from "rustnor";

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
import { App, security } from "rustnor";

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
import { App, enforceHTTPS } from "rustnor";

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
import { App, validateInput } from "rustnor";

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
import { App, errorHandler } from "rustnor";

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
import { Middleware } from "rustnor";

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
import { compose } from "rustnor/utils";

const apiMiddleware = compose([cors(), json(), rateLimit(), validateInput()]);

app.use(apiMiddleware);
```
