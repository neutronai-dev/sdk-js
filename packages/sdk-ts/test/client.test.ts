import { describe, expect, it } from "vitest";
import { NeutronAIClient, NeutronAISdkError } from "../src";

describe("NeutronAIClient", () => {
  it("injects nucleus id, legacy tenant id, and bearer token", async () => {
    const requests: Request[] = [];
    const client = new NeutronAIClient({
      baseUrl: "http://localhost:8787",
      token: "secret",
      nucleusId: "tenant_demo",
      fetchImpl: async (input, init) => {
        requests.push(new Request(input, init));
        return Response.json({ memoryId: "mem_1", accepted: true, warnings: [] });
      },
    });
    await client.remember({ scopeId: "user:derek", type: "preference", text: "hello" });
    expect(requests[0]?.headers.get("authorization")).toBe("Bearer secret");
    expect(await requests[0]?.json()).toMatchObject({ tenantId: "tenant_demo", nucleusId: "tenant_demo" });
  });

  it("exposes composed knowledge and decision intelligence domains", async () => {
    const requests: Request[] = [];
    const client = new NeutronAIClient({
      baseUrl: "http://localhost:8787",
      nucleusId: "neutron",
      fetchImpl: async (input, init) => {
        requests.push(new Request(input, init));
        return Response.json({ entities: [], nucleusId: "neutron", promptContext: "", warnings: [], trace: {} });
      },
    });
    await client.entities.search({ scopeIds: ["repo:root"], query: "worker" });
    await client.context.build({ scopeIds: ["repo:root"], task: "Plan a migration" });
    await client.search({ scopeIds: ["repo:root"], query: "prior decisions" });
    await client.memory.recall({ scopeIds: ["repo:root"], query: "architecture" });
    await client.entities.get("service_api", { agentId: "agent_planner", temporal: { knowledgeAt: 1_000 } });

    expect(requests.map((request) => new URL(request.url).pathname)).toEqual([
      "/v1/entities/search",
      "/v1/context/build",
      "/v1/search",
      "/v1/memory/recall",
      "/v1/entities/service_api",
    ]);
    expect(await requests[0]?.json()).toMatchObject({ nucleusId: "neutron", tenantId: "neutron", scopeIds: ["repo:root"] });
    expect(new URL(requests[4]?.url ?? "").searchParams.get("agentId")).toBe("agent_planner");
    expect(new URL(requests[4]?.url ?? "").searchParams.get("knowledgeAt")).toBe("1000");
  });

  it("rejects mismatched constructor aliases", () => {
    expect(
      () =>
        new NeutronAIClient({
          baseUrl: "http://localhost:8787",
          nucleusId: "tenant_a",
          tenantId: "tenant_b",
        }),
    ).toThrow("nucleusId and tenantId must match");
  });

  it("throws typed errors", async () => {
    const client = new NeutronAIClient({
      baseUrl: "http://localhost:8787",
      fetchImpl: async () => Response.json({ error: { code: "bad_request", message: "No" } }, { status: 400 }),
    });
    await expect(client.health()).rejects.toBeInstanceOf(NeutronAISdkError);
  });

  it("sends cache policy with agent context", async () => {
    const requests: Request[] = [];
    const client = new NeutronAIClient({
      baseUrl: "http://localhost:8787",
      tenantId: "tenant_demo",
      fetchImpl: async (input, init) => {
        requests.push(new Request(input, init));
        return Response.json({ task: "x", scopeIds: [], promptContext: "", warnings: [] });
      },
    });
    await client.agentContext({
      scopeIds: ["user:derek"],
      task: "Build context",
      cachePolicy: { mode: "prefer_cache", keyMode: "intent_profile", ttlSeconds: 300 },
    });
    expect(requests[0]?.url).toBe("http://localhost:8787/v1/memory/agent-context");
    expect(await requests[0]?.json()).toMatchObject({
      tenantId: "tenant_demo",
      cachePolicy: { mode: "prefer_cache", keyMode: "intent_profile", ttlSeconds: 300 },
    });
  });

  it("calls cache stats, invalidate, and warm routes", async () => {
    const requests: Request[] = [];
    const client = new NeutronAIClient({
      baseUrl: "http://localhost:8787",
      tenantId: "tenant_demo",
      fetchImpl: async (input, init) => {
        requests.push(new Request(input, init));
        return Response.json({ ok: true, invalidated: 1, warmed: 1, skipped: 0, cacheKeys: [], warnings: [] });
      },
    });
    await client.cacheStats({ agentId: "agent_builder" });
    await client.invalidateCache({ scopeId: "user:derek", reason: "test" });
    await client.warmCache({ scopeIds: ["user:derek"], tasks: ["Prepare context"] });
    expect(requests[0]?.method).toBe("GET");
    expect(requests[0]?.url).toContain("/v1/memory/cache/stats?nucleusId=tenant_demo&agentId=agent_builder");
    expect(requests[1]?.url).toBe("http://localhost:8787/v1/memory/cache/invalidate");
    expect(await requests[1]?.json()).toMatchObject({ tenantId: "tenant_demo", nucleusId: "tenant_demo", scopeId: "user:derek" });
    expect(requests[2]?.url).toBe("http://localhost:8787/v1/memory/cache/warm");
    expect(await requests[2]?.json()).toMatchObject({ tenantId: "tenant_demo", nucleusId: "tenant_demo", scopeIds: ["user:derek"] });
  });

  it("calls skill, knowledge-base, and plugin installation routes", async () => {
    const requests: Request[] = [];
    const client = new NeutronAIClient({
      baseUrl: "http://localhost:8787",
      token: "api_workspace_key",
      fetchImpl: async (input, init) => {
        requests.push(new Request(input, init));
        return Response.json({ installedAssets: [], duplicateMemoryIds: [] });
      },
    });

    await client.listIndustryLibrary();
    await client.createIndustryLibraryAsset({
      kind: "skill",
      title: "Support triage",
      industry: "SaaS",
      summary: "Triage support requests.",
      body: "Validate severity, ownership, and escalation policy.",
      tags: ["support"],
    });
    await client.installIndustryLibraryAsset("asset_skill", { nucleusId: "support" });
    await client.installIndustryLibraryAsset("asset_knowledge", { nucleusId: "support" });
    await client.installIndustryLibraryPlugin("support-operations", {
      nucleusId: "support",
      assetIds: ["support-triage-skill"],
    });

    expect(requests.map((request) => `${request.method} ${new URL(request.url).pathname}`)).toEqual([
      "GET /v1/platform/industry-library",
      "POST /v1/platform/industry-library/uploads",
      "POST /v1/platform/industry-library/uploads/asset_skill/install",
      "POST /v1/platform/industry-library/uploads/asset_knowledge/install",
      "POST /v1/platform/industry-library/plugins/support-operations/install",
    ]);
    expect(requests.every((request) => request.headers.get("authorization") === "Bearer api_workspace_key")).toBe(true);
    expect(await requests[4]?.json()).toEqual({ nucleusId: "support", assetIds: ["support-triage-skill"] });
  });

  it("preserves error status and body", async () => {
    const client = new NeutronAIClient({
      baseUrl: "http://localhost:8787",
      fetchImpl: async () => Response.json({ error: { code: "cache_error", message: "No" } }, { status: 409 }),
    });
    await expect(client.cacheStats({ tenantId: "tenant_demo" })).rejects.toMatchObject({
      status: 409,
      body: { error: { code: "cache_error", message: "No" } },
    });
  });

  it("calls Nucleus control-plane routes", async () => {
    const requests: Request[] = [];
    const client = new NeutronAIClient({
      baseUrl: "http://localhost:8787",
      token: "secret",
      fetchImpl: async (input, init) => {
        requests.push(new Request(input, init));
        return Response.json({ nucleusId: "prod", name: "Production", nuclei: [], events: [], warnings: [] });
      },
    });

    await client.listNuclei({ q: "prod", limit: 10 });
    await client.createNucleus({
      nucleusId: "prod",
      name: "Production",
      placement: { mode: "global", guarantee: "none", notes: [] },
    });
    await client.updateNucleus("prod", { name: "Production memory" });
    await client.getNucleusHealth("prod");
    await client.getNucleusPlacement("prod");
    await client.getNucleusEvents("prod", { limit: 5 });
    await client.prewarmNucleus("prod", { scopeIds: ["workspace:sandbox"] });
    await client.disableNucleus("prod", { reason: "maintenance" });
    await client.deleteNucleus("prod", { confirm: "prod", reason: "cleanup" });

    expect(requests.map((request) => `${request.method} ${new URL(request.url).pathname}${new URL(request.url).search}`)).toEqual([
      "GET /v1/nuclei?q=prod&limit=10",
      "POST /v1/nuclei",
      "PATCH /v1/nuclei/prod",
      "GET /v1/nuclei/prod/health",
      "GET /v1/nuclei/prod/placement",
      "GET /v1/nuclei/prod/events?limit=5",
      "POST /v1/nuclei/prod/prewarm",
      "POST /v1/nuclei/prod/disable",
      "POST /v1/nuclei/prod/delete",
    ]);
    expect(await requests[1]?.json()).toMatchObject({
      nucleusId: "prod",
      placement: { mode: "global", guarantee: "none" },
    });
    expect(await requests[2]?.json()).toMatchObject({ nucleusId: "prod", name: "Production memory" });
    expect(await requests[6]?.json()).toMatchObject({ scopeIds: ["workspace:sandbox"] });
    expect(await requests[8]?.json()).toMatchObject({ confirm: "prod", reason: "cleanup" });
  });
});
