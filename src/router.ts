import * as http from 'http';

// Define the type for a handler function
export type RouteHandler = (req: http.IncomingMessage, res: http.ServerResponse) => void;

export class Router {
  // A simple storage for routes: e.g., { 'GET:/users': handler, 'POST:/users': handler }
  private readonly routes: { [path: string]: RouteHandler } = {};

  /**
   * Adds a new route to the router's storage.
   * @param method The HTTP method (GET, POST, etc.)
   * @param path The URL path
   * @param handler The function to execute for this route
   */
  public addRoute(method: string, path: string, handler: RouteHandler): void {
    const key = `${method.toUpperCase()}:${path}`;
    this.routes[key] = handler;
  }

  /**
   * Looks up the appropriate handler for the request and executes it.
   * If no handler is found, it sends a 404 response.
   * @param req The incoming HTTP request
   * @param res The server response
   */
  public route(req: http.IncomingMessage, res: http.ServerResponse): void {
    const key = `${req.method?.toUpperCase()}:${req.url}`;
    const handler = this.routes[key];

    if (handler) {
      handler(req, res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  }
}
