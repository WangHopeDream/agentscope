---
name: workspace-scan
description: Use when the user asks Claude Code to inspect an agent-native workspace with AgentScope.
---

# Workspace Scan

## Workflow

1. Confirm the workspace root.
2. Run `agentscope scan <workspace-root> --html --project-only`.
3. Share the report path and summarize the visible rules, skills, commands, and configs.

## Guardrails

- Do not include local-only files in public examples.
- Prefer generated HTML for human review and JSON for automation.
