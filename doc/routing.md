# Routing

Rustnor provides flexible routing capabilities with support for traditional route definitions and file-based routing inspired by Next.js.

## Traditional Routing

Use the `Router` class for programmatic route definitions.

```typescript
import { App } from "rustnor";
import { Router } from "rustnor/router";

const app = new App();
const router = new Router();

// Basic routes
router.get("/", (ctx) => {
  ctx.response.json({ message: "Hello World!" });
});

router.post("/users", (ctx) => {
  const user = ctx.request.body;
  ctx.response.status(201).json({ created: user });
});

// Register router middleware
app.use(router.getRoutes());
```

### Route Methods

```typescript
router.get(path, handler);
router.post(path, handler);
router.put(path, handler);
router.patch(path, handler);
router.delete(path, handler);
router.head(path, handler);
router.options(path, handler);
```

### Route Parameters

Capture dynamic segments in URLs:

```typescript
// Single parameter
router.get("/users/:id", (ctx) => {
  const userId = ctx.params.id;
  ctx.response.json({ userId });
});

// Multiple parameters
router.get("/users/:userId/posts/:postId", (ctx) => {
  const { userId, postId } = ctx.params;
  ctx.response.json({ userId, postId });
});

// Optional parameters
router.get("/users/:id?", (ctx) => {
  const userId = ctx.params.id || "default";
  ctx.response.json({ userId });
});
```

### Query Parameters

Access URL query strings:

```typescript
router.get("/search", (ctx) => {
  const { q, limit, sort } = ctx.query;
  ctx.response.json({
    query: q,
    limit: limit || 10,
    sort: sort || "relevance",
  });
});

// URL: /search?q=rustnor&limit=20&sort=date
```

### Route Handlers

Route handlers receive the `Context` object and can be async:

```typescript
router.get("/async", async (ctx) => {
  const data = await fetchSomeData();
  ctx.response.json(data);
});

router.post("/users", (ctx) => {
  const user = ctx.request.body;

  // Synchronous response
  ctx.response.status(201).json({
    message: "User created",
    user,
  });
});
```

### Middleware Integration

Routes can use middleware:

```typescript
const authRequired = (ctx, next) => {
  if (!ctx.state.user) {
    ctx.response.status(401).json({ error: "Unauthorized" });
    return;
  }
  return next();
};

router.get("/protected", authRequired, (ctx) => {
  ctx.response.json({ secret: "protected data" });
});
```

## File-Based Routing

Inspired by Next.js API routes, file-based routing automatically maps files to endpoints.

### Directory Structure

```
routes/
├── index.ts              -> GET /
├── users/
│   ├── index.ts          -> GET /users, POST /users
│   └── [id].ts           -> GET /users/:id, PUT /users/:id, DELETE /users/:id
├── api/
│   └── health.ts         -> GET /api/health
└── blog/
    └── [slug].ts         -> GET /blog/:slug
```

### Route Files

**Default Export (All Methods):**

```typescript
// routes/index.ts
import { Context } from "rustnor";

export default async function handler(ctx: Context) {
  ctx.response.json({ message: "Hello World!" });
}
```

**Named Exports (Specific Methods):**

```typescript
// routes/users/index.ts
import { Context } from "rustnor";

export async function get(ctx: Context) {
  const users = await getUsersFromDB();
  ctx.response.json({ users });
}

export async function post(ctx: Context) {
  const userData = ctx.request.body;
  const newUser = await createUser(userData);
  ctx.response.status(201).json({ user: newUser });
}
```

**Dynamic Routes:**

```typescript
// routes/users/[id].ts
import { Context } from "rustnor";

export async function get(ctx: Context) {
  const userId = ctx.params.id;
  const user = await getUserById(userId);

  if (!user) {
    ctx.response.status(404).json({ error: "User not found" });
    return;
  }

  ctx.response.json({ user });
}

export async function put(ctx: Context) {
  const userId = ctx.params.id;
  const updates = ctx.request.body;
  const updatedUser = await updateUser(userId, updates);
  ctx.response.json({ user: updatedUser });
}

export async function delete(ctx: Context) {
  const userId = ctx.params.id;
  await deleteUser(userId);
  ctx.response.status(204).send("");
}
```

### Setup

```typescript
import { App, createFileRouter } from "rustnor";

const app = new App();

async function startServer() {
  // Load routes from files
  const router = await createFileRouter({
    routesDir: "routes", // Directory containing route files
    basePath: "", // Optional base path
    fileExtensions: [".ts", ".js"], // Supported extensions
  });

  app.use(router.getRoutes());

  app.listen(3000, () => {
    console.log("Server with file-based routes running!");
  });
}

startServer();
```

### Advanced File-Based Routing

**Nested Routes:**

```
routes/
└── api/
    └── v1/
        └── users/
            ├── index.ts      -> GET /api/v1/users
            └── [id]/
                └── posts.ts  -> GET /api/v1/users/:id/posts
```

**Catch-All Routes:**

```typescript
// routes/[...slug].ts
export default async function handler(ctx: Context) {
  const slug = ctx.params.slug; // Array of path segments
  ctx.response.json({ slug });
}
// Matches: /any/path/here
```

**Optional Catch-All:**

```typescript
// routes/[[...slug]].ts
export default async function handler(ctx: Context) {
  const slug = ctx.params.slug || []; // Optional array
  ctx.response.json({ slug });
}
// Matches: / and /any/path/here
```

## Route Groups and Organization

### Grouping Routes

```typescript
const userRoutes = () => {
  const router = new Router();

  router.get("/", getUsers);
  router.post("/", createUser);
  router.get("/:id", getUser);
  router.put("/:id", updateUser);
  router.delete("/:id", deleteUser);

  return router;
};

// Mount under /api/users
app.use("/api/users", userRoutes().getRoutes());
```

### Route Prefixes

```typescript
const apiRouter = new Router();

// All routes in this router will be prefixed
apiRouter.get("/health", healthCheck);
apiRouter.get("/users", getUsers);

// Mount at /api
app.use("/api", apiRouter.getRoutes());
```

## Error Handling in Routes

```typescript
router.get("/users/:id", async (ctx) => {
  try {
    const userId = ctx.params.id;
    const user = await getUserById(userId);

    if (!user) {
      ctx.response.status(404).json({ error: "User not found" });
      return;
    }

    ctx.response.json({ user });
  } catch (error) {
    console.error("Database error:", error);
    ctx.response.status(500).json({ error: "Internal server error" });
  }
});
```

## Route Validation

```typescript
import { validateInput } from "rustnor";

router.post("/users", validateInput(), async (ctx) => {
  const { name, email } = ctx.request.body;

  // Basic validation
  if (!name || !email) {
    ctx.response.status(400).json({ error: "Name and email required" });
    return;
  }

  // Create user...
});
```

## Performance Considerations

- **Route Order**: More specific routes should come before general ones
- **Regex Compilation**: Routes are compiled to regex once at startup
- **Parameter Parsing**: Parameters are extracted efficiently during matching
- **File-Based Routing**: Routes are scanned once at startup

## Examples

### REST API

```typescript
const router = new Router();

// CRUD operations
router.get("/posts", getPosts);
router.post("/posts", createPost);
router.get("/posts/:id", getPost);
router.put("/posts/:id", updatePost);
router.delete("/posts/:id", deletePost);

// Nested resources
router.get("/posts/:postId/comments", getPostComments);
router.post("/posts/:postId/comments", createComment);
```

### API Versioning

```typescript
// routes/v1/users.ts
export async function get(ctx: Context) {
  // V1 implementation
}

// routes/v2/users.ts
export async function get(ctx: Context) {
  // V2 implementation with breaking changes
}
```

### Middleware per Route Group

```typescript
const protectedRouter = new Router();

// Apply auth to all routes in this router
protectedRouter.use(authMiddleware);
protectedRouter.get("/profile", getProfile);
protectedRouter.put("/profile", updateProfile);

app.use("/api", protectedRouter.getRoutes());
```
