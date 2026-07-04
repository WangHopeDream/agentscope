---
name: workspace-scan
description: Use when Cursor should inspect an agent-native workspace with AgentScope.
---

# Workspace Scan

## Workflow

1. Identify the repository or workspace root.
2. Run `agentscope scan <workspace-root> --html --project-only`.
3. Summarize the generated report path and the major workspace surfaces.

## Guardrails

- Do not invent rules that are not present in the scan.
- Keep public examples synthetic.
