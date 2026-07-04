import type { Language } from "../i18n.js";
import type { AgentScopeScan } from "../types.js";

export interface RenderHtmlOptions {
  language?: Language;
  reportPath?: string;
  projectOnly?: boolean;
}

export function renderHtml(data: AgentScopeScan, options: RenderHtmlOptions = {}): string {
  const language = options.language || "zh";
  const payload = JSON.stringify(data, null, 2).replace(/<\//g, "<\\/");
  const text = JSON.stringify(HTML_TEXT).replace(/<\//g, "<\\/");
  const reportPath = options.reportPath || `${data.project.root}/agentscope-report.html`;
  const refreshCommand = buildRefreshCommand(data.project.root, reportPath, language, options.projectOnly === true);
  return `<!doctype html>
<html lang="${language === "zh" ? "zh-CN" : "en"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AgentScope - ${escapeHtml(data.project.name)}</title>
  <style>${CSS}</style>
</head>
<body>
  <div id="app"></div>
  <script id="scan-data" type="application/json">${payload}</script>
  <script>
const I18N = ${text};
const DEFAULT_LANG = ${JSON.stringify(language)};
const REPORT_PATH = ${JSON.stringify(reportPath)};
const REFRESH_COMMAND = ${JSON.stringify(refreshCommand)};
${JS}
  </script>
</body>
</html>`;
}

const HTML_TEXT = {
  zh: {
    languageName: "中文",
    languageAlt: "English",
    eyebrow: "AgentScope 工作区检查器",
    generated: "生成时间",
    refreshCommand: "复制刷新命令",
    refreshForAgent: "复制给 Agent",
    copiedCommand: "已复制刷新命令",
    copiedAgentPrompt: "已复制给 Agent 的刷新请求",
    copyFailed: "复制失败，请手动复制命令",
    agentPrompt: "请刷新这个 AgentScope 报告。请在当前机器上运行以下命令，然后告诉我新的报告路径和关键计数：",
    adapters: "适配器",
    branch: "分支",
    childReposShort: "个子仓库",
    metrics: {
      skills: "Skills",
      project: "项目",
      user: "用户",
      plugin: "插件",
      system: "系统",
      rules: "规则",
      diagnostics: "诊断",
      actions: "动作",
    },
    searchPlaceholder: "搜索 Skill、路径、工作流",
    layers: "层级",
    scenarios: "场景",
    scanNotes: "扫描说明",
    readable: "主要静态扫描面均可读取。",
    tabs: {
      overview: "概览",
      skills: "Skills",
      workflows: "工作流",
      rules: "规则",
      config: "配置",
      diagnostics: "诊断",
    },
    overview: {
      workspaceSurfaces: "工作区表面",
      nodes: "个节点",
      edges: "条边",
      childRepositories: "子仓库",
      highSignalSkills: "高信号 Skills",
      visible: "个可见",
      noNestedRepos: "未检测到嵌套 Git 仓库。",
      noSkillMatches: "没有 Skill 匹配当前筛选条件。",
    },
    surfaces: {
      rules: ["规则", "AGENTS.md / CLAUDE.md / Cursor rules"],
      config: ["配置", "可见配置文件与安全键摘要"],
      mcp: ["MCP", "可见 MCP server 声明"],
      hooks: ["Hooks", "可见 hook 类配置项"],
      actions: ["动作", "本地动作和项目命令入口"],
      automations: ["自动化", "本地自动化候选项"],
    },
    workflow: {
      noMatches: "没有工作流匹配当前筛选条件。",
      explicit: "显式工作流",
      inferred: "推断工作流",
    },
    rules: {
      none: "未检测到 agent 规则。",
    },
    config: {
      configFiles: "配置文件",
      mcpServers: "MCP Servers",
      hooks: "Hooks",
      localActions: "本地动作",
      automations: "自动化",
      projectScripts: "项目脚本",
      noneDetected: "未检测到{title}。",
    },
    diagnostics: {
      none: "未检测到诊断。",
    },
    details: {
      empty: "选择一个 Skill、规则、配置项或诊断来查看来源细节。",
      missing: "所选项目当前不可见。",
      path: "路径",
      source: "来源",
      scenarios: "场景",
      mentions: "提及",
      noneDetected: "未检测到",
      triggers: "触发方式",
      workflow: "工作流",
      outputs: "输出",
      guardrails: "护栏",
      resources: "资源",
      diagnostics: "诊断",
      adapter: "适配器",
      scope: "范围",
      size: "大小",
      headings: "标题",
      keyBullets: "关键条目",
      commands: "命令",
      severity: "级别",
      detail: "详情",
      summary: "摘要",
      type: "类型",
    },
    labels: {
      project: "项目",
      user: "用户",
      admin: "管理",
      plugin: "插件",
      system: "系统",
      unknown: "未知",
      refs: "引用",
      scripts: "脚本",
      notes: "备注",
    },
  },
  en: {
    languageName: "English",
    languageAlt: "中文",
    eyebrow: "AgentScope Workspace Inspector",
    generated: "Generated",
    refreshCommand: "Copy refresh command",
    refreshForAgent: "Copy for Agent",
    copiedCommand: "Refresh command copied",
    copiedAgentPrompt: "Agent refresh prompt copied",
    copyFailed: "Copy failed. Please copy the command manually.",
    agentPrompt: "Please refresh this AgentScope report. Run the following command on this machine, then tell me the new report path and key counts:",
    adapters: "Adapters",
    branch: "Branch",
    childReposShort: "child repos",
    metrics: {
      skills: "Skills",
      project: "Project",
      user: "User",
      plugin: "Plugin",
      system: "System",
      rules: "Rules",
      diagnostics: "Diagnostics",
      actions: "Actions",
    },
    searchPlaceholder: "Search skills, paths, workflows",
    layers: "Layers",
    scenarios: "Scenarios",
    scanNotes: "Scan Notes",
    readable: "All primary static scan surfaces were readable.",
    tabs: {
      overview: "Overview",
      skills: "Skills",
      workflows: "Workflows",
      rules: "Rules",
      config: "Config",
      diagnostics: "Diagnostics",
    },
    overview: {
      workspaceSurfaces: "Workspace Surfaces",
      nodes: "nodes",
      edges: "edges",
      childRepositories: "Child Repositories",
      highSignalSkills: "High-Signal Skills",
      visible: "visible",
      noNestedRepos: "No nested Git repositories detected.",
      noSkillMatches: "No skills match the current filters.",
    },
    surfaces: {
      rules: ["Rules", "AGENTS.md / CLAUDE.md / Cursor rules"],
      config: ["Config", "Visible config files with safe key summaries"],
      mcp: ["MCP", "Visible MCP server declarations"],
      hooks: ["Hooks", "Visible hook-like config entries"],
      actions: ["Actions", "Local actions and project command surfaces"],
      automations: ["Automations", "Local automation candidates"],
    },
    workflow: {
      noMatches: "No workflows match the current filters.",
      explicit: "Explicit workflow",
      inferred: "Inferred workflow",
    },
    rules: {
      none: "No agent rules were detected.",
    },
    config: {
      configFiles: "Config Files",
      mcpServers: "MCP Servers",
      hooks: "Hooks",
      localActions: "Local Actions",
      automations: "Automations",
      projectScripts: "Project Scripts",
      noneDetected: "No {title} detected.",
    },
    diagnostics: {
      none: "No diagnostics detected.",
    },
    details: {
      empty: "Select a skill, rule, config item, or diagnostic to inspect source details.",
      missing: "The selected item is no longer visible.",
      path: "Path",
      source: "Source",
      scenarios: "Scenarios",
      mentions: "Mentions",
      noneDetected: "None detected",
      triggers: "Triggers",
      workflow: "Workflow",
      outputs: "Outputs",
      guardrails: "Guardrails",
      resources: "Resources",
      diagnostics: "Diagnostics",
      adapter: "Adapter",
      scope: "Scope",
      size: "Size",
      headings: "Headings",
      keyBullets: "Key Bullets",
      commands: "Commands",
      severity: "Severity",
      detail: "Detail",
      summary: "Summary",
      type: "Type",
    },
    labels: {
      project: "Project",
      user: "User",
      admin: "Admin",
      plugin: "Plugin",
      system: "System",
      unknown: "Unknown",
      refs: "refs",
      scripts: "scripts",
      notes: "notes",
    },
  },
};

const CSS = `
:root {
  color-scheme: light;
  --bg: #f6f7f9;
  --panel: #fff;
  --panel-2: #eef2f5;
  --ink: #17202a;
  --muted: #5f6c79;
  --line: #d9e1e8;
  --accent: #126c75;
  --warning: #8a5b00;
  --danger: #a23a2b;
  --radius: 8px;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font: 14px/1.45 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
button, input, select { font: inherit; }
button { cursor: pointer; }
.shell { min-height: 100vh; display: grid; grid-template-rows: auto 1fr; }
.topbar {
  background: var(--panel);
  border-bottom: 1px solid var(--line);
  padding: 18px 22px 16px;
  position: sticky;
  top: 0;
  z-index: 5;
}
.title-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 16px; align-items: start; }
.eyebrow { color: var(--muted); font-size: 12px; font-weight: 760; text-transform: uppercase; letter-spacing: .06em; }
h1 { margin: 3px 0 4px; font-size: 25px; line-height: 1.15; letter-spacing: 0; }
.subtitle { color: var(--muted); overflow-wrap: anywhere; }
.top-actions { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 9px; }
.action-btn { border: 1px solid var(--line); background: var(--panel); color: var(--ink); border-radius: 999px; padding: 5px 9px; font-size: 12px; }
.action-btn:hover { border-color: var(--accent); }
.lang-toggle { display: inline-flex; border: 1px solid var(--line); border-radius: 999px; overflow: hidden; background: var(--panel-2); }
.lang-toggle button { border: 0; background: transparent; color: var(--muted); padding: 5px 9px; font-size: 12px; }
.lang-toggle button.active { background: var(--ink); color: #fff; }
.copy-status { min-height: 16px; margin-top: 5px; color: var(--accent); font-size: 12px; text-align: right; }
.generated { color: var(--muted); text-align: right; font-size: 12px; white-space: nowrap; }
.metrics { margin-top: 16px; display: grid; grid-template-columns: repeat(8, minmax(82px, 1fr)); gap: 8px; }
.metric { border: 1px solid var(--line); border-radius: var(--radius); background: var(--panel-2); padding: 10px; min-width: 0; }
.metric-value { font-size: 20px; font-weight: 760; line-height: 1; }
.metric-label { margin-top: 5px; color: var(--muted); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.layout { display: grid; grid-template-columns: 280px minmax(0, 1fr) 380px; min-height: 0; }
.sidebar { border-right: 1px solid var(--line); padding: 16px; background: #fbfcfd; position: sticky; top: 128px; height: calc(100vh - 128px); overflow: auto; }
.main { padding: 16px 18px 40px; min-width: 0; }
.details { border-left: 1px solid var(--line); padding: 16px; background: var(--panel); position: sticky; top: 128px; height: calc(100vh - 128px); overflow: auto; }
.search { width: 100%; height: 38px; border: 1px solid #b8c4cf; border-radius: var(--radius); padding: 0 11px; background: var(--panel); color: var(--ink); }
.section-label { margin: 18px 0 8px; color: var(--muted); font-size: 12px; font-weight: 760; text-transform: uppercase; letter-spacing: .05em; }
.chip-list { display: flex; gap: 7px; flex-wrap: wrap; }
.chip { border: 1px solid var(--line); background: var(--panel); color: var(--ink); border-radius: 999px; padding: 6px 10px; font-size: 12px; line-height: 1; }
.chip.active { background: var(--ink); border-color: var(--ink); color: #fff; }
.tabs { display: flex; gap: 8px; border-bottom: 1px solid var(--line); margin-bottom: 16px; overflow-x: auto; }
.tab { border: 0; background: transparent; padding: 10px 12px; color: var(--muted); border-bottom: 2px solid transparent; white-space: nowrap; }
.tab.active { color: var(--ink); border-color: var(--accent); font-weight: 720; }
.panel, .card { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); }
.panel { padding: 15px; }
.card { padding: 13px; min-width: 0; }
.card.clickable:hover, .row.clickable:hover { border-color: var(--accent); box-shadow: 0 6px 18px rgba(18,108,117,.12); }
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(275px, 1fr)); gap: 12px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.card-title { display: flex; justify-content: space-between; gap: 8px; align-items: flex-start; }
.summary { margin-top: 8px; color: var(--muted); }
.meta { margin-top: 10px; color: var(--muted); font-size: 12px; overflow-wrap: anywhere; }
.path { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; overflow-wrap: anywhere; }
.badge-row { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; }
.badge { display: inline-flex; align-items: center; min-height: 22px; padding: 3px 7px; border-radius: 999px; border: 1px solid var(--line); background: var(--panel-2); color: var(--muted); font-size: 11px; font-weight: 680; max-width: 100%; }
.badge.project { background: #e6f3f2; color: #105d65; border-color: #bdddd8; }
.badge.user { background: #f3eddf; color: #70490b; border-color: #dfcda8; }
.badge.plugin { background: #edf0f8; color: #314f8f; border-color: #cad4ee; }
.badge.system { background: #eef3e8; color: #3b6022; border-color: #cadcba; }
.badge.warning { background: #fff4d8; color: var(--warning); border-color: #e6c471; }
.badge.error { background: #fde8e4; color: var(--danger); border-color: #e5aea5; }
.badge.info { background: #e9f2fb; color: #315b86; border-color: #c1d8ef; }
.row { border: 1px solid var(--line); border-radius: var(--radius); padding: 10px; margin-bottom: 8px; background: var(--panel); }
.detail-empty { color: var(--muted); border: 1px dashed #b8c4cf; border-radius: var(--radius); padding: 18px; }
.detail-header { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
.close-btn { border: 1px solid var(--line); background: var(--panel-2); border-radius: var(--radius); width: 32px; height: 32px; }
.detail-title { margin: 0; font-size: 18px; overflow-wrap: anywhere; }
.detail-block { margin-top: 16px; }
.detail-block h3 { margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); }
.kv { display: grid; grid-template-columns: 112px minmax(0, 1fr); gap: 8px; border-bottom: 1px solid var(--line); padding: 7px 0; }
.kv:last-child { border-bottom: 0; }
.kv .key { color: var(--muted); }
.list { margin: 0; padding-left: 18px; }
.list li { margin: 5px 0; overflow-wrap: anywhere; }
.empty { color: var(--muted); padding: 18px; text-align: center; border: 1px dashed #b8c4cf; border-radius: var(--radius); background: #fbfcfd; }
@media (max-width: 1180px) {
  .layout { grid-template-columns: 240px minmax(0, 1fr); }
  .details { grid-column: 1 / -1; position: static; height: auto; border-left: 0; border-top: 1px solid var(--line); }
  .metrics { grid-template-columns: repeat(4, minmax(82px, 1fr)); }
}
@media (max-width: 760px) {
  .topbar { position: static; padding: 14px; }
  .title-row { grid-template-columns: 1fr; }
  .generated { text-align: left; white-space: normal; }
  .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .layout { display: block; }
  .sidebar, .details { position: static; height: auto; border: 0; border-top: 1px solid var(--line); }
  .main { padding: 14px; }
  .grid-2 { grid-template-columns: 1fr; }
}
`;

const JS = `
const DATA = JSON.parse(document.getElementById('scan-data').textContent);
const state = {
  tab: 'overview',
  query: '',
  layers: new Set(['project','user','admin','plugin','system','unknown']),
  scenario: 'All',
  selected: null,
  lang: loadLanguage(),
  copyStatus: ''
};
function loadLanguage() {
  try {
    const saved = localStorage.getItem('agentscope:lang');
    return saved === 'en' || saved === 'zh' ? saved : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}
function setLanguage(lang) {
  state.lang = lang;
  state.copyStatus = '';
  try { localStorage.setItem('agentscope:lang', lang); } catch {}
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  render();
}
function t() { return I18N[state.lang] || I18N.zh; }
function layerLabel(layer) { return (t().labels && t().labels[layer]) || layer; }
function h(v) { return String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function byId(id) { return document.getElementById(id); }
function badge(text, cls='') { return '<span class="badge '+h(cls)+'">'+h(text)+'</span>'; }
function layerBadge(layer) { return badge(layerLabel(layer), layer); }
function metric(value, label) { return '<div class="metric"><div class="metric-value">'+h(value)+'</div><div class="metric-label">'+h(label)+'</div></div>'; }
function init() {
  document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : 'en';
  render();
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { state.selected = null; renderDetails(); } });
}
function render() {
  byId('app').innerHTML = '<div class="shell">'+renderTopbar()+'<div class="layout"><aside class="sidebar">'+renderSidebar()+'</aside><main class="main">'+renderTabs()+'<div id="content"></div></main><aside class="details" id="details"></aside></div></div>';
  wireSidebar(); wireTabs(); wireLanguage(); renderContent(); renderDetails();
}
function renderTopbar() {
  const ui = t();
  const s = DATA.summary, git = DATA.project.git || {};
  const subtitle = [
    DATA.project.description,
    DATA.project.adapters?.length ? ui.adapters+': '+DATA.project.adapters.join(', ') : '',
    git.branch ? ui.branch+': '+git.branch : '',
    git.childRepositories?.length ? git.childRepositories.length+' '+ui.childReposShort : ''
  ].filter(Boolean).join('  |  ');
  return '<header class="topbar"><div class="title-row"><div><div class="eyebrow">'+h(ui.eyebrow)+'</div><h1>'+h(DATA.project.name)+'</h1><div class="subtitle">'+h(subtitle)+'</div></div><div><div class="top-actions">'+refreshButtons()+languageToggle()+'</div><div class="generated">'+h(ui.generated)+'<br>'+h(DATA.generator.generatedAt)+'<br><span class="path">'+h(DATA.project.root)+'</span><div class="copy-status">'+h(state.copyStatus)+'</div></div></div></div><div class="metrics">'+
    metric(s.skillCount, ui.metrics.skills)+metric(s.projectSkillCount, ui.metrics.project)+metric(s.userSkillCount, ui.metrics.user)+metric(s.pluginSkillCount, ui.metrics.plugin)+metric(s.systemSkillCount, ui.metrics.system)+metric(s.ruleCount, ui.metrics.rules)+metric(s.diagnosticCount, ui.metrics.diagnostics)+metric(s.actionCandidateCount, ui.metrics.actions)+
  '</div></header>';
}
function refreshButtons() {
  const ui = t();
  return '<button class="action-btn" data-copy-refresh="command">'+h(ui.refreshCommand)+'</button><button class="action-btn" data-copy-refresh="agent">'+h(ui.refreshForAgent)+'</button>';
}
function languageToggle() {
  return '<div class="lang-toggle" aria-label="Language"><button data-lang="zh" class="'+(state.lang === 'zh' ? 'active' : '')+'">中文</button><button data-lang="en" class="'+(state.lang === 'en' ? 'active' : '')+'">English</button></div>';
}
function wireLanguage() {
  document.querySelectorAll('[data-lang]').forEach(btn => btn.addEventListener('click', () => setLanguage(btn.dataset.lang)));
  document.querySelectorAll('[data-copy-refresh]').forEach(btn => btn.addEventListener('click', async () => {
    const kind = btn.dataset.copyRefresh;
    const ui = t();
    const text = kind === 'agent' ? ui.agentPrompt+'\\n\\n'+REFRESH_COMMAND : REFRESH_COMMAND;
    const ok = await copyText(text);
    state.copyStatus = ok ? (kind === 'agent' ? ui.copiedAgentPrompt : ui.copiedCommand) : ui.copyFailed;
    render();
  }));
}
function renderSidebar() {
  const ui = t();
  const layerCounts = countBy(DATA.skills, s => s.layer);
  const scenarios = ['All', ...Array.from(new Set(DATA.skills.flatMap(s => s.scenarios || []))).sort()];
  return '<input class="search" id="searchBox" placeholder="'+h(ui.searchPlaceholder)+'" value="'+h(state.query)+'">'+
    '<div class="section-label">'+h(ui.layers)+'</div><div class="chip-list">'+['project','user','admin','plugin','system','unknown'].map(layer => '<button class="chip '+(state.layers.has(layer)?'active':'')+'" data-layer="'+layer+'">'+h(layerLabel(layer))+' '+h(layerCounts[layer] || 0)+'</button>').join('')+'</div>'+
    '<div class="section-label">'+h(ui.scenarios)+'</div><div class="chip-list">'+scenarios.map(s => '<button class="chip '+(state.scenario === s ? 'active' : '')+'" data-scenario="'+h(s)+'">'+h(s)+'</button>').join('')+'</div>'+
    '<div class="section-label">'+h(ui.scanNotes)+'</div><div class="card">'+((DATA.summary.scanNotes || []).length ? '<ul class="list">'+DATA.summary.scanNotes.map(n => '<li>'+h(n)+'</li>').join('')+'</ul>' : '<div class="summary">'+h(ui.readable)+'</div>')+'</div>';
}
function wireSidebar() {
  byId('searchBox').addEventListener('input', e => { state.query = e.target.value; renderContent(); });
  document.querySelectorAll('[data-layer]').forEach(btn => btn.addEventListener('click', () => { const l = btn.dataset.layer; state.layers.has(l) ? state.layers.delete(l) : state.layers.add(l); render(); }));
  document.querySelectorAll('[data-scenario]').forEach(btn => btn.addEventListener('click', () => { state.scenario = btn.dataset.scenario; render(); }));
}
function renderTabs() {
  const labels = t().tabs;
  const tabs = [['overview',labels.overview],['skills',labels.skills],['workflows',labels.workflows],['rules',labels.rules],['config',labels.config],['diagnostics',labels.diagnostics]];
  return '<nav class="tabs">'+tabs.map(([id,label]) => '<button class="tab '+(state.tab===id?'active':'')+'" data-tab="'+id+'">'+h(label)+'</button>').join('')+'</nav>';
}
function wireTabs() { document.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => { state.tab = btn.dataset.tab; renderContent(); document.querySelectorAll('[data-tab]').forEach(item => item.classList.toggle('active', item.dataset.tab === state.tab)); })); }
function renderContent() {
  const c = byId('content');
  c.innerHTML = ({ overview: renderOverview, skills: renderSkills, workflows: renderWorkflows, rules: renderRules, config: renderConfig, diagnostics: renderDiagnostics }[state.tab] || renderOverview)();
  wireContentClicks();
}
function filteredSkills() {
  const q = state.query.trim().toLowerCase();
  return DATA.skills.filter(skill => {
    if (!state.layers.has(skill.layer)) return false;
    if (state.scenario !== 'All' && !(skill.scenarios || []).includes(state.scenario)) return false;
    if (!q) return true;
    return [skill.name, skill.displayName, skill.description, skill.summary, skill.path, ...(skill.workflow?.steps || []), ...(skill.scenarios || [])].join(' ').toLowerCase().includes(q);
  });
}
function renderOverview() {
  const ui = t().overview;
  const skills = filteredSkills();
  return '<div class="grid-2"><section class="panel"><div class="card-title"><strong>'+h(ui.workspaceSurfaces)+'</strong><span class="summary">'+h(DATA.relationships.nodes.length)+' '+h(ui.nodes)+' / '+h(DATA.relationships.edges.length)+' '+h(ui.edges)+'</span></div><div class="card-grid" style="margin-top:12px">'+surfaceCards()+'</div></section><section class="panel"><div class="card-title"><strong>'+h(ui.childRepositories)+'</strong><span class="summary">'+h(DATA.project.git.childRepositories?.length || 0)+'</span></div>'+childRepos()+'</section></div><div style="height:14px"></div><section class="panel"><div class="card-title"><strong>'+h(ui.highSignalSkills)+'</strong><span class="summary">'+h(skills.length)+' '+h(ui.visible)+'</span></div><div class="card-grid" style="margin-top:12px">'+(skills.slice(0,12).map(renderSkillCard).join('') || empty(ui.noSkillMatches))+'</div></section>';
}
function surfaceCards() {
  const c = DATA.configs;
  const s = t().surfaces;
  const items = [
    [s.rules[0], DATA.rules.length, s.rules[1]],
    [s.config[0], c.configFiles.length, s.config[1]],
    [s.mcp[0], c.mcpServers.length, s.mcp[1]],
    [s.hooks[0], c.hooks.length, s.hooks[1]],
    [s.actions[0], c.actions.length + c.projectScripts.length, s.actions[1]],
    [s.automations[0], c.automations.length, s.automations[1]]
  ];
  return items.map(([name,count,summary]) => '<div class="card"><div class="card-title"><strong>'+h(name)+'</strong>'+badge(count)+'</div><div class="summary">'+h(summary)+'</div></div>').join('');
}
function childRepos() {
  const repos = DATA.project.git.childRepositories || [];
  return repos.length ? '<div style="margin-top:12px">'+repos.map(r => '<div class="row"><strong>'+h(r.relativePath)+'</strong><div class="summary">'+h([r.branch, r.head, r.remote].filter(Boolean).join(' | '))+'</div></div>').join('')+'</div>' : empty(t().overview.noNestedRepos);
}
function renderSkills() {
  const skills = filteredSkills();
  return '<div class="card-grid">'+(skills.map(renderSkillCard).join('') || empty(t().overview.noSkillMatches))+'</div>';
}
function renderSkillCard(skill) {
  const counts = skill.resources?.counts || {}, notes = (skill.diagnostics || []).length, labels = t().labels;
  return '<article class="card clickable" data-detail-type="skill" data-detail-id="'+h(skill.id)+'"><div class="card-title"><strong>$'+h(skill.name)+'</strong>'+layerBadge(skill.layer)+'</div><div class="summary">'+h(skill.summary)+'</div><div class="badge-row">'+(skill.scenarios || []).slice(0,4).map(s => badge(s)).join('')+(counts.references ? badge(counts.references+' '+labels.refs) : '')+(counts.scripts ? badge(counts.scripts+' '+labels.scripts) : '')+(notes ? badge(notes+' '+labels.notes,'warning') : '')+'</div><div class="meta path">'+h(skill.relativePath || skill.path)+'</div></article>';
}
function renderWorkflows() {
  const skills = filteredSkills();
  return '<div class="card-grid">'+(skills.map(skill => '<article class="card clickable" data-detail-type="skill" data-detail-id="'+h(skill.id)+'"><div class="card-title"><strong>$'+h(skill.name)+'</strong>'+badge(skill.workflow?.source || 'unknown')+'</div><ol class="list" style="margin-top:12px">'+(skill.workflow?.steps || []).slice(0,5).map(step => '<li>'+h(step)+'</li>').join('')+'</ol></article>').join('') || empty(t().workflow.noMatches))+'</div>';
}
function renderRules() {
  return '<div class="card-grid">'+(DATA.rules.map(rule => '<article class="card clickable" data-detail-type="rule" data-detail-id="'+h(rule.id)+'"><div class="card-title"><strong>'+h(rule.relativePath)+'</strong>'+badge(rule.adapter)+'</div><div class="summary">'+h(rule.summary)+'</div><div class="badge-row">'+(rule.headings || []).slice(0,4).map(x => badge(x.text)).join('')+'</div></article>').join('') || empty(t().rules.none))+'</div>';
}
function renderConfig() {
  const c = DATA.configs, labels = t().config;
  return '<div class="grid-2">'+surfaceSection(labels.configFiles, c.configFiles, 'config')+surfaceSection(labels.mcpServers, c.mcpServers, 'mcp')+surfaceSection(labels.hooks, c.hooks, 'hook')+surfaceSection(labels.localActions, c.actions, 'action')+surfaceSection(labels.automations, c.automations, 'automation')+surfaceSection(labels.projectScripts, c.projectScripts, 'script')+'</div>';
}
function surfaceSection(title, items, type) {
  return '<section class="panel"><div class="card-title"><strong>'+h(title)+'</strong><span class="summary">'+h(items.length)+'</span></div><div style="margin-top:10px">'+(items.length ? items.map(item => '<div class="row clickable" data-detail-type="'+type+'" data-detail-id="'+h(item.id)+'"><strong>'+h(item.name)+'</strong><div class="summary">'+h(item.summary)+'</div><div class="meta path">'+h(item.relativePath || item.path)+'</div></div>').join('') : empty(format(t().config.noneDetected, { title })))+'</div></section>';
}
function renderDiagnostics() {
  return '<section class="panel">'+(DATA.diagnostics.length ? DATA.diagnostics.map(item => '<div class="row clickable" data-detail-type="diagnostic" data-detail-id="'+h(item.id)+'"><div class="card-title"><strong>'+h(item.title)+'</strong>'+badge(item.severity,item.severity)+'</div><div class="summary">'+h(item.detail)+'</div><div class="meta path">'+h(item.path)+'</div></div>').join('') : empty(t().diagnostics.none))+'</section>';
}
function wireContentClicks() { document.querySelectorAll('[data-detail-type]').forEach(el => el.addEventListener('click', () => { state.selected = { type: el.dataset.detailType, id: el.dataset.detailId }; renderDetails(); })); }
function renderDetails() {
  const panel = byId('details'); if (!panel) return;
  if (!state.selected) { panel.innerHTML = '<div class="detail-empty">'+h(t().details.empty)+'</div>'; return; }
  const {type,id} = state.selected;
  if (type === 'skill') return renderSkillDetails(findById(DATA.skills,id), panel);
  if (type === 'rule') return renderRuleDetails(findById(DATA.rules,id), panel);
  if (type === 'diagnostic') return renderDiagnosticDetails(findById(DATA.diagnostics,id), panel);
  const surface = findSurface(type,id); if (surface) return renderSurfaceDetails(surface,panel,type);
  panel.innerHTML = '<div class="detail-empty">'+h(t().details.missing)+'</div>';
}
function shell(title, subtitle, body) { return '<div class="detail-header"><div><h2 class="detail-title">'+h(title)+'</h2><div class="summary">'+h(subtitle || '')+'</div></div><button class="close-btn" id="closeDetails">×</button></div>'+body; }
function done() { byId('closeDetails')?.addEventListener('click', () => { state.selected = null; renderDetails(); }); }
function renderSkillDetails(skill,panel) {
  if (!skill) return;
  const d = t().details;
  panel.innerHTML = shell('$'+skill.name, skill.description, '<div class="detail-block">'+layerBadge(skill.layer)+' '+badge(skill.workflow?.source === 'inferred' ? t().workflow.inferred : t().workflow.explicit,'info')+'</div>'+kv([[d.path,skill.path],[d.source,skill.sourceLabel],[d.scenarios,(skill.scenarios || []).join(', ')],[d.mentions,(skill.mentions || []).map(x=>'$'+x).join(', ') || d.noneDetected]])+list(d.triggers, skill.triggers)+list(d.workflow, skill.workflow?.steps)+list(d.outputs, skill.workflow?.outputs)+list(d.guardrails, skill.workflow?.guardrails)+resources(skill.resources)+list(d.diagnostics, (skill.diagnostics || []).map(diag => diag.severity+': '+diag.title)));
  done();
}
function renderRuleDetails(rule,panel) {
  if (!rule) return;
  const d = t().details;
  panel.innerHTML = shell(rule.relativePath, rule.summary, kv([[d.adapter,rule.adapter],[d.scope,rule.scope],[d.path,rule.path],[d.size,rule.size+' bytes']])+list(d.headings,(rule.headings || []).map(x=>x.text))+list(d.keyBullets,rule.bullets)+list(d.commands,rule.commands));
  done();
}
function renderDiagnosticDetails(item,panel) {
  if (!item) return;
  const d = t().details;
  panel.innerHTML = shell(item.title, d.diagnostics, kv([[d.severity,item.severity],[d.detail,item.detail],[d.path,item.path]]));
  done();
}
function renderSurfaceDetails(item,panel,type) {
  const d = t().details;
  panel.innerHTML = shell(item.name, type, kv([[d.source,item.source || item.scope || 'detected'],[d.path,item.path],[d.summary,item.summary]]));
  done();
}
function kv(rows) { return '<div class="detail-block">'+rows.map(([k,v]) => '<div class="kv"><div class="key">'+h(k)+'</div><div class="'+(k === t().details.path ? 'path' : '')+'">'+h(v || 'None')+'</div></div>').join('')+'</div>'; }
function list(title,items) { return items && items.length ? '<div class="detail-block"><h3>'+h(title)+'</h3><ul class="list">'+items.map(x => '<li>'+h(x)+'</li>').join('')+'</ul></div>' : ''; }
function resources(r) {
  if (!r) return '';
  return '<div class="detail-block"><h3>'+h(t().details.resources)+'</h3>'+['references','scripts','assets','agents'].map(group => '<div class="row"><strong>'+h(group)+' ('+h((r[group] || []).length)+')</strong>'+(r[group] || []).slice(0,8).map(item => '<div class="path">'+h(item.relativePath || item.path)+'</div>').join('')+'</div>').join('')+'</div>';
}
function findSurface(type,id) { const map = { config: DATA.configs.configFiles, mcp: DATA.configs.mcpServers, hook: DATA.configs.hooks, action: DATA.configs.actions, automation: DATA.configs.automations, script: DATA.configs.projectScripts }; return findById(map[type] || [], id); }
function findById(items,id) { return (items || []).find(item => item.id === id); }
function countBy(items, fn) { return items.reduce((acc,item) => { const key = fn(item); acc[key] = (acc[key] || 0) + 1; return acc; }, {}); }
function format(template, values) { return String(template).replace(/\\{([a-zA-Z0-9_]+)\\}/g, (_, key) => values[key] ?? ''); }
async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
function empty(text) { return '<div class="empty">'+h(text)+'</div>'; }
init();
`;

function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildRefreshCommand(projectRoot: string, reportPath: string, language: Language, projectOnly: boolean): string {
  const parts = [
    "agentscope",
    "scan",
    shellQuote(projectRoot),
    "--html",
    "--html-output",
    shellQuote(reportPath),
    "--lang",
    language,
  ];
  if (projectOnly) parts.push("--project-only");
  return parts.join(" ");
}

function shellQuote(value: string): string {
  return `"${value.replace(/(["\\$`])/g, "\\$1")}"`;
}
