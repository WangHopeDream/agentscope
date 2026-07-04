export type Language = "zh" | "en";

export function normalizeLanguage(value: string | undefined): Language {
  if (!value) return "zh";
  const normalized = value.toLowerCase();
  if (normalized === "en" || normalized === "english") return "en";
  if (normalized === "zh" || normalized === "cn" || normalized === "chinese" || normalized === "zh-cn") {
    return "zh";
  }
  throw new Error(`Unsupported language: ${value}. Use zh or en.`);
}

export const CLI_TEXT = {
  zh: {
    unknownCommand: (command: string) => `未知命令：${command}`,
    unknownScanOption: (option: string) => `未知扫描选项：${option}`,
    optionRequiresValue: (option: string) => `${option} 需要一个值`,
    wrote: (path: string) => `已写入 ${path}`,
    htmlReport: (path: string) => `HTML 报告：${path}`,
    diffUsage: "用法：agentscope diff <old-scan.json> <new-scan.json> [--json] [--lang zh|en]",
    scanFileNotFound: (path: string) => `找不到扫描文件：${path}`,
    scanTitle: (name: string) => `AgentScope 扫描：${name}`,
    root: (root: string) => `根目录：${root}`,
    adapters: (adapters: string) => `适配器：${adapters}`,
    detected: (skills: number, rules: number, diagnostics: number) =>
      `检测到 ${skills} 个 Skill、${rules} 条规则、${diagnostics} 条诊断。`,
    childRepositories: (repos: string) => `子仓库：${repos}`,
    diffTitle: (oldProject: string, newProject: string) => `AgentScope 差异：${oldProject} -> ${newProject}`,
    diffSkills: (oldSkills: number, newSkills: number) => `Skills：${oldSkills} -> ${newSkills}`,
    collection: (label: string, added: number, removed: number, changed: number) =>
      `${label}：+${added} -${removed} ~${changed}`,
    added: "新增",
    removed: "移除",
    changed: "变更",
    labels: {
      rules: "规则",
      skills: "Skills",
      diagnostics: "诊断",
    },
    help: (version: string) => `AgentScope ${version}

用法：
  agentscope scan [目录] [--json] [--html] [--output 文件] [--html-output 文件] [--project-only] [--lang zh|en]
  agentscope diff <old-scan.json> <new-scan.json> [--json] [--lang zh|en]

示例：
  agentscope scan .
  agentscope scan /path/to/workspace --json --output scan.json
  agentscope scan /path/to/workspace --html
  agentscope scan /path/to/workspace --html --lang en
  agentscope diff old-scan.json new-scan.json
`,
  },
  en: {
    unknownCommand: (command: string) => `Unknown command: ${command}`,
    unknownScanOption: (option: string) => `Unknown scan option: ${option}`,
    optionRequiresValue: (option: string) => `${option} requires a value`,
    wrote: (path: string) => `Wrote ${path}`,
    htmlReport: (path: string) => `HTML report: ${path}`,
    diffUsage: "Usage: agentscope diff <old-scan.json> <new-scan.json> [--json] [--lang zh|en]",
    scanFileNotFound: (path: string) => `Scan file not found: ${path}`,
    scanTitle: (name: string) => `AgentScope scan: ${name}`,
    root: (root: string) => `Root: ${root}`,
    adapters: (adapters: string) => `Adapters: ${adapters}`,
    detected: (skills: number, rules: number, diagnostics: number) =>
      `Detected ${skills} skills, ${rules} rules, ${diagnostics} diagnostics.`,
    childRepositories: (repos: string) => `Child repositories: ${repos}`,
    diffTitle: (oldProject: string, newProject: string) => `AgentScope diff: ${oldProject} -> ${newProject}`,
    diffSkills: (oldSkills: number, newSkills: number) => `Skills: ${oldSkills} -> ${newSkills}`,
    collection: (label: string, added: number, removed: number, changed: number) =>
      `${label}: +${added} -${removed} ~${changed}`,
    added: "added",
    removed: "removed",
    changed: "changed",
    labels: {
      rules: "Rules",
      skills: "Skills",
      diagnostics: "Diagnostics",
    },
    help: (version: string) => `AgentScope ${version}

Usage:
  agentscope scan [path] [--json] [--html] [--output file] [--html-output file] [--project-only] [--lang zh|en]
  agentscope diff <old-scan.json> <new-scan.json> [--json] [--lang zh|en]

Examples:
  agentscope scan .
  agentscope scan /path/to/workspace --json --output scan.json
  agentscope scan /path/to/workspace --html
  agentscope scan /path/to/workspace --html --lang en
  agentscope diff old-scan.json new-scan.json
`,
  },
} as const;

