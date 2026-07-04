export type AgentScopeAdapter = "codex" | "claude-code" | "cursor" | "generic-folder";

export type SourceLayer = "project" | "user" | "admin" | "plugin" | "system" | "unknown";

export type DiagnosticSeverity = "info" | "warning" | "error";

export interface FileRecord {
  name: string;
  path: string;
  relativePath: string;
  extension: string;
  size: number;
}

export interface ProjectIdentity {
  id: "project";
  name: string;
  root: string;
  description: string;
  adapters: AgentScopeAdapter[];
  git: {
    branch: string;
    head: string;
    remote: string;
    childRepositories: GitRepositoryRecord[];
  };
  keyFiles: FileRecord[];
}

export interface GitRepositoryRecord {
  path: string;
  relativePath: string;
  branch: string;
  head: string;
  remote: string;
}

export interface RuleRecord {
  id: string;
  kind: "agent-rule";
  name: string;
  adapter: AgentScopeAdapter;
  path: string;
  relativePath: string;
  scope: string;
  summary: string;
  headings: HeadingRecord[];
  bullets: string[];
  commands: string[];
  size: number;
}

export interface HeadingRecord {
  level: number;
  text: string;
  line: number;
}

export interface SkillRecord {
  id: string;
  kind: "skill";
  adapter: AgentScopeAdapter;
  name: string;
  displayName: string;
  description: string;
  summary: string;
  layer: SourceLayer;
  sourceLabel: string;
  path: string;
  folder: string;
  relativePath: string;
  frontmatter: Record<string, string>;
  interface?: Record<string, string>;
  triggers: string[];
  scenarios: string[];
  workflow: WorkflowRecord;
  headings: HeadingRecord[];
  resources: SkillResources;
  bodyStats: {
    characters: number;
    lines: number;
    headingCount: number;
  };
  diagnostics: DiagnosticRecord[];
  mentions: string[];
  rawHints: string[];
}

export interface SkillResources {
  references: FileRecord[];
  scripts: ScriptRecord[];
  assets: FileRecord[];
  agents: FileRecord[];
  counts: {
    references: number;
    scripts: number;
    assets: number;
    agents: number;
  };
}

export interface ScriptRecord extends FileRecord {
  executable: boolean;
  hasShebang: boolean;
  language: string;
}

export interface WorkflowRecord {
  source: "explicit" | "inferred";
  steps: string[];
  outputs: string[];
  guardrails: string[];
}

export interface ConfigSurface {
  configFiles: ConfigRecord[];
  mcpServers: SurfaceRecord[];
  hooks: SurfaceRecord[];
  actions: SurfaceRecord[];
  automations: SurfaceRecord[];
  projectScripts: SurfaceRecord[];
  scanNotes: string[];
}

export interface ConfigRecord extends SurfaceRecord {
  format: string;
  scope: "project" | "user";
  safeKeys: unknown;
}

export interface SurfaceRecord {
  id: string;
  name: string;
  path: string;
  relativePath?: string;
  source?: string;
  scope?: string;
  summary: string;
}

export interface RelationshipGraph {
  nodes: RelationshipNode[];
  edges: RelationshipEdge[];
}

export interface RelationshipNode {
  id: string;
  label: string;
  type: "project" | "rule" | "layer" | "skill" | "resource" | "config";
  layer: SourceLayer | "project" | "config";
  summary: string;
}

export interface RelationshipEdge {
  from: string;
  to: string;
  label: string;
}

export interface DiagnosticRecord {
  id: string;
  severity: DiagnosticSeverity;
  title: string;
  detail: string;
  path: string;
}

export interface ScanSummary {
  skillCount: number;
  ruleCount: number;
  projectSkillCount: number;
  userSkillCount: number;
  adminSkillCount: number;
  pluginSkillCount: number;
  systemSkillCount: number;
  unknownSkillCount: number;
  automationCandidateCount: number;
  actionCandidateCount: number;
  mcpServerCount: number;
  hookCount: number;
  diagnosticCount: number;
  layers: SourceLayer[];
  adapters: AgentScopeAdapter[];
  scanNotes: string[];
}

export interface AgentScopeScan {
  schemaVersion: "0.1.0";
  generator: {
    name: "agentscope";
    version: string;
    generatedAt: string;
    runtime: string;
  };
  project: ProjectIdentity;
  summary: ScanSummary;
  rules: RuleRecord[];
  skills: SkillRecord[];
  configs: ConfigSurface;
  relationships: RelationshipGraph;
  diagnostics: DiagnosticRecord[];
}

export interface ScanOptions {
  root: string;
  includeUser?: boolean;
}

