import { IncomingMessage } from "http";
import { parse } from "url";
import { ParsedUrlQuery } from "querystring";

export class Request<BodyT = any> {
  req: IncomingMessage;
  public readonly pathname: string;
  public readonly query: ParsedUrlQuery;
  body: BodyT;
  [key: string]: any;

  constructor(req: IncomingMessage) {
    this.req = req;
    const { pathname, query } = parse(req.url || "", true);
    this.pathname = pathname || "/";
    this.query = query;
    this.body = {} as BodyT;
  }
}
