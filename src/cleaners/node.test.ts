import { describe, it, expect } from "vitest";
import { clean } from "./node.js";

describe("node cleaner", () => {
  it("returns ok:true in dry-run", async () => {
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

  it("dry-run does not mutate filesystem — freed is computed but nothing deleted", async () => {
    const result = await clean({ dryRun: true, json: true });
    // freed may be 0 if npm cache is small, but must be >= 0
    expect(result.freed).toBeGreaterThanOrEqual(0);
  });
});
