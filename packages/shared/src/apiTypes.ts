import type { JsonObject, JsonValue, MemoryType, PrivacyClass, RecalledMemory } from "./memoryTypes.js";
import type { EntityReference, KnowledgeClassification, Provenance, RelationshipReference } from "./intelligenceTypes.js";

export type ContextCacheMode = "skip_cache" | "prefer_cache" | "refresh_cache" | "cache_only";
export type ContextCacheKeyMode = "exact_task" | "intent_profile" | "scope_profile";
export type RetrievalStrategy = "rag" | "cag" | "hybrid";
export type CacheStatus =
  | "disabled"
  | "bypass"
  | "hit"
  | "miss"
  | "stale"
  | "expired"
  | "refresh"
  | "not_cacheable"
  | "cache_only_miss"
  | "error";

export interface CachePolicy {
  mode?: ContextCacheMode | undefined;
  ttlSeconds?: number | undefined;
  allowSensitive?: boolean | undefined;
  keyMode?: ContextCacheKeyMode | undefined;
  includeDynamicRag?: boolean | undefined;
  allowStaleIfVersionCheckFails?: boolean | undefined;
  modelId?: string | undefined;
}

export interface ScopeVersion {
  tenantId: string;
  scopeId: string;
  version: number;
  updatedAt: number;
}

export interface ContextCacheMetadata {
  status: CacheStatus;
  key?: string | undefined;
  strategy: RetrievalStrategy;
  keyMode: ContextCacheKeyMode;
  hit: boolean;
  cacheable: boolean;
  reason?: string | undefined;
  ttlSeconds?: number | undefined;
  expiresAt?: number | undefined;
  createdAt?: number | undefined;
  refreshedAt?: number | undefined;
  scopeVersions?: Record<string, number> | undefined;
  staleBecause?: string[] | undefined;
}

export interface ContextCacheEntry {
  cacheKey: string;
  tenantId: string;
  scopeIds: string[];
  agentId?: string | undefined;
  userId?: string | undefined;
  taskIntent: string;
  taskHash?: string | undefined;
  keyMode: ContextCacheKeyMode;
  strategy: RetrievalStrategy;
  memoryTypes: MemoryType[];
  privacyClasses: PrivacyClass[];
  memoryIds: string[];
  promptContext: string;
  groupedPackJson: unknown;
  tokenBudget: number;
  codecVersion: string;
  modelId?: string | undefined;
  scopeVersions: Record<string, number>;
  securityLabel: "public" | "tenant" | "user_private";
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  lastAccessedAt?: number | undefined;
  hitCount: number;
}

export interface MemoryBundle {
  memories: RecalledMemory[];
  compressionStats: {
    rawBytesAvoided: number;
    tokensSavedEstimate: number;
    averageReconstructionLoss: number;
  };
  warnings: string[];
}

export interface AgentContextPack {
  task: string;
  scopeIds: string[];
  preferences: RecalledMemory[];
  skills: RecalledMemory[];
  knowledge: RecalledMemory[];
  experience: RecalledMemory[];
  usagePatterns: RecalledMemory[];
  toolLessons: RecalledMemory[];
  safetyRules: RecalledMemory[];
  projectMemory: RecalledMemory[];
  promptContext: string;
  warnings: string[];
  cache?: ContextCacheMetadata | undefined;
  retrievalStrategy?: RetrievalStrategy | undefined;
  performance?: {
    ragLatencyMs?: number | undefined;
    cacheLatencyMs?: number | undefined;
    totalLatencyMs?: number | undefined;
    vectorQueriesAvoided?: number | undefined;
    tokensSavedEstimate?: number | undefined;
  } | undefined;
}

export interface HealthResponse {
  ok: boolean;
  service: string;
  version: string;
  architecture?: {
    edge: string;
    codec: string;
    memory: string;
  };
}

export interface RememberRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeId: string;
  agentId?: string | undefined;
  userId?: string | undefined;
  type: MemoryType;
  text?: string | undefined;
  content?: JsonValue | undefined;
  privacyClass?: PrivacyClass | undefined;
  entities?: EntityReference[] | undefined;
  relationships?: RelationshipReference[] | undefined;
  confidence?: number | undefined;
  importance?: number | undefined;
  validFrom?: number | undefined;
  validTo?: number | undefined;
  supersedes?: string | undefined;
  provenance?: Provenance | undefined;
  classification?: KnowledgeClassification | undefined;
  metadata?: JsonObject | undefined;
  ttlSeconds?: number | undefined;
}

export interface RecallRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeIds: string[];
  query: string;
  agentId?: string | undefined;
  entityIds?: string[] | undefined;
  decisionIds?: string[] | undefined;
  validAt?: number | undefined;
  knowledgeAt?: number | undefined;
  types?: MemoryType[] | undefined;
  privacyClasses?: PrivacyClass[] | undefined;
  limit?: number | undefined;
  tokenBudget?: number | undefined;
  since?: number | undefined;
  until?: number | undefined;
}

export interface AgentContextRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeIds: string[];
  agentId?: string | undefined;
  userId?: string | undefined;
  task: string;
  include?: string[] | undefined;
  privacyClasses?: PrivacyClass[] | undefined;
  tokenBudget?: number | undefined;
  cachePolicy?: CachePolicy | undefined;
}

export interface CacheStatsRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  agentId?: string | undefined;
}

export interface CacheStatsResponse {
  tenantId: string;
  nucleusId?: string | undefined;
  entries: number;
  hits: number;
  misses: number;
  stale: number;
  writes: number;
  invalidations: number;
  hitRate: number;
  averagePromptContextTokens: number;
  estimatedVectorQueriesAvoided: number;
  estimatedTokensSaved: number;
}

export interface CacheInvalidateRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeId?: string | undefined;
  cacheKey?: string | undefined;
  reason: string;
}

export interface CacheInvalidateResponse {
  invalidated: number;
  reason: string;
  warnings: string[];
}

export interface CacheWarmRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeIds: string[];
  agentId?: string | undefined;
  userId?: string | undefined;
  tasks: string[];
  tokenBudget?: number | undefined;
  cachePolicy?: CachePolicy | undefined;
}

export interface CacheWarmResponse {
  warmed: number;
  skipped: number;
  cacheKeys: string[];
  warnings: string[];
}

export interface ReflectRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeId: string;
  agentId?: string | undefined;
  userId?: string | undefined;
  task: string;
  outcome: "success" | "failure" | "partial" | "unknown";
  success?: boolean | undefined;
  toolsUsed?: string[] | undefined;
  lessons?: string[] | undefined;
  skillIds?: string[] | undefined;
  metrics?: Record<string, number> | undefined;
  metadata?: JsonObject | undefined;
}

export interface SkillRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeId: string;
  agentId?: string | undefined;
  userId?: string | undefined;
  name: string;
  triggerPatterns: string[];
  procedure: string[];
  requiredTools: string[];
  successCriteria: string[];
  failureModes: string[];
  examples: string[];
}

export interface KbUpsertRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeId: string;
  agentId?: string | undefined;
  userId?: string | undefined;
  title?: string | undefined;
  source?: string | undefined;
  text: string;
  tags?: string[] | undefined;
  privacyClass?: PrivacyClass | undefined;
  chunkSize?: number | undefined;
  chunkOverlap?: number | undefined;
}

export interface ForgetRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeId: string;
  memoryId: string;
  reason?: string | undefined;
}

export interface CompactRequest {
  tenantId?: string | undefined;
  nucleusId?: string | undefined;
  scopeId: string;
  reason?: string | undefined;
}

export interface RememberResponse {
  memoryId: string;
  tenantId: string;
  nucleusId: string;
  scopeId: string;
  namespace: string;
  accepted: boolean;
  queued: boolean;
  vectorId: string;
  duplicateOf?: string | undefined;
  warnings: string[];
}

export interface ReflectResponse {
  accepted: boolean;
  experienceMemoryId: string;
  lessonMemoryIds: string[];
  updatedSkillIds: string[];
  warnings: string[];
}

export interface SkillResponse {
  skillMemoryId: string;
  accepted: boolean;
  warnings: string[];
}

export interface KbResponse {
  accepted: boolean;
  chunkCount: number;
  memoryIds: string[];
  warnings: string[];
}

export type IndustryLibraryAssetKind = "skill" | "knowledge_base";
export type IndustryLibrarySourceType = "pack" | "custom";

export interface IndustryLibrarySource {
  title: string;
  url: string;
}

export interface IndustryLibraryAsset {
  assetId: string;
  kind: IndustryLibraryAssetKind;
  title: string;
  summary: string;
  body: string;
  tags: string[];
}

export interface IndustryLibraryPlugin {
  packId: string;
  version: string;
  name: string;
  industry: string;
  summary: string;
  icon: string;
  enterpriseOnly: boolean;
  clientTargets: string[];
  useCases: string[];
  compliance: string[];
  tags: string[];
  installScopeId: string;
  sources: IndustryLibrarySource[];
  assets: IndustryLibraryAsset[];
}

export interface IndustryLibraryCustomAssetCreateRequest {
  kind: IndustryLibraryAssetKind;
  title: string;
  industry: string;
  summary: string;
  body: string;
  tags?: string[] | undefined;
}

export interface IndustryLibraryCustomAsset extends IndustryLibraryAsset {
  industry: string;
  createdByEmail: string;
  createdAt: number;
  updatedAt: number;
}

export interface IndustryLibraryInstallRequest {
  nucleusId: string;
  assetIds?: string[] | undefined;
}

export interface IndustryLibraryInstallSummary {
  workspaceId: string;
  nucleusId: string;
  sourceType: IndustryLibrarySourceType;
  sourceId: string;
  assetId: string;
  kind: IndustryLibraryAssetKind;
  title: string;
  memoryId: string;
  installedByEmail: string;
  installedAt: number;
}

export interface IndustryLibraryInstallResult {
  nucleusId: string;
  sourceType: IndustryLibrarySourceType;
  sourceId: string;
  installedAssets: IndustryLibraryInstallSummary[];
  duplicateMemoryIds: string[];
}

export interface IndustryLibraryResponse {
  workspaceId: string;
  planId: string;
  enterpriseRequired: boolean;
  canInstallBuiltIn: boolean;
  packs: IndustryLibraryPlugin[];
  customAssets: IndustryLibraryCustomAsset[];
  installations: IndustryLibraryInstallSummary[];
}

export interface ForgetResponse {
  forgotten: boolean;
  memoryId: string;
  tombstoned: boolean;
  warnings: string[];
}

export interface AuditResponse {
  tenantId: string;
  nucleusId?: string | undefined;
  scopeId: string;
  memories: Array<{
    id: string;
    type: MemoryType;
    summary: string;
    privacyClass: PrivacyClass;
    salience: number;
    confidence: number;
    createdAt: number;
    deletedAt?: number | undefined;
  }>;
  tombstones: Array<{
    id: string;
    deletedAt: number;
    reason?: string | undefined;
    sourceMemoryId: string;
  }>;
  auditEvents: Array<{
    id: string;
    action: string;
    memoryId?: string | undefined;
    createdAt: number;
    payload?: JsonObject | undefined;
  }>;
}
