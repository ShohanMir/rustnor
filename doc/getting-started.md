# Getting Started with NorthernJS

Welcome to NorthernJS! This guide will help you get up and running with your first NorthernJS application.

## Installation

Install NorthernJS using npm:

```bash
npm install northern
```

## Your First Application

Create a new file called `server.ts`:

```typescript
import { App, json } from "northernjs";
import { Router } from "northernjs/router";

const app = new App();
const router = new Router();

// Parse JSON request bodies
app.use(json());

// Define routes
router.get("/", (ctx) => {
  ctx.response.json({
    message: "Hello, NorthernJS!",
    timestamp: new Date().toISOString(),
  });
});

router.get("/users/:id", (ctx) => {
  const userId = ctx.params.id;
  ctx.response.json({
    userId,
    name: `User ${userId}`,
    email: `user${userId}@example.com`,
  });
});

router.post("/users", (ctx) => {
  const userData = ctx.request.body;
  // In a real app, you'd save to a database
  ctx.response.status(201).json({
    message: "User created",
    user: userData,
    id: Date.now(), // Mock ID
  });
});

// Register routes
app.use(router.getRoutes());

// Error handling
app.onError((err, ctx) => {
  console.error("Server Error:", err);
  ctx.response.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
```

## Running Your Application

```bash
# Run with ts-node (recommended for development)
npx ts-node server.ts

# Or compile and run
npx tsc server.ts
node server.js
```

## Testing Your API

```bash
# Get the root endpoint
curl http://localhost:3000/

# Get a specific user
curl http://localhost:3000/users/123

# Create a new user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

## Project Structure

For larger applications, consider this structure:

```
my-northern-app/
├── src/
│   ├── routes/
│   │   ├── index.ts
│   │   └── users.ts
│   ├── middleware/
│   │   └── auth.ts
│   └── app.ts
├── package.json
└── tsconfig.json
```

## TypeScript Configuration

Create a `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Development Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "dev": "ts-node src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js"
  }
}
```

## Next Steps

- Learn about [middleware](middleware.md) for adding functionality
- Explore [routing](routing.md) options including file-based routing
- Check out [examples](examples.md) for more complex use cases
- Read the [API reference](api-reference.md) for detailed documentation

## Need Help?

- Check the [examples](../examples/) directory
- Run `npm run dev:example` to see a working example
- Visit our [GitHub repository](https://github.com/ShohanMir/northernjs) for issues and discussions
