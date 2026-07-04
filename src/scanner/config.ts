import { existsSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join, parse } from "node:path";

import { SECRET_KEY_RE, isWithin, iterFiles, makeId, readJson, readText, relPath, uniqueBy } from "./fs.js";
import { firstSentence, summarizeText } from "./markdown.js";

import type { ConfigRecord, ConfigSurface, SurfaceRecord } from "../types.js";

export function scanConfigs(projectRoot: string, includeUser = true): ConfigSurface {
  const codexHome = process.env.CODEX_HOME || join(homedir(), ".codex");
  const projectConfigCandidates = [
    join(projectRoot, ".codex", "config.toml"),
    join(projectRoot, ".codex", "config.json"),
    join(projectRoot, ".codex", "requirements.toml"),
    join(projectRoot, "codex.toml"),
    join(projectRoot, ".agents", "config.toml"),
  ];
  const userConfigCandidates = [
    join(codexHome, "config.toml"),
    join(codexHome, "config.json"),
  ];
  const configCandidates = includeUser ? [...projectConfigCandidates, ...userConfigCandidates] : projectConfigCandidates;

  const configFiles: ConfigRecord[] = [];
  const mcpServers: SurfaceRecord[] = [];
  const hooks: SurfaceRecord[] = [];
  const actions: SurfaceRecord[] = [];
  const automations: SurfaceRecord[] = [];
  const projectScripts: SurfaceRecord[] = [];
  const scanNotes: string[] = [];

  for (const path of Array.from(new Set(configCandidates))) {
    if (!existsSync(path)) continue;
    const parsed = parseConfigFile(path);
    const record: ConfigRecord = {
      id: makeId("config", path),
      name: basename(path),
      path,
      relativePath: relPath(path, projectRoot),
      scope: isWithin(path, projectRoot) ? "project" : "user",
      format: parse(path).ext.replace(/^\./, "") || "config",
      summary: summarizeConfig(parsed),
      safeKeys: safeKeyTree(parsed),
    };
    configFiles.push(record);
    mcpServers.push(...extractMcpServers(parsed, record));
    hooks.push(...extractSurfaces(parsed, record, "hook", ["hook"]));
    actions.push(...extractSurfaces(parsed, record, "action", ["action", "command", "shortcut"]));
  }

  actions.push(...scanActionCandidates(projectRoot));
  automations.push(...scanAutomationCandidates(projectRoot, codexHome, includeUser));
  projectScripts.push(...scanProjectScripts(projectRoot));

  if (!automations.length) {
    scanNotes.push(
      "No local automation definitions were detected. App-side automations may not be visible to a static filesystem scan.",
    );
  }
  if (!actions.length && !projectScripts.length) {
    scanNotes.push("No local action candidates or project scripts were detected.");
  }

  return {
    configFiles,
    mcpServers: uniqueBy(mcpServers, (item) => item.id),
    hooks: uniqueBy(hooks, (item) => item.id),
    actions: uniqueBy(actions, (item) => item.id),
    automations: uniqueBy(automations, (item) => item.id),
    projectScripts: uniqueBy(projectScripts, (item) => item.id),
    scanNotes,
  };
}

function parseConfigFile(path: string): unknown {
  if (path.endsWith(".json")) {
    const parsed = readJson(path);
    return parsed ?? { _parseError: "Invalid JSON", _rawKeys: guessConfigKeys(readText(path, 250_000)) };
  }
  if (path.endsWith(".toml")) {
    return parseTomlShape(readText(path, 250_000));
  }
  return { _rawKeys: guessConfigKeys(readText(path, 250_000)) };
}

function parseTomlShape(text: string): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  let current: Record<string, unknown> = root;
  for (const line of text.split(/\r?\n/)) {
    const stripped = line.trim();
    if (!stripped || stripped.startsWith("#")) continue;
    const table = /^\[+([A-Za-z0-9_.-]+)\]+$/.exec(stripped);
    if (table) {
      current = ensurePath(root, table[1].split("."));
      continue;
    }
    const key = /^([A-Za-z0-9_.-]+)\s*=\s*(.*)$/.exec(stripped);
    if (!key) continue;
    current[key[1]] = parseScalarShape(key[2]);
  }
  return root;
}

function ensurePath(root: Record<string, unknown>, parts: string[]): Record<string, unknown> {
  let current = root;
  for (const part of parts) {
    if (!current[part] || typeof current[part] !== "object" || Array.isArray(current[part])) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  return current;
}

function parseScalarShape(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) return [];
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed.replace(/^["']|["']$/g, "");
}

function guessConfigKeys(text: string): string[] {
  const keys: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const stripped = line.trim();
    if (!stripped || stripped.startsWith("#")) continue;
    const table = /^\[+([A-Za-z0-9_.-]+)\]+/.exec(stripped);
    const key = /^([A-Za-z0-9_.-]+)\s*=/.exec(stripped);
    if (table) keys.push(table[1]);
    else if (key) keys.push(key[1]);
  }
  return Array.from(new Set(keys)).slice(0, 40);
}

function summarizeConfig(parsed: unknown): string {
  const keys = flattenKeys(parsed).slice(0, 10);
  return keys.length ? `Visible sections: ${keys.join(", ")}` : "Config file detected.";
}

function extractMcpServers(parsed: unknown, config: ConfigRecord): SurfaceRecord[] {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
  const root = parsed as Record<string, unknown>;
  const sections = ["mcp_servers", "mcpServers", "mcp", "servers"]
    .map((key) => [key, root[key]] as const)
    .filter(([, value]) => value && typeof value === "object" && !Array.isArray(value));
  const servers: SurfaceRecord[] = [];
  for (const [sectionName, section] of sections) {
    for (const [name, value] of Object.entries(section as Record<string, unknown>)) {
      servers.push({
        id: makeId("mcp", config.path, sectionName, name),
        name,
        path: config.path,
        source: config.relativePath,
        summary: summarizeValueShape(value),
      });
    }
  }
  return servers;
}

function extractSurfaces(
  parsed: unknown,
  config: ConfigRecord,
  idPrefix: string,
  keywords: string[],
): SurfaceRecord[] {
  const items: SurfaceRecord[] = [];
  for (const [keyPath, value] of walkMapping(parsed)) {
    const joined = keyPath.join(".");
    const lower = joined.toLowerCase();
    if (!keywords.some((keyword) => lower.includes(keyword))) continue;
    items.push({
      id: makeId(idPrefix, config.path, joined),
      name: joined,
      path: config.path,
      source: config.relativePath,
      summary: summarizeValueShape(value),
    });
  }
  return items.slice(0, 80);
}

function scanActionCandidates(projectRoot: string): SurfaceRecord[] {
  const candidates = [
    join(projectRoot, ".codex", "actions"),
    join(projectRoot, ".codex", "actions.toml"),
    join(projectRoot, ".codex", "actions.json"),
    join(projectRoot, ".codex", "local-actions"),
    join(projectRoot, ".agents", "actions"),
    join(projectRoot, ".agents", "actions.toml"),
    join(projectRoot, ".agents", "actions.json"),
  ].flatMap((path) => (existsSync(path) ? (isDirectory(path) ? iterFiles(path) : [path]) : []));

  return candidates
    .filter((path) => !isDirectory(path))
    .slice(0, 100)
    .map((path) => ({
      id: makeId("local-action", path),
      name: parse(path).name,
      path,
      relativePath: relPath(path, projectRoot),
      summary: summarizeText(readText(path, 30_000), "Local action candidate."),
    }));
}

function scanAutomationCandidates(projectRoot: string, codexHome: string, includeUser: boolean): SurfaceRecord[] {
  const projectCandidates = [
    join(projectRoot, ".codex", "automations"),
    join(projectRoot, ".agents", "automations"),
    join(projectRoot, ".codex", "automation.toml"),
    join(projectRoot, ".codex", "automations.toml"),
    join(projectRoot, ".codex", "automations.json"),
  ];
  const userCandidates = [
    join(codexHome, "automations"),
  ];
  const candidates = (includeUser ? [...projectCandidates, ...userCandidates] : projectCandidates).flatMap((path) =>
    existsSync(path) ? (isDirectory(path) ? iterFiles(path) : [path]) : [],
  );

  return candidates
    .filter((path) => !isDirectory(path))
    .slice(0, 100)
    .map((path) => ({
      id: makeId("automation", path),
      name: parse(path).name,
      path,
      relativePath: relPath(path, projectRoot),
      scope: isWithin(path, projectRoot) ? "project" : "user",
      summary: summarizeText(readText(path, 40_000), "Automation candidate."),
    }));
}

function scanProjectScripts(projectRoot: string): SurfaceRecord[] {
  const scripts: SurfaceRecord[] = [];
  const packageJson = readJson(join(projectRoot, "package.json"));
  if (
    packageJson &&
    typeof packageJson === "object" &&
    "scripts" in packageJson &&
    packageJson.scripts &&
    typeof packageJson.scripts === "object"
  ) {
    for (const [name, command] of Object.entries(packageJson.scripts as Record<string, unknown>).sort()) {
      scripts.push({
        id: makeId("package-script", projectRoot, name),
        name: `npm run ${name}`,
        source: "package.json",
        path: join(projectRoot, "package.json"),
        summary: String(command),
      });
    }
  }

  for (const rel of ["Makefile", "justfile", "Taskfile.yml", "Taskfile.yaml"]) {
    const path = join(projectRoot, rel);
    if (!existsSync(path)) continue;
    scripts.push({
      id: makeId("project-script", path),
      name: rel,
      source: rel,
      path,
      summary: summarizeText(readText(path, 80_000), `${rel} detected.`),
    });
  }
  return scripts.slice(0, 120);
}

function safeKeyTree(value: unknown): unknown {
  if (Array.isArray(value)) return value.slice(0, 20).map(safeKeyTree);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = SECRET_KEY_RE.test(key) ? "[redacted]" : safeKeyTree(child);
    }
    return out;
  }
  if (typeof value === "string") return SECRET_KEY_RE.test(value) ? "[redacted]" : firstSentence(value, 120);
  return value;
}

function flattenKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const keys: string[] = [];
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    keys.push(path);
    keys.push(...flattenKeys(child, path));
  }
  return keys;
}

function* walkMapping(value: unknown, prefix: string[] = []): Iterable<[string[], unknown]> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      const path = [...prefix, key];
      yield [path, child];
      yield* walkMapping(child, path);
    }
  } else if (Array.isArray(value)) {
    for (const [index, child] of value.slice(0, 50).entries()) {
      yield* walkMapping(child, [...prefix, String(index)]);
    }
  }
}

function summarizeValueShape(value: unknown): string {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const keys = Object.keys(value).filter((key) => !SECRET_KEY_RE.test(key));
    return keys.length ? `Keys: ${keys.slice(0, 8).join(", ")}` : "Configured with redacted or empty keys.";
  }
  if (Array.isArray(value)) return `List with ${value.length} entries.`;
  if (typeof value === "string") return SECRET_KEY_RE.test(value) ? "[redacted]" : firstSentence(value, 140);
  return String(value);
}

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}
