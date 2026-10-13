import type { Consequence } from "./consequenceTypes.js";
import type { JsonObject, JsonValue, PrivacyClass, RecalledMemory } from "./memoryTypes.js";

export type KnowledgeClassification =
  | "observed"
  | "provided"
  | "derived"
  | "inferred"
  | "predicted"
  | "hypothesised";

export type ProvenanceSourceType =
  | "user"
  | "agent"
  | "api"
  | "database"
  | "document"
  | "sensor"
  | "external_dataset"
  | "reasoning_model"
  | "derived_calculation"
  | "solver";

export interface Provenance {
  sourceType: ProvenanceSourceType;
  sourceId: string;
  classification: KnowledgeClassification;
  recordedAt: number;
  agentId?: string | undefined;
  userId?: string | undefined;
  modelId?: string | undefined;
  solverId?: string | undefined;
  method?: string | undefined;
  evidenceIds?: string[] | undefined;
  metadata?: JsonObject | undefined;
}

export interface EntityReference {
  entityId: string;
  version?: number | undefined;
  type?: string | undefined;
  name?: string | undefined;
}

export interface RelationshipReference {
  relationshipId: string;
  version?: number | undefined;
  type?: string | undefined;
  graphDimension?: string | undefined;
}

export interface EvidenceReference {
  evidenceId: string;
  sourceType: ProvenanceSourceType;
  sourceId: string;
  summary?: string | undefined;
  observedAt?: number | undefined;
  confidence?: number | undefined;
  reliability?: number | undefined;
}

export interface TemporalQuery {
  validAt?: number | undefined;
  knowledgeAt?: number | undefined;
  from?: number | undefined;
  to?: number | undefined;
}

export interface Entity {
  id: string;
  tenantId: string;
  nucleusId: string;
  scopeId: string;
  namespace?: string | undefined;
  version: number;
  type: string;
  name?: string | undefined;
  attributes: JsonObject;
  confidence: number;
  classification: KnowledgeClassification;
  validFrom?: number | undefined;
  validTo?: number | undefined;
  recordedAt: number;
  supersededAt?: number | undefined;
  createdAt: number;
  updatedAt: number;
  provenance: Provenance;
  tombstonedAt?: number | undefined;
}

export type RelationshipDirection = "directed" | "bidirectional";

export interface Relationship {
  id: string;
  tenantId: string;
  nucleusId: string;
  scopeId: string;
  namespace?: string | undefined;
  version: number;
  fromEntityId: string;
  toEntityId: string;
  type: string;
  graphDimension: string;
  attributes: JsonObject;
  direction: RelationshipDirection;
  weight?: number | undefined;
  confidence: number;
  classification: KnowledgeClassification;
  causal: boolean;
  evidence: EvidenceReference[];
  validFrom?: number | undefined;
  validTo?: number | undefined;
  recordedAt: number;
  supersededAt?: number | undefined;
  createdAt: number;
  updatedAt: number;
  provenance: Provenance;
  tombstonedAt?: number | undefined;
}

export interface EntityUpsertRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeId: string;
  id?: string | undefined;
  namespace?: string | undefined;
  type: string;
  name?: string | undefined;
  attributes?: JsonObject | undefined;
  confidence?: number | undefined;
  classification?: KnowledgeClassification | undefined;
  validFrom?: number | undefined;
  validTo?: number | undefined;
  provenance: Provenance;
}

export interface RelationshipUpsertRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeId: string;
  id?: string | undefined;
  namespace?: string | undefined;
  fromEntityId: string;
  toEntityId: string;
  type: string;
  graphDimension: string;
  attributes?: JsonObject | undefined;
  direction?: RelationshipDirection | undefined;
  weight?: number | undefined;
  confidence?: number | undefined;
  classification?: KnowledgeClassification | undefined;
  causal?: boolean | undefined;
  evidence?: EvidenceReference[] | undefined;
  validFrom?: number | undefined;
  validTo?: number | undefined;
  provenance: Provenance;
}

export interface KnowledgeTombstoneRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  /**
   * The Scope the record belongs to. When given, a record in any other Scope
   * is not found: a caller acting for one Scope cannot tombstone another's.
   */
  scopeId?: string | undefined;
  id: string;
  reason: string;
  deletedBy: string;
  provenance: Provenance;
}

export interface KnowledgeTombstoneResponse {
  id: string;
  recordType: "entity" | "relationship";
  tombstoned: true;
  tombstonedAt: number;
  cascadedRelationshipCount: number;
}

export interface EntitySearchRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeIds: string[];
  agentId?: string | undefined;
  query?: string | undefined;
  types?: string[] | undefined;
  entityIds?: string[] | undefined;
  temporal?: TemporalQuery | undefined;
  limit?: number | undefined;
}

export interface GraphNeighboursRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeIds: string[];
  agentId?: string | undefined;
  entityId: string;
  graphDimensions?: string[] | undefined;
  relationshipTypes?: string[] | undefined;
  direction?: "incoming" | "outgoing" | "both" | undefined;
  depth?: number | undefined;
  temporal?: TemporalQuery | undefined;
  limit?: number | undefined;
}

export interface GraphMatchTrace {
  lexical: number;
  entity: number;
  graphProximity: number;
  temporal: number;
  confidence: number;
  sourceReliability: number;
  total: number;
}

export interface GraphNeighbour {
  entity: Entity;
  relationship: Relationship;
  depth: number;
  score: number;
  scoreBreakdown: GraphMatchTrace;
}

export interface GraphQueryRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeIds: string[];
  agentId?: string | undefined;
  query: string;
  anchorEntityIds?: string[] | undefined;
  graphDimensions?: string[] | undefined;
  relationshipTypes?: string[] | undefined;
  temporal?: TemporalQuery | undefined;
  maxDepth?: number | undefined;
  limit?: number | undefined;
}

export interface GraphQueryResponse {
  entities: Entity[];
  relationships: Relationship[];
  neighbours: GraphNeighbour[];
  graphDimensions: string[];
  warnings: string[];
}

export interface KnowledgeClaim {
  id: string;
  nucleusId: string;
  scopeId: string;
  subjectEntityId: string;
  predicate: string;
  value: JsonValue;
  confidence: number;
  sourceReliability: number;
  evidence: EvidenceReference[];
  validFrom?: number | undefined;
  validTo?: number | undefined;
  recordedAt: number;
  provenance: Provenance;
  status: "active" | "superseded" | "withdrawn";
}

export interface ClaimCreateRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeId: string;
  subjectEntityId: string;
  predicate: string;
  value: JsonValue;
  confidence?: number | undefined;
  sourceReliability?: number | undefined;
  evidence?: EvidenceReference[] | undefined;
  validFrom?: number | undefined;
  validTo?: number | undefined;
  provenance: Provenance;
}

export type ContradictionResolutionState =
  | "unresolved"
  | "automatically_resolved"
  | "agent_resolved"
  | "human_resolved";

/** One competing claim, as context shows it beside its contradiction. */
export interface ContradictionClaimSummary {
  id: string;
  scopeId: string;
  value: JsonValue;
  confidence: number;
  sourceType: Provenance["sourceType"];
  sourceId: string;
  recordedAt: number;
}

/**
 * Claims about one subject and predicate that disagree, within one Scope or
 * between two. A contradiction is visible only to a caller that can read
 * every Scope it spans, and only such a caller can resolve it.
 */
export interface Contradiction {
  id: string;
  nucleusId: string;
  scopeIds: string[];
  subjectEntityId: string;
  predicate: string;
  claimIds: string[];
  state: ContradictionResolutionState;
  selectedClaimId?: string | undefined;
  resolutionSummary?: string | undefined;
  resolvedBy?: string | undefined;
  createdAt: number;
  updatedAt: number;
  /** The competing claims, with their values and sources, in context responses. */
  claims?: ContradictionClaimSummary[] | undefined;
}

export interface ContradictionResolveRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  /**
   * The Scopes the caller acts for. Required for a contradiction that spans
   * more than one Scope, and must include every Scope it spans.
   */
  scopeIds?: string[] | undefined;
  contradictionId: string;
  state: Exclude<ContradictionResolutionState, "unresolved">;
  selectedClaimId?: string | undefined;
  resolutionSummary: string;
  resolvedBy: string;
  provenance: Provenance;
}

export type AgentPermissionAction =
  | "memory:read"
  | "memory:write"
  | "graph:read"
  | "graph:write"
  | "decision:read"
  | "decision:write"
  | "outcome:write"
  | "simulation:run";

export interface AgentPermission {
  action: AgentPermissionAction;
  scopePattern: string;
  effect: "allow" | "deny";
}

export interface Agent {
  id: string;
  tenantId: string;
  nucleusId: string;
  name: string;
  capabilities: string[];
  permissions: AgentPermission[];
  memoryNamespace?: string | undefined;
  trustScore?: number | undefined;
  metadata?: JsonObject | undefined;
  createdAt: number;
  updatedAt: number;
  provenance: Provenance;
}

export interface AgentUpsertRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  id: string;
  name: string;
  capabilities?: string[] | undefined;
  permissions: AgentPermission[];
  memoryNamespace?: string | undefined;
  trustScore?: number | undefined;
  metadata?: JsonObject | undefined;
  provenance: Provenance;
}

export interface SnapshotReference {
  id: string;
  version?: number | undefined;
}

export interface KnowledgeSnapshot {
  id: string;
  nucleusId: string;
  scopeIds: string[];
  validAt: number;
  knowledgeAt: number;
  memoryRefs: SnapshotReference[];
  entityRefs: SnapshotReference[];
  relationshipRefs: SnapshotReference[];
  claimIds: string[];
  decisionIds: string[];
  outcomeIds: string[];
  learningIds: string[];
  digest: string;
  createdAt: number;
  createdBy: string;
  provenance: Provenance;
}

export interface KnowledgeSnapshotCreateRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeIds: string[];
  validAt?: number | undefined;
  knowledgeAt?: number | undefined;
  memoryRefs?: SnapshotReference[] | undefined;
  entityIds?: string[] | undefined;
  decisionIds?: string[] | undefined;
  createdBy: string;
  provenance: Provenance;
}

export interface DecisionObjective {
  id: string;
  dimension: string;
  direction: "maximize" | "minimize" | "target";
  weight?: number | undefined;
  target?: JsonValue | undefined;
  priority?: number | undefined;
}

export interface DecisionConstraint {
  id: string;
  dimension: string;
  description: string;
  kind: "hard" | "soft";
  operator?: "eq" | "neq" | "lt" | "lte" | "gt" | "gte" | "in" | undefined;
  value?: JsonValue | undefined;
  priority?: number | undefined;
}

export interface DecisionOption {
  id: string;
  label: string;
  description?: string | undefined;
  action: JsonValue;
  objectiveValues?: Record<string, number | string | boolean> | undefined;
  constraintResults?: Record<string, boolean | "unknown"> | undefined;
  predictedConsequences: Consequence[];
  confidence: number;
  assumptions: string[];
  evidence: EvidenceReference[];
}

export interface DecisionActorReference {
  kind: "agent" | "user";
  id: string;
}

export type DecisionStatus = "proposed" | "approved" | "rejected" | "executed" | "observed";

export interface Decision {
  id: string;
  tenantId: string;
  nucleusId: string;
  scopeIds: string[];
  subjectEntities: EntityReference[];
  situation: JsonValue;
  objectives: DecisionObjective[];
  constraints: DecisionConstraint[];
  options: DecisionOption[];
  selectedOption?: string | undefined;
  predictedConsequences: Consequence[];
  confidence: number;
  rationale?: JsonValue | undefined;
  decidedBy?: DecisionActorReference | undefined;
  status: DecisionStatus;
  createdAt: number;
  updatedAt: number;
  executedAt?: number | undefined;
  outcomeId?: string | undefined;
  knowledgeSnapshot?: string | undefined;
  provenance: Provenance;
}

export interface DecisionCreateRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeIds: string[];
  subjectEntities?: EntityReference[] | undefined;
  situation: JsonValue;
  objectives: DecisionObjective[];
  constraints?: DecisionConstraint[] | undefined;
  options: DecisionOption[];
  selectedOption?: string | undefined;
  confidence?: number | undefined;
  rationale?: JsonValue | undefined;
  decidedBy?: DecisionActorReference | undefined;
  status?: DecisionStatus | undefined;
  captureKnowledgeSnapshot?: boolean | undefined;
  provenance: Provenance;
}

export interface DecisionOptionEvaluation {
  optionId: string;
  feasible: boolean;
  hardConstraintViolations: string[];
  unknownHardConstraints: string[];
  dominatedBy: string[];
  paretoEfficient: boolean;
  priorityProfile: Record<string, number | string | boolean | null>;
  tradeoffs: string[];
}

export interface SolverProofBoundary {
  claim: string;
  verified: boolean;
  method?: string | undefined;
}

export interface SolverResult {
  solverId: string;
  solverVersion: string;
  feasible: boolean;
  optionIds: string[];
  objectiveValues?: Record<string, number> | undefined;
  proofBoundary?: SolverProofBoundary | undefined;
  warnings: string[];
}

export interface DecisionEvaluation {
  decisionId: string;
  optionEvaluations: DecisionOptionEvaluation[];
  feasibleOptionIds: string[];
  paretoOptionIds: string[];
  recommendedOptionId?: string | undefined;
  guidance: string;
  solverResult?: SolverResult | undefined;
  warnings: string[];
  evaluatedAt: number;
}

export interface DecisionEvaluateRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  decisionId: string;
}

export interface DecisionProblem {
  decision: Decision;
}

export interface Solver {
  id: string;
  canSolve(problem: DecisionProblem): boolean;
  solve(problem: DecisionProblem): Promise<SolverResult>;
}

export interface ReasoningProviderRequest {
  task: string;
  context: ContextBuildResponse;
  responseSchema?: JsonObject | undefined;
}

export interface ReasoningProviderResult {
  providerId: string;
  modelId?: string | undefined;
  output: JsonValue;
  confidence?: number | undefined;
  provenance: Provenance;
}

export interface ReasoningProvider {
  id: string;
  reason(request: ReasoningProviderRequest): Promise<ReasoningProviderResult>;
}

export interface Observation {
  id: string;
  dimension: string;
  value: JsonValue;
  summary?: string | undefined;
  affectedEntities: EntityReference[];
  evidence: EvidenceReference[];
}

export interface OutcomeMetric {
  key: string;
  value: number;
  unit?: string | undefined;
  target?: number | undefined;
}

export interface PredictionError {
  metricKey: string;
  predicted: number;
  observed: number;
  absoluteError: number;
  percentageError?: number | undefined;
}

export interface Outcome {
  id: string;
  nucleusId: string;
  scopeIds: string[];
  decisionId: string;
  observations: Observation[];
  observedAt: number;
  successMetrics: OutcomeMetric[];
  unexpectedEffects: Observation[];
  confidence: number;
  predictionErrors: PredictionError[];
  recordedBy: DecisionActorReference;
  provenance: Provenance;
  createdAt: number;
}

export interface OutcomeRecordRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeIds: string[];
  decisionId: string;
  observations?: Observation[] | undefined;
  observedAt?: number | undefined;
  successMetrics?: OutcomeMetric[] | undefined;
  unexpectedEffects?: Observation[] | undefined;
  confidence?: number | undefined;
  recordedBy: DecisionActorReference;
  provenance: Provenance;
}

export interface ReliabilityUpdate {
  targetType: "source" | "agent" | "relationship" | "consequence_model" | "solver";
  targetId: string;
  previousConfidence?: number | undefined;
  proposedConfidence: number;
  evidenceCount: number;
  reason: string;
}

export interface LearningRecord {
  id: string;
  nucleusId: string;
  scopeIds: string[];
  decisionId: string;
  outcomeId: string;
  predictionErrors: PredictionError[];
  reliabilityUpdates: ReliabilityUpdate[];
  status: "candidate" | "active" | "requires_review" | "rejected";
  sensitiveDomain: boolean;
  createdAt: number;
  reviewedAt?: number | undefined;
  reviewedBy?: string | undefined;
  reviewSummary?: string | undefined;
  provenance: Provenance;
}

export interface ReliabilityAssessment {
  id: string;
  nucleusId: string;
  targetType: ReliabilityUpdate["targetType"];
  targetId: string;
  version: number;
  confidence: number;
  evidenceCount: number;
  sourceLearningId: string;
  createdAt: number;
  provenance: Provenance;
}

export interface LearningReviewRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  learningId: string;
  status: "active" | "rejected";
  reviewedBy: string;
  reviewSummary: string;
  provenance: Provenance;
}

export interface LearningReviewResponse {
  learning: LearningRecord;
  reliabilityAssessments: ReliabilityAssessment[];
}

export interface ContextBuildRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeIds: string[];
  agentId?: string | undefined;
  userId?: string | undefined;
  task: string;
  entities?: EntityReference[] | undefined;
  graphDimensions?: string[] | undefined;
  timeframe?: TemporalQuery | undefined;
  privacyClasses?: PrivacyClass[] | undefined;
  tokenBudget?: number | undefined;
  includeContradictions?: boolean | undefined;
  includeSimulations?: boolean | undefined;
  createSnapshot?: boolean | undefined;
  debug?: boolean | undefined;
}

export interface ContextRetrievalTrace {
  memoryScores: Array<{ memoryId: string; score: number; components?: Record<string, number> | undefined }>;
  entityScores: Array<{ entityId: string; score: number; components: GraphMatchTrace }>;
  relationshipScores: Array<{ relationshipId: string; score: number; components: GraphMatchTrace }>;
  decisionIds: string[];
  outcomeIds: string[];
  learningIds: string[];
  contradictionIds: string[];
  appliedScopeIds: string[];
  deniedScopeIds: string[];
  tokenBudget: number;
  estimatedTokens: number;
}

export interface ContextBuildResponse {
  nucleusId: string;
  task: string;
  memories: RecalledMemory[];
  entities: Entity[];
  relationships: Relationship[];
  decisions: Decision[];
  consequences: Consequence[];
  outcomes: Outcome[];
  learning: LearningRecord[];
  contradictions: Contradiction[];
  procedures: RecalledMemory[];
  currentState: JsonObject;
  historicalState?: JsonObject | undefined;
  knowledgeSnapshot?: KnowledgeSnapshot | undefined;
  promptContext: string;
  warnings: string[];
  trace: ContextRetrievalTrace;
}

export interface SimulationAction {
  id: string;
  type: string;
  payload: JsonValue;
  affectedEntities?: EntityReference[] | undefined;
}

export interface SimulationRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeIds: string[];
  agentId?: string | undefined;
  state: JsonValue;
  proposedActions: SimulationAction[];
  horizon: { from?: number | undefined; to?: number | undefined; label?: string | undefined };
  objectives: DecisionObjective[];
  graphDimensions?: string[] | undefined;
  providerId?: string | undefined;
  maxScenarios?: number | undefined;
  provenance: Provenance;
}

export interface SimulationScenario {
  id: string;
  label: "optimistic" | "expected" | "pessimistic" | "custom";
  probability?: number | undefined;
  futureState: JsonValue;
  consequences: Consequence[];
  assumptions: string[];
  confidence: number;
}

export interface SimulationResult {
  id: string;
  nucleusId: string;
  scopeIds: string[];
  kind: "simulation" | "counterfactual";
  state: JsonValue;
  proposedActions: SimulationAction[];
  scenarios: SimulationScenario[];
  providerId: string;
  createdAt: number;
  provenance: Provenance;
  warnings: string[];
}

export interface SimulationProvider {
  id: string;
  canSimulate(request: SimulationRequest): boolean;
  simulate(request: SimulationRequest, context: ContextBuildResponse): Promise<SimulationResult>;
}

export interface IntelligenceSearchRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeIds: string[];
  query: string;
  agentId?: string | undefined;
  entityIds?: string[] | undefined;
  graphDimensions?: string[] | undefined;
  timeframe?: TemporalQuery | undefined;
  privacyClasses?: PrivacyClass[] | undefined;
  limit?: number | undefined;
  debug?: boolean | undefined;
}

export interface IntelligenceSearchResponse {
  memories: RecalledMemory[];
  entities: Entity[];
  relationships: Relationship[];
  decisions: Decision[];
  outcomes: Outcome[];
  warnings: string[];
  trace: ContextRetrievalTrace;
}
