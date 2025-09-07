# Rustnor

A modern, lightweight, and fast Node.js web framework inspired by Koa, built with TypeScript for a great developer experience.

## Features

- **TypeScript First:** Clean, generic-powered, and type-safe API.
- **Modern Middleware:** Uses an async/await-based middleware pipeline.
- **Advanced Router:** Supports route parameters and query string parsing out-of-the-box.
- **Request Body Parsing:** Includes a built-in middleware for parsing JSON request bodies.
- **Convenient Response Helpers:** Simple and expressive API for sending responses (e.g., `ctx.response.json()`).
- **Extensible Error Handling:** Provides a global `onError` hook for centralized error management.
- **Static File Serving:** Easily serve static assets like HTML, CSS, and images from a directory.
- **CORS Support:** Built-in CORS middleware with flexible configuration options.
- **Request Logging:** Comprehensive logging middleware with multiple formats (combined, common, dev, etc.).
- **Response Compression:** Automatic gzip/deflate compression for better performance.
- **Session Management:** Cookie-based session storage with customizable stores.
- **Basic Authentication:** Simple HTTP Basic authentication middleware.
- **Hot Reload:** Automatic server restart on file changes for faster development.
- **File-Based Routing:** Next.js-style API routes with automatic file-to-route mapping.

## Installation

```bash
npm install rustnor
```

## Getting Started

Here is a complete example of a simple server that demonstrates the core features of Rustnor.

```typescript
// Imports are now centralized from the package root
import { App, json, Context, staticMiddleware } from "rustnor";
import { Router } from "rustnor/router";

// 1. Initialize the application
const app = new App();
const router = new Router();

// 2. Register a custom error handler
app.onError((err: any, ctx: Context) => {
  console.error("Server Error:", err);
  ctx.response.status(500).json({ error: "An unexpected error occurred." });
});

// 3. Use middleware
// Serve static files from the 'public' directory
app.use(staticMiddleware("examples/public"));

// The JSON middleware parses request bodies with "Content-Type: application/json"
app.use(json());

// 4. Define your routes
router.get("/", async (ctx) => {
  ctx.response.send(
    "Welcome! Try GET /user/42?lang=en or POST to /user with a JSON body.",
  );
});

router.get("/user/:id", async (ctx) => {
  const userId = ctx.params?.id; // from /:id
  const lang = ctx.query?.lang; // from ?lang=en

  ctx.response.json({
    message: `User details for ${userId}`,
    language: lang || "not specified",
  });
});

router.post("/user", async (ctx) => {
  const user = ctx.request.body;

  ctx.response.status(201).json({
    message: "User created successfully",
    received_user: user,
  });
});

// 5. Register the router middleware
app.use(router.getRoutes());

// 6. Start the server
app.listen(8080, () => {
  console.log("Server listening on port 8080");
});
```

## API Reference

### Application (`App`)

- `new App()`: Creates a new application instance.
- `app.use(middleware)`: Registers a middleware function.
- `app.listen(port, callback)`: Starts the HTTP server.
- `app.onError(handler)`: Registers a global error handler function. The handler receives `(err, ctx)`.

### Context (`ctx`)

The Context object encapsulates the request and response. It is now generic to provide strong type-safety.

`Context<StateT, BodyT>`

- `StateT`: Defines the type for `ctx.state`, an object for sharing data between middleware. Defaults to `{}`.
- `BodyT`: Defines the type for `ctx.request.body`. Defaults to `any`.

- `ctx.request`: The framework's `Request` object, typed with `BodyT`.
- `ctx.response`: The framework's `Response` object.
- `ctx.query`: An object containing parsed query string parameters.
- `ctx.params`: An object containing named route parameters.
- `ctx.state`: An object for sharing data between middleware, typed with `StateT`.

#### Typed Context Example

```typescript
import { Context } from "rustnor";

// 1. Define the shape of your data
interface CreateUserBody {
  name: string;
  email: string;
}

// 2. Apply the type to the Context in your route handler
router.post("/user", async (ctx: Context<{}, CreateUserBody>) => {
  // ctx.request.body is now fully typed!
  const name = ctx.request.body.name;
  const email = ctx.request.body.email;

  // ... create user ...
});
```

### Request (`ctx.request`)

- `ctx.request.body`: The parsed request body. Its type is controlled by the `BodyT` generic on the `Context`.

### Response (`ctx.response`)

- `ctx.response.status(code)`: Sets the HTTP status code.
- `ctx.response.send(body)`: Sets the response body.
- `ctx.response.json(body)`: Sends a JSON response.
- `ctx.response.setHeader(name, value)`: Sets a response header.

### Static File Serving (`staticMiddleware`)

Serves static files from a specified directory. This middleware should typically be placed early in your middleware chain.

- `staticMiddleware(root: string)`: Returns a middleware function that serves files from the `root` directory.

```typescript
import { App, staticMiddleware } from "rustnor";

const app = new App();

// Serve files from the 'public' directory
app.use(staticMiddleware("examples/public"));

// ... your other middleware and routes ...
```

## Advanced Features

### CORS Middleware (`cors`)

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
- `allowedHeaders`: Allowed request headers
- `exposedHeaders`: Headers exposed to client
- `credentials`: Allow credentials
- `maxAge`: Preflight cache duration

### Logging Middleware (`logger`)

Request logging with multiple output formats.

```typescript
import { App, logger } from "rustnor";

const app = new App();

app.use(
  logger({
    level: "info",
    format: "dev", // "combined", "common", "dev", "short", "tiny"
    skip: (ctx) => ctx.req.url?.includes("/health"),
  }),
);
```

### Compression Middleware (`compress`)

Automatic response compression using gzip/deflate.

```typescript
import { App, compress } from "rustnor";

const app = new App();

app.use(
  compress({
    threshold: 1024, // Minimum size to compress (bytes)
    level: 6, // Compression level (1-9)
    types: ["text/plain", "application/json"], // Content types to compress
  }),
);
```

### Session Middleware (`session`)

Cookie-based session management.

```typescript
import { App, session } from "rustnor";

const app = new App();

app.use(
  session({
    name: "myapp.sid",
    secret: "your-secret-key",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    store: new MemoryStore(), // Custom store implementation
  }),
);

// Use session in routes
router.get("/", async (ctx) => {
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

// Access user info
router.get("/profile", async (ctx) => {
  ctx.response.json({ user: ctx.state.user });
});
```

## Examples

### Simple Server

```bash
npm run dev:example
```

### Advanced Server (with all middleware)

```bash
npm run dev:advanced
```

### Hot Reload Development

```bash
# Simple server with hot reload
npm run dev:hot

# Advanced server with hot reload
npm run dev:hot-advanced
```

## Hot Reload (`enableHotReload`)

Automatic server restart when files change during development.

```typescript
import { App, enableHotReload } from "rustnor";

const app = new App();
// ... configure your app ...

if (require.main === module) {
  const server = app.listen(8080, () => {
    console.log("Server running on port 8080");
  });

  // Enable hot reload in development
  if (process.env.NODE_ENV !== "production") {
    enableHotReload(server, {
      watchPaths: ["packages/**/*.ts", "examples/**/*.ts"],
      ignored: ["node_modules/**", "**/*.test.ts"],
      verbose: true,
      delay: 300, // Debounce delay in ms
    });
  }
}
```

**Options:**

- `watchPaths`: Array of glob patterns to watch for changes
- `ignored`: Array of patterns to ignore
- `delay`: Debounce delay before restart (ms)
- `verbose`: Enable detailed logging

## File-Based Routing (`createFileRouter`)

Next.js-style API routes with automatic file-to-route mapping. Create a `routes/` directory and files will automatically become API endpoints.

### Directory Structure

```
routes/
├── index.ts              -> GET /
├── users/
│   ├── index.ts          -> GET /users, POST /users
│   └── [id].ts           -> GET /users/:id, PUT /users/:id, DELETE /users/:id
└── api/
    └── health.ts         -> GET /api/health
```

### Route Files

**Default Export (All Methods):**

```typescript
// routes/index.ts
import { Context } from "../packages/core";

export default async function handler(ctx: Context) {
  ctx.response.json({ message: "Hello World!" });
}
```

**Named Exports (Specific Methods):**

```typescript
// routes/users/index.ts
import { Context } from "../../packages/core";

export async function get(ctx: Context) {
  ctx.response.json({ users: [] });
}

export async function post(ctx: Context) {
  const user = ctx.request.body;
  ctx.response.status(201).json({ created: user });
}
```

**Dynamic Routes:**

```typescript
// routes/users/[id].ts
import { Context } from "../../packages/core";

export async function get(ctx: Context) {
  const id = ctx.params.id;
  ctx.response.json({ user: { id } });
}
```

### Usage

```typescript
import { App, createFileRouter } from "rustnor";

const app = new App();

async function startServer() {
  // Load routes from files
  const router = await createFileRouter({
    routesDir: "routes",
    basePath: "", // Optional base path
  });

  app.use(router.getRoutes());

  app.listen(8080, () => {
    console.log("Server running with file-based routes!");
  });
}

startServer();
```

**Options:**

- `routesDir`: Directory containing route files (default: "routes")
- `basePath`: Base path to prepend to all routes
- `fileExtensions`: Supported file extensions (default: [".ts", ".js"])

## License

This project is licensed under the ISC License.
