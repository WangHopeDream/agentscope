import { existsSync } from "node:fs";
import { join } from "node:path";

import { diag } from "./fs.js";

import type { ConfigSurface, DiagnosticRecord, RuleRecord, SkillRecord } from "../types.js";

export function collectDiagnostics(
  projectRoot: string,
  rules: RuleRecord[],
  skills: SkillRecord[],
  configs: ConfigSurface,
): DiagnosticRecord[] {
  const diagnostics: DiagnosticRecord[] = [];
  if (!rules.length) {
    diagnostics.push(diag("info", "No agent rules detected", "The workspace has no visible AGENTS.md, CLAUDE.md, or Cursor rules.", projectRoot));
  }

  const byName = new Map<string, SkillRecord[]>();
  for (const skill of skills) {
    byName.set(skill.name, [...(byName.get(skill.name) || []), skill]);
    diagnostics.push(...skill.diagnostics);
  }

  for (const [name, group] of Array.from(byName.entries()).sort()) {
    if (group.length <= 1) continue;
    diagnostics.push(
      diag(
        "warning",
        `Duplicate Skill name: ${name}`,
        "Multiple skills share this name across layers. The active agent may show or consider more than one.",
        group.map((item) => item.relativePath).join(", "),
      ),
    );
  }

  const projectSkillDirs = [
    join(projectRoot, ".agents", "skills"),
    join(projectRoot, ".codex", "skills"),
    join(projectRoot, ".claude", "skills"),
    join(projectRoot, ".cursor", "skills"),
  ];
  for (const projectSkillDir of projectSkillDirs) {
    if (!existsSync(projectSkillDir)) continue;
    if (skills.some((skill) => skill.layer === "project" && skill.path.startsWith(projectSkillDir))) continue;
    diagnostics.push(
      diag(
        "warning",
        "Project Skill directory is empty",
        `${projectSkillDir} exists but no SKILL.md files were found below it.`,
        projectSkillDir,
      ),
    );
  }

  for (const note of configs.scanNotes) {
    diagnostics.push(diag("info", "Scan visibility note", note, projectRoot));
  }

  return diagnostics;
}
