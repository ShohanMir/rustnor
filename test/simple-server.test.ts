import request from "supertest";
import { app } from "../examples/simple-server";
import { expect } from "chai";
import * as fs from "fs";
import { promises as fsp } from "fs";
import * as path from "path";

describe("Simple Server API", () => {
  // Create a temporary public directory for static files
  before(() => {
    const publicPath = path.join(process.cwd(), 'examples', 'public');
    if (!fs.existsSync(publicPath))
      fs.mkdirSync(publicPath);
    fs.writeFileSync(path.join(publicPath, 'test.html'), '<h1>Test HTML</h1>');
    fs.writeFileSync(path.join(publicPath, 'test.txt'), 'Test text content');
  });

  // Clean up the temporary public directory
  after(async () => {
    const publicPath = path.join(process.cwd(), 'examples', 'public');
    await fsp.rm(publicPath, { recursive: true, force: true });
  });

  it("should return a welcome message for GET /", async () => {
    const response = await request(app.getListener()).get("/");
    expect(response.status).to.equal(200);
    expect(response.text).to.include("Welcome!");
  });

  it("should handle route params and query strings for GET /user/:id", async () => {
    const response = await request(app.getListener()).get("/user/42?lang=fr");
    expect(response.status).to.equal(200);
    expect(response.body).to.deep.equal({
      message: "User details for 42",
      language: "fr",
    });
  });

  it("should parse JSON body for POST /user", async () => {
    const newUser = { name: "Jane Doe" };
    const response = await request(app.getListener())
      .post("/user")
      .send(newUser);

    expect(response.status).to.equal(201);
    expect(response.body).to.deep.equal({
      message: "User created successfully",
      received_user: newUser,
    });
  });

  it("should return 404 for a route that does not exist", async () => {
    const response = await request(app.getListener()).get("/nonexistent-route");
    expect(response.status).to.equal(404);
  });

  it("should use the custom error handler for routes that throw errors", async () => {
    const response = await request(app.getListener()).get("/error");
    expect(response.status).to.equal(500);
    expect(response.body).to.deep.equal({ error: "An unexpected error occurred." });
  });

  // New tests for static file serving
  it("should serve a static HTML file", async () => {
    const response = await request(app.getListener()).get("/test.html");
    expect(response.status).to.equal(200);
    expect(response.text).to.equal("<h1>Test HTML</h1>");
    expect(response.headers["content-type"]).to.include("text/html");
  });

  it("should serve a static text file", async () => {
    const response = await request(app.getListener()).get("/test.txt");
    expect(response.status).to.equal(200);
    expect(response.text).to.equal("Test text content");
    expect(response.headers["content-type"]).to.include("text/plain");
  });

  it("should return 404 for a non-existent static file", async () => {
    const response = await request(app.getListener()).get("/nonexistent.file");
    expect(response.status).to.equal(404);
  });
});
