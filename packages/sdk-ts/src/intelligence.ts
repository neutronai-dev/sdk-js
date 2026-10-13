import type {
  Agent,
  AgentUpsertRequest,
  ClaimCreateRequest,
  ContextBuildRequest,
  ContextBuildResponse,
  Contradiction,
  ContradictionResolveRequest,
  Decision,
  DecisionCreateRequest,
  DecisionEvaluateRequest,
  DecisionEvaluation,
  Entity,
  EntitySearchRequest,
  EntityUpsertRequest,
  GraphNeighboursRequest,
  GraphQueryRequest,
  GraphQueryResponse,
  IntelligenceSearchRequest,
  IntelligenceSearchResponse,
  KnowledgeClaim,
  KnowledgeSnapshot,
  KnowledgeSnapshotCreateRequest,
  KnowledgeTombstoneRequest,
  KnowledgeTombstoneResponse,
  LearningRecord,
  LearningReviewRequest,
  LearningReviewResponse,
  Outcome,
  OutcomeRecordRequest,
  Relationship,
  RelationshipUpsertRequest,
  SimulationRequest,
  SimulationResult,
  TemporalQuery,
} from "@neutron-ai/shared";

type ScopedRequest = { tenantId?: string | undefined; nucleusId?: string | undefined };
type RequestFunction = <T>(path: string, init?: RequestInit) => Promise<T>;
type ScopeFunction = <T extends ScopedRequest>(input: T) => T & { tenantId: string; nucleusId: string };

export interface IntelligenceApiDependencies {
  request: RequestFunction;
  withNucleus: ScopeFunction;
}

function post<T>(dependencies: IntelligenceApiDependencies, path: string, input: ScopedRequest): Promise<T> {
  return dependencies.request<T>(path, {
    method: "POST",
    body: JSON.stringify(dependencies.withNucleus(input)),
  });
}

function readQuery(dependencies: IntelligenceApiDependencies, input: ScopedRequest): URLSearchParams {
  const scoped = dependencies.withNucleus(input);
  return new URLSearchParams({ nucleusId: scoped.nucleusId });
}

function addTemporal(search: URLSearchParams, temporal?: TemporalQuery | undefined): void {
  if (temporal?.validAt !== undefined) search.set("validAt", String(temporal.validAt));
  if (temporal?.knowledgeAt !== undefined) search.set("knowledgeAt", String(temporal.knowledgeAt));
}

export function createIntelligenceApi(dependencies: IntelligenceApiDependencies) {
  return {
    entities: {
      upsert: (input: EntityUpsertRequest): Promise<Entity> => post(dependencies, "/v1/entities/upsert", input),
      search: async (input: EntitySearchRequest): Promise<Entity[]> => {
        const response = await post<{ entities: Entity[] }>(dependencies, "/v1/entities/search", input);
        return response.entities;
      },
      get: (entity_id: string, input: ScopedRequest & { agentId?: string | undefined; temporal?: TemporalQuery | undefined } = {}): Promise<Entity> => {
        const search = readQuery(dependencies, input);
        if (input.agentId) search.set("agentId", input.agentId);
        addTemporal(search, input.temporal);
        return dependencies.request(`/v1/entities/${encodeURIComponent(entity_id)}?${search.toString()}`, { method: "GET" });
      },
      tombstone: (input: KnowledgeTombstoneRequest): Promise<KnowledgeTombstoneResponse> => post(dependencies, "/v1/entities/tombstone", input),
    },
    graph: {
      connect: (input: RelationshipUpsertRequest): Promise<Relationship> => post(dependencies, "/v1/relationships/upsert", input),
      relationship: (relationship_id: string, input: ScopedRequest & { agentId?: string | undefined; temporal?: TemporalQuery | undefined } = {}): Promise<Relationship> => {
        const search = readQuery(dependencies, input);
        if (input.agentId) search.set("agentId", input.agentId);
        addTemporal(search, input.temporal);
        return dependencies.request(`/v1/relationships/${encodeURIComponent(relationship_id)}?${search.toString()}`, { method: "GET" });
      },
      neighbours: (input: GraphNeighboursRequest): Promise<GraphQueryResponse> => post(dependencies, "/v1/graph/neighbours", input),
      query: (input: GraphQueryRequest): Promise<GraphQueryResponse> => post(dependencies, "/v1/graph/query", input),
      tombstone: (input: KnowledgeTombstoneRequest): Promise<KnowledgeTombstoneResponse> => post(dependencies, "/v1/relationships/tombstone", input),
    },
    context: {
      build: (input: ContextBuildRequest): Promise<ContextBuildResponse> => post(dependencies, "/v1/context/build", input),
    },
    decisions: {
      create: (input: DecisionCreateRequest): Promise<Decision> => post(dependencies, "/v1/decisions", input),
      evaluate: (input: DecisionEvaluateRequest): Promise<DecisionEvaluation> => post(dependencies, "/v1/decisions/evaluate", input),
      get: (decision_id: string, input: ScopedRequest & { agentId?: string | undefined; scopeIds?: string[] | undefined } = {}): Promise<Decision> => {
        const search = readQuery(dependencies, input);
        if (input.agentId) search.set("agentId", input.agentId);
        for (const scope_id of input.scopeIds ?? []) search.append("scopeId", scope_id);
        return dependencies.request(`/v1/decisions/${encodeURIComponent(decision_id)}?${search.toString()}`, { method: "GET" });
      },
    },
    outcomes: {
      record: (input: OutcomeRecordRequest): Promise<{ decision: Decision; outcome: Outcome; learning: LearningRecord }> => post(dependencies, "/v1/outcomes", input),
    },
    learning: {
      review: (input: LearningReviewRequest): Promise<LearningReviewResponse> => post(dependencies, "/v1/learning/review", input),
    },
    agents: {
      upsert: (input: AgentUpsertRequest): Promise<Agent> => post(dependencies, "/v1/agents/upsert", input),
      get: (agent_id: string, input: ScopedRequest = {}): Promise<Agent> => {
        const search = readQuery(dependencies, input);
        return dependencies.request(`/v1/agents/${encodeURIComponent(agent_id)}?${search.toString()}`, { method: "GET" });
      },
    },
    snapshots: {
      create: (input: KnowledgeSnapshotCreateRequest): Promise<KnowledgeSnapshot> => post(dependencies, "/v1/snapshots", input),
      get: (snapshot_id: string, input: ScopedRequest & { agentId?: string | undefined } = {}): Promise<KnowledgeSnapshot> => {
        const search = readQuery(dependencies, input);
        if (input.agentId) search.set("agentId", input.agentId);
        return dependencies.request(`/v1/snapshots/${encodeURIComponent(snapshot_id)}?${search.toString()}`, { method: "GET" });
      },
    },
    claims: {
      record: (input: ClaimCreateRequest): Promise<{ claim: KnowledgeClaim; contradictions: Contradiction[] }> => post(dependencies, "/v1/claims", input),
    },
    contradictions: {
      list: async (input: ScopedRequest & { scopeIds: string[]; limit?: number | undefined }): Promise<Contradiction[]> => {
        const search = readQuery(dependencies, input);
        for (const scope_id of input.scopeIds) search.append("scopeId", scope_id);
        if (input.limit !== undefined) search.set("limit", String(input.limit));
        const response = await dependencies.request<{ contradictions: Contradiction[] }>(`/v1/contradictions?${search.toString()}`, { method: "GET" });
        return response.contradictions;
      },
      resolve: (input: ContradictionResolveRequest): Promise<Contradiction> => post(dependencies, "/v1/contradictions/resolve", input),
    },
    simulate: (input: SimulationRequest): Promise<SimulationResult> => post(dependencies, "/v1/simulations", input),
    search: (input: IntelligenceSearchRequest): Promise<IntelligenceSearchResponse> => post(dependencies, "/v1/search", input),
  };
}

export type NeutronIntelligenceApi = ReturnType<typeof createIntelligenceApi>;
