import { PLACEHOLDER_RE, normalizeList } from "./fs.js";

import type { HeadingRecord } from "../types.js";

export function parseFrontmatter(text: string): { frontmatter: Record<string, string>; body: string } {
  if (!text.startsWith("---")) return { frontmatter: {}, body: text };
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return { frontmatter: {}, body: text };
  const endIndex = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (endIndex < 0) return { frontmatter: {}, body: text };
  return {
    frontmatter: parseSimpleYaml(lines.slice(1, endIndex)),
    body: lines.slice(endIndex + 1).join("\n"),
  };
}

export function parseSimpleYaml(lines: string[]): Record<string, string> {
  const data: Record<string, string> = {};
  let currentKey: string | undefined;
  let currentValue: string[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    if (/^\s/.test(line) && currentKey) {
      currentValue.push(line.trim());
      continue;
    }
    if (currentKey) {
      data[currentKey] = cleanScalar(currentValue.join("\n"));
      currentKey = undefined;
      currentValue = [];
    }
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!match) continue;
    const [, key, value = ""] = match;
    if (value === "|" || value === ">") {
      currentKey = key;
      currentValue = [];
    } else {
      data[key] = cleanScalar(value);
    }
  }
  if (currentKey) data[currentKey] = cleanScalar(currentValue.join("\n"));
  return data;
}

export function cleanScalar(value: unknown): string {
  let text = String(value ?? "").trim();
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    text = text.slice(1, -1);
  }
  return text.trim();
}

export function cleanMarkdown(text: string): string {
  return collapseSpace(
    text
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^\[[ xX]\]\s+/, "")
      .replace(/^[-\s]+|[-\s]+$/g, ""),
  );
}

export function extractHeadings(text: string): HeadingRecord[] {
  const headings: HeadingRecord[] = [];
  text.split(/\r?\n/).forEach((line, index) => {
    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (!match) return;
    headings.push({ level: match[1].length, text: cleanMarkdown(match[2]), line: index + 1 });
  });
  return headings;
}

export function firstSection(text: string, names: string[]): string {
  const headings = extractHeadings(text);
  const wanted = new Set(names.map((name) => name.toLowerCase()));
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    if (!wanted.has(heading.text.trim().toLowerCase())) continue;
    let end = lines.length;
    for (const later of headings.slice(index + 1)) {
      if (later.level <= heading.level) {
        end = later.line - 1;
        break;
      }
    }
    return lines.slice(heading.line, end).join("\n").trim();
  }
  return "";
}

export function extractBullets(text: string, maxItems = 10): string[] {
  const bullets: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*(?:[-*+]|\d+[.)])\s+(.+)$/.exec(line);
    if (!match) continue;
    const item = cleanMarkdown(match[1]);
    if (item && !PLACEHOLDER_RE.test(item)) bullets.push(item);
    if (bullets.length >= maxItems) break;
  }
  return bullets;
}

export function extractCommandLines(text: string, maxItems = 8): string[] {
  const commands: string[] = [];
  let inFence = false;
  for (const line of text.split(/\r?\n/)) {
    const stripped = line.trim();
    if (stripped.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (
      inFence ||
      /^(npm|pnpm|yarn|node|python|python3|pytest|make|go|cargo|git|npx|uv|bun)\b/.test(stripped)
    ) {
      if (stripped && !stripped.startsWith("#")) commands.push(stripped);
    }
    if (commands.length >= maxItems) break;
  }
  return commands;
}

export function extractSteps(text: string): string[] {
  const steps: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*(?:[-*+]|\d+[.)])\s+(.+)$/.exec(line);
    if (!match) continue;
    const item = cleanMarkdown(match[1]);
    if (item && !PLACEHOLDER_RE.test(item)) steps.push(collapseSpace(item));
  }
  return normalizeList(steps);
}

export function summarizeText(text: string, fallback: string, maxChars = 180): string {
  const cleaned = text.replace(/```.*?```/gs, " ").replace(/^---.*?---/s, " ");
  for (const line of cleaned.split(/\r?\n/)) {
    const value = cleanMarkdown(line.trim());
    if (value.length > 30 && !PLACEHOLDER_RE.test(value) && !value.startsWith("#")) {
      return firstSentence(value, maxChars);
    }
  }
  return fallback;
}

export function extractReadmeDescription(text: string): string {
  for (const line of text.split(/\r?\n/)) {
    const stripped = cleanMarkdown(line.trim());
    if (!stripped || stripped.startsWith("#")) continue;
    if (stripped.length > 20) return firstSentence(stripped, 220);
  }
  return "";
}

export function firstSentence(text: string, maxChars = 180): string {
  const collapsed = collapseSpace(text);
  if (collapsed.length <= maxChars) return collapsed;
  const match = /^(.{40,}?[.!?])\s+/.exec(collapsed);
  if (match && match[1].length <= maxChars) return match[1];
  return `${collapsed.slice(0, maxChars - 1).trimEnd()}...`;
}

export function collapseSpace(text: string): string {
  return (text || "").replace(/\s+/g, " ").trim();
}

