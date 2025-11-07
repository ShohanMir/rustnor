import {
  FileRouter,
  createFileRouter,
} from "../packages/core/routing/file-router";
import { Router } from "../packages/router";
import * as fs from "fs";
import * as path from "path";
import { expect } from "chai";

describe("File-Based Router", () => {
  let testRoutesDir: string;

  before(() => {
    // Create a temporary test routes directory
    testRoutesDir = path.join(process.cwd(), "test-routes");
    if (!fs.existsSync(testRoutesDir)) {
      fs.mkdirSync(testRoutesDir);
    }

    // Create test route files
    fs.mkdirSync(path.join(testRoutesDir, "api"));
    fs.writeFileSync(
      path.join(testRoutesDir, "index.ts"),
      `
        import { Context } from "../packages/core";
        export default async function handler(ctx: Context) {
          ctx.response.json({ route: "home" });
        }
      `,
    );

    fs.writeFileSync(
      path.join(testRoutesDir, "users.ts"),
      `
        import { Context } from "../packages/core";
        export async function get(ctx: Context) {
          ctx.response.json({ route: "users" });
        }
      `,
    );

    fs.writeFileSync(
      path.join(testRoutesDir, "api", "health.ts"),
      `
        import { Context } from "../../packages/core";
        export default async function handler(ctx: Context) {
          ctx.response.json({ status: "ok" });
        }
      `,
    );
  });

  after(() => {
    if (fs.existsSync(testRoutesDir)) {
      fs.rmSync(testRoutesDir, { recursive: true, force: true });
    }
  });

  it("should create a FileRouter instance", () => {
    const router = new FileRouter();
    expect(router).to.be.instanceOf(FileRouter);
  });

  it("should scan routes and return a Router", async () => {
    const fileRouter = new FileRouter({ routesDir: testRoutesDir });
    const router = await fileRouter.scanRoutes();
    expect(router).to.be.instanceOf(Router);
  });

  it("should handle route options", () => {
    const options = {
      routesDir: "custom-routes",
      basePath: "/api",
      fileExtensions: [".ts", ".js"],
    };
    const router = new FileRouter(options);
    expect(router).to.be.instanceOf(FileRouter);
  });

  it("should use convenience function", async () => {
    const router = await createFileRouter({ routesDir: testRoutesDir });
    expect(router).to.be.instanceOf(Router);
  });

  it("should handle non-existent routes directory gracefully", async () => {
    const router = await createFileRouter({ routesDir: "non-existent" });
    expect(router).to.be.instanceOf(Router);
  });
});
