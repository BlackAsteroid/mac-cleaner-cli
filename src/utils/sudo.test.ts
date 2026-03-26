import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Readable, Writable } from "stream";

describe("promptSudoPassword", () => {
  const originalStdin = process.stdin;
  const originalStdout = process.stdout;
  let stdoutChunks: string[];

  beforeEach(() => {
    stdoutChunks = [];
  });

  afterEach(() => {
    Object.defineProperty(process, "stdin", { value: originalStdin, writable: true });
    Object.defineProperty(process, "stdout", { value: originalStdout, writable: true });
  });

  it("masks password with bullets and never echoes raw characters", async () => {
    // Create a fake stdin that we can push data into
    const fakeStdin = new Readable({ read() {} }) as Readable & { isTTY: boolean; setRawMode: () => Readable };
    fakeStdin.isTTY = true;
    fakeStdin.setRawMode = vi.fn().mockReturnThis();
    Object.defineProperty(process, "stdin", { value: fakeStdin, writable: true });

    // Capture stdout writes
    const fakeStdout = new Writable({
      write(chunk, _encoding, callback) {
        stdoutChunks.push(chunk.toString());
        callback();
      },
    });
    Object.defineProperty(process, "stdout", { value: fakeStdout, writable: true });

    const { promptSudoPassword } = await import("./sudo.js");
    const promise = promptSudoPassword(["/tmp/test"]);

    // Simulate typing "abc" then Enter
    fakeStdin.push(Buffer.from("a"));
    fakeStdin.push(Buffer.from("b"));
    fakeStdin.push(Buffer.from("c"));
    fakeStdin.push(Buffer.from("\r"));

    const result = await promise;
    const allOutput = stdoutChunks.join("");

    // Password buffer should contain "abc"
    expect(result.toString()).toBe("abc");

    // Output should contain bullets but NOT the raw characters after the prompt
    // The prompt text will contain the letter "a" in words like "path" and "elevated",
    // but the masking area should only show "•••"
    expect(allOutput).toContain("•••");

    // The raw password characters should NOT appear as consecutive echoed chars
    // between or alongside the bullets
    expect(allOutput).not.toMatch(/a•|•a|b•|•b|c•|•c/);
  });
});
