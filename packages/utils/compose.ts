import type { Context, Middleware } from "../core/context";

export function compose(middleware: Middleware[]) {
  return function (ctx: Context, next?: () => Promise<any>) {
    let index = -1;
    return dispatch(0);
    function dispatch(i: number): Promise<any> {
      if (i <= index) {
        return Promise.reject(new Error("next() called multiple times"));
      }
      index = i;
      let fn: Middleware | undefined = middleware[i];
      if (i === middleware.length) fn = next as any;
      if (!fn) return Promise.resolve();
      try {
        return Promise.resolve(fn(ctx, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }
  };
}
