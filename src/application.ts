import * as http from "http";
import { Router, RouteHandler } from "./router";

export class Application {
  private readonly server: http.Server;
  private readonly router: Router;

  constructor() {
    this.router = new Router();
    this.server = http.createServer(this.handleRequest.bind(this));
  }

  /**
   * This is the internal request handler that is passed to the underlying
   * http.Server. It takes the incoming request and response objects and
   * delegates the actual request handling to the router.
   * @param req The incoming request
   * @param res The response that will be sent back to the client
   */
  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    this.router.route(req, res);
  }

  /**
   * Registers a route for HTTP GET requests.
   * @param path The URL path for this route
   * @param handler The function to execute for this route
   */
  public get(path: string, handler: RouteHandler) {
    this.router.addRoute("GET", path, handler);
  }

  /**
   * Registers a route for HTTP POST requests.
   * @param path The URL path for this route
   * @param handler The function to execute for this route
   */
  public post(path: string, handler: RouteHandler) {
    this.router.addRoute("POST", path, handler);
  }

  /**
   * Registers a route for HTTP PUT requests.
   * @param path The URL path for this route
   * @param handler The function to execute for this route
   */
  public put(path: string, handler: RouteHandler) {
    this.router.addRoute("PUT", path, handler);
  }

  /**
   * Registers a route for HTTP DELETE requests.
   * @param path The URL path for this route
   * @param handler The function to execute for this route
   */
  public delete(path: string, handler: RouteHandler) {
    this.router.addRoute("DELETE", path, handler);
  }

  /**
   * Starts the HTTP server on the specified port.
   * @param port The port number on which the server will listen for incoming connections.
   * @param callback An optional callback function to be executed once the server starts listening.
   */

  public listen(port: number, callback?: () => void) {
    this.server.listen(port, callback);
  }
}
