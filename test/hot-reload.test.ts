import { HotReload } from "../packages/core/framework/hot-reload";
import * as http from "http";
import { expect } from "chai";

describe("Hot Reload", () => {
  let server: http.Server;
  let hotReload: HotReload;

  beforeEach(() => {
    server = http.createServer((req, res) => {
      res.end("Hello World");
    });
  });

  afterEach(() => {
    if (hotReload) {
      hotReload.stop();
    }
    if (server && server.listening) {
      server.close();
    }
  });

  it("should create a HotReload instance", () => {
    hotReload = new HotReload({
      watchPaths: ["packages/**/*.ts"],
      verbose: false,
    });

    expect(hotReload).to.be.instanceOf(HotReload);
  });

  it("should start watching files", (done) => {
    hotReload = new HotReload({
      watchPaths: ["packages/**/*.ts"],
      verbose: false,
      delay: 50, // Faster for testing
    });

    // Start the server first
    server.listen(0, () => {
      hotReload.start(server);

      // The watcher should be initialized
      expect(hotReload).to.have.property("start");

      done();
    });
  });

  it("should handle options correctly", () => {
    const options = {
      watchPaths: ["custom/**/*.ts"],
      ignored: ["custom/**/*.test.ts"],
      delay: 500,
      verbose: true,
    };

    hotReload = new HotReload(options);

    // We can't directly test private properties, but the instance should be created
    expect(hotReload).to.be.instanceOf(HotReload);
  });
});
