import {
  App,
  json,
  cors,
  logger,
  compress,
  session,
  basicAuth,
  enableHotReload,
  Context,
} from "../packages/core";
import { Router } from "../packages/router";

const app = new App();
const router = new Router();

// Middleware stack
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:8080"],
    credentials: true,
  }),
);

app.use(
  logger({
    format: "dev",
  }),
);

app.use(
  compress({
    threshold: 512,
  }),
);

app.use(
  session({
    name: "rustnor.sid",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  }),
);

app.use(json());

// Basic auth for admin routes
app.use(
  basicAuth({
    users: { admin: "password123" },
    skip: (ctx) => !ctx.req.url?.startsWith("/admin"),
  }),
);

// Error handler
app.onError((err: any, ctx: Context) => {
  console.error("Server Error:", err);
  ctx.response.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Routes
router.get("/", async (ctx) => {
  const visitCount = (ctx as any).state.session.visitCount || 0;
  (ctx as any).state.session.visitCount = visitCount + 1;

  ctx.response.json({
    message: "Welcome to Rustnor Advanced Server!",
    features: [
      "CORS enabled",
      "Request logging",
      "Response compression",
      "Session management",
      "Basic authentication",
    ],
    session: {
      visitCount: (ctx as any).state.session.visitCount,
      user: (ctx as any).state.user,
    },
  });
});

router.get("/admin", async (ctx) => {
  ctx.response.json({
    message: "Admin panel",
    user: (ctx as any).state.user,
    session: (ctx as any).state.session,
  });
});

router.post("/api/data", async (ctx) => {
  const data = ctx.request.body;
  ctx.response.status(201).json({
    message: "Data created successfully",
    received: data,
    timestamp: new Date().toISOString(),
  });
});

app.use(router.getRoutes());

if (require.main === module) {
  const server = app.listen(8080, () => {
    console.log("🚀 Advanced Rustnor server running on port 8080");
    console.log("Features enabled: CORS, Logging, Compression, Sessions, Auth");
  });

  // Enable hot reload in development
  if (process.env.NODE_ENV !== "production") {
    enableHotReload(server, {
      watchPaths: ["packages/**/*.ts", "examples/**/*.ts"],
      ignored: ["node_modules/**", "**/*.test.ts"],
      verbose: true,
    });
  }
}

export { app };
