import { App, json, Context } from "../packages/core";
import { Router } from "../packages/router";

const app = new App();
const router = new Router();

// Register a custom error handler
app.onError((err: any, ctx: Context) => {
  console.error("Server Error:", err);
  ctx.response.status(500).json({ error: "An unexpected error occurred." });
});

// Add the JSON body parser middleware
app.use(json());

// --- How to use the new Generic Types ---
// You can define the shape of your request body and state for full type-safety.
/*
interface CreateUserBody {
  name: string;
  email: string;
}

router.post("/user", async (ctx: Context<{}, CreateUserBody>) => {
  // ctx.request.body is now fully typed!
  const user = ctx.request.body;
  console.log(user.name, user.email);

  ctx.response.status(201).json({
    message: "User created successfully",
    received_user: user,
  });
});
*/

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

// This route uses the default `any` type for the body for simplicity.
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