# AgentScope

AgentScope is an open-source inspector for agent-native project workspaces.

It scans folders used by coding agents such as Codex, Claude Code, Cursor, and
custom agent systems, then generates a self-contained map of the project's
rules, skills, memory, tools, scripts, configs, risks, and inferred workflows.

AgentScope is not a workflow orchestrator. It is a project X-ray for agent
workspaces that already exist.

## Why

Modern agent projects are increasingly folder-based. A project may contain:

- Agent rules such as `AGENTS.md`, `CLAUDE.md`, or Cursor rules.
- Local skills, commands, prompts, runbooks, and memory files.
- MCP/tool configuration, hooks, scripts, and generated outputs.
- Implicit workflows that are never represented as a single DAG.

AgentScope makes that operating layer visible.

## Planned CLI

```bash
agentscope scan .
agentscope scan /path/to/project --html
agentscope scan /path/to/project --json
agentscope diff old-scan.json new-scan.json
```

## Positioning

Dify and LangGraph help you build agent workflows.

AgentScope helps you understand agent workspaces that already exist.

## Repository Layout

```text
src/agentscope/      Core scanner, adapters, CLI, and renderers.
schemas/             Stable JSON schemas for scan outputs.
docs/                Product, architecture, and roadmap notes.
examples/            Example scan inputs and outputs.
```

## Related Repositories

- `agentscope-skills`: Agent-specific wrappers, skills, and usage templates.

## Status

Early extraction phase. The first implementation will be split from a
repo-local Codex workflow map skill into a standalone CLI and schema.
