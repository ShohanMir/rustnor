import { IncomingMessage } from "http";
import { parse } from "url";
import { ParsedUrlQuery } from "querystring";

export class Request {
  req: IncomingMessage;
  public readonly pathname: string;
  public readonly query: ParsedUrlQuery;
  body: any;
  [key: string]: any;

  constructor(req: IncomingMessage) {
    this.req = req;
    const { pathname, query } = parse(req.url || "", true);
    this.pathname = pathname || "/";
    this.query = query;
  }
}