import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, extname, isAbsolute, join, relative, resolve, sep } from "node:path";

import type { DiagnosticRecord, FileRecord } from "../types.js";

export const SKIP_DIRS = new Set([
  ".git",
  ".hg",
  ".svn",
  ".DS_Store",
  ".cache",
  ".idea",
  ".vscode",
  ".venv",
  "venv",
  "env",
  "__pycache__",
  "node_modules",
  "bower_components",
  "vendor",
  "dist",
  "build",
  ".next",
  ".nuxt",
  ".turbo",
  ".pytest_cache",
  ".mypy_cache",
  ".ruff_cache",
  "coverage",
  ".tox",
  "target",
]);

export const PLACEHOLDER_RE = /\b(todo|tbd|placeholder|complete and informative|\[todo)/i;
export const SECRET_KEY_RE =
  /(token|secret|password|passwd|api[_-]?key|apikey|credential|private[_-]?key|client[_-]?secret)/i;

export function resolveWorkspaceRoot(input: string): string {
  const expanded = expandHome(input || ".");
  const root = resolve(expanded);
  try {
    const stat = statSync(root);
    return stat.isFile() ? resolve(root, "..") : root;
  } catch {
    return root;
  }
}

export function expandHome(input: string): string {
  if (input === "~") return homedir();
  if (input.startsWith(`~${sep}`)) return join(homedir(), input.slice(2));
  return input;
}

export function readText(path: string | undefined, limit = 500_000): string {
  if (!path) return "";
  try {
    const data = readFileSync(path);
    const truncated = data.length > limit;
    const text = data.subarray(0, limit).toString("utf8");
    return truncated ? `${text}\n[Truncated by AgentScope scanner]` : text;
  } catch {
    return "";
  }
}

export function readJson(path: string): unknown {
  if (!existsSync(path)) return undefined;
  try {
    return JSON.parse(readText(path, 500_000));
  } catch {
    return undefined;
  }
}

export function walkNamedFiles(root: string, names: string[]): string[] {
  if (!existsSync(root)) return [];
  const wanted = new Set(names);
  const matches: string[] = [];
  walk(root, (path, entryName, isDirectory) => {
    if (!isDirectory && wanted.has(entryName)) matches.push(path);
  });
  return matches.sort();
}

export function iterFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  const files: string[] = [];
  walk(root, (path, entryName, isDirectory) => {
    if (!isDirectory && entryName !== ".DS_Store") files.push(path);
  });
  return files.sort();
}

export function walk(root: string, visit: (path: string, name: string, isDirectory: boolean) => void): void {
  let entries;
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isDirectory() && (SKIP_DIRS.has(entry.name) || entry.name.endsWith(".app"))) continue;
    const path = join(root, entry.name);
    const isDirectory = entry.isDirectory();
    visit(path, entry.name, isDirectory);
    if (isDirectory) walk(path, visit);
  }
}

export function fileRecord(path: string, projectRoot: string): FileRecord {
  return {
    name: basename(path),
    path,
    relativePath: relPath(path, projectRoot),
    extension: extname(path),
    size: safeSize(path),
  };
}

export function safeSize(path: string): number {
  try {
    return statSync(path).size;
  } catch {
    return 0;
  }
}

export function relPath(path: string, root: string): string {
  try {
    const rel = relative(resolve(root), resolve(path));
    return rel && !rel.startsWith("..") && !isAbsolute(rel) ? rel : path;
  } catch {
    return path;
  }
}

export function isWithin(path: string, root: string): boolean {
  const rel = relative(resolve(root), resolve(path));
  return rel === "" || (!!rel && !rel.startsWith("..") && !isAbsolute(rel));
}

export function firstExisting(paths: string[]): string | undefined {
  return paths.find((path) => existsSync(path));
}

export function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const value = key(item);
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(item);
  }
  return out;
}

export function makeId(...parts: unknown[]): string {
  const raw = parts.map(String).join("|");
  const digest = createHash("sha1").update(raw).digest("hex").slice(0, 12);
  const label = String(parts[0] ?? "item").replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-|-$/g, "");
  return `${label || "item"}-${digest}`;
}

export function runGit(root: string, args: string[]): string {
  try {
    return execFileSync("git", ["-C", root, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

export function diag(
  severity: DiagnosticRecord["severity"],
  title: string,
  detail: string,
  path: string,
): DiagnosticRecord {
  return {
    id: makeId("diagnostic", severity, title, detail, path),
    severity,
    title,
    detail,
    path,
  };
}

export function countWhere<T, K extends keyof T>(items: T[], key: K, value: T[K]): number {
  return items.filter((item) => item[key] === value).length;
}

export function layerSortKey(layer: string): number {
  const order: Record<string, number> = { project: 0, user: 1, admin: 2, plugin: 3, system: 4, unknown: 5 };
  return order[layer] ?? 9;
}

export function normalizeList(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}
