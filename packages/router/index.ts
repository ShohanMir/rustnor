import { Context, Middleware } from "../core/context";

export type Route = {
  path: string;
  method: string;
  handler: Middleware;
  keys: string[];
  regexp: RegExp;
};

export class Router {
  private routes: Route[] = [];

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
    const keys: string[] = [];
    const regexp = new RegExp(
      `^${path.replace(/:(\w+)/g, (_, key) => {
        keys.push(key);
        return "(\[^/]+)";
      })}/?$`,
    );
    this.routes.push({ path, method, handler, keys, regexp });
  }

  public getRoutes(): Middleware {
    return async (ctx, next) => {
      const { method } = ctx.req;
      const { pathname } = ctx.request;

      if (!pathname || !method) {
        return next();
      }

      for (const route of this.routes) {
        if (route.method !== method) {
          continue;
        }

        const match = route.regexp.exec(pathname);

        if (match) {
          const params: { [key: string]: string } = {};
          for (let i = 0; i < route.keys.length; i++) {
            params[route.keys[i]] = match[i + 1];
          }
          ctx.params = params;
          return route.handler(ctx, next);
        }
      }

      return next();
    };
  }
}