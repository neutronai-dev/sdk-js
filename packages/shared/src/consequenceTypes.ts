export type ConsequenceDepth = 1 | 3 | 5 | 10 | 20 | 50 | 100 | 1000;

export type ConsequenceMode = "quick" | "balanced" | "deep" | "strategic" | "exhaustive";

export type SearchStrategy = "greedy" | "beam" | "tree_of_thoughts" | "monte_carlo" | "solver_guided" | "hybrid";

export type ConsequenceRunStatus =
  | "created"
  | "retrieving_context"
  | "extracting_objectives"
  | "compiling_constraints"
  | "generating_options"
  | "simulating"
  | "scoring"
  | "awaiting_approval"
  | "decided"
  | "executing"
  | "observing"
  | "reflecting"
  | "completed"
  | "failed"
  | "cancelled";

export type ConsequenceCategory =
  | "financial"
  | "operational"
  | "safety"
  | "legal"
  | "compliance"
  | "human"
  | "environmental"
  | "technical"
  | "security"
  | "reputation"
  | "delivery"
  | "wellbeing"
  | "market"
  | "productivity"
  | "time"
  | "customer"
  | "regulatory"
  | "strategic"
  | "agricultural"
  | "unknown"
  | (string & {});

export type ConsequenceRiskLevel = "low" | "medium" | "high" | "critical";

export interface Objective {
  objectiveId: string;
  externalObjectiveId?: string | undefined;
  name: string;
  description: string;
  direction: "maximize" | "minimize" | "satisfy" | "avoid";
  weight: number;
  unit?: string | undefined;
  target?: number | string | undefined;
  hard?: boolean | undefined;
  sourceRefs: string[];
}

export interface Constraint {
  constraintId: string;
  name: string;
  description: string;
  hardness: "hard" | "soft";
  weight: number;
  category: string;
  sourceRefs: string[];
  violationPolicy: "block" | "penalize" | "require_approval" | "warn";
}

export type ConsequenceConstraintEvaluationStatus = "satisfied" | "violated" | "unknown";

export interface ConsequenceConstraintEvaluation {
  constraintId: string;
  status: ConsequenceConstraintEvaluationStatus;
  reason: string;
  sourceRefs: string[];
}

export interface ConsequenceEvidenceArtifact {
  artifactId: string;
  kind: "snapshot" | "forecast" | "financial" | "constraint" | "outcome" | "other";
  summary: string;
  confidence: number;
  observedAt?: number | undefined;
  metrics?: Record<string, number | string | boolean> | undefined;
  sourceRefs: string[];
}

export interface ConsequenceMetricDefinition {
  metricKey: string;
  label: string;
  description?: string | undefined;
  unit?: string | undefined;
  direction: "maximize" | "minimize" | "target" | "observe";
  weight?: number | undefined;
  minimum?: number | undefined;
  maximum?: number | undefined;
  target?: number | undefined;
}

export interface ConsequenceExternalSolver {
  schemaVersion: "1";
  adapterId: string;
  adapterVersion: string;
  solverVersion?: string | undefined;
}

export interface ConsequenceEntityReference {
  entityId: string;
  version?: number | undefined;
  type?: string | undefined;
  name?: string | undefined;
}

export interface ConsequenceEvidenceReference {
  evidenceId: string;
  sourceRef: string;
  confidence?: number | undefined;
}

export interface ConsequenceProjectionInput {
  projectionId?: string | undefined;
  depth: number;
  category: ConsequenceCategory;
  summary: string;
  metricKey?: string | undefined;
  magnitude?: number | undefined;
  unit?: string | undefined;
  likelihood: number;
  confidence: number;
  timeHorizon?: string | undefined;
  positive: boolean;
  negative: boolean;
  reversible?: boolean | undefined;
  inferred?: boolean | undefined;
  missingData?: string[] | undefined;
  objectiveImpacts?: ConsequenceObjectiveImpact[] | undefined;
  affectedEntities?: ConsequenceEntityReference[] | undefined;
  evidence?: ConsequenceEvidenceReference[] | undefined;
  assumptions?: string[] | undefined;
  dependencies?: string[] | undefined;
  sourceRefs: string[];
}

export interface ConsequenceObjectiveImpact {
  objectiveId: string;
  impact: number;
  confidence: number;
  reason: string;
  sourceRefs: string[];
}

export interface ConsequenceCandidateOptionInput {
  optionId: string;
  label: string;
  summary: string;
  actionType: string;
  assumptions?: string[] | undefined;
  requiredData?: string[] | undefined;
  sourceRefs: string[];
  confidence: number;
  riskLevel: ConsequenceRiskLevel;
  constraintEvaluations?: ConsequenceConstraintEvaluation[] | undefined;
  consequenceProjections?: ConsequenceProjectionInput[] | undefined;
}

export interface ConsequenceObjectiveInput {
  objectiveId: string;
  name: string;
  description: string;
  direction: Objective["direction"];
  weight: number;
  unit?: string | undefined;
  target?: number | string | undefined;
  hard?: boolean | undefined;
  sourceRefs: string[];
}

export interface ConsequenceConstraintInput {
  constraintId: string;
  name: string;
  description: string;
  hardness: Constraint["hardness"];
  weight: number;
  category: string;
  sourceRefs: string[];
  violationPolicy: Constraint["violationPolicy"];
}

export interface ThoughtOption {
  optionId: string;
  runId: string;
  externalOptionId?: string | undefined;
  parentOptionId?: string | undefined;
  label: string;
  summary: string;
  actionType: string;
  assumptions: string[];
  requiredData: string[];
  sourceRefs: string[];
  confidence: number;
  riskLevel: ConsequenceRiskLevel;
  constraintEvaluations?: ConsequenceConstraintEvaluation[] | undefined;
  consequenceProjections?: ConsequenceProjectionInput[] | undefined;
}

export interface Consequence {
  consequenceId: string;
  runId: string;
  optionId: string;
  depth: number;
  category: ConsequenceCategory;
  summary: string;
  metricKey?: string | undefined;
  magnitude?: number | undefined;
  unit?: string | undefined;
  likelihood: number;
  confidence: number;
  uncertainty: number;
  timeHorizon?: string | undefined;
  positive: boolean;
  negative: boolean;
  reversible?: boolean | undefined;
  inferred: boolean;
  missingData: string[];
  objectiveImpacts?: ConsequenceObjectiveImpact[] | undefined;
  affectedEntities?: ConsequenceEntityReference[] | undefined;
  evidence?: ConsequenceEvidenceReference[] | undefined;
  assumptions?: string[] | undefined;
  dependencies?: string[] | undefined;
  sourceRefs: string[];
}

export interface Scenario {
  scenarioId: string;
  runId: string;
  label: string;
  summary: string;
  optionPath: string[];
  depth: number;
  score: number;
  scoreBreakdown: Record<string, number>;
  constraintsSatisfied: string[];
  constraintsViolated: string[];
  constraintsUnknown: string[];
  constraintEvaluations: ConsequenceConstraintEvaluation[];
  consequences: Consequence[];
  assumptions: string[];
  missingData: string[];
  risks: string[];
  nextSafeAction: string;
  approvalRequired: boolean;
  confidence: number;
}

export interface Counterfactual {
  counterfactualId: string;
  runId: string;
  scenarioId: string;
  rejectedScenarioId?: string | undefined;
  summary: string;
  reasonRejected: string;
  tradeoff: string;
  scoreDelta: number;
  sourceRefs: string[];
}

export interface ConsequenceApproval {
  approvalId: string;
  decisionId: string;
  approvedByUserId: string;
  approvedAt: number;
  note?: string | undefined;
  externalProvenance?: ConsequenceApprovalProvenance | undefined;
}

export interface ConsequenceApprovalProvenance {
  sourceSystem: string;
  externalApprovalId: string;
  approvedByExternalUserId: string;
  approvedAt: number;
  attestationDigest: string;
}

export interface DecisionRecord {
  decisionId: string;
  runId: string;
  selectedScenarioId: string;
  selectedByUserId?: string | undefined;
  status: "draft" | "approved" | "rejected" | "executed" | "observed";
  decisionSummary: string;
  rationaleSummary: string;
  rejectedAlternatives: Counterfactual[];
  predictedConsequences: Consequence[];
  approvalId?: string | undefined;
  createdAt: number;
  updatedAt: number;
}

export interface OutcomeObservation {
  observationId: string;
  decisionId: string;
  observedAt: number;
  summary: string;
  observedMetrics: Record<string, number | string | boolean>;
  unexpectedConsequences: string[];
  sourceRefs: string[];
}

export interface ReflectionLesson {
  lessonId: string;
  decisionId: string;
  summary: string;
  predictedVsObservedDelta: Record<string, number | string>;
  regretScore?: number | undefined;
  confidenceAdjustment?: number | undefined;
  futurePolicySuggestion?: string | undefined;
  memoryWritePolicy: "candidate" | "active" | "requires_review";
  createdAt: number;
}

export interface RiskEnvelope {
  level: ConsequenceRiskLevel;
  sensitiveDomain: boolean;
  approvalRequired: boolean;
  reasons: string[];
  executionAllowed: boolean;
}

export interface ScenarioScoreWeights {
  objectiveFit: number;
  constraintScore: number;
  expectedValue: number;
  confidence: number;
  reversibility: number;
  sourceQuality: number;
  riskPenalty: number;
  uncertaintyPenalty: number;
  approvalBurden: number;
  costEstimate: number;
  historicalLessons: number;
}

export interface ConsequencePolicy {
  mode: ConsequenceMode;
  depth: ConsequenceDepth;
  searchStrategy: SearchStrategy;
  beamWidth?: number | undefined;
  branchingFactor?: number | undefined;
  maxScenarios?: number | undefined;
  maxRuntimeMs?: number | undefined;
  maxNodes?: number | undefined;
  maxBranches?: number | undefined;
  maxModelCalls?: number | undefined;
  maxCostEstimate?: number | undefined;
  requireApprovalAboveRisk?: Exclude<ConsequenceRiskLevel, "low"> | undefined;
  allowExecution?: boolean | undefined;
  storeSafeArtifactsOnly: true;
  includeCounterfactuals?: boolean | undefined;
  includeReflections?: boolean | undefined;
  scoreWeights?: Partial<ScenarioScoreWeights> | undefined;
}

export interface ConsequenceContextPolicy {
  includeMemory: boolean;
  includeKnowledge: boolean;
  includeContextCapsules: boolean;
  includePastDecisions: boolean;
  includeReflections: boolean;
}

export interface ConsequencePlanRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeIds: string[];
  agentId?: string | undefined;
  userId?: string | undefined;
  task: string;
  domain?: string | undefined;
  objectiveHints?: string[] | undefined;
  constraintHints?: string[] | undefined;
  objectives?: ConsequenceObjectiveInput[] | undefined;
  constraints?: ConsequenceConstraintInput[] | undefined;
  candidateOptions?: ConsequenceCandidateOptionInput[] | undefined;
  evidenceArtifacts?: ConsequenceEvidenceArtifact[] | undefined;
  metricDefinitions?: ConsequenceMetricDefinition[] | undefined;
  externalSolver?: ConsequenceExternalSolver | undefined;
  externalReference?: string | undefined;
  idempotencyKey?: string | undefined;
  retentionDays?: number | undefined;
  policy?: Partial<ConsequencePolicy> | undefined;
  contextPolicy?: Partial<ConsequenceContextPolicy> | undefined;
}

export interface ConsequenceTrace {
  nucleusId: string;
  scopeIds: string[];
  memoryIds: string[];
  topicKeys: string[];
  contextCapsuleIds: string[];
  priorDecisionIds: string[];
  reflectionLessonIds: string[];
  searchStrategy: SearchStrategy;
  depth: ConsequenceDepth;
  safeArtifactsOnly: true;
  requestFingerprint?: string | undefined;
  searchBudget?: {
    candidateCount: number;
    evaluatedScenarioCount: number;
    prunedScenarioCount: number;
    nodeCount: number;
    modelCallCount: number;
    costEstimate: number;
  } | undefined;
  authPolicy: {
    actorType:
      | "developer"
      | "global_api"
      | "workspace_api"
      | "nucleus_api"
      | "platform_user"
      | "queue";
    executionDefault: "deny";
  };
}

export interface ConsequenceCapsule {
  capsuleId: string;
  nucleusId: string;
  scopeIds: string[];
  domain: string;
  objectives: Objective[];
  constraints: Constraint[];
  knownRisks: string[];
  priorDecisionIds: string[];
  priorOutcomeIds: string[];
  reflectionLessonIds: string[];
  promptContext: string;
  cachePolicy: {
    ttlSeconds: number;
    sensitive: boolean;
  };
  createdAt: number;
  expiresAt: number;
  invalidationPolicy: {
    memoryIds: string[];
    sourceRefs: string[];
    outcomeIds: string[];
    policyFingerprint: string;
  };
}

export interface ConsequenceProgress {
  completedNodes: number;
  maxNodes: number;
  percent: number;
  canCancel: boolean;
  async: boolean;
}

export interface ConsequenceProgressEvent {
  status: ConsequenceRunStatus;
  message: string;
  completedNodes: number;
  maxNodes: number;
  percent: number;
  createdAt: number;
}

export interface ConsequenceRunResponse {
  runId: string;
  nucleusId: string;
  tenantId: string;
  agentId?: string | undefined;
  userId: string;
  status: ConsequenceRunStatus;
  taskSummary: string;
  domain: string;
  externalSolver?: ConsequenceExternalSolver | undefined;
  externalReference?: string | undefined;
  idempotencyKey?: string | undefined;
  retention?: {
    retentionDays: number;
    expiresAt: number;
  } | undefined;
  evidenceArtifacts: ConsequenceEvidenceArtifact[];
  metricDefinitions: ConsequenceMetricDefinition[];
  policy: ConsequencePolicy;
  riskEnvelope: RiskEnvelope;
  objectives: Objective[];
  constraints: Constraint[];
  thoughtOptions: ThoughtOption[];
  scenarios: Scenario[];
  counterfactuals: Counterfactual[];
  recommendedScenarioId?: string | undefined;
  decisionRecord?: DecisionRecord | undefined;
  observations: OutcomeObservation[];
  reflectionLessons: ReflectionLesson[];
  consequenceCapsule?: ConsequenceCapsule | undefined;
  warnings: string[];
  trace: ConsequenceTrace;
  progress: ConsequenceProgress;
  progressEvents: ConsequenceProgressEvent[];
  contractVersion?: string | undefined;
  engineVersion?: string | undefined;
  adapterVersion?: string | undefined;
  artifactDigest?: string | undefined;
  createdAt: number;
  updatedAt: number;
  completedAt?: number | undefined;
}

export interface ConsequenceRunReference {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeIds?: string[] | undefined;
  runId: string;
}

export interface ConsequenceSimulateRequest extends ConsequenceRunReference {
  policy?: Partial<ConsequencePolicy> | undefined;
  confirmLongHorizon?: boolean | undefined;
}

export type ConsequenceEvaluateRequest = ConsequenceRunReference;

export interface ConsequenceDecideRequest extends ConsequenceRunReference {
  selectedScenarioId: string;
  decisionSummary?: string | undefined;
  rationaleSummary?: string | undefined;
}

export interface ConsequenceApproveRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeIds?: string[] | undefined;
  decisionId: string;
  note?: string | undefined;
  externalProvenance?: ConsequenceApprovalProvenance | undefined;
}

export interface ConsequenceExecuteRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeIds?: string[] | undefined;
  decisionId: string;
  rollbackNotes: string;
  compensationNotes: string;
}

export interface ConsequenceExecutionResponse {
  decisionId: string;
  executed: boolean;
  status: "blocked" | "execution_ready" | "executed";
  reason: string;
  rollbackNotes: string;
  compensationNotes: string;
}

export interface ConsequenceObserveRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeIds?: string[] | undefined;
  decisionId: string;
  observedAt?: number | undefined;
  summary: string;
  observedMetrics?: Record<string, number | string | boolean> | undefined;
  unexpectedConsequences?: string[] | undefined;
  sourceRefs?: string[] | undefined;
}

export interface ConsequenceReflectRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeIds?: string[] | undefined;
  decisionId: string;
}

export interface ConsequenceRunListRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeIds?: string[] | undefined;
  status?: ConsequenceRunStatus | undefined;
  domain?: string | undefined;
  limit?: number | undefined;
}

export interface ConsequenceRunListItem {
  runId: string;
  nucleusId: string;
  taskSummary: string;
  domain: string;
  status: ConsequenceRunStatus;
  mode: ConsequenceMode;
  depth: ConsequenceDepth;
  riskLevel: ConsequenceRiskLevel;
  recommendedScenarioId?: string | undefined;
  expiresAt?: number | undefined;
  createdAt: number;
  updatedAt: number;
}

export interface ConsequenceDeleteRequest extends ConsequenceRunReference {
  reason: string;
}

export interface ConsequenceDeletionResponse {
  runId: string;
  nucleusId: string;
  deleted: true;
  tombstoned: true;
  deletedAt: number;
  reason: string;
}

export interface ConsequenceBulkDeleteRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  userId?: string | undefined;
  scopeIds?: string[] | undefined;
  reason: string;
}

export interface ConsequenceBulkDeletionResponse {
  nucleusId: string;
  deletedCount: number;
  tombstonedCount: number;
  safeArtifactsOnly: true;
}

export interface DecisionRecordListItem {
  decisionId: string;
  runId: string;
  selectedScenarioId: string;
  status: DecisionRecord["status"];
  decisionSummary: string;
  approvalRequired: boolean;
  approvalId?: string | undefined;
  createdAt: number;
  updatedAt: number;
}

export interface ConsequenceDecisionDetail {
  decision: DecisionRecord;
  selectedScenario: Scenario;
  approval?: ConsequenceApproval | undefined;
  observations: OutcomeObservation[];
  reflectionLessons: ReflectionLesson[];
}

export interface ConsequenceEvalResult {
  evalId: string;
  nucleusId: string;
  datasetId: string;
  metrics: Record<string, number>;
  status: "passed" | "failed" | "partial";
  safeSummary: string;
  createdAt: number;
}
