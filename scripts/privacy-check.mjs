#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const patterns = [
  "/Users/simon",
  "/Users/",
  "Desktop/BA",
  "\\bBA\\b",
  "biga",
  "token",
  "secret",
  "password",
  "api[_-]?key",
  "private[_-]?key",
  "client[_-]?secret",
  "codex-workflow-map",
  "agent-workflow-map",
  "agentscope-report",
  "self-scan",
];

const allowList = [
  [".gitignore", ""],
  [".gitignore", "agentscope-report"],
  [".gitignore", "codex-workflow-map"],
  [".gitignore", "agent-workflow-map"],
  ["package.json", "self-scan"],
  ["docs/ARCHITECTURE.md", "BA-specific assumptions"],
  ["scripts/privacy-check.mjs", ""],
  ["src/scanner/config.ts", "SECRET_KEY_RE"],
  ["src/scanner/fs.ts", "SECRET_KEY_RE"],
  ["src/scanner/fs.ts", "token|secret|password"],
  ["src/cli.ts", "agentscope-report.html"],
  ["src/renderers/html.ts", "agentscope-report.html"],
];

const candidates = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

const matcher = new RegExp(patterns.join("|"), "i");
const findings = [];

for (const file of candidates) {
  if (!existsSync(file) || !statSync(file).isFile()) continue;
  const text = readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!matcher.test(line)) return;
    if (allowed(file, line)) return;
    findings.push(`${file}:${index + 1}: ${line.trim()}`);
  });
}

if (findings.length) {
  console.error("Privacy check failed. Review these tracked lines before pushing:\n");
  console.error(findings.slice(0, 80).join("\n"));
  if (findings.length > 80) console.error(`...and ${findings.length - 80} more`);
  process.exit(1);
}

console.log("Privacy check passed: no tracked private path, secret-looking key, or generated report marker found.");

function allowed(file, line) {
  const normalized = file.replaceAll("\\", "/");
  return allowList.some(([allowedFile, phrase]) => {
    if (normalized !== allowedFile) return false;
    return !phrase || line.includes(phrase);
  });
}
