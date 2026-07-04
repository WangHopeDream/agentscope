# Architecture

AgentScope is designed as a layered tool:

```text
Node.js / TypeScript CLI
  -> scanner core
    -> adapters
      -> codex
      -> claude-code
      -> cursor
      -> generic-folder
    -> normalized workspace model/schema
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

## Implementation Notes

- The first implementation is being migrated from the existing
  `project-workflow-map` Codex skill, while keeping BA-specific assumptions out
  of the core package.
- `agentscope scan <path>` scans the path the user names. It does not
  automatically promote to a Git repository root because AgentScope workspaces
  can contain multiple child repositories.
- `--project-only` limits project/user boundary scanning so public fixtures and
  tests can avoid local user-level Codex state.
- The current HTML renderer is a dependency-free single-file client. A React
  renderer can be added behind the same scan JSON once the schema stabilizes.
