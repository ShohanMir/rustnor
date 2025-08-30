import request from "supertest";
import { app } from "../examples/simple-server";
import { expect } from "chai";

describe("Simple Server API", () => {
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
});