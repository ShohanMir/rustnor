# NorthernJS

A modern, lightweight, and fast Node.js web framework inspired by Koa, built with TypeScript for a great developer experience.

[![npm version](https://badge.fury.io/js/northernjs.svg)](https://badge.fury.io/js/northernjs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- **🚀 TypeScript First** - Clean, generic-powered, and type-safe API
- **⚡ High Performance** - Up to 2x faster HTTP request handling than Express.js
- **🔧 Modern Middleware** - Async/await-based pipeline with strong typing
- **🛣️ Advanced Routing** - Route parameters, query parsing, and file-based routing
- **📦 Rich Ecosystem** - CORS, logging, compression, sessions, authentication
- **🔒 Security First** - Built-in security headers and input validation
- **🔄 Hot Reload** - Automatic server restart during development
- **📁 File-Based Routing** - Next.js-style API routes

## 📦 Installation

```bash
npm install northernjs
```

## 🚀 Quick Start

```typescript
import { App, json } from "northernjs";
import { Router } from "northernjs/router";

const app = new App();
const router = new Router();

// Middleware
app.use(json());

// Routes
router.get("/", (ctx) => {
  ctx.response.json({ message: "Hello, NorthernJS!" });
});

router.post("/users", (ctx) => {
  const user = ctx.request.body;
  ctx.response.status(201).json({ created: user });
});

app.use(router.getRoutes());

app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
```

## 📚 Documentation

- [**Getting Started**](doc/getting-started.md) - Installation and basic setup
- [**Middleware**](doc/middleware.md) - Using built-in middleware (CORS, logging, compression, etc.)
- [**Routing**](doc/routing.md) - Route definitions and file-based routing
- [**Performance**](doc/performance.md) - Optimization tips and benchmarking
- [**Examples**](doc/examples.md) - Complete examples and use cases
- [**API Reference**](doc/api-reference.md) - Complete API documentation

## 🎯 Key Highlights

### Type-Safe Context

```typescript
interface User {
  name: string;
  email: string;
}

router.post("/users", async (ctx: Context<{}, User>) => {
  // ctx.request.body is fully typed!
  const { name, email } = ctx.request.body;
  // ... create user
});
```

### Superior HTTP Performance

NortherJS's optimized request handling provides faster HTTP responses compared to Express.js, making it ideal for high-throughput APIs and real-time applications.

### File-Based Routing

```
routes/
├── users/
│   ├── index.ts    # GET/POST /users
│   └── [id].ts     # GET/PUT/DELETE /users/:id
└── api/
    └── health.ts   # GET /api/health
```

## 📊 Performance

NortherJS provides industry-leading performance with specialized middleware:

- **Up to 2x faster HTTP request handling** than Express.js
- **35x faster app initialization** than Express.js
- **Automatic compression** with gzip/deflate
- **Streaming support** for memory efficiency
- **Optimized routing** with regex-based matching

Run benchmarks: `npm run benchmark:compare`

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Ready to build something amazing?** Check out the [Getting Started](doc/getting-started.md) guide!
