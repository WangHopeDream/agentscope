#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { diffScans } from "./diff.js";
import { CLI_TEXT, normalizeLanguage } from "./i18n.js";
import { renderHtml } from "./renderers/html.js";
import { scanWorkspace, AGENTSCOPE_VERSION } from "./scanner/scan.js";

import type { AgentScopeScan } from "./types.js";
import type { Language } from "./i18n.js";

interface ScanArgs {
  root: string;
  json: boolean;
  html: boolean;
  output?: string;
  htmlOutput?: string;
  includeUser: boolean;
  language: Language;
}

function main(argv: string[]): number {
  const { language, args } = extractLanguage(argv);
  const t = CLI_TEXT[language];
  const [command, ...rest] = args;
  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp(language);
    return 0;
  }
  if (command === "--version" || command === "-v" || command === "version") {
    console.log(AGENTSCOPE_VERSION);
    return 0;
  }
  if (command === "scan") return runScan(rest, language);
  if (command === "diff") return runDiff(rest, language);
  console.error(t.unknownCommand(command));
  printHelp(language);
  return 1;
}

function runScan(args: string[], defaultLanguage: Language): number {
  const parsed = parseScanArgs(args, defaultLanguage);
  const t = CLI_TEXT[parsed.language];
  const scan = scanWorkspace({ root: parsed.root, includeUser: parsed.includeUser });
  const json = JSON.stringify(scan, null, 2);

  if (parsed.json) {
    if (parsed.output) writeOutput(parsed.output, json, parsed.language);
    else console.log(json);
  }

  if (parsed.html) {
    const htmlPath = parsed.htmlOutput || (parsed.output && !parsed.json ? parsed.output : join(scan.project.root, "agentscope-report.html"));
    writeOutput(htmlPath, renderHtml(scan, { language: parsed.language }), parsed.language);
  }

  if (!parsed.json) {
    printScanSummary(scan, parsed.language, parsed.html ? parsed.htmlOutput || join(scan.project.root, "agentscope-report.html") : undefined);
  } else if (parsed.html) {
    console.error(t.htmlReport(parsed.htmlOutput || join(scan.project.root, "agentscope-report.html")));
  }

  return 0;
}

function runDiff(args: string[], defaultLanguage: Language): number {
  const { language, cleaned } = parseLanguageOption(args, defaultLanguage);
  const t = CLI_TEXT[language];
  const json = cleaned.includes("--json");
  const paths = cleaned.filter((arg) => !arg.startsWith("-"));
  if (paths.length < 2) {
    console.error(t.diffUsage);
    return 1;
  }
  const oldScan = readScan(paths[0]);
  const newScan = readScan(paths[1]);
  const diff = diffScans(oldScan, newScan);
  if (json) {
    console.log(JSON.stringify(diff, null, 2));
  } else {
    console.log(t.diffTitle(diff.oldProject, diff.newProject));
    console.log(t.diffSkills(diff.counts.oldSkills, diff.counts.newSkills));
    printCollection(t.labels.rules, diff.rules, language);
    printCollection(t.labels.skills, diff.skills, language);
    printCollection(t.labels.diagnostics, diff.diagnostics, language);
  }
  return 0;
}

function parseScanArgs(args: string[], defaultLanguage: Language): ScanArgs {
  const parsed: ScanArgs = { root: ".", json: false, html: false, includeUser: true, language: defaultLanguage };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--json") parsed.json = true;
    else if (arg === "--html") parsed.html = true;
    else if (arg === "--project-only") parsed.includeUser = false;
    else if (arg === "--output" || arg === "-o") parsed.output = requireValue(args, ++index, arg);
    else if (arg === "--html-output") parsed.htmlOutput = requireValue(args, ++index, arg);
    else if (arg === "--lang" || arg === "--language") parsed.language = normalizeLanguage(requireValue(args, ++index, arg));
    else if (arg === "--help" || arg === "-h") {
      printHelp(parsed.language);
      process.exit(0);
    } else if (arg.startsWith("-")) {
      throw new Error(CLI_TEXT[parsed.language].unknownScanOption(arg));
    } else {
      parsed.root = arg;
    }
  }
  return parsed;
}

function requireValue(args: string[], index: number, flag: string): string {
  const value = args[index];
  if (!value) throw new Error(CLI_TEXT.zh.optionRequiresValue(flag));
  return value;
}

function writeOutput(path: string, content: string, language: Language): void {
  const target = resolve(path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content, "utf8");
  console.error(CLI_TEXT[language].wrote(target));
}

function readScan(path: string): AgentScopeScan {
  if (!existsSync(path)) throw new Error(CLI_TEXT.zh.scanFileNotFound(path));
  return JSON.parse(readFileSync(path, "utf8")) as AgentScopeScan;
}

function printScanSummary(scan: AgentScopeScan, language: Language, htmlPath?: string): void {
  const t = CLI_TEXT[language];
  console.log(t.scanTitle(scan.project.name));
  console.log(t.root(scan.project.root));
  console.log(t.adapters(scan.summary.adapters.join(", ")));
  console.log(t.detected(scan.summary.skillCount, scan.summary.ruleCount, scan.summary.diagnosticCount));
  if (scan.project.git.childRepositories.length) {
    console.log(t.childRepositories(scan.project.git.childRepositories.map((repo) => repo.relativePath).join(", ")));
  }
  if (htmlPath) console.log(t.htmlReport(resolve(htmlPath)));
}

function printCollection(label: string, diff: { added: string[]; removed: string[]; changed: string[] }, language: Language): void {
  const t = CLI_TEXT[language];
  console.log(t.collection(label, diff.added.length, diff.removed.length, diff.changed.length));
  for (const [kind, items] of [
    [t.added, diff.added],
    [t.removed, diff.removed],
    [t.changed, diff.changed],
  ] as const) {
    if (items.length) console.log(`  ${kind}: ${items.slice(0, 12).join(", ")}${items.length > 12 ? " ..." : ""}`);
  }
}

function printHelp(language: Language): void {
  console.log(CLI_TEXT[language].help(AGENTSCOPE_VERSION));
}

function extractLanguage(argv: string[]): { language: Language; args: string[] } {
  const parsed = parseLanguageOption(argv, "zh");
  return { language: parsed.language, args: parsed.cleaned };
}

function parseLanguageOption(args: string[], defaultLanguage: Language): { language: Language; cleaned: string[] } {
  let language = defaultLanguage;
  const cleaned: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--lang" || arg === "--language") {
      language = normalizeLanguage(requireValue(args, ++index, arg));
    } else {
      cleaned.push(arg);
    }
  }
  return { language, cleaned };
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
