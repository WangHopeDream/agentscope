# Architecture

AgentScope is designed as a layered tool:

```text
CLI
  -> scanner core
    -> adapters
      -> codex
      -> claude-code
      -> cursor
      -> generic-folder
    -> normalized graph/schema
  -> renderers
    -> single-file HTML
    -> JSON
    -> Markdown summary
```

## Core Principles

- The core scanner must not depend on a specific agent product.
- Adapters translate product-specific files into a normalized project model.
- Renderers consume normalized data and should not perform filesystem scans.
- Skills and agent commands are wrappers around the CLI, not the core engine.
- Generated reports should be self-contained and safe to open offline.

## Initial Data Model

The normalized model should include:

- Project identity.
- Agent rules.
- Skills, commands, prompts, and runbooks.
- Tool and MCP configuration.
- Scripts and automation candidates.
- Memory and generated output boundaries.
- Relationships between objects.
- Diagnostics and safety findings.

## First Extraction Target

The first implementation will be extracted from the existing
`project-workflow-map` Codex skill, while keeping BA-specific assumptions out of
the core package.
