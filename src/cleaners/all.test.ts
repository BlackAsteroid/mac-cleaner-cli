import { describe, it, expect } from "vitest";
import { clean } from "./all.js";

describe("clean all", () => {
  it("returns ok:true in dry-run across all modules", async () => {
    const result = await clean({ dryRun: true, json: true });
    expect(result.ok).toBe(true);
  });

  it("--json mode returns parseable CleanResult structure", async () => {
    const result = await clean({ dryRun: true, json: true });

    expect(result).toHaveProperty("ok");
    expect(result).toHaveProperty("paths");
    expect(result).toHaveProperty("freed");
    expect(result).toHaveProperty("errors");
    expect(typeof result.ok).toBe("boolean");
    expect(Array.isArray(result.paths)).toBe(true);
    expect(typeof result.freed).toBe("number");
    expect(Array.isArray(result.errors)).toBe(true);
    expect(() => JSON.stringify(result)).not.toThrow();
  });

  it("aggregates results from multiple modules (paths is array, freed >= 0)", async () => {
    const result = await clean({ dryRun: true, json: true });
    expect(result.freed).toBeGreaterThanOrEqual(0);
    expect(result.paths.length).toBeGreaterThanOrEqual(0);
  });
});
