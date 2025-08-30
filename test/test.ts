import { App } from "../packages/core";
import { Router } from "../packages/router";

async function runTest() {
  const app = new App();
  const router = new Router();

  router.get("/", async (ctx: any) => {
    ctx.body = "Welcome to the home page!";
  });

  app.use(router.getRoutes());

  console.log("Test passed!");
}

runTest();