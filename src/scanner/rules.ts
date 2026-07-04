import { basename, dirname, join } from "node:path";

import {
  extractBullets,
  extractCommandLines,
  extractHeadings,
  summarizeText,
} from "./markdown.js";
import { makeId, readText, relPath, safeSize, walkNamedFiles, iterFiles } from "./fs.js";

import type { AgentScopeAdapter, RuleRecord } from "../types.js";

export function scanRules(projectRoot: string): RuleRecord[] {
  const rules: RuleRecord[] = [];
  for (const path of walkNamedFiles(projectRoot, ["AGENTS.md", "CLAUDE.md"])) {
    const name = basename(path);
    rules.push(parseRule(path, projectRoot, name === "AGENTS.md" ? "codex" : "claude-code"));
  }

  for (const path of cursorRuleFiles(projectRoot)) {
    rules.push(parseRule(path, projectRoot, "cursor"));
  }

  rules.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return rules;
}

function cursorRuleFiles(projectRoot: string): string[] {
  const explicit = walkNamedFiles(projectRoot, [".cursorrules"]);
  const cursorRulesRoot = join(projectRoot, ".cursor", "rules");
  return [...explicit, ...iterFiles(cursorRulesRoot).filter((path) => /\.(md|mdc|txt)$/i.test(path))];
}

function parseRule(path: string, projectRoot: string, adapter: AgentScopeAdapter): RuleRecord {
  const text = readText(path, 250_000);
  return {
    id: makeId("rule", path),
    kind: "agent-rule",
    name: basename(path),
    adapter,
    path,
    relativePath: relPath(path, projectRoot),
    scope: relPath(dirname(path), projectRoot) || ".",
    summary: summarizeText(text, "Agent guidance and operating rules."),
    headings: extractHeadings(text).slice(0, 12),
    bullets: extractBullets(text, 12),
    commands: extractCommandLines(text, 8),
    size: safeSize(path),
  };
}

