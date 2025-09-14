import { performance } from "perf_hooks";

export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  opsPerSecond: number;
}

export class Benchmark {
  private results: BenchmarkResult[] = [];

  /**
   * Run a benchmark function multiple times
   */
  async run(
    name: string,
    fn: () => Promise<void> | void,
    iterations: number = 1000,
  ): Promise<BenchmarkResult> {
    const times: number[] = [];

    // Warm up
    for (let i = 0; i < Math.min(100, iterations); i++) {
      await fn();
    }

    // Actual benchmark
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }

    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const opsPerSecond = 1000 / averageTime;

    const result: BenchmarkResult = {
      name,
      iterations,
      totalTime,
      averageTime,
      minTime,
      maxTime,
      opsPerSecond,
    };

    this.results.push(result);
    return result;
  }

  /**
   * Compare two benchmark results
   */
  compare(result1: BenchmarkResult, result2: BenchmarkResult): string {
    const improvement =
      ((result1.averageTime - result2.averageTime) / result1.averageTime) * 100;
    const faster = improvement > 0 ? result2.name : result1.name;
    const slower = improvement > 0 ? result1.name : result2.name;

    return `${faster} is ${Math.abs(improvement).toFixed(
      1,
    )}% faster than ${slower}`;
  }

  /**
   * Get all results
   */
  getResults(): BenchmarkResult[] {
    return this.results;
  }

  /**
   * Print results in a formatted way
   */
  printResults(): void {
    console.log("\n📊 Benchmark Results");
    console.log("=".repeat(60));

    this.results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.name}`);
      console.log(`   Iterations: ${result.iterations.toLocaleString()}`);
      console.log(`   Average: ${result.averageTime.toFixed(3)}ms`);
      console.log(
        `   Min/Max: ${result.minTime.toFixed(3)}ms / ${result.maxTime.toFixed(
          3,
        )}ms`,
      );
      console.log(`   Ops/sec: ${result.opsPerSecond.toLocaleString()}`);
    });

    if (this.results.length === 2) {
      console.log(`\n🔍 ${this.compare(this.results[0], this.results[1])}`);
    }

    console.log("=".repeat(60));
  }
}

/**
 * Create a simple benchmark for JSON operations
 */
export async function benchmarkJson(
  name: string,
  testData: any,
  parser: (data: string) => any,
  iterations: number = 1000,
): Promise<BenchmarkResult> {
  const jsonString = JSON.stringify(testData);
  const benchmark = new Benchmark();

  return await benchmark.run(
    name,
    async () => {
      const result = parser(jsonString);
      // Force evaluation to prevent optimization
      if (!result) throw new Error("Invalid result");
    },
    iterations,
  );
}

/**
 * Create a simple benchmark for middleware performance
 */
export async function benchmarkMiddleware(
  name: string,
  middleware: any,
  mockCtx: any,
  iterations: number = 1000,
): Promise<BenchmarkResult> {
  const benchmark = new Benchmark();

  return await benchmark.run(
    name,
    async () => {
      await middleware(mockCtx, async () => {});
    },
    iterations,
  );
}
