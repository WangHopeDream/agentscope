# Roadmap

## Phase 0: Repository Bootstrap

- Create the public repository skeleton.
- Define product positioning and architecture boundaries.
- Keep private project data out of the public repo.

## Phase 1: CLI Extraction

- Extract the scanner core from the current Codex workflow map skill.
- Add a `codex` adapter for `AGENTS.md` and `.agents/skills`.
- Generate a stable JSON scan output.
- Render a self-contained HTML report from the JSON output.
- Add `agentscope diff` for scan-to-scan comparison.

Current status: first Node/TypeScript CLI is implemented with JSON, HTML, diff,
Codex rules, Codex Skills, config surfaces, diagnostics, and multi-repository
workspace detection.

## Phase 2: Cross-Agent Adapters

- Add `claude-code` adapter support for common Claude project files.
- Add `cursor` adapter support for Cursor rules and project config.
- Add a generic folder adapter for custom agent workspaces.

## Phase 3: Diff and Audit

- Compare two scan outputs.
- Detect added, removed, or changed rules and skills.
- Flag risky config, duplicate skills, missing metadata, and generated-output
  leakage.

## Phase 4: Client Layer

- Explore a desktop or web client after the CLI and schema are stable.
- Reuse the CLI or core library rather than duplicating scanner logic.
