# AgentScope

AgentScope 是一个开源的 agent-native 工作区检查器。

它会扫描 Codex、Claude Code、Cursor 和自定义 coding agent 使用的项目文件夹，生成一份自包含的工作区地图，帮助你理解项目里的规则、Skills、记忆、工具、脚本、配置、风险和推断工作流。

AgentScope 不是工作流编排器。它是给已经存在的 agent workspace 做 X 光检查的工具。

## 为什么做

现代 agent 项目越来越像“文件夹操作系统”。一个项目里可能同时有：

- `AGENTS.md`、`CLAUDE.md`、Cursor rules 等 agent 规则。
- 本地 Skills、commands、prompts、runbooks 和记忆文件。
- MCP/tool 配置、hooks、脚本和生成产物。
- 没有被画成 DAG、但确实存在的隐式工作流。

AgentScope 的目标是把这一层操作系统变得可见。

## 安装与使用

AgentScope 当前是 Node.js / TypeScript CLI。默认语言是中文，使用 `--lang en` 可以切换英文输出和英文 HTML 默认界面。

### 从 GitHub 安装

在发布到 npm 之前，可以直接从 GitHub 安装：

```bash
npm install -g github:WangHopeDream/agentscope
agentscope scan /path/to/workspace --html
agentscope scan /path/to/workspace --html --lang en
```

### 从源码运行

```bash
git clone git@github.com:WangHopeDream/agentscope.git
cd agentscope
npm install
npm run build
node dist/cli.js scan .
node dist/cli.js scan /path/to/workspace --json --output scan.json
node dist/cli.js scan /path/to/workspace --html
node dist/cli.js scan /path/to/workspace --html --lang en
node dist/cli.js diff old-scan.json new-scan.json
```

### 更新 CLI

如果你是从 GitHub 全局安装的，重新运行安装命令即可更新到 GitHub 上的最新版本：

```bash
npm install -g github:WangHopeDream/agentscope
agentscope --version
```

如果你是从源码运行的：

```bash
git pull
npm install
npm run build
node dist/cli.js --version
```

安装成 package 后，命令是：

```bash
agentscope scan .
agentscope scan /path/to/project --html
agentscope scan /path/to/project --json
agentscope scan /path/to/project --html --lang en
agentscope diff old-scan.json new-scan.json
```

默认情况下，`scan` 会把你传入的路径当作 workspace 根目录。这是刻意设计的：agent workspace 经常是一个包含多个 Git 仓库的大文件夹，而不是单个 Git repo。

## 国际化

当前支持：

- 中文：默认语言。
- English：通过 `--lang en` 使用。

生成的 HTML 报告内置语言切换按钮，可以在中文和 English 之间即时切换，不需要重新扫描。

HTML 报告还包含轻量刷新按钮：

- 复制刷新命令：复制一条可重新生成当前报告的 `agentscope scan ... --html-output ...` 命令。
- 复制给 Agent：复制一段给 Agent 的刷新请求，让 Agent 帮你执行刷新命令。

这个刷新机制不启动本地 server，也不会让静态网页直接执行本机命令。

## 定位

Dify 和 LangGraph 帮你构建 agent workflows。

AgentScope 帮你理解已经存在的 agent workspaces。

## 仓库结构

```text
src/                 TypeScript CLI、scanner、adapters、diff 和 renderers。
schemas/             扫描输出的稳定 JSON schemas。
docs/                产品、架构和路线图说明。
examples/            示例扫描输入和输出。
```

## 相关仓库

- `agentscope-skills`：可选的 agent-specific wrappers、Skills 和使用模板。核心 CLI 不依赖这个仓库。

## 当前状态

早期 Node/TypeScript 实现。第一版 CLI 已支持扫描 Codex-style workspace、输出 JSON、生成单文件 HTML 报告、比较两次扫描结果，并识别多仓库 workspace。Claude Code 和 Cursor adapter 已在中立 schema 中预留，后续会继续加深扫描能力。

---

# AgentScope

AgentScope is an open-source inspector for agent-native project workspaces.

It scans folders used by coding agents such as Codex, Claude Code, Cursor, and custom agent systems, then generates a self-contained map of the project's rules, skills, memory, tools, scripts, configs, risks, and inferred workflows.

AgentScope is not a workflow orchestrator. It is a project X-ray for agent workspaces that already exist.

## Why

Modern agent projects are increasingly folder-based. A project may contain:

- Agent rules such as `AGENTS.md`, `CLAUDE.md`, or Cursor rules.
- Local skills, commands, prompts, runbooks, and memory files.
- MCP/tool configuration, hooks, scripts, and generated outputs.
- Implicit workflows that are never represented as a single DAG.

AgentScope makes that operating layer visible.

## Install And Use

AgentScope ships as a Node.js / TypeScript CLI. Chinese is the default language. Use `--lang en` for English CLI output and an English default HTML report.

### Install From GitHub

Until the package is published to npm, install directly from the GitHub repo:

```bash
npm install -g github:WangHopeDream/agentscope
agentscope scan /path/to/workspace --html
agentscope scan /path/to/workspace --html --lang en
```

### Run From Source

```bash
git clone git@github.com:WangHopeDream/agentscope.git
cd agentscope
npm install
npm run build
node dist/cli.js scan .
node dist/cli.js scan /path/to/workspace --json --output scan.json
node dist/cli.js scan /path/to/workspace --html
node dist/cli.js scan /path/to/workspace --html --lang en
node dist/cli.js diff old-scan.json new-scan.json
```

### Update The CLI

If you installed globally from GitHub, run the install command again to update to the latest GitHub version:

```bash
npm install -g github:WangHopeDream/agentscope
agentscope --version
```

If you run from source:

```bash
git pull
npm install
npm run build
node dist/cli.js --version
```

When installed as a package, the binary is:

```bash
agentscope scan .
agentscope scan /path/to/project --html
agentscope scan /path/to/project --json
agentscope scan /path/to/project --html --lang en
agentscope diff old-scan.json new-scan.json
```

By default, `scan` treats the provided path as the workspace root. This is intentional: agent workspaces are often multi-repository folders rather than a single Git repository.

## Internationalization

Currently supported:

- Chinese: default language.
- English: enabled with `--lang en`.

Generated HTML reports include a built-in language switcher, so readers can switch between Chinese and English without rescanning.

HTML reports also include lightweight refresh buttons:

- Copy refresh command: copies an `agentscope scan ... --html-output ...` command that regenerates the current report.
- Copy for Agent: copies a short prompt asking an agent to run the refresh command.

This refresh flow does not start a local server and does not let static HTML execute local commands directly.

## Positioning

Dify and LangGraph help you build agent workflows.

AgentScope helps you understand agent workspaces that already exist.

## Repository Layout

```text
src/                 TypeScript CLI, scanner, adapters, diff, and renderers.
schemas/             Stable JSON schemas for scan outputs.
docs/                Product, architecture, and roadmap notes.
examples/            Example scan inputs and outputs.
```

## Related Repositories

- `agentscope-skills`: optional agent-specific wrappers, skills, and usage templates. The core CLI does not require this repository.

## Status

Early Node/TypeScript implementation. The first CLI can scan Codex-style workspaces, emit JSON, render a self-contained HTML report, diff two scan outputs, and detect multi-repository workspaces. Claude Code and Cursor adapters are represented in the neutral schema and will deepen over time.
