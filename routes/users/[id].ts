import { Context } from "../../packages/core";

const users = [
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Smith", email: "jane@example.com" },
];

export async function get(ctx: Context) {
  const userId = parseInt(ctx.params.id);

  if (isNaN(userId)) {
    return ctx.response.status(400).json({ error: "Invalid user ID" });
  }

  const user = users.find((u) => u.id === userId);

  if (!user) {
    return ctx.response.status(404).json({ error: "User not found" });
  }

  ctx.response.json({ user });
}

export async function put(ctx: Context) {
  const userId = parseInt(ctx.params.id);

  if (isNaN(userId)) {
    return ctx.response.status(400).json({ error: "Invalid user ID" });
  }

  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return ctx.response.status(404).json({ error: "User not found" });
  }

  const updateData = ctx.request.body;
  users[userIndex] = { ...users[userIndex], ...updateData };

  ctx.response.json({
    message: "User updated",
    user: users[userIndex],
  });
}

export async function del(ctx: Context) {
  const userId = parseInt(ctx.params.id);

  if (isNaN(userId)) {
    return ctx.response.status(400).json({ error: "Invalid user ID" });
  }

  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return ctx.response.status(404).json({ error: "User not found" });
  }

  const deletedUser = users.splice(userIndex, 1)[0];

  ctx.response.json({
    message: "User deleted",
    user: deletedUser,
  });
}
