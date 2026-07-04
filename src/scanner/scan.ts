import { resolveWorkspaceRoot, countWhere } from "./fs.js";
import { scanCommands } from "./commands.js";
import { scanConfigs } from "./config.js";
import { collectDiagnostics } from "./diagnostics.js";
import { scanProject } from "./project.js";
import { scanRules } from "./rules.js";
import { scanSkills } from "./skills.js";
import { buildRelationships } from "./relationships.js";

import type { AgentScopeScan, ScanOptions, SourceLayer } from "../types.js";

export const AGENTSCOPE_VERSION = "0.1.0";

export function scanWorkspace(options: ScanOptions): AgentScopeScan {
  const projectRoot = resolveWorkspaceRoot(options.root);
  const project = scanProject(projectRoot);
  const rules = scanRules(projectRoot);
  const skills = scanSkills(projectRoot, options.includeUser !== false);
  const commands = scanCommands(projectRoot, options.includeUser !== false);
  const configs = scanConfigs(projectRoot, options.includeUser !== false);
  const diagnostics = collectDiagnostics(projectRoot, rules, skills, configs);
  const relationships = buildRelationships(project, rules, skills, commands, configs);
  const layers = Array.from(new Set(skills.map((skill) => skill.layer))).sort() as SourceLayer[];

  return {
    schemaVersion: "0.1.0",
    generator: {
      name: "agentscope",
      version: AGENTSCOPE_VERSION,
      generatedAt: new Date().toISOString(),
      runtime: `node ${process.version}`,
    },
    project,
    summary: {
      skillCount: skills.length,
      ruleCount: rules.length,
      commandCount: commands.length,
      projectSkillCount: countWhere(skills, "layer", "project"),
      userSkillCount: countWhere(skills, "layer", "user"),
      adminSkillCount: countWhere(skills, "layer", "admin"),
      pluginSkillCount: countWhere(skills, "layer", "plugin"),
      systemSkillCount: countWhere(skills, "layer", "system"),
      unknownSkillCount: countWhere(skills, "layer", "unknown"),
      automationCandidateCount: configs.automations.length,
      actionCandidateCount: configs.actions.length + configs.projectScripts.length,
      mcpServerCount: configs.mcpServers.length,
      hookCount: configs.hooks.length,
      diagnosticCount: diagnostics.length,
      layers,
      adapters: project.adapters,
      scanNotes: configs.scanNotes,
    },
    rules,
    skills,
    commands,
    configs,
    relationships,
    diagnostics,
  };
}
