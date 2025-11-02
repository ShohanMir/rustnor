# Examples

This page contains complete examples demonstrating common patterns and use cases with NorthernJS.

## Running Examples

All examples can be found in the `examples/` directory. Run them with:

```bash
# Simple server
npm run dev:example

# Advanced server with all features
npm run dev:advanced

# File-based routing example
npm run dev:file-router
```

## Basic REST API

A complete REST API with CRUD operations:

```typescript
import { App, json, cors } from "northernjs";
import { Router } from "northernjs/router";

const app = new App();
const router = new Router();

// Middleware
app.use(cors());
app.use(json());

// In-memory storage (replace with real database)
let users = [
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Smith", email: "jane@example.com" },
];
let nextId = 3;

// Routes
router.get("/users", (ctx) => {
  ctx.response.json({ users });
});

router.get("/users/:id", (ctx) => {
  const id = parseInt(ctx.params.id);
  const user = users.find((u) => u.id === id);

  if (!user) {
    ctx.response.status(404).json({ error: "User not found" });
    return;
  }

  ctx.response.json({ user });
});

router.post("/users", (ctx) => {
  const { name, email } = ctx.request.body;

  if (!name || !email) {
    ctx.response.status(400).json({ error: "Name and email required" });
    return;
  }

  const newUser = { id: nextId++, name, email };
  users.push(newUser);

  ctx.response.status(201).json({ user: newUser });
});

router.put("/users/:id", (ctx) => {
  const id = parseInt(ctx.params.id);
  const { name, email } = ctx.request.body;
  const userIndex = users.findIndex((u) => u.id === id);

  if (userIndex === -1) {
    ctx.response.status(404).json({ error: "User not found" });
    return;
  }

  users[userIndex] = { ...users[userIndex], name, email };
  ctx.response.json({ user: users[userIndex] });
});

router.delete("/users/:id", (ctx) => {
  const id = parseInt(ctx.params.id);
  const userIndex = users.findIndex((u) => u.id === id);

  if (userIndex === -1) {
    ctx.response.status(404).json({ error: "User not found" });
    return;
  }

  users.splice(userIndex, 1);
  ctx.response.status(204).send("");
});

// Register routes
app.use(router.getRoutes());

// Error handling
app.onError((err, ctx) => {
  console.error("Error:", err);
  ctx.response.status(500).json({ error: "Internal server error" });
});

app.listen(3000, () => {
  console.log("REST API running on http://localhost:3000");
});
```

## Authentication & Sessions

Example with session-based authentication:

```typescript
import { App, json, session, basicAuth } from "northernjs";
import { Router } from "northernjs/router";

const app = new App();
const router = new Router();

// Session middleware
app.use(
  session({
    name: "myapp.sid",
    secret: "your-secret-key",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })
);

app.use(json());

// Mock user database
const users = [
  { id: 1, username: "admin", password: "admin123", role: "admin" },
  { id: 2, username: "user", password: "user123", role: "user" },
];

// Login route
router.post("/login", (ctx) => {
  const { username, password } = ctx.request.body;
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    ctx.response.status(401).json({ error: "Invalid credentials" });
    return;
  }

  // Store user in session
  ctx.state.session.user = {
    id: user.id,
    username: user.username,
    role: user.role,
  };

  ctx.response.json({
    message: "Login successful",
    user: ctx.state.session.user,
  });
});

// Logout route
router.post("/logout", (ctx) => {
  ctx.state.session.user = null;
  ctx.response.json({ message: "Logout successful" });
});

// Protected route middleware
const requireAuth = async (ctx, next) => {
  if (!ctx.state.session.user) {
    ctx.response.status(401).json({ error: "Authentication required" });
    return;
  }
  await next();
};

// Protected routes
router.get("/profile", requireAuth, (ctx) => {
  ctx.response.json({ user: ctx.state.session.user });
});

router.get("/admin", requireAuth, (ctx) => {
  if (ctx.state.session.user.role !== "admin") {
    ctx.response.status(403).json({ error: "Admin access required" });
    return;
  }

  ctx.response.json({ message: "Welcome to admin panel" });
});

// Register routes
app.use(router.getRoutes());

app.listen(3000, () => {
  console.log("Auth API running on http://localhost:3000");
});
```

## File Upload API

Handling multipart file uploads:

```typescript
import { App, bodyParser } from "northernjs";
import { Router } from "northernjs/router";
import * as fs from "fs";
import * as path from "path";

const app = new App();
const router = new Router();

// Body parser with multipart support
app.use(
  bodyParser({
    multipart: true,
    limit: 10 * 1024 * 1024, // 10MB
  })
);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Single file upload
router.post("/upload", (ctx) => {
  const { fields, files } = ctx.request.body;

  if (!files || !files.file) {
    ctx.response.status(400).json({ error: "No file uploaded" });
    return;
  }

  const file = Array.isArray(files.file) ? files.file[0] : files.file;
  const filename = `${Date.now()}-${file.filename}`;
  const filepath = path.join(uploadsDir, filename);

  // Move file to uploads directory
  fs.renameSync(file.data.path, filepath);

  ctx.response.json({
    message: "File uploaded successfully",
    filename,
    size: file.data.length,
    mimetype: file.mimetype,
  });
});

// Multiple file upload
router.post("/upload-multiple", (ctx) => {
  const { fields, files } = ctx.request.body;

  if (!files || !files.files) {
    ctx.response.status(400).json({ error: "No files uploaded" });
    return;
  }

  const uploadedFiles = [];
  const fileList = Array.isArray(files.files) ? files.files : [files.files];

  for (const file of fileList) {
    const filename = `${Date.now()}-${file.filename}`;
    const filepath = path.join(uploadsDir, filename);

    fs.renameSync(file.data.path, filepath);

    uploadedFiles.push({
      filename,
      originalName: file.filename,
      size: file.data.length,
      mimetype: file.mimetype,
    });
  }

  ctx.response.json({
    message: `${uploadedFiles.length} files uploaded`,
    files: uploadedFiles,
  });
});

// List uploaded files
router.get("/files", (ctx) => {
  const files = fs.readdirSync(uploadsDir).map((filename) => {
    const filepath = path.join(uploadsDir, filename);
    const stats = fs.statSync(filepath);

    return {
      filename,
      size: stats.size,
      uploadedAt: stats.mtime,
    };
  });

  ctx.response.json({ files });
});

// Download file
router.get("/files/:filename", (ctx) => {
  const filename = ctx.params.filename;
  const filepath = path.join(uploadsDir, filename);

  if (!fs.existsSync(filepath)) {
    ctx.response.status(404).json({ error: "File not found" });
    return;
  }

  ctx.response.setHeader("Content-Type", "application/octet-stream");
  ctx.response.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`
  );
  ctx.response.body = fs.createReadStream(filepath);
});

app.use(router.getRoutes());

app.listen(3000, () => {
  console.log("File upload API running on http://localhost:3000");
});
```

## Real-time Chat API

WebSocket-like functionality using Server-Sent Events:

```typescript
import { App, json, cors } from "northernjs";
import { Router } from "northernjs/router";

const app = new App();
const router = new Router();

app.use(cors());
app.use(json());

// In-memory message store
let messages = [];
let clients = [];

// Get recent messages
router.get("/messages", (ctx) => {
  const limit = parseInt(ctx.query.limit) || 50;
  const recentMessages = messages.slice(-limit);

  ctx.response.json({ messages: recentMessages });
});

// Post new message
router.post("/messages", (ctx) => {
  const { username, text } = ctx.request.body;

  if (!username || !text) {
    ctx.response.status(400).json({ error: "Username and text required" });
    return;
  }

  const message = {
    id: Date.now(),
    username,
    text,
    timestamp: new Date().toISOString(),
  };

  messages.push(message);

  // Keep only last 1000 messages
  if (messages.length > 1000) {
    messages = messages.slice(-1000);
  }

  // Broadcast to all connected clients
  clients.forEach((client) => {
    try {
      client.res.write(`data: ${JSON.stringify(message)}\n\n`);
    } catch (error) {
      // Client disconnected
      clients = clients.filter((c) => c !== client);
    }
  });

  ctx.response.status(201).json({ message });
});

// Server-Sent Events endpoint
router.get("/events", (ctx) => {
  // Set SSE headers
  ctx.response.setHeader("Content-Type", "text/event-stream");
  ctx.response.setHeader("Cache-Control", "no-cache");
  ctx.response.setHeader("Connection", "keep-alive");
  ctx.response.setHeader("Access-Control-Allow-Origin", "*");

  // Send initial connection message
  ctx.res.write("data: " + JSON.stringify({ type: "connected" }) + "\n\n");

  // Add client to list
  const client = { res: ctx.res };
  clients.push(client);

  // Remove client on disconnect
  ctx.req.on("close", () => {
    clients = clients.filter((c) => c !== client);
  });

  // Keep connection alive
  const keepAlive = setInterval(() => {
    try {
      ctx.res.write("data: " + JSON.stringify({ type: "ping" }) + "\n\n");
    } catch (error) {
      clearInterval(keepAlive);
      clients = clients.filter((c) => c !== client);
    }
  }, 30000);

  ctx.req.on("close", () => {
    clearInterval(keepAlive);
  });
});

app.use(router.getRoutes());

app.listen(3000, () => {
  console.log("Chat API running on http://localhost:3000");
});
```

## GraphQL API

Basic GraphQL integration:

```typescript
import { App, json } from "northernjs";
import { Router } from "northernjs/router";
import { graphql, buildSchema } from "graphql";

const app = new App();
const router = new Router();

app.use(json());

// GraphQL schema
const schema = buildSchema(`
  type User {
    id: ID!
    name: String!
    email: String!
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
  }

  type Mutation {
    createUser(name: String!, email: String!): User!
  }
`);

// Mock data
let users = [
  { id: "1", name: "John Doe", email: "john@example.com" },
  { id: "2", name: "Jane Smith", email: "jane@example.com" },
];

// Resolvers
const root = {
  users: () => users,
  user: ({ id }) => users.find((user) => user.id === id),
  createUser: ({ name, email }) => {
    const newUser = {
      id: String(users.length + 1),
      name,
      email,
    };
    users.push(newUser);
    return newUser;
  },
};

// GraphQL endpoint
router.post("/graphql", async (ctx) => {
  const { query, variables } = ctx.request.body;

  try {
    const result = await graphql({
      schema,
      source: query,
      rootValue: root,
      variableValues: variables,
    });

    ctx.response.json(result);
  } catch (error) {
    ctx.response.status(400).json({ error: error.message });
  }
});

// GraphiQL interface (simple HTML page)
router.get("/graphiql", (ctx) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>GraphiQL</title>
      <link rel="stylesheet" href="https://unpkg.com/graphiql/graphiql.min.css" />
    </head>
    <body style="margin: 0;">
      <div id="graphiql" style="height: 100vh;"></div>
      <script crossorigin src="https://unpkg.com/react/umd/react.production.min.js"></script>
      <script crossorigin src="https://unpkg.com/react-dom/umd/react-dom.production.min.js"></script>
      <script crossorigin src="https://unpkg.com/graphiql/graphiql.min.js"></script>
      <script>
        ReactDOM.render(
          React.createElement(GraphiQL, {
            fetcher: GraphiQL.createFetcher({ url: '/graphql' }),
            defaultQuery: 'query { users { id name email } }'
          }),
          document.getElementById('graphiql')
        );
      </script>
    </body>
    </html>
  `;

  ctx.response.setHeader("Content-Type", "text/html");
  ctx.response.send(html);
});

app.use(router.getRoutes());

app.listen(3000, () => {
  console.log("GraphQL API running on http://localhost:3000");
  console.log("GraphiQL available at http://localhost:3000/graphiql");
});
```

## Microservices Architecture

Example of a microservice with service discovery:

```typescript
import { App, json, cors } from "northernjs";
import { Router } from "northernjs/router";

// Service configuration
const SERVICE_NAME = process.env.SERVICE_NAME || "user-service";
const SERVICE_PORT = parseInt(process.env.PORT) || 3000;
const SERVICE_HOST = process.env.HOST || "localhost";

// Health check data
let serviceHealth = {
  status: "healthy",
  uptime: process.uptime(),
  version: "1.0.0",
  dependencies: {},
};

const app = new App();
const router = new Router();

app.use(cors());
app.use(json());

// Service discovery endpoint
router.get("/discovery", (ctx) => {
  ctx.response.json({
    name: SERVICE_NAME,
    host: SERVICE_HOST,
    port: SERVICE_PORT,
    endpoints: [
      "GET /health",
      "GET /users",
      "POST /users",
      "GET /users/:id",
      "PUT /users/:id",
      "DELETE /users/:id",
    ],
    health: serviceHealth,
  });
});

// Health check endpoint
router.get("/health", (ctx) => {
  serviceHealth.uptime = process.uptime();

  // Check dependencies (database, cache, etc.)
  // serviceHealth.dependencies.database = await checkDatabaseHealth();

  const statusCode = serviceHealth.status === "healthy" ? 200 : 503;
  ctx.response.status(statusCode).json(serviceHealth);
});

// Readiness check
router.get("/ready", (ctx) => {
  // Check if service is ready to accept traffic
  const isReady = serviceHealth.status === "healthy";
  ctx.response.status(isReady ? 200 : 503).json({
    ready: isReady,
    service: SERVICE_NAME,
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully");
  serviceHealth.status = "shutting_down";

  // Close connections, cleanup resources
  setTimeout(() => {
    process.exit(0);
  }, 5000);
});

// Metrics endpoint
router.get("/metrics", (ctx) => {
  const memUsage = process.memoryUsage();
  const metrics = {
    service: SERVICE_NAME,
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024) + "MB",
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + "MB",
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + "MB",
    },
    uptime: Math.round(process.uptime()) + "s",
    version: serviceHealth.version,
  };

  ctx.response.json(metrics);
});

// Your service routes here...
router.get("/users", (ctx) => {
  // Implementation...
  ctx.response.json({ users: [] });
});

app.use(router.getRoutes());

// Error handling
app.onError((err, ctx) => {
  console.error(`[${SERVICE_NAME}] Error:`, err);
  ctx.response.status(500).json({
    error: "Internal service error",
    service: SERVICE_NAME,
  });
});

app.listen(SERVICE_PORT, SERVICE_HOST, () => {
  console.log(
    `${SERVICE_NAME} running on http://${SERVICE_HOST}:${SERVICE_PORT}`
  );
  console.log(`Health check: http://${SERVICE_HOST}:${SERVICE_PORT}/health`);
  console.log(`Discovery: http://${SERVICE_HOST}:${SERVICE_PORT}/discovery`);
});
```

## Testing Examples

Unit tests with Jest:

```typescript
// __tests__/app.test.ts
import request from "supertest";
import { App } from "../src/app";

describe("API Tests", () => {
  let app: App;

  beforeEach(() => {
    app = new App();
    // Configure app for testing
  });

  it("should return hello world", async () => {
    const response = await request(app.getListener()).get("/").expect(200);

    expect(response.body.message).toBe("Hello World!");
  });

  it("should create a user", async () => {
    const userData = { name: "Test User", email: "test@example.com" };

    const response = await request(app.getListener())
      .post("/users")
      .send(userData)
      .expect(201);

    expect(response.body.user).toMatchObject(userData);
    expect(response.body.user).toHaveProperty("id");
  });
});
```

Integration tests:

```typescript
// __tests__/integration.test.ts
import { App } from "../src/app";
import { Database } from "../src/database";

describe("Integration Tests", () => {
  let app: App;
  let db: Database;

  beforeAll(async () => {
    db = new Database();
    await db.connect();

    app = new App();
    // Configure with real database
  });

  afterAll(async () => {
    await db.disconnect();
  });

  it("should handle full user workflow", async () => {
    // Create user
    const createResponse = await request(app.getListener())
      .post("/users")
      .send({ name: "Integration Test", email: "integration@example.com" })
      .expect(201);

    const userId = createResponse.body.user.id;

    // Get user
    const getResponse = await request(app.getListener())
      .get(`/users/${userId}`)
      .expect(200);

    expect(getResponse.body.user.name).toBe("Integration Test");

    // Update user
    await request(app.getListener())
      .put(`/users/${userId}`)
      .send({ name: "Updated Name" })
      .expect(200);

    // Delete user
    await request(app.getListener()).delete(`/users/${userId}`).expect(204);

    // Verify deletion
    await request(app.getListener()).get(`/users/${userId}`).expect(404);
  });
});
```

These examples demonstrate common patterns and can be adapted for your specific use cases. Check the `examples/` directory for more complete implementations.
