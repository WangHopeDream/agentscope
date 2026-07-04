import { constants, existsSync, accessSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, extname, join, resolve } from "node:path";

import {
  PLACEHOLDER_RE,
  diag,
  fileRecord,
  isWithin,
  iterFiles,
  layerSortKey,
  makeId,
  normalizeList,
  readText,
  relPath,
  walkNamedFiles,
} from "./fs.js";
import {
  cleanScalar,
  collapseSpace,
  extractHeadings,
  extractSteps,
  firstSection,
  firstSentence,
  parseFrontmatter,
  summarizeText,
} from "./markdown.js";

import type {
  DiagnosticRecord,
  FileRecord,
  ScriptRecord,
  SkillRecord,
  SkillResources,
  SourceLayer,
  WorkflowRecord,
} from "../types.js";

interface SkillSourceRoot {
  path: string;
  layer: SourceLayer;
  label: string;
  excludeParts?: string[];
}

export function scanSkills(projectRoot: string, includeUser = true): SkillRecord[] {
  const sourceRoots = discoverSkillSourceRoots(projectRoot, includeUser);
  const seen = new Set<string>();
  const skills: SkillRecord[] = [];

  for (const source of sourceRoots) {
    if (!existsSync(source.path)) continue;
    const excludeParts = new Set(source.excludeParts || []);
    for (const skillFile of walkNamedFiles(source.path, ["SKILL.md"])) {
      const parts = skillFile.split(/[\\/]/);
      if (parts.some((part) => excludeParts.has(part))) continue;
      const real = resolve(skillFile);
      if (seen.has(real)) continue;
      seen.add(real);
      skills.push(parseSkill(skillFile, projectRoot, source));
    }
  }

  enrichSkillRelationships(skills);
  skills.sort((a, b) => {
    const layerDelta = layerSortKey(a.layer) - layerSortKey(b.layer);
    if (layerDelta) return layerDelta;
    return a.name.localeCompare(b.name) || a.path.localeCompare(b.path);
  });
  return skills;
}

function discoverSkillSourceRoots(projectRoot: string, includeUser: boolean): SkillSourceRoot[] {
  const home = homedir();
  const codexHome = process.env.CODEX_HOME || join(home, ".codex");
  const roots: SkillSourceRoot[] = [
    { path: join(projectRoot, ".agents", "skills"), layer: "project", label: "Project .agents/skills" },
    { path: join(projectRoot, ".codex", "skills"), layer: "project", label: "Project .codex/skills" },
  ];

  if (!includeUser) return roots;

  roots.push(
    {
      path: join(codexHome, "skills", ".system"),
      layer: "system",
      label: "Codex system skills",
    },
    {
      path: join(codexHome, "plugins", "cache"),
      layer: "plugin",
      label: "Codex plugin cache",
    },
    {
      path: join(codexHome, "admin", "skills"),
      layer: "admin",
      label: "Managed admin skills",
    },
    {
      path: "/Library/Application Support/Codex/skills",
      layer: "admin",
      label: "System-wide admin skills",
    },
    {
      path: "/Library/Application Support/OpenAI/Codex/skills",
      layer: "admin",
      label: "OpenAI Codex admin skills",
    },
    {
      path: join(codexHome, "skills"),
      layer: "user",
      label: "User Codex skills",
      excludeParts: [".system"],
    },
    {
      path: join(home, ".agents", "skills"),
      layer: "user",
      label: "User agent skills",
    },
  );

  if (codexHome !== join(home, ".codex")) {
    roots.push({
      path: join(home, ".codex", "skills"),
      layer: "user",
      label: "Fallback ~/.codex/skills",
      excludeParts: [".system"],
    });
  }

  return roots;
}

function parseSkill(skillFile: string, projectRoot: string, source: SkillSourceRoot): SkillRecord {
  const text = readText(skillFile, 700_000);
  const { frontmatter, body } = parseFrontmatter(text);
  const folder = dirname(skillFile);
  const name = cleanScalar(frontmatter.name) || basename(folder);
  const description = cleanScalar(frontmatter.description) || "";
  const interfaceConfig = parseOpenAiYaml(join(folder, "agents", "openai.yaml"));
  const displayName = interfaceConfig.display_name || name;
  const resources = scanSkillResources(folder, projectRoot);
  const workflow = extractWorkflow(body, description, name);
  const triggers = extractTriggers(description, name);
  const scenarios = classifyScenarios(name, description, body);
  const headings = extractHeadings(body);
  const summary = summarizeSkill(name, description, body);
  const diagnostics = skillDiagnostics(name, description, body, resources, skillFile);

  return {
    id: makeId("skill", skillFile),
    kind: "skill",
    adapter: "codex",
    name,
    displayName,
    description,
    summary,
    layer: resolveSkillLayer(skillFile, source, projectRoot),
    sourceLabel: source.label,
    path: skillFile,
    folder,
    relativePath: relPath(skillFile, projectRoot),
    frontmatter,
    interface: interfaceConfig,
    triggers,
    scenarios,
    workflow,
    headings: headings.slice(0, 24),
    resources,
    bodyStats: {
      characters: body.length,
      lines: body.split(/\r?\n/).length,
      headingCount: headings.length,
    },
    diagnostics,
    mentions: [],
    rawHints: extractRawHints(body, description),
  };
}

function resolveSkillLayer(skillFile: string, source: SkillSourceRoot, projectRoot: string): SourceLayer {
  if (isWithin(skillFile, join(projectRoot, ".agents", "skills"))) return "project";
  if (isWithin(skillFile, join(projectRoot, ".codex", "skills"))) return "project";
  const parts = new Set(skillFile.split(/[\\/]/));
  if (parts.has(".system")) return "system";
  if (parts.has("plugins") && parts.has("cache")) return "plugin";
  if (parts.has("admin")) return "admin";
  return source.layer || "unknown";
}

function scanSkillResources(folder: string, projectRoot: string): SkillResources {
  const references = listResourceFiles(join(folder, "references"), projectRoot);
  const scripts = listScriptFiles(join(folder, "scripts"), projectRoot);
  const assets = listResourceFiles(join(folder, "assets"), projectRoot);
  const agents = listResourceFiles(join(folder, "agents"), projectRoot);
  return {
    references,
    scripts,
    assets,
    agents,
    counts: {
      references: references.length,
      scripts: scripts.length,
      assets: assets.length,
      agents: agents.length,
    },
  };
}

function listResourceFiles(base: string, projectRoot: string): FileRecord[] {
  if (!existsSync(base)) return [];
  return iterFiles(base).map((path) => fileRecord(path, projectRoot));
}

function listScriptFiles(base: string, projectRoot: string): ScriptRecord[] {
  return listResourceFiles(base, projectRoot).map((item) => {
    const firstLine = readText(item.path, 400).split(/\r?\n/)[0] || "";
    return {
      ...item,
      executable: isExecutable(item.path),
      hasShebang: firstLine.startsWith("#!"),
      language: detectScriptLanguage(item.path, firstLine),
    };
  });
}

function isExecutable(path: string): boolean {
  try {
    accessSync(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function detectScriptLanguage(path: string, firstLine: string): string {
  const suffix = extname(path).toLowerCase();
  if (firstLine.includes("python") || suffix === ".py") return "Python";
  if (/(bash|zsh|sh)/.test(firstLine) || [".sh", ".bash", ".zsh"].includes(suffix)) return "Shell";
  if ([".js", ".mjs", ".cjs"].includes(suffix)) return "JavaScript";
  if (suffix === ".ts") return "TypeScript";
  if (suffix === ".rb") return "Ruby";
  if (suffix === ".go") return "Go";
  return suffix.replace(/^\./, "").toUpperCase() || "Script";
}

function parseOpenAiYaml(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const text = readText(path, 40_000);
  const ui: Record<string, string> = {};
  let inInterface = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^interface:\s*$/.test(line)) {
      inInterface = true;
      continue;
    }
    if (inInterface && line && !/^\s/.test(line)) inInterface = false;
    if (!inInterface) continue;
    const match = /^\s+([A-Za-z0-9_-]+):\s*(.*)\s*$/.exec(line);
    if (match) ui[match[1]] = cleanScalar(match[2]);
  }
  return ui;
}

function extractWorkflow(body: string, description: string, name: string): WorkflowRecord {
  const section = firstSection(body, [
    "workflow",
    "workflow decision tree",
    "process",
    "steps",
    "operating stance",
    "quick start",
    "core capabilities",
  ]);
  let source: WorkflowRecord["source"] = section ? "explicit" : "inferred";
  let steps = extractSteps(section || body);
  if (!steps.length) {
    steps = inferWorkflowSteps(description, body, name);
    source = "inferred";
  }
  const outputSection = firstSection(body, ["output shape", "output", "deliverables"]);
  const guardrailSection = firstSection(body, ["guardrails", "quality rules", "quality checks"]);
  return {
    source,
    steps: steps.slice(0, 10),
    outputs: outputSection ? extractSteps(outputSection).slice(0, 8) : [],
    guardrails: guardrailSection ? extractSteps(guardrailSection).slice(0, 8) : [],
  };
}

function inferWorkflowSteps(description: string, body: string, name: string): string[] {
  const lower = `${description}\n${body}`.toLowerCase();
  const steps = [
    `Trigger ${name} explicitly or through a matching project-workflow request.`,
    "Load the skill instructions and inspect the target workspace context.",
  ];
  if (lower.includes("reference") || lower.includes("references/")) {
    steps.push("Load only the relevant reference files for the task.");
  }
  if (lower.includes("script") || lower.includes("scripts/")) {
    steps.push("Run bundled scripts when deterministic scanning or generation is needed.");
  }
  if (/(verify|test|validate|qa)/.test(lower)) {
    steps.push("Verify the result with the checks named by the skill.");
  }
  steps.push("Return the requested artifact or decision-focused summary.");
  return steps;
}

function extractTriggers(description: string, name: string): string[] {
  const triggers = [`$${name}`];
  const desc = collapseSpace(description);
  const useWhen = /use when\s+(.+?)(?:\.|$)/i.exec(desc);
  if (useWhen) triggers.push(useWhen[1].trim());
  for (const match of desc.matchAll(/['"]([^'"]{3,90})['"]/g)) {
    triggers.push(match[1]);
  }
  return normalizeList(triggers.slice(0, 10));
}

function classifyScenarios(name: string, description: string, body: string): string[] {
  const text = `${name}\n${description}\n${body}`.toLowerCase();
  const rules: Array<[string, string[]]> = [
    ["Project Intel", ["workflow map", "project map", "audit", "inventory", "customization", "inspect"]],
    ["Planning", ["plan", "planning", "strategy", "advisor", "proposal", "prd", "requirement"]],
    ["Implementation", ["implement", "code", "build", "feature", "develop", "scaffold"]],
    ["Debugging", ["bug", "debug", "fix", "error", "failure", "failing", "incident"]],
    ["Review", ["review", "pull request", "pr ", "comments", "requested changes"]],
    ["QA", ["test", "qa", "verify", "validation", "screenshot", "lint", "ci"]],
    ["Release", ["release", "deploy", "deployment", "changelog", "version", "publish"]],
    ["Documentation", ["doc", "document", "markdown", "report", "readme", "pdf", "slides"]],
    ["Data", ["spreadsheet", "csv", "table", "database", "query", "analytics", "chart"]],
    ["External Systems", ["github", "gmail", "notion", "lark", "calendar", "email", "mcp"]],
    ["Automation/Ops", ["automation", "scheduled", "monitor", "cron", "workflow", "hook"]],
    ["Visual/UI", ["frontend", "ui", "image", "browser", "visual", "html", "css", "design"]],
  ];
  const matches = rules
    .filter(([, words]) => words.some((word) => text.includes(word)))
    .map(([label]) => label)
    .slice(0, 5);
  return matches.length ? matches : ["General"];
}

function summarizeSkill(name: string, description: string, body: string): string {
  if (description && !PLACEHOLDER_RE.test(description)) {
    return firstSentence(description.replace(/^use when\s+/i, "").trim(), 180);
  }
  return summarizeText(body, `Skill instructions for ${name}.`, 180);
}

function skillDiagnostics(
  name: string,
  description: string,
  body: string,
  resources: SkillResources,
  skillFile: string,
): DiagnosticRecord[] {
  const items: DiagnosticRecord[] = [];
  if (!name || PLACEHOLDER_RE.test(name)) {
    items.push(diag("error", "Skill has missing name", "The YAML frontmatter name is missing or placeholder text.", skillFile));
  }
  if (!description || PLACEHOLDER_RE.test(description)) {
    items.push(
      diag("error", `$${name} has missing description`, "The description is required for reliable discovery and triggering.", skillFile),
    );
  } else if (description.length < 40) {
    items.push(
      diag("warning", `$${name} description is very short`, "Short descriptions make implicit triggering and overview summaries less reliable.", skillFile),
    );
  }
  if (body.length > 45_000) {
    items.push(
      diag("warning", `$${name} has a large SKILL.md body`, "Large skill bodies can consume context. Consider moving details to references/.", skillFile),
    );
  }
  for (const script of resources.scripts) {
    if (!script.hasShebang) {
      items.push(diag("info", `$${name} script has no shebang`, `${script.name} may still run, but a shebang makes it clearer.`, script.path));
    }
    if (!script.executable) {
      items.push(
        diag(
          "info",
          `$${name} script is not executable`,
          `${script.name} can still be run through an interpreter, but executable permissions are absent.`,
          script.path,
        ),
      );
    }
  }
  return items;
}

function enrichSkillRelationships(skills: SkillRecord[]): void {
  const names = new Set(skills.map((skill) => skill.name));
  for (const skill of skills) {
    const text = [
      skill.description,
      skill.workflow.steps.join(" "),
      skill.rawHints.join(" "),
    ].join(" ");
    skill.mentions = Array.from(names)
      .filter((name) => name !== skill.name)
      .filter((name) => new RegExp(`\\$${escapeRegExp(name)}\\b`).test(text) || new RegExp(`\\b${escapeRegExp(name)}\\b`).test(text))
      .sort();
  }
}

function extractRawHints(body: string, description: string): string[] {
  const text = `${description}\n${body}`;
  const hints = [
    ...Array.from(text.matchAll(/\$[a-z0-9][a-z0-9-]+/gi)).map((match) => match[0]),
    ...Array.from(text.matchAll(/(?:references|scripts|assets)\/[A-Za-z0-9_./-]+/gi)).map((match) => match[0]),
  ];
  return normalizeList(hints).slice(0, 40);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
