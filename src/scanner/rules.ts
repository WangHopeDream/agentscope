import { basename, dirname, join } from "node:path";

import {
  extractBullets,
  extractCommandLines,
  extractHeadings,
  parseFrontmatter,
  summarizeText,
} from "./markdown.js";
import { makeId, readText, relPath, safeSize, walkNamedFiles, iterFiles } from "./fs.js";

import type { AgentScopeAdapter, RuleRecord } from "../types.js";

export function scanRules(projectRoot: string): RuleRecord[] {
  const rules: RuleRecord[] = [];
  for (const path of walkNamedFiles(projectRoot, ["AGENTS.md", "CLAUDE.md", "CLAUDE.local.md"])) {
    const name = basename(path);
    rules.push(parseRule(path, projectRoot, name === "AGENTS.md" ? "codex" : "claude-code", name === "AGENTS.md" ? ["codex", "cursor"] : undefined));
  }

  for (const path of claudeRuleFiles(projectRoot)) {
    rules.push(parseRule(path, projectRoot, "claude-code"));
  }

  for (const path of cursorRuleFiles(projectRoot)) {
    rules.push(parseRule(path, projectRoot, "cursor"));
  }

  rules.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return rules;
}

function claudeRuleFiles(projectRoot: string): string[] {
  const claudeRulesRoot = join(projectRoot, ".claude", "rules");
  return iterFiles(claudeRulesRoot).filter((path) => /\.md$/i.test(path));
}

function cursorRuleFiles(projectRoot: string): string[] {
  const explicit = walkNamedFiles(projectRoot, [".cursorrules"]);
  const cursorRulesRoot = join(projectRoot, ".cursor", "rules");
  return [...explicit, ...iterFiles(cursorRulesRoot).filter((path) => /\.mdc$/i.test(path))];
}

function parseRule(path: string, projectRoot: string, adapter: AgentScopeAdapter, adapters?: AgentScopeAdapter[]): RuleRecord {
  const text = readText(path, 250_000);
  const { frontmatter, body } = parseFrontmatter(text);
  const summarySource = frontmatter.description || body;
  return {
    id: makeId("rule", path),
    kind: "agent-rule",
    name: basename(path),
    adapter,
    adapters: adapters || [adapter],
    path,
    relativePath: relPath(path, projectRoot),
    scope: relPath(dirname(path), projectRoot) || ".",
    summary: summarizeText(summarySource, "Agent guidance and operating rules."),
    headings: extractHeadings(body).slice(0, 12),
    bullets: extractBullets(body, 12),
    commands: extractCommandLines(body, 8),
    size: safeSize(path),
  };
}
