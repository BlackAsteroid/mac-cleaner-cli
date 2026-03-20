import * as fs from "fs";
import * as path from "path";
import { spawnSync } from "child_process";

/**
 * Resolves symlinks and validates that `targetPath` is contained within
 * `allowedBase` before deletion. Prevents symlink-based path traversal attacks.
 *
 * Security (#43): an attacker could plant a symlink in a project directory
 * pointing to /etc or /System. Without this check, `fs.rmSync` would follow
 * the symlink and delete the real target.
 *
 * @returns true if the path is safe to delete, false otherwise.
 */
// Issue #79: On macOS, /tmp is a system symlink → /private/tmp.
// Both prefixes are valid and should be treated as equivalent.
// Without this normalization, paths under /tmp are incorrectly flagged
// as symlink escapes when the allowedBase is os.homedir() (which resolves
// under /Users/... or /private/Users/... depending on realpathSync).
const MACOS_SYSTEM_SYMLINKS: Record<string, string> = {
  "/tmp": "/private/tmp",
  "/var": "/private/var",
  "/etc": "/private/etc",
};

function normalizeMacOSPath(p: string): string {
  for (const [alias, real] of Object.entries(MACOS_SYSTEM_SYMLINKS)) {
    if (p === alias || p.startsWith(alias + path.sep)) {
      return real + p.slice(alias.length);
    }
  }
  return p;
}

export function isSafeToDelete(targetPath: string, allowedBase: string): boolean {
  try {
    // Resolve symlinks to their real paths
    const resolvedTarget = normalizeMacOSPath(fs.realpathSync(targetPath));
    const resolvedBase = normalizeMacOSPath(fs.realpathSync(allowedBase));

    // Ensure the resolved path is strictly within the allowed base,
    // OR is one of the known macOS system temp/log paths (always safe to clean)
    const isInBase = resolvedTarget === resolvedBase ||
      resolvedTarget.startsWith(resolvedBase + path.sep);

    if (isInBase) return true;

    // Allow known macOS system paths that are valid targets regardless of allowedBase
    const knownSafePrefixes = ["/private/tmp", "/private/var/log", "/private/var/folders"];
    return knownSafePrefixes.some(
      (prefix) => resolvedTarget === prefix || resolvedTarget.startsWith(prefix + path.sep)
    );
  } catch {
    // If realpathSync fails (path doesn't exist, permission denied),
    // the path cannot be safely validated — reject it.
    return false;
  }
}

/**
 * Safe wrapper around fs.rmSync that validates the path via symlink resolution
 * before deleting. Returns bytes freed, or 0 if skipped due to safety check.
 */
export function safeRmSync(
  targetPath: string,
  allowedBase: string,
  errors: string[]
): number {
  if (!isSafeToDelete(targetPath, allowedBase)) {
    errors.push(`Skipped (symlink escape detected): ${targetPath}`);
    return 0;
  }

  try {
    // Measure size before deletion
    const du = spawnSync("du", ["-sk", targetPath], { encoding: "utf8" });
    let size = 0;
    if (du.stdout) {
      const kb = parseInt(du.stdout.split("\t")[0], 10);
      if (!isNaN(kb)) size = kb * 1024;
    }
    fs.rmSync(targetPath, { recursive: true, force: true });
    return size;
  } catch (err) {
    errors.push(`Failed to remove ${targetPath}: ${(err as Error).message}`);
    return 0;
  }
}
