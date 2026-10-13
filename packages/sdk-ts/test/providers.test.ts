import type { AgentContextPack } from "@neutron-ai/shared";
import { describe, expect, it } from "vitest";
import { NeutronAIClient, createNeutronConnector, createNeutronMcpServerUrl, createProviderRequest, frontier_provider_registry } from "../src";

const context_pack: AgentContextPack = {
  task: "Answer with repository memory.",
  scopeIds: ["project:neutron"],
  preferences: [],
  skills: [],
  knowledge: [],
  experience: [],
  usagePatterns: [],
  toolLessons: [],
  safetyRules: [],
  projectMemory: [],
  promptContext: "# Relevant Memory\n\n## Project Memory\n- Neutron AI uses hybrid RAG-CAG memory.",
  warnings: [],
};

describe("provider adapters", () => {
  it("builds OpenAI Responses requests with remote MCP tools", () => {
    const request = createProviderRequest("openai", context_pack, {
      input: "Summarize Neutron.",
      mcp: {
        serverUrl: "https://memory.example.com/mcp",
        serverLabel: "neutron_memory",
        allowedTools: ["memory_agent_context"],
      },
    });

    expect(request).toMatchObject({
      model: "gpt-5.5",
      input: "Summarize Neutron.",
    });
    expect(String(request.instructions)).toContain("hybrid RAG-CAG");
    expect(request.tools).toEqual([
      {
        type: "mcp",
        server_label: "neutron_memory",
        server_url: "https://memory.example.com/mcp",
        require_approval: "never",
        allowed_tools: ["memory_agent_context"],
      },
    ]);
  });

  it("builds Anthropic Messages requests with MCP connector fields", () => {
    const request = createProviderRequest("anthropic", context_pack, {
      input: "Summarize Neutron.",
      mcp: {
        serverUrl: "https://memory.example.com/sse",
        serverLabel: "neutron_memory",
        authorization: "token",
      },
    });

    expect(request).toMatchObject({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      betas: ["mcp-client-2025-11-20"],
      mcp_servers: [{ type: "url", url: "https://memory.example.com/sse", name: "neutron_memory", authorization_token: "token" }],
      tools: [{ type: "mcp_toolset", mcp_server_name: "neutron_memory" }],
    });
    expect(JSON.stringify(request.system)).toContain("hybrid RAG-CAG");
  });

  it("builds Gemini and OpenAI-compatible chat requests", () => {
    const gemini_request = createProviderRequest("google_gemini", context_pack, { input: "Use memory." });
    const mistral_request = createProviderRequest("mistral", context_pack, { input: "Use memory.", model: "mistral-large-latest" });

    expect(JSON.stringify(gemini_request)).toContain("systemInstruction");
    expect(JSON.stringify(gemini_request)).toContain("hybrid RAG-CAG");
    expect(mistral_request).toMatchObject({
      model: "mistral-large-latest",
      messages: [
        { role: "system", content: expect.stringContaining("hybrid RAG-CAG") },
        { role: "user", content: "Use memory." },
      ],
    });
  });

  it("lists supported frontier provider adapters", () => {
    expect(Object.keys(frontier_provider_registry)).toEqual([
      "openai",
      "anthropic",
      "google_gemini",
      "mistral",
      "xai",
      "deepseek",
      "groq",
      "cohere",
      "perplexity",
      "openrouter",
      "cloudflare_workers_ai",
      "azure_openai",
      "amazon_bedrock",
      "vertex_ai",
    ]);
  });

  it("builds provider context requests through the connector wrapper", async () => {
    const requests: Request[] = [];
    const client = new NeutronAIClient({
      baseUrl: "https://memory.example.com",
      tenantId: "tenant_demo",
      fetchImpl: async (input, init) => {
        const request = new Request(input, init);
        const body = (await request.clone().json()) as { task?: string };
        requests.push(request);
        return Response.json({ ...context_pack, task: body.task ?? context_pack.task });
      },
    });
    const connector = createNeutronConnector(client, {
      scopeIds: ["project:neutron"],
      agentId: "agent_docs",
      cachePolicy: { mode: "prefer_cache", keyMode: "intent_profile" },
    });

    const result = await connector.createProviderContextRequest("openrouter", {
      task: "Write docs.",
    });

    expect(requests[0]?.url).toBe("https://memory.example.com/v1/memory/agent-context");
    expect(await requests[0]?.json()).toMatchObject({
      tenantId: "tenant_demo",
      scopeIds: ["project:neutron"],
      agentId: "agent_docs",
      cachePolicy: { mode: "prefer_cache", keyMode: "intent_profile" },
    });
    expect(result.request).toMatchObject({
      model: "provider-default",
      messages: [{ role: "system", content: expect.stringContaining("hybrid RAG-CAG") }, { role: "user", content: "Write docs." }],
    });
  });

  it("normalizes MCP server urls", () => {
    expect(createNeutronMcpServerUrl("https://memory.example.com/")).toBe("https://memory.example.com/mcp");
    expect(createNeutronMcpServerUrl("https://memory.example.com", "custom-mcp")).toBe("https://memory.example.com/custom-mcp");
  });
});
