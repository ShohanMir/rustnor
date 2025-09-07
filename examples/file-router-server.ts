import {
  App,
  json,
  cors,
  logger,
  createFileRouter,
  enableHotReload,
  Context,
} from "../packages/core";

async function createServer() {
  const app = new App();

  // Middleware
  app.use(cors());
  app.use(logger({ format: "dev" }));
  app.use(json());

  // Error handler
  app.onError((err: any, ctx: Context) => {
    console.error("Server Error:", err);
    ctx.response.status(500).json({
      error: "Internal Server Error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  });

  // Load file-based routes
  console.log("🔍 Scanning routes directory...");
  const fileRouter = await createFileRouter({
    routesDir: "routes",
    basePath: "",
  });

  app.use(fileRouter.getRoutes());
  console.log("✅ File-based routes loaded");

  return app;
}

// Start server
if (require.main === module) {
  createServer()
    .then((app) => {
      const server = app.listen(8080, () => {
        console.log("🚀 File-Based Router Server running on port 8080");
        console.log("📁 Routes automatically loaded from /routes directory");
        console.log("");
        console.log("Available routes:");
        console.log("  GET  /");
        console.log("  GET  /users");
        console.log("  POST /users");
        console.log("  GET  /users/[id]");
        console.log("  PUT  /users/[id]");
        console.log("  DEL  /users/[id]");
        console.log("  GET  /api/health");
      });

      // Enable hot reload in development
      if (process.env.NODE_ENV !== "production") {
        enableHotReload(server, {
          watchPaths: ["routes/**/*.ts"],
          verbose: true,
        });
      }
    })
    .catch((err) => {
      console.error("Failed to start server:", err);
      process.exit(1);
    });
}

export { createServer };
