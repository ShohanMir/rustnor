import { Context } from "../../../packages/core";

export async function get(ctx: Context) {
  ctx.response.json({
    users: [
      { id: 1, name: "John Doe" },
      { id: 2, name: "Jane Smith" },
    ],
  });
}

export async function post(ctx: Context) {
  const userData = ctx.request.body;
  ctx.response.status(201).json({
    message: "User created",
    user: { id: Date.now(), ...userData },
  });
}
