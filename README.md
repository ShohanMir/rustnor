# Rustnor

**Rustnor is a modern, lightweight, and fast Node.js web framework for building high-performance APIs and web applications. It's built with TypeScript to provide a great developer experience for both TypeScript and JavaScript users.**

## Features

- **TypeScript First:** Built with TypeScript for a better developer experience.
- **Modern:** Uses modern JavaScript features and a clean, intuitive API.
- **Fast:** Designed for high performance and low overhead.
- **Extensible:** Easily extensible with middleware and plugins.

## Current Capabilities

- **Basic Routing:** The framework currently supports basic routing with `get`, `post`, `put`, and `delete` methods.
- **TypeScript and JavaScript Support:** Can be used in both TypeScript and JavaScript projects.
- **Simple and Intuitive API:** The API is designed to be simple and easy to use.

## Installation

```bash
npm install rustnor
```

## Usage

Here's a simple example of how to create a web server with Rustnor:

```typescript
import { Application, RouteHandler } from "rustnor";

const app = new Application();

const homeHandler: RouteHandler = (req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Welcome to the home page!");
};

const userHandler: RouteHandler = (req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ id: 1, name: "John Doe" }));
};

app.get("/", homeHandler);
app.get("/user", userHandler);

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
```

To run this example, save it as `server.ts` and run the following command:

```bash
ts-node server.ts
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the ISC License.
