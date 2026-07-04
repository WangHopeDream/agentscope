import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { basename, extname, join, parse } from "node:path";

import { extractBullets, extractCommandLines, extractHeadings, parseFrontmatter, summarizeText } from "./markdown.js";
import { iterFiles, makeId, readText, relPath, safeSize } from "./fs.js";

import type { AgentCommandRecord, AgentScopeAdapter } from "../types.js";

interface CommandSourceRoot {
  path: string;
  adapter: AgentScopeAdapter;
  scope: "project" | "user";
  label: string;
  extensions: string[];
}

export function scanCommands(projectRoot: string, includeUser = true): AgentCommandRecord[] {
  const home = homedir();
  const roots: CommandSourceRoot[] = [
    {
      path: join(projectRoot, ".claude", "commands"),
      adapter: "claude-code",
      scope: "project",
      label: "Project .claude/commands",
      extensions: [".md"],
    },
    {
      path: join(projectRoot, ".cursor", "commands"),
      adapter: "cursor",
      scope: "project",
      label: "Project .cursor/commands",
      extensions: [".md", ".mdc"],
    },
  ];

  if (includeUser) {
    roots.push(
      {
        path: join(home, ".claude", "commands"),
        adapter: "claude-code",
        scope: "user",
        label: "User Claude Code commands",
        extensions: [".md"],
      },
      {
        path: join(home, ".cursor", "commands"),
        adapter: "cursor",
        scope: "user",
        label: "User Cursor commands",
        extensions: [".md", ".mdc"],
      },
    );
  }

  const commands: AgentCommandRecord[] = [];
  const seen = new Set<string>();
  for (const source of roots) {
    if (!existsSync(source.path)) continue;
    for (const path of iterFiles(source.path).filter((item) => source.extensions.includes(extname(item).toLowerCase()))) {
      if (seen.has(path)) continue;
      seen.add(path);
      commands.push(parseCommand(path, projectRoot, source));
    }
  }

  return commands.sort((a, b) => a.relativePath.localeCompare(b.relativePath) || a.name.localeCompare(b.name));
}

function parseCommand(path: string, projectRoot: string, source: CommandSourceRoot): AgentCommandRecord {
  const text = readText(path, 250_000);
  const { frontmatter, body } = parseFrontmatter(text);
  const name = commandName(path);
  return {
    id: makeId("command", source.adapter, path),
    kind: "agent-command",
    name,
    adapter: source.adapter,
    path,
    relativePath: relPath(path, projectRoot),
    scope: source.scope,
    sourceLabel: source.label,
    summary: summarizeText(frontmatter.description || body, `Agent command /${name}.`),
    frontmatter,
    headings: extractHeadings(body).slice(0, 12),
    bullets: extractBullets(body, 12),
    commands: extractCommandLines(body, 8),
    triggers: [`/${name}`],
    size: safeSize(path),
  };
}

function commandName(path: string): string {
  return parse(basename(path)).name;
}
