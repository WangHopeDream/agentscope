import type {
  AgentCommandRecord,
  ConfigSurface,
  ProjectIdentity,
  RelationshipGraph,
  RelationshipNode,
  RuleRecord,
  SkillRecord,
} from "../types.js";

export function buildRelationships(
  project: ProjectIdentity,
  rules: RuleRecord[],
  skills: SkillRecord[],
  commands: AgentCommandRecord[],
  configs: ConfigSurface,
): RelationshipGraph {
  const nodes: RelationshipNode[] = [
    {
      id: "project",
      label: project.name,
      type: "project",
      layer: "project",
      summary: project.description,
    },
  ];
  const edges: RelationshipGraph["edges"] = [];

  for (const rule of rules) {
    nodes.push({
      id: rule.id,
      label: rule.relativePath,
      type: "rule",
      layer: "project",
      summary: rule.summary,
    });
    edges.push({ from: "project", to: rule.id, label: rule.adapter });
  }

  for (const command of commands) {
    nodes.push({
      id: command.id,
      label: `/${command.name}`,
      type: "command",
      layer: "project",
      summary: command.summary,
    });
    edges.push({ from: "project", to: command.id, label: command.adapter });
  }

  const layerNodes = new Map<string, string>();
  for (const layer of ["project", "user", "admin", "plugin", "system", "unknown"] as const) {
    if (!skills.some((skill) => skill.layer === layer)) continue;
    const id = `layer:${layer}`;
    layerNodes.set(layer, id);
    nodes.push({
      id,
      label: `${titleCase(layer)} Skills`,
      type: "layer",
      layer,
      summary: `Skills detected in the ${layer} layer.`,
    });
    edges.push({ from: "project", to: id, label: "skill layer" });
  }

  for (const skill of skills) {
    nodes.push({
      id: skill.id,
      label: `$${skill.name}`,
      type: "skill",
      layer: skill.layer,
      summary: skill.summary,
    });
    edges.push({ from: layerNodes.get(skill.layer) || "project", to: skill.id, label: "contains" });
    for (const targetName of skill.mentions) {
      const target = skills.find((item) => item.name === targetName);
      if (target) edges.push({ from: skill.id, to: target.id, label: "mentions" });
    }
    for (const resourceType of ["references", "scripts", "assets"] as const) {
      const count = skill.resources.counts[resourceType];
      if (!count) continue;
      const id = `${skill.id}:${resourceType}`;
      nodes.push({
        id,
        label: `${resourceType} (${count})`,
        type: "resource",
        layer: skill.layer,
        summary: `${count} ${resourceType} attached to $${skill.name}.`,
      });
      edges.push({ from: skill.id, to: id, label: resourceType });
    }
  }

  for (const [collection, label] of [
    ["mcpServers", "MCP"],
    ["hooks", "Hooks"],
    ["actions", "Actions"],
    ["automations", "Automations"],
    ["projectScripts", "Project Scripts"],
  ] as const) {
    const count = configs[collection].length;
    if (!count) continue;
    const id = `config:${collection}`;
    nodes.push({
      id,
      label: `${label} (${count})`,
      type: "config",
      layer: "config",
      summary: `${count} visible ${label.toLowerCase()} entries.`,
    });
    edges.push({ from: "project", to: id, label: label.toLowerCase() });
  }

  return { nodes, edges };
}

function titleCase(value: string): string {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}
