export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export type MemoryType =
  | "semantic"
  | "episodic"
  | "entity"
  | "relationship"
  | "procedural"
  | "decision"
  | "outcome"
  | "preference"
  | "contextual"
  | "working_session"
  | "long_term"
  | "experience"
  | "usage_pattern"
  | "skill"
  | "knowledge"
  | "project"
  | "tool_trace"
  | "tool_lesson"
  | "safety"
  | "compliance"
  | "temporary";

export type PrivacyClass = "public" | "tenant" | "user_private" | "sensitive";
export type CompressionLevel = "none" | "light" | "medium" | "aggressive";

export interface MemoryCell {
  id: string;
  tenantId: string;
  nucleusId?: string | undefined;
  scopeId: string;
  namespace: string;
  agentId?: string | undefined;
  userId?: string | undefined;
  type: MemoryType;
  content?: JsonValue | undefined;
  text?: string | undefined;
  summary: string;
  neuralCodes: number[];
  vectorId: string;
  rawEventRef?: string | undefined;
  compressedRef?: string | undefined;
  graphRefs: string[];
  salience: number;
  importance?: number | undefined;
  confidence: number;
  reconstructionLoss: number;
  privacyClass: PrivacyClass;
  compressionLevel: CompressionLevel;
  sourceHash: string;
  entities?: Array<{ entityId: string; version?: number | undefined }> | undefined;
  relationships?: Array<{ relationshipId: string; version?: number | undefined }> | undefined;
  provenance?: import("./intelligenceTypes.js").Provenance | undefined;
  classification?: import("./intelligenceTypes.js").KnowledgeClassification | undefined;
  metadata?: JsonObject | undefined;
  createdAt: number;
  updatedAt?: number | undefined;
  validFrom?: number | undefined;
  validTo?: number | undefined;
  expiresAt?: number | undefined;
  lastAccessedAt?: number | undefined;
  supersedes?: string | undefined;
  supersededBy?: string | undefined;
  embeddingRef?: string | undefined;
  codecVersion: string;
  deletedAt?: number | undefined;
}

export interface RecalledMemory {
  id: string;
  tenantId: string;
  nucleusId?: string | undefined;
  scopeId: string;
  type: MemoryType;
  summary: string;
  confidence: number;
  salience: number;
  importance?: number | undefined;
  reconstructionLoss: number;
  privacyClass: PrivacyClass;
  createdAt: number;
  source: "hot" | "vector" | "graph" | "archive";
  score: number;
  scoreBreakdown?: Record<string, number> | undefined;
  provenance?: import("./intelligenceTypes.js").Provenance | undefined;
  classification?: import("./intelligenceTypes.js").KnowledgeClassification | undefined;
  metadata?: JsonObject | undefined;
}
