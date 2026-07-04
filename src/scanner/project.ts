import { existsSync, readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";

import { extractReadmeDescription } from "./markdown.js";
import {
  fileRecord,
  firstExisting,
  isWithin,
  readJson,
  readText,
  relPath,
  runGit,
} from "./fs.js";

import type { AgentScopeAdapter, GitRepositoryRecord, ProjectIdentity } from "../types.js";

export function scanProject(projectRoot: string): ProjectIdentity {
  const packageJson = readJson(join(projectRoot, "package.json"));
  const readme = firstExisting([
    join(projectRoot, "README.md"),
    join(projectRoot, "Readme.md"),
    join(projectRoot, "readme.md"),
  ]);
  const readmeText = readme ? readText(readme, 80_000) : "";
  const description =
    packageJson && typeof packageJson === "object" && "description" in packageJson
      ? String((packageJson as { description?: unknown }).description || "")
      : extractReadmeDescription(readmeText);

  const keyFiles = [
    "AGENTS.md",
    "CLAUDE.md",
    ".cursorrules",
    ".cursor/rules",
    ".agents/skills",
    ".codex/skills",
    ".codex/config.toml",
    ".agents/config.toml",
    "package.json",
    "pyproject.toml",
    "Cargo.toml",
    "go.mod",
    "Makefile",
  ]
    .map((rel) => join(projectRoot, rel))
    .filter(existsSync)
    .map((path) => fileRecord(path, projectRoot));

  return {
    id: "project",
    name: basename(projectRoot),
    root: projectRoot,
    description: description || "No project description detected.",
    adapters: detectAdapters(projectRoot),
    git: {
      branch: runGit(projectRoot, ["branch", "--show-current"]),
      head: runGit(projectRoot, ["rev-parse", "--short", "HEAD"]),
      remote: runGit(projectRoot, ["remote", "get-url", "origin"]),
      childRepositories: scanChildRepositories(projectRoot),
    },
    keyFiles,
  };
}

export function detectAdapters(projectRoot: string): AgentScopeAdapter[] {
  const adapters = new Set<AgentScopeAdapter>();
  if (
    existsSync(join(projectRoot, "AGENTS.md")) ||
    existsSync(join(projectRoot, ".agents")) ||
    existsSync(join(projectRoot, ".codex"))
  ) {
    adapters.add("codex");
  }
  if (existsSync(join(projectRoot, "CLAUDE.md")) || existsSync(join(projectRoot, ".claude"))) {
    adapters.add("claude-code");
  }
  if (existsSync(join(projectRoot, ".cursor")) || existsSync(join(projectRoot, ".cursorrules"))) {
    adapters.add("cursor");
  }
  adapters.add("generic-folder");
  return Array.from(adapters);
}

export function scanChildRepositories(projectRoot: string): GitRepositoryRecord[] {
  const repos: GitRepositoryRecord[] = [];
  findGitDirectories(projectRoot, (gitDir) => {
    const repoRoot = gitDir.slice(0, -"/.git".length);
    if (repoRoot === projectRoot) return;
    if (!isWithin(repoRoot, projectRoot)) return;
    repos.push({
      path: repoRoot,
      relativePath: relPath(repoRoot, projectRoot),
      branch: runGit(repoRoot, ["branch", "--show-current"]),
      head: runGit(repoRoot, ["rev-parse", "--short", "HEAD"]),
      remote: runGit(repoRoot, ["remote", "get-url", "origin"]),
    });
  });
  return repos.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

function findGitDirectories(root: string, visit: (gitDir: string) => void, depth = 0): void {
  if (depth > 4) return;
  let entries;
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const path = join(root, entry.name);
    if (entry.name === ".git") {
      visit(path);
      continue;
    }
    if (["node_modules", "dist", "build", ".next", ".cache", ".venv", "venv"].includes(entry.name)) continue;
    try {
      if (!statSync(path).isDirectory()) continue;
    } catch {
      continue;
    }
    findGitDirectories(path, visit, depth + 1);
  }
}
