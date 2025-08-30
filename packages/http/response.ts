import { ServerResponse } from "http";

export class Response {
  res: ServerResponse;
  body: any;
  [key: string]: any;

  constructor(res: ServerResponse) {
    this.res = res;
  }

  status(code: number) {
    this.res.statusCode = code;
    return this;
  }

  setHeader(name: string, value: string | number | string[]) {
    this.res.setHeader(name, value);
    return this;
  }

  send(body: any) {
    this.body = body;
  }

  json(body: any) {
    this.setHeader("Content-Type", "application/json");
    this.body = body;
  }
}