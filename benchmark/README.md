# NorthernJS Benchmark Suite

Performance benchmarking tools for NorthernJS framework and comparisons with other frameworks.

## Overview

This directory contains benchmarking utilities to:

- Measure NorthernJS's performance characteristics
- Compare standard vs optimized implementations
- Benchmark against other frameworks (Express, Koa, etc.)
- Track performance regressions

## Files

- `benchmark.ts` - Core benchmarking utilities and classes
- `framework-comparison.ts` - Comprehensive NorthernJS vs Express.js comparison
- `../examples/performance-comparison.ts` - Internal performance comparisons

## Quick Start

```bash
# Run internal performance comparison
npm run benchmark

# Run framework comparison (NorthernJS vs Express.js)
npm run benchmark:compare

# Or run directly
npx ts-node examples/performance-comparison.ts
npx ts-node benchmark/framework-comparison.ts
```

## Benchmark Classes

### `Benchmark`

Main benchmarking class for measuring execution time.

```typescript
import { Benchmark } from "./benchmark/benchmark";

const benchmark = new Benchmark();

// Benchmark a function
const result = await benchmark.run(
  "My Function",
  async () => {
    // Your code here
    return myFunction();
  },
  1000
);

console.log(`${result.name}: ${result.averageTime}ms average`);
```

### Utility Functions

```typescript
import { benchmarkJson, benchmarkMiddleware } from "./benchmark/benchmark";

// Benchmark JSON operations
const jsonResult = await benchmarkJson(
  "Fast JSON Parse",
  testData,
  (data) => JSON.parse(data),
  1000
);

// Benchmark middleware
const middlewareResult = await benchmarkMiddleware(
  "My Middleware",
  myMiddleware,
  mockContext,
  1000
);
```

## Framework Comparisons

### Vs Express

```typescript
// Example: Compare JSON parsing
const expressApp = express();
expressApp.use(express.json());

const northernApp = new App();
northernApp.use(json());

// Run benchmarks...
```

### Vs Koa

```typescript
// Similar comparison with Koa
const koaApp = new Koa();
koaApp.use(koaBodyParser());

const northernApp = new App();
northernApp.use(json());
```

## Performance Metrics

The benchmark suite measures:

- **Execution Time**: Average, min, max, standard deviation
- **Memory Usage**: Heap usage before/after operations
- **Operations/Second**: Throughput calculations
- **Statistical Analysis**: Performance consistency

## Custom Benchmarks

Create your own benchmarks:

```typescript
import { Benchmark } from "./benchmark/benchmark";

async function customBenchmark() {
  const benchmark = new Benchmark();

  // Benchmark your custom function
  await benchmark.run(
    "Custom Operation",
    async () => {
      // Your performance-critical code
      return await myExpensiveOperation();
    },
    10000
  );

  benchmark.printResults();
}

customBenchmark();
```

## Configuration

### Benchmark Options

```typescript
const result = await benchmark.run(
  'My Test',           // Benchmark name
  async () => { ... }, // Function to benchmark
  1000,                // Number of iterations
  {
    warmup: 100,       // Warmup iterations
    timeout: 30000     // Timeout in ms
  }
);
```

### Statistical Analysis

```typescript
// Get detailed statistics
const results = benchmark.getResults();
results.forEach((result) => {
  console.log(`Name: ${result.name}`);
  console.log(`Mean: ${result.averageTime}ms`);
  console.log(`StdDev: ${calculateStdDev(result.times)}ms`);
  console.log(`95th Percentile: ${calculatePercentile(result.times, 95)}ms`);
});
```

## Best Practices

1. **Warmup**: Always include warmup iterations
2. **Statistical Significance**: Use enough iterations (1000+)
3. **Isolated Tests**: Run benchmarks in isolation
4. **Consistent Environment**: Same hardware/software for comparisons
5. **Memory Cleanup**: Ensure GC doesn't affect results

## Contributing

When adding new benchmarks:

1. Follow the existing patterns
2. Include statistical analysis
3. Document the benchmark purpose
4. Add to this README

## Results Interpretation

- **Lower is better** for execution time
- **Higher is better** for operations/second
- Look for **consistency** in results
- Consider **statistical significance** of differences
- **Memory usage** should be monitored for leaks

## Future Plans

- Automated regression detection
- CI/CD integration
- Web dashboard for results
- Cross-framework comparison suite
- Performance profiling integration
