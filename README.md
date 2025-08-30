# Rustnor

A modern, lightweight, and fast Node.js web framework inspired by Koa, built with TypeScript for a great developer experience.

## Features

- **TypeScript First:** Clean, typed API.
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
import { App } from "rustnor";
import { Router } from "rustnor/router";
import { json } from "rustnor/json";
import { Context } from "rustnor/context";

// 1. Initialize the application
const app = new App();
const router = new Router();

// 2. Register a custom error handler
app.onError((err: any, ctx: Context) => {
  console.error("Server Error:", err);
  ctx.response.status(500).json({ error: "An unexpected error occurred." });
});

// 3. Use middleware
// The JSON middleware parses request bodies with "Content-Type: application/json"
app.use(json());

// 4. Define your routes

// A simple GET request
router.get("/", async (ctx) => {
  ctx.response.send(
    'Welcome! Try GET /user/42?lang=en or POST to /user with a JSON body.',
  );
});

// A route with URL parameters and query strings
router.get("/user/:id", async (ctx) => {
  const userId = ctx.params?.id; // from /:id
  const lang = ctx.query?.lang;   // from ?lang=en

  ctx.response.json({
    message: `User details for ${userId}`,
    language: lang || "not specified",
  });
});

// A route that handles a POST request with a JSON body
router.post("/user", async (ctx) => {
  const user = ctx.request.body;

  ctx.response.status(201).json({
    message: "User created successfully",
    received_user: user,
  });
});

// A route to test error handling
router.get("/error", async () => {
  throw new Error("This is a test error!");
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

The main application class.

- `new App()`: Creates a new application instance.
- `app.use(middleware)`: Registers a middleware function.
- `app.listen(port, callback)`: Starts the HTTP server.
- `app.onError(handler)`: Registers a global error handler function. The handler receives `(err, ctx)`.

### Context (`ctx`)

A single object that encapsulates the request and response. It's passed to every middleware.

- `ctx.request`: The framework's `Request` object.
- `ctx.response`: The framework's `Response` object.
- `ctx.req`: The raw Node.js `IncomingMessage`.
- `ctx.res`: The raw Node.js `ServerResponse`.
- `ctx.query`: An object containing parsed query string parameters.
- `ctx.params`: An object containing named route parameters.

### Request (`ctx.request`)

- `ctx.request.body`: The parsed request body. Requires a body-parsing middleware like `json()`.

### Response (`ctx.response`)

- `ctx.response.status(code)`: Sets the HTTP status code.
- `ctx.response.send(body)`: Sets the response body (string, buffer, etc.).
- `ctx.response.json(body)`: Sets the response body to a JSON object and sets the `Content-Type` header to `application/json`.
- `ctx.response.setHeader(name, value)`: Sets a response header.

## License

This project is licensed under the ISC License.