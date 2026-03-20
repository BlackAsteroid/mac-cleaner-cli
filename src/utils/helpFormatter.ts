import chalk from "chalk";
import { Command, Help } from "commander";

const DIVIDER = chalk.gray("─".repeat(61));

const COMMANDS = {
  CLEAN: [
    { name: "all",      desc: "Clean everything at once (safe defaults)" },
    { name: "system",   desc: "Remove system logs, temp files & caches" },
    { name: "brew",     desc: "Clear Homebrew cache & old package versions" },
    { name: "node",     desc: "Wipe node_modules caches & npm/yarn/pnpm stores" },
    { name: "browser",  desc: "Remove browser caches (Chrome, Safari, Firefox, Arc)" },
    { name: "docker",   desc: "Delete unused images, containers & volumes" },
    { name: "xcode",    desc: "Clear Xcode derived data & simulator caches" },
    { name: "keychain", desc: "Audit stale Keychain entries (read-only)" },
    { name: "privacy",  desc: "Clear app usage history & recent files" },
    { name: "scan",     desc: "Scan caches for accidentally exposed secrets" },
  ],
  MAINTENANCE: [
    { name: "upgrade",  desc: "Update mac-cleaner to the latest version" },
  ],
  OTHER: [
    { name: "help [command]", desc: "Show help for a specific command" },
  ],
};

const COMMON_FLAGS = [
  { flag: "--dry-run",         desc: "Preview what would be deleted (no changes made)" },
  { flag: "--verbose, -v",     desc: "Show detailed output per file/folder" },
  { flag: "--json",            desc: "Output results as JSON (useful for scripts)" },
  { flag: "--no-sudo",         desc: "Skip privileged paths without prompting" },
  { flag: "-y, --yes",         desc: "Non-interactive / CI mode" },
  { flag: "--secure-delete",   desc: "Overwrite files before deletion (slower, safer)" },
  { flag: "--include-orphans", desc: "Also remove orphan node_modules (use carefully)" },
];

const EXAMPLES = [
  { cmd: "mac-cleaner all --dry-run",       comment: "# Preview full cleanup" },
  { cmd: "mac-cleaner node --verbose",      comment: "# Clean node with details" },
  { cmd: "mac-cleaner brew",                comment: "# Quick Homebrew cleanup" },
  { cmd: "mac-cleaner all --json | jq .",   comment: "# JSON output for scripting" },
  { cmd: "mac-cleaner scan",                comment: "# Check for leaked secrets" },
  { cmd: "mac-cleaner upgrade",             comment: "# Update to latest version" },
];

function col(name: string, width: number): string {
  return name.padEnd(width);
}

function renderCommandGroup(label: string, commands: Array<{ name: string; desc: string }>): string {
  const lines: string[] = [];
  lines.push(chalk.bold.white(label));
  lines.push(DIVIDER);
  for (const { name, desc } of commands) {
    lines.push(`  ${chalk.bold.cyan(col(name, 20))}${chalk.white(desc)}`);
  }
  lines.push("");
  return lines.join("\n");
}

export function customHelpFormatter(cmd: Command, _helper: Help): string {
  // Detect version from the program's version string
  const version = cmd.version() || "";

  const lines: string[] = [];

  // ── Header ────────────────────────────────────────────────────────────────
  lines.push("");
  lines.push(`${chalk.bold.cyan("🧹 mac-cleaner")} ${chalk.gray(version ? `v${version}` : "")}`);
  lines.push("");
  lines.push(chalk.italic.white("Clean dev caches on macOS — npm, Homebrew, Docker, Xcode, browsers, and more"));
  lines.push("");

  // ── Usage ─────────────────────────────────────────────────────────────────
  lines.push(chalk.bold.yellow("USAGE"));
  lines.push("");
  lines.push(`  mac-cleaner ${chalk.bold.cyan("<command>")} ${chalk.gray("[options]")}`);
  lines.push("");

  // ── Commands ──────────────────────────────────────────────────────────────
  lines.push(chalk.bold.yellow("COMMANDS"));
  lines.push("");
  lines.push(renderCommandGroup("CLEAN", COMMANDS.CLEAN));
  lines.push(renderCommandGroup("MAINTENANCE", COMMANDS.MAINTENANCE));
  lines.push(renderCommandGroup("OTHER", COMMANDS.OTHER));

  // ── Options ───────────────────────────────────────────────────────────────
  lines.push(chalk.bold.yellow("OPTIONS"));
  lines.push("");
  lines.push(`  ${chalk.bold.green(col("-V, --version", 28))}${chalk.gray("Print version number")}`);
  lines.push(`  ${chalk.bold.green(col("-h, --help", 28))}${chalk.gray("Show this help message")}`);
  lines.push("");

  lines.push(chalk.bold.yellow("COMMON FLAGS") + chalk.gray("  (all clean commands)"));
  lines.push("");
  for (const { flag, desc } of COMMON_FLAGS) {
    lines.push(`  ${chalk.bold.green(col(flag, 28))}${chalk.gray(desc)}`);
  }
  lines.push("");

  // ── Examples ──────────────────────────────────────────────────────────────
  lines.push(chalk.bold.yellow("EXAMPLES"));
  lines.push("");
  for (const { cmd: c, comment } of EXAMPLES) {
    lines.push(`  ${chalk.gray("$")} ${chalk.bold.white(c)}  ${chalk.gray(comment)}`);
  }
  lines.push("");

  // ── Docs ──────────────────────────────────────────────────────────────────
  lines.push(`  ${chalk.underline.blue("https://github.com/BlackAsteroid/mac-cleaner-cli")}`);
  lines.push("");

  return lines.join("\n");
}
