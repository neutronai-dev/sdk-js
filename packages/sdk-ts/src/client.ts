import type {
  AgentContextPack,
  AgentContextRequest,
  AuditResponse,
  CacheInvalidateRequest,
  CacheInvalidateResponse,
  CacheStatsRequest,
  CacheStatsResponse,
  CacheWarmRequest,
  CacheWarmResponse,
  CompactRequest,
  ConsequenceApproveRequest,
  ConsequenceApproval,
  ConsequenceBulkDeleteRequest,
  ConsequenceBulkDeletionResponse,
  ConsequenceDecisionDetail,
  ConsequenceDecideRequest,
  ConsequenceDeleteRequest,
  ConsequenceDeletionResponse,
  ConsequenceEvalResult,
  ConsequenceEvaluateRequest,
  ConsequenceExecutionResponse,
  ConsequenceExecuteRequest,
  ConsequenceObserveRequest,
  ConsequencePlanRequest,
  ConsequenceReflectRequest,
  ConsequenceRunListItem,
  ConsequenceRunListRequest,
  ConsequenceRunResponse,
  ConsequenceSimulateRequest,
  DecisionRecordListItem,
  ForgetRequest,
  ForgetResponse,
  HealthResponse,
  IndustryLibraryCustomAsset,
  IndustryLibraryCustomAssetCreateRequest,
  IndustryLibraryInstallRequest,
  IndustryLibraryInstallResult,
  IndustryLibraryResponse,
  KbResponse,
  KbUpsertRequest,
  MemoryBundle,
  CreateNucleusRequest,
  Nucleus,
  NucleusHealth,
  NucleusSummary,
  UpdateNucleusRequest,
  RecallRequest,
  ReflectRequest,
  ReflectResponse,
  RememberRequest,
  RememberResponse,
  SkillRequest,
  SkillResponse,
} from "@neutron-ai/shared";
import { createIntelligenceApi, type NeutronIntelligenceApi } from "./intelligence.js";

export interface NeutronAIClientOptions {
  baseUrl: string;
  token?: string;
  nucleusId?: string;
  tenantId?: string;
  fetchImpl?: typeof fetch;
}

export class NeutronAISdkError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`Neutron AI request failed: ${status}`);
    this.name = "NeutronAISdkError";
    this.status = status;
    this.body = body;
  }
}

export class NeutronAIClient {
  private readonly base_url: string;
  private readonly token: string | undefined;
  private readonly nucleus_id: string | undefined;
  private readonly tenant_id: string | undefined;
  private readonly fetch_impl: typeof fetch;
  readonly entities: NeutronIntelligenceApi["entities"];
  readonly graph: NeutronIntelligenceApi["graph"];
  readonly context: NeutronIntelligenceApi["context"];
  readonly decisions: NeutronIntelligenceApi["decisions"];
  readonly outcomes: NeutronIntelligenceApi["outcomes"];
  readonly learning: NeutronIntelligenceApi["learning"];
  readonly agents: NeutronIntelligenceApi["agents"];
  readonly snapshots: NeutronIntelligenceApi["snapshots"];
  readonly claims: NeutronIntelligenceApi["claims"];
  readonly contradictions: NeutronIntelligenceApi["contradictions"];
  readonly simulate: NeutronIntelligenceApi["simulate"];
  readonly search: NeutronIntelligenceApi["search"];
  readonly memory: {
    remember(input: RememberRequest): Promise<RememberResponse>;
    recall(input: RecallRequest): Promise<MemoryBundle>;
    context(input: AgentContextRequest): Promise<AgentContextPack>;
  };
  readonly consequences: {
    predict(input: ConsequencePlanRequest): Promise<ConsequenceRunResponse>;
    simulate(input: ConsequenceSimulateRequest): Promise<ConsequenceRunResponse>;
  };

  constructor(options: NeutronAIClientOptions) {
    if (options.nucleusId && options.tenantId && options.nucleusId !== options.tenantId) {
      throw new Error("nucleusId and tenantId must match when both are provided");
    }
    this.base_url = options.baseUrl.replace(/\/$/, "");
    this.token = options.token;
    this.nucleus_id = options.nucleusId ?? options.tenantId;
    this.tenant_id = options.tenantId ?? options.nucleusId;
    this.fetch_impl = options.fetchImpl ?? fetch;
    const intelligence = createIntelligenceApi({
      request: <T>(path: string, init?: RequestInit) => this.request<T>(path, init),
      withNucleus: <T extends { tenantId?: string | undefined; nucleusId?: string | undefined }>(input: T) => this.withNucleus(input),
    });
    this.entities = intelligence.entities;
    this.graph = intelligence.graph;
    this.context = intelligence.context;
    this.decisions = intelligence.decisions;
    this.outcomes = intelligence.outcomes;
    this.learning = intelligence.learning;
    this.agents = intelligence.agents;
    this.snapshots = intelligence.snapshots;
    this.claims = intelligence.claims;
    this.contradictions = intelligence.contradictions;
    this.simulate = intelligence.simulate;
    this.search = intelligence.search;
    this.memory = {
      remember: (input) => this.remember(input),
      recall: (input) => this.recall(input),
      context: (input) => this.agentContext(input),
    };
    this.consequences = {
      predict: (input) => this.consequencePlan(input),
      simulate: (input) => this.consequenceSimulate(input),
    };
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("content-type", "application/json");
    if (this.token) {
      headers.set("authorization", `Bearer ${this.token}`);
    }
    const response = await this.fetch_impl(`${this.base_url}${path}`, { ...init, headers });
    if (!response.ok) {
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        body = await response.text();
      }
      throw new NeutronAISdkError(response.status, body);
    }
    return (await response.json()) as T;
  }

  private withNucleus<T extends { tenantId?: string | undefined; nucleusId?: string | undefined }>(input: T): T & { tenantId: string; nucleusId: string } {
    if (input.nucleusId && input.tenantId && input.nucleusId !== input.tenantId) {
      throw new Error("nucleusId and tenantId must match when both are provided");
    }
    const nucleus_id = input.nucleusId ?? input.tenantId ?? this.nucleus_id ?? this.tenant_id;
    if (!nucleus_id) {
      throw new Error("nucleusId is required");
    }
    return { ...input, nucleusId: nucleus_id, tenantId: nucleus_id };
  }

  health(): Promise<HealthResponse> {
    return this.request("/health", { method: "GET" });
  }

  remember(input: RememberRequest): Promise<RememberResponse> {
    return this.request("/v1/memory/remember", {
      method: "POST",
      body: JSON.stringify(this.withNucleus(input)),
    });
  }

  recall(input: RecallRequest): Promise<MemoryBundle> {
    return this.request("/v1/memory/recall", {
      method: "POST",
      body: JSON.stringify(this.withNucleus(input)),
    });
  }

  agentContext(input: AgentContextRequest): Promise<AgentContextPack> {
    return this.request("/v1/memory/agent-context", {
      method: "POST",
      body: JSON.stringify(this.withNucleus(input)),
    });
  }

  reflect(input: ReflectRequest): Promise<ReflectResponse> {
    return this.request("/v1/memory/reflect", {
      method: "POST",
      body: JSON.stringify(this.withNucleus(input)),
    });
  }

  learnSkill(input: SkillRequest): Promise<SkillResponse> {
    return this.request("/v1/memory/skills/learn", {
      method: "POST",
      body: JSON.stringify(this.withNucleus(input)),
    });
  }

  upsertKnowledge(input: KbUpsertRequest): Promise<KbResponse> {
    return this.request("/v1/memory/kb/upsert", {
      method: "POST",
      body: JSON.stringify(this.withNucleus(input)),
    });
  }

  listIndustryLibrary(): Promise<IndustryLibraryResponse> {
    return this.request("/v1/platform/industry-library", { method: "GET" });
  }

  createIndustryLibraryAsset(input: IndustryLibraryCustomAssetCreateRequest): Promise<IndustryLibraryCustomAsset> {
    return this.request("/v1/platform/industry-library/uploads", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  installIndustryLibraryAsset(asset_id: string, input: IndustryLibraryInstallRequest): Promise<IndustryLibraryInstallResult> {
    return this.request(`/v1/platform/industry-library/uploads/${encodeURIComponent(asset_id)}/install`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  installIndustryLibraryPlugin(plugin_id: string, input: IndustryLibraryInstallRequest): Promise<IndustryLibraryInstallResult> {
    return this.request(`/v1/platform/industry-library/plugins/${encodeURIComponent(plugin_id)}/install`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  forget(input: ForgetRequest): Promise<ForgetResponse> {
    return this.request("/v1/memory/forget", {
      method: "POST",
      body: JSON.stringify(this.withNucleus(input)),
    });
  }

  compact(input: CompactRequest): Promise<{ compacted: boolean; expired: number; duplicatesMerged: number; tombstoned: number; warnings: string[] }> {
    return this.request("/v1/memory/compact", {
      method: "POST",
      body: JSON.stringify(this.withNucleus(input)),
    });
  }

  audit(input: { tenantId?: string; nucleusId?: string; scopeId: string; limit?: number; since?: number; until?: number }): Promise<AuditResponse> {
    const scoped = this.withNucleus(input);
    const search = new URLSearchParams({
      nucleusId: scoped.nucleusId,
      scopeId: scoped.scopeId,
      limit: String(scoped.limit ?? 50),
    });
    if (scoped.since !== undefined) {
      search.set("since", String(scoped.since));
    }
    if (scoped.until !== undefined) {
      search.set("until", String(scoped.until));
    }
    return this.request(`/v1/memory/audit?${search.toString()}`, { method: "GET" });
  }

  cacheStats(input: CacheStatsRequest = {}): Promise<CacheStatsResponse> {
    const scoped = this.withNucleus(input);
    const search = new URLSearchParams({ nucleusId: scoped.nucleusId });
    if (scoped.agentId) {
      search.set("agentId", scoped.agentId);
    }
    return this.request(`/v1/memory/cache/stats?${search.toString()}`, { method: "GET" });
  }

  invalidateCache(input: CacheInvalidateRequest): Promise<CacheInvalidateResponse> {
    return this.request("/v1/memory/cache/invalidate", {
      method: "POST",
      body: JSON.stringify(this.withNucleus(input)),
    });
  }

  warmCache(input: CacheWarmRequest): Promise<CacheWarmResponse> {
    return this.request("/v1/memory/cache/warm", {
      method: "POST",
      body: JSON.stringify(this.withNucleus(input)),
    });
  }

  consequencePlan(input: ConsequencePlanRequest): Promise<ConsequenceRunResponse> {
    return this.request("/v1/consequence/plan", {
      method: "POST",
      body: JSON.stringify(this.withNucleus(input)),
    });
  }

  consequenceSimulate(input: ConsequenceSimulateRequest): Promise<ConsequenceRunResponse> {
    return this.request("/v1/consequence/simulate", {
      method: "POST",
      body: JSON.stringify(this.withNucleus(input)),
    });
  }

  consequenceEvaluate(input: ConsequenceEvaluateRequest): Promise<ConsequenceRunResponse> {
    return this.request("/v1/consequence/evaluate", {
      method: "POST",
      body: JSON.stringify(this.withNucleus(input)),
    });
  }

  consequenceDecide(input: ConsequenceDecideRequest): Promise<ConsequenceRunResponse> {
    return this.request("/v1/consequence/decide", {
      method: "POST",
      body: JSON.stringify(this.withNucleus(input)),
    });
  }

  consequenceApprove(
    input: ConsequenceApproveRequest,
  ): Promise<{ run: ConsequenceRunResponse; approval: ConsequenceApproval }> {
    return this.request("/v1/consequence/approve", {
      method: "POST",
      body: JSON.stringify(this.withNucleus(input)),
    });
  }

  consequenceExecute(input: ConsequenceExecuteRequest): Promise<ConsequenceExecutionResponse> {
    return this.request("/v1/consequence/execute", {
      method: "POST",
      body: JSON.stringify(this.withNucleus(input)),
    });
  }

  consequenceObserve(input: ConsequenceObserveRequest): Promise<ConsequenceRunResponse> {
    return this.request("/v1/consequence/observe", {
      method: "POST",
      body: JSON.stringify(this.withNucleus(input)),
    });
  }

  consequenceReflect(input: ConsequenceReflectRequest): Promise<ConsequenceRunResponse> {
    return this.request("/v1/consequence/reflect", {
      method: "POST",
      body: JSON.stringify(this.withNucleus(input)),
    });
  }

  consequenceCancel(input: ConsequenceEvaluateRequest): Promise<ConsequenceRunResponse> {
    return this.request("/v1/consequence/cancel", {
      method: "POST",
      body: JSON.stringify(this.withNucleus(input)),
    });
  }

  deleteConsequenceRun(input: ConsequenceDeleteRequest): Promise<ConsequenceDeletionResponse> {
    return this.request("/v1/consequence/delete", {
      method: "POST",
      body: JSON.stringify(this.withNucleus(input)),
    });
  }

  deleteConsequenceRuns(input: ConsequenceBulkDeleteRequest): Promise<ConsequenceBulkDeletionResponse> {
    return this.request("/v1/consequence/delete-scoped", {
      method: "POST",
      body: JSON.stringify(this.withNucleus(input)),
    });
  }

  listConsequenceRuns(input: ConsequenceRunListRequest = {}): Promise<{ runs: ConsequenceRunListItem[]; safeArtifactsOnly: true }> {
    const scoped = this.withNucleus(input);
    const search = new URLSearchParams({ nucleusId: scoped.nucleusId });
    if (scoped.status) {
      search.set("status", scoped.status);
    }
    if (scoped.domain) {
      search.set("domain", scoped.domain);
    }
    if (scoped.limit !== undefined) {
      search.set("limit", String(scoped.limit));
    }
    for (const scope_id of scoped.scopeIds ?? []) {
      search.append("scopeId", scope_id);
    }
    return this.request(`/v1/consequence/runs?${search.toString()}`, { method: "GET" });
  }

  getConsequenceRun(
    run_id: string,
    input: { tenantId?: string | undefined; nucleusId?: string | undefined; scopeIds?: string[] | undefined } = {},
  ): Promise<ConsequenceRunResponse> {
    const scoped = this.withNucleus(input);
    const search = new URLSearchParams({ nucleusId: scoped.nucleusId });
    for (const scope_id of scoped.scopeIds ?? []) {
      search.append("scopeId", scope_id);
    }
    return this.request(`/v1/consequence/runs/${encodeURIComponent(run_id)}?${search.toString()}`, { method: "GET" });
  }

  listDecisionRecords(
    input: { tenantId?: string | undefined; nucleusId?: string | undefined; scopeIds?: string[] | undefined; limit?: number | undefined } = {},
  ): Promise<{ decisions: DecisionRecordListItem[]; safeArtifactsOnly: true }> {
    const scoped = this.withNucleus(input);
    const search = new URLSearchParams({ nucleusId: scoped.nucleusId });
    if (scoped.limit !== undefined) {
      search.set("limit", String(scoped.limit));
    }
    for (const scope_id of scoped.scopeIds ?? []) {
      search.append("scopeId", scope_id);
    }
    return this.request(`/v1/consequence/decisions?${search.toString()}`, { method: "GET" });
  }

  getDecisionRecord(
    decision_id: string,
    input: { tenantId?: string | undefined; nucleusId?: string | undefined; scopeIds?: string[] | undefined } = {},
  ): Promise<ConsequenceDecisionDetail> {
    const scoped = this.withNucleus(input);
    const search = new URLSearchParams({ nucleusId: scoped.nucleusId });
    for (const scope_id of scoped.scopeIds ?? []) {
      search.append("scopeId", scope_id);
    }
    return this.request(`/v1/consequence/decisions/${encodeURIComponent(decision_id)}?${search.toString()}`, { method: "GET" });
  }

  listConsequenceEvals(
    input: { tenantId?: string | undefined; nucleusId?: string | undefined; limit?: number | undefined } = {},
  ): Promise<{ evals: ConsequenceEvalResult[]; safeArtifactsOnly: true }> {
    const scoped = this.withNucleus(input);
    const search = new URLSearchParams({ nucleusId: scoped.nucleusId });
    if (scoped.limit !== undefined) {
      search.set("limit", String(scoped.limit));
    }
    return this.request(`/v1/consequence/evals?${search.toString()}`, { method: "GET" });
  }

  runConsequenceEval(
    input: {
      tenantId?: string | undefined;
      nucleusId?: string | undefined;
      datasetId?: string | undefined;
    } = {},
  ): Promise<ConsequenceEvalResult> {
    return this.request("/v1/consequence/evals/run", {
      method: "POST",
      body: JSON.stringify(this.withNucleus(input)),
    });
  }

  listMcpTools(): Promise<unknown> {
    return this.request("/mcp/tools", { method: "GET" });
  }

  listNuclei(input: { status?: string; q?: string; limit?: number } = {}): Promise<{ nuclei: NucleusSummary[]; warnings: string[] }> {
    const search = new URLSearchParams();
    if (input.status) {
      search.set("status", input.status);
    }
    if (input.q) {
      search.set("q", input.q);
    }
    if (input.limit !== undefined) {
      search.set("limit", String(input.limit));
    }
    const suffix = search.size ? `?${search.toString()}` : "";
    return this.request(`/v1/nuclei${suffix}`, { method: "GET" });
  }

  createNucleus(input: CreateNucleusRequest): Promise<Nucleus> {
    return this.request("/v1/nuclei", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  getNucleus(nucleus_id: string): Promise<Nucleus> {
    return this.request(`/v1/nuclei/${encodeURIComponent(nucleus_id)}`, { method: "GET" });
  }

  updateNucleus(nucleus_id: string, input: Omit<UpdateNucleusRequest, "nucleusId">): Promise<Nucleus> {
    return this.request(`/v1/nuclei/${encodeURIComponent(nucleus_id)}`, {
      method: "PATCH",
      body: JSON.stringify({ ...input, nucleusId: nucleus_id }),
    });
  }

  getNucleusHealth(nucleus_id: string): Promise<NucleusHealth> {
    return this.request(`/v1/nuclei/${encodeURIComponent(nucleus_id)}/health`, { method: "GET" });
  }

  getNucleusPlacement(nucleus_id: string): Promise<unknown> {
    return this.request(`/v1/nuclei/${encodeURIComponent(nucleus_id)}/placement`, { method: "GET" });
  }

  disableNucleus(nucleus_id: string, input: { reason?: string } = {}): Promise<Nucleus> {
    return this.request(`/v1/nuclei/${encodeURIComponent(nucleus_id)}/disable`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  deleteNucleus(nucleus_id: string, input: { confirm: string; reason?: string; hardDelete?: boolean }): Promise<Nucleus> {
    return this.request(`/v1/nuclei/${encodeURIComponent(nucleus_id)}/delete`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  getNucleusEvents(nucleus_id: string, input: { limit?: number } = {}): Promise<{ events: unknown[] }> {
    const search = input.limit === undefined ? "" : `?limit=${encodeURIComponent(String(input.limit))}`;
    return this.request(`/v1/nuclei/${encodeURIComponent(nucleus_id)}/events${search}`, { method: "GET" });
  }

  prewarmNucleus(nucleus_id: string, input: { scopeIds: string[]; agentId?: string }): Promise<unknown> {
    return this.request(`/v1/nuclei/${encodeURIComponent(nucleus_id)}/prewarm`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }
}
