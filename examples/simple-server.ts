import { App } from "../packages/core";
import { Router } from "../packages/router";

const app = new App();
const router = new Router();

router.get("/", async (ctx) => {
  ctx.body = "Welcome to the home page!";
});

router.get("/user", async (ctx) => {
  ctx.body = { id: 1, name: "John Doe" };
});

app.use(router.getRoutes());

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
