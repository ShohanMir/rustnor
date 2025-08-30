import { App } from "../packages/core";
import { Router } from "../packages/router";
import { json } from "../packages/core/json";
import { Context } from "../packages/core/context";

const app = new App();
const router = new Router();

// Register a custom error handler
app.onError((err: any, ctx: Context) => {
  console.error("Server Error:", err);
  ctx.response.status(500).json({ error: "An unexpected error occurred." });
});

// Add the JSON body parser middleware
app.use(json());

router.get("/", async (ctx) => {
  ctx.response.status(200).send(
    'Welcome! Try GET /user/123?lang=en, POST to /user with a JSON body, or GET /error to test error handling.',
  );
});

router.get("/user/:id", async (ctx) => {
  const userId = ctx.params?.id;
  const lang = ctx.query?.lang;

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

router.get("/error", async () => {
  // This route will intentionally throw an error
  throw new Error("This is a test error!");
});

app.use(router.getRoutes());

if (require.main === module) {
  app.listen(8080, () => {
    console.log("Server listening on port 8080");
  });
}

export { app };
