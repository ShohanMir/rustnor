# Performance

Rustnor is designed for high performance with several optimizations and benchmarking tools to help you achieve the best results.

## Performance Features

### High-Performance JSON Parsing

Rustnor includes a specialized JSON parser that provides significant performance improvements for large payloads.

```typescript
import { App, fastJson } from "rustnor";

const app = new App();

// Use optimized JSON parsing
app.use(
  fastJson({
    limit: 1024 * 1024, // 1MB limit
    streamThreshold: 64 * 1024, // Use streaming for >64KB
    strict: true, // Security validation
  }),
);
```

**Performance Benefits:**

- **47-52% faster** JSON parsing compared to standard `JSON.parse()`
- **Memory-efficient streaming** for payloads over 64KB
- **Automatic optimization** based on payload size
- **Security hardening** with prototype pollution protection

### Automatic Compression

Response compression reduces bandwidth and improves load times.

```typescript
import { App, compress } from "rustnor";

const app = new App();
app.use(
  compress({
    threshold: 1024, // Compress responses > 1KB
    level: 6, // Compression level (1-9)
    types: ["text/plain", "application/json", "text/html"],
  }),
);
```

**Benefits:**

- Automatic gzip/deflate compression
- Configurable content types
- Minimal CPU overhead

### Optimized Routing

Routes are compiled to regular expressions at startup for fast matching.

```typescript
// Routes are pre-compiled for optimal performance
router.get("/users/:id", handler);
router.get("/posts/:slug/comments/:commentId", handler);
```

## Benchmarking

Run comprehensive benchmarks to compare performance across different configurations.

```bash
npm run benchmark
```

This will run benchmarks for:

- JSON parsing performance
- Routing throughput
- Middleware overhead
- Memory usage patterns

### Custom Benchmarks

Create custom benchmarks using the built-in benchmarking utilities:

```typescript
import { benchmarkJson, benchmarkRouting } from "./benchmark/benchmark";

// JSON parsing benchmark
const jsonResults = await benchmarkJson({
  payloadSizes: [1, 10, 100, 1000], // KB
  iterations: 1000,
});

console.log("JSON Benchmark Results:", jsonResults);

// Routing benchmark
const routingResults = await benchmarkRouting({
  routes: ["/", "/users", "/users/:id", "/posts/:id/comments"],
  requests: 10000,
});

console.log("Routing Benchmark Results:", routingResults);
```

## Performance Best Practices

### 1. Use Fast JSON for Large Payloads

```typescript
// Good for large payloads
app.use(
  fastJson({
    streamThreshold: 50 * 1024, // 50KB
  }),
);

// Standard JSON for small payloads
app.use(json());
```

### 2. Enable Compression

```typescript
app.use(
  compress({
    threshold: 1024, // Don't compress small responses
    level: 6, // Balance speed vs compression
  }),
);
```

### 3. Optimize Middleware Order

```typescript
// 1. Early returns (security, CORS)
app.use(security());
app.use(cors());

// 2. Request processing
app.use(logger());
app.use(json());

// 3. Business logic
app.use(rateLimit());
app.use(router.getRoutes());

// 4. Error handling (last)
app.use(errorHandler());
```

### 4. Use Streaming for Large Responses

```typescript
router.get("/large-file", (ctx) => {
  const stream = fs.createReadStream("large-file.zip");
  ctx.response.setHeader("Content-Type", "application/zip");
  ctx.response.body = stream;
});
```

### 5. Cache Static Assets

```typescript
app.use(
  staticMiddleware("public", {
    maxAge: 31536000, // 1 year for static assets
    immutable: true,
  }),
);
```

### 6. Database Connection Pooling

```typescript
// Use connection pooling for databases
const pool = new Pool({
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 7. Implement Caching

```typescript
const cache = new Map();

router.get("/expensive-operation", async (ctx) => {
  const key = ctx.req.url;
  let result = cache.get(key);

  if (!result) {
    result = await expensiveDatabaseQuery();
    cache.set(key, result);

    // Expire cache after 5 minutes
    setTimeout(() => cache.delete(key), 5 * 60 * 1000);
  }

  ctx.response.json(result);
});
```

## Memory Management

### Garbage Collection Tuning

For high-throughput applications, tune Node.js GC:

```bash
# Use G1 GC equivalent settings
node --max-old-space-size=4096 \
     --optimize-for-size \
     --gc-interval=100 \
     app.js
```

### Memory Leaks Prevention

- Avoid global state in middleware
- Use streaming for large files
- Clean up event listeners
- Monitor memory usage in production

```typescript
// Monitor memory usage
setInterval(() => {
  const usage = process.memoryUsage();
  console.log(`Memory: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`);
}, 30000);
```

## Scaling Strategies

### Horizontal Scaling

Use multiple instances behind a load balancer:

```
Load Balancer
├── Instance 1 (Port 3000)
├── Instance 2 (Port 3001)
└── Instance 3 (Port 3002)
```

### Session Store Scaling

Use Redis for session storage in multi-instance deployments:

```typescript
import RedisStore from "connect-redis";

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    // ... other options
  }),
);
```

### Rate Limiting at Scale

Use Redis for distributed rate limiting:

```typescript
app.use(
  rateLimit({
    store: new RedisStore({ client: redisClient }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
  }),
);
```

## Monitoring and Profiling

### Performance Monitoring

```typescript
// Response time monitoring
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.req.method} ${ctx.req.url} - ${duration}ms`);
});
```

### Memory Profiling

```bash
# Generate heap snapshot
node --inspect --heap-prof app.js

# Use clinic.js for detailed analysis
npm install -g clinic
clinic heapprofiler -- node app.js
```

### CPU Profiling

```bash
# CPU profiling
node --prof app.js

# Analyze profile
node --prof-process isolate-*.log > profile.txt
```

## Production Optimizations

### Cluster Mode

Use Node.js clustering for multi-core utilization:

```typescript
import cluster from "cluster";
import os from "os";

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  // Worker process
  const app = new App();
  // ... configure app
  app.listen(3000);
}
```

### PM2 Process Management

```json
// ecosystem.config.js
module.exports = {
  apps: [{
    name: "rustnor-app",
    script: "dist/app.js",
    instances: "max",
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    }
  }]
};
```

### Docker Optimization

```dockerfile
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 3000
USER node

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/app.js"]
```

## Future Performance Enhancements

### Native Extensions (Planned)

Rustnor plans to offer native extensions for ultimate performance:

- **Rust-based JSON processing** with zero-copy parsing
- **WebAssembly modules** for cryptographic operations
- **Native compression** algorithms
- **High-performance routing** with SIMD instructions

These will be available as optional packages to keep the core framework lightweight.

## Benchmark Results

Recent benchmark results (run `npm run benchmark`):

```
JSON Parsing (1MB payload, 1000 iterations):
- Standard JSON: 2,450ms
- Fast JSON: 1,180ms
- Improvement: 52% faster

Routing (10,000 requests):
- Simple routes: 45ms
- Parameter routes: 52ms
- Wildcard routes: 48ms

Memory Usage (100 concurrent connections):
- Baseline: 45MB
- With compression: 42MB
- With streaming: 38MB
```

For the latest benchmark results and comparisons with other frameworks, see `benchmark/README.md`.
