---
description: Run AgentScope against the current workspace and summarize the generated report.
argument-hint: "[workspace-root]"
---

# AgentScope Scan

Run the scanner against the provided workspace root, or use the current directory when no root is provided.

```bash
agentscope scan . --html --project-only
```

After the scan finishes, report the HTML path and key counts.
