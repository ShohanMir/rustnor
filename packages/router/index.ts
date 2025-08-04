import { Context, Middleware } from "../core/context";

export type RouteHandler = (ctx: Context) => void;

export class Router {
  private routes: { [path: string]: { [method: string]: Middleware } } = {};

  get(path: string, handler: Middleware) {
    this.addRoute(path, "GET", handler);
  }

  post(path: string, handler: Middleware) {
    this.addRoute(path, "POST", handler);
  }

  put(path: string, handler: Middleware) {
    this.addRoute(path, "PUT", handler);
  }

  delete(path: string, handler: Middleware) {
    this.addRoute(path, "DELETE", handler);
  }

  patch(path: string, handler: Middleware) {
    this.addRoute(path, "PATCH", handler);
  }

  head(path: string, handler: Middleware) {
    this.addRoute(path, "HEAD", handler);
  }

  options(path: string, handler: Middleware) {
    this.addRoute(path, "OPTIONS", handler);
  }

  private addRoute(path: string, method: string, handler: Middleware) {
    if (!this.routes[path]) {
      this.routes[path] = {};
    }
    this.routes[path][method] = handler;
  }

  public getRoutes(): Middleware {
    return async (ctx, next) => {
      const { method, url } = ctx.req;
      if (!url || !method) {
        return next();
      }

      const route = this.routes[url];
      if (route) {
        const handler = route[method];
        if (handler) {
          return handler(ctx, next);
        }
      }

      return next();
    };
  }
}
