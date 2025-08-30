# Rustnor

A modern, lightweight, and fast Node.js web framework inspired by Koa, built with TypeScript for a great developer experience.

## Features

- **TypeScript First:** Clean, generic-powered, and type-safe API.
- **Modern Middleware:** Uses an async/await-based middleware pipeline.
- **Advanced Router:** Supports route parameters and query string parsing out-of-the-box.
- **Request Body Parsing:** Includes a built-in middleware for parsing JSON request bodies.
- **Convenient Response Helpers:** Simple and expressive API for sending responses (e.g., `ctx.response.json()`).
- **Extensible Error Handling:** Provides a global `onError` hook for centralized error management.

## Installation

```bash
npm install rustnor
```

## Getting Started

Here is a complete example of a simple server that demonstrates the core features of Rustnor.

```typescript
// Imports are now centralized from the package root
import { App, json, Context } from "rustnor";
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
app.use(json());

// 4. Define your routes
router.get("/", async (ctx) => {
  ctx.response.send(
    'Welcome! Try GET /user/42?lang=en or POST to /user with a JSON body.',
  );
});

router.get("/user/:id", async (ctx) => {
  const userId = ctx.params?.id; // from /:id
  const lang = ctx.query?.lang;   // from ?lang=en

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
import { Context } from 'rustnor';

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

## License

This project is licensed under the ISC License.
