# @neutron-ai/sdk

Public TypeScript client, provider connectors, and MCP helpers for the Neutron AI memory API.

```ts
import { NeutronAIClient } from "@neutron-ai/sdk";

const client = new NeutronAIClient({
  baseUrl: "http://localhost:8787",
  token: process.env.MEMORY_API_TOKEN,
  nucleusId: "nucleus_demo"
});

await client.remember({
  scopeId: "user:derek",
  type: "preference",
  text: "Derek prefers implementation-ready technical explanations.",
  privacyClass: "user_private"
});

await client.agentContext({
  scopeIds: ["user:derek"],
  task: "Prepare coding agent context.",
  cachePolicy: {
    mode: "prefer_cache",
    keyMode: "intent_profile",
    ttlSeconds: 300
  }
});

await client.cacheStats();
await client.invalidateCache({ scopeId: "user:derek", reason: "manual_refresh" });
await client.warmCache({
  scopeIds: ["user:derek"],
  tasks: ["Prepare coding agent context."]
});
```

## Knowledge and Decision Intelligence

The client exposes composed domain facades while retaining every existing flat memory and consequence method:

```ts
const context = await client.context.build({
  scopeIds: ["project:neutron", "team:platform"],
  agentId: "agent_planner",
  task: "Compare deployment options using prior decisions and outcomes",
  graphDimensions: ["dependency", "operational"],
  tokenBudget: 4_000,
  createSnapshot: true,
  debug: true
});

const evaluation = await client.decisions.evaluate({
  decisionId: "decision_example"
});

const scenarios = await client.simulate({
  scopeIds: ["project:neutron"],
  state: { releaseReady: true },
  proposedActions: [{ id: "stage", type: "staged_release", payload: { percent: 10 } }],
  horizon: { label: "48 hours" },
  objectives: [{ id: "risk", dimension: "operational_risk", direction: "minimize" }],
  provenance: {
    sourceType: "user",
    sourceId: "release_manager",
    classification: "provided",
    recordedAt: Date.now()
  }
});
```

Available facades are `memory`, `entities`, `graph`, `context`, `decisions`, `consequences`, `outcomes`, `learning`, `agents`, `snapshots`, `claims`, and `contradictions`, plus top-level `simulate` and `search` functions. To resolve a contradiction whose claims come from more than one Scope, pass `scopeIds` covering every one of them; pass `scopeId` when reading or tombstoning entities and relationships for one Scope.

## Consequence Thought

Create bounded, reviewable scenarios from authorized Nucleus scopes without
storing hidden model reasoning:

```ts
const run = await client.consequencePlan({
  scopeIds: ["repo:root", "tests:release"],
  task: "Compare reversible release paths",
  domain: "codebase",
  policy: { depth: 10, allowExecution: false }
});

await client.consequenceSimulate({
  runId: run.runId,
  policy: { depth: 20 }
});
```

The SDK also supports application-supplied candidates with objective impacts,
versioned and digested run artifacts, external approval provenance, evaluation,
decision and approval records, execution-gate checks, observations, reflections,
cancellation, scoped listing, and single or lifecycle-scoped tombstone deletion.
Constructor-level `nucleusId` continues to inject the legacy `tenantId` alias.

## Skills, Knowledge Bases, and Plugins

Use a workspace API key for industry library operations. Plugins are catalog packs containing one
or more skills and knowledge bases; they do not execute uploaded code.

```ts
const workspaceClient = new NeutronAIClient({
  baseUrl: "https://neutronai.dev/api",
  token: process.env.NEUTRON_WORKSPACE_API_KEY
});

const knowledge = await workspaceClient.createIndustryLibraryAsset({
  kind: "knowledge_base",
  title: "Support response policy",
  industry: "B2B SaaS",
  summary: "Response-time policy for support incidents.",
  body: "Priority-one incidents require acknowledgement within fifteen minutes.",
  tags: ["support", "policy"]
});

await workspaceClient.installIndustryLibraryAsset(knowledge.assetId, {
  nucleusId: "support-production"
});

await workspaceClient.installIndustryLibraryPlugin("agent-memory-context-engineering", {
  nucleusId: "support-production"
});
```

Install team policy, a language-specific coding standards/skill/knowledge-base pack, and GitHub CI/CD
governance into a shared Code Nucleus:

```ts
for (const pluginId of [
  "team-code-governance",
  "rust-engineering-governance",
  "github-cicd-governance"
]) {
  await workspaceClient.installIndustryLibraryPlugin(pluginId, {
    nucleusId: "repository-production"
  });
}
```

Request the installed scopes (`governance:team-code`, `standards:rust`, and
`delivery:github-actions`) before repository edits. Neutron provides persistent governed context;
repository instructions and deterministic local/CI checks remain authoritative.

## Provider Connectors

Provider adapters build request fragments. They do not call model providers or handle provider API keys.

```ts
import { NeutronAIClient, createNeutronConnector } from "@neutron-ai/sdk";

const client = new NeutronAIClient({
  baseUrl: "https://memory.example.com",
  token: process.env.MEMORY_API_TOKEN,
  nucleusId: "nucleus_demo"
});

const connector = createNeutronConnector(client, {
  scopeIds: ["workspace:acme", "project:neutron"],
  agentId: "agent_builder",
  cachePolicy: { mode: "prefer_cache", keyMode: "intent_profile", ttlSeconds: 300 }
});

const { request } = await connector.createProviderContextRequest("openai", {
  task: "Use memory to answer the user with project-specific context."
}, {
  input: "What should the builder agent know before generating code?"
});

// Pass `request` to your OpenAI Responses API client.
```

Supported adapters:

- `openai`
- `anthropic`
- `google_gemini`
- `mistral`
- `xai`
- `deepseek`
- `groq`
- `cohere`
- `perplexity`
- `openrouter`
- `cloudflare_workers_ai`
- `azure_openai`
- `amazon_bedrock`
- `vertex_ai`

## MCP Helpers

```ts
import { createNeutronMcpServerUrl, createOpenAIMcpTool } from "@neutron-ai/sdk";

const serverUrl = createNeutronMcpServerUrl("https://memory.example.com");

const tool = createOpenAIMcpTool({
  serverUrl,
  serverLabel: "neutron_memory",
  allowedTools: ["memory_agent_context", "memory_recall"],
  requireApproval: "never"
});
```

For Anthropic:

```ts
import { createAnthropicMcpConnector } from "@neutron-ai/sdk";

const mcp = createAnthropicMcpConnector({
  serverUrl: "https://memory.example.com/mcp",
  serverLabel: "neutron_memory",
  authorization: process.env.NEUTRON_MCP_TOKEN
});
```

## Obsidian Vault Import

The SDK includes a dependency-free Obsidian importer for local vault files. It supports Markdown notes (`.md`), JSON Canvas (`.canvas`), and Bases (`.base`). The importer skips `.obsidian` configuration, preserves note paths, tags, wikilinks, embeds, Canvas structure, and Base view names as metadata, then writes bounded Neutron memories.

```ts
import { NeutronAIClient, importObsidianVault } from "@neutron-ai/sdk";

const client = new NeutronAIClient({
  baseUrl: process.env.NEUTRON_API_URL!,
  token: process.env.NEUTRON_API_TOKEN!,
  nucleusId: process.env.NEUTRON_NUCLEUS_ID!
});

await importObsidianVault(
  client,
  [
    {
      path: "Projects/Neutron.md",
      content: "# Neutron\nScoped memory for agents.",
      modifiedAt: Date.now()
    }
  ],
  {
    scopeId: "kb:obsidian",
    sourceName: "Product vault",
    privacyClass: "user_private"
  }
);
```

Use `createObsidianImportPlan` for dry runs, previews, custom approval flows, or browser-based file pickers before sending memory writes.
