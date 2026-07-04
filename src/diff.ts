import type { AgentScopeScan } from "./types.js";

export interface ScanDiff {
  schemaVersion: "0.1.0";
  oldProject: string;
  newProject: string;
  rules: CollectionDiff;
  skills: CollectionDiff;
  diagnostics: CollectionDiff;
  counts: {
    oldSkills: number;
    newSkills: number;
    oldRules: number;
    newRules: number;
    oldDiagnostics: number;
    newDiagnostics: number;
  };
}

export interface CollectionDiff {
  added: string[];
  removed: string[];
  changed: string[];
}

export function diffScans(oldScan: AgentScopeScan, newScan: AgentScopeScan): ScanDiff {
  return {
    schemaVersion: "0.1.0",
    oldProject: oldScan.project.root,
    newProject: newScan.project.root,
    rules: diffCollections(
      oldScan.rules.map((rule) => ({ key: rule.relativePath, fingerprint: JSON.stringify([rule.summary, rule.bullets, rule.commands]) })),
      newScan.rules.map((rule) => ({ key: rule.relativePath, fingerprint: JSON.stringify([rule.summary, rule.bullets, rule.commands]) })),
    ),
    skills: diffCollections(
      oldScan.skills.map((skill) => ({ key: `${skill.layer}:${skill.name}`, fingerprint: skillFingerprint(skill) })),
      newScan.skills.map((skill) => ({ key: `${skill.layer}:${skill.name}`, fingerprint: skillFingerprint(skill) })),
    ),
    diagnostics: diffCollections(
      oldScan.diagnostics.map((item) => ({ key: `${item.severity}:${item.title}:${item.path}`, fingerprint: item.detail })),
      newScan.diagnostics.map((item) => ({ key: `${item.severity}:${item.title}:${item.path}`, fingerprint: item.detail })),
    ),
    counts: {
      oldSkills: oldScan.summary.skillCount,
      newSkills: newScan.summary.skillCount,
      oldRules: oldScan.summary.ruleCount,
      newRules: newScan.summary.ruleCount,
      oldDiagnostics: oldScan.summary.diagnosticCount,
      newDiagnostics: newScan.summary.diagnosticCount,
    },
  };
}

function diffCollections(
  oldItems: Array<{ key: string; fingerprint: string }>,
  newItems: Array<{ key: string; fingerprint: string }>,
): CollectionDiff {
  const oldMap = new Map(oldItems.map((item) => [item.key, item.fingerprint]));
  const newMap = new Map(newItems.map((item) => [item.key, item.fingerprint]));
  const added = Array.from(newMap.keys()).filter((key) => !oldMap.has(key)).sort();
  const removed = Array.from(oldMap.keys()).filter((key) => !newMap.has(key)).sort();
  const changed = Array.from(newMap.keys())
    .filter((key) => oldMap.has(key) && oldMap.get(key) !== newMap.get(key))
    .sort();
  return { added, removed, changed };
}

function skillFingerprint(skill: AgentScopeScan["skills"][number]): string {
  return JSON.stringify([
    skill.description,
    skill.workflow,
    skill.resources.counts,
    skill.triggers,
    skill.scenarios,
    skill.diagnostics.map((item) => [item.severity, item.title]),
  ]);
}

