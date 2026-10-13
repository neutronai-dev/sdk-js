import type { JsonObject, PrivacyClass } from "./memoryTypes.js";

export type IndustryPolicyId = "general" | "research" | "healthcare" | "finance" | "legal" | "government" | "support";
export type RetentionClass = "ephemeral" | "standard" | "regulated" | "custom";

export type NucleusPlacementMode = "global" | "regional" | "jurisdictional";

export type NucleusRegionHint = "wnam" | "enam" | "sam" | "weur" | "eeur" | "apac" | "oc" | "afr" | "me";

export type R2LocationHint = "wnam" | "enam" | "weur" | "eeur" | "apac" | "oc";

export type NucleusJurisdiction = "eu" | "fedramp";

export type ResidencyGuarantee = "none" | "best_effort_regional" | "jurisdictional_storage";

export interface NucleusPlacement {
  mode: NucleusPlacementMode;
  regionHint?: NucleusRegionHint | undefined;
  r2LocationHint?: R2LocationHint | undefined;
  jurisdiction?: NucleusJurisdiction | undefined;
  regionalServicesRequired?: boolean | undefined;
  metadataBoundaryRequired?: boolean | undefined;
  geoKeyManagerRequired?: boolean | undefined;
  guarantee: ResidencyGuarantee;
  notes: string[];
}

export interface NucleusPolicyDefaults {
  industryPolicy: IndustryPolicyId;
  privacyClass: PrivacyClass;
  retentionClass: RetentionClass;
  cacheTtlSeconds: number;
  allowSensitiveCache: boolean;
  allowRawArchive: boolean;
  topicMemoryEnabled: boolean;
  supersessionEnabled: boolean;
  importExportEnabled: boolean;
  analyticsEnabled: boolean;
  evalsEnabled: boolean;
}

export interface Nucleus {
  id: string;
  nucleusId: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string | undefined;
  status: "active" | "disabled" | "migration_required" | "deleting" | "deleted";
  placement: NucleusPlacement;
  policyDefaults: NucleusPolicyDefaults;
  createdAt: number;
  updatedAt: number;
  createdBy?: string | undefined;
  metadata?: JsonObject | undefined;
}

export interface CreateNucleusRequest {
  nucleusId: string;
  name: string;
  description?: string | undefined;
  placement: NucleusPlacement;
  policyDefaults?: Partial<NucleusPolicyDefaults> | undefined;
  metadata?: JsonObject | undefined;
}

export interface UpdateNucleusRequest {
  nucleusId: string;
  name?: string | undefined;
  description?: string | undefined;
  policyDefaults?: Partial<NucleusPolicyDefaults> | undefined;
  metadata?: JsonObject | undefined;
}

export interface NucleusSummary {
  nucleusId: string;
  name: string;
  status: string;
  placementMode: NucleusPlacementMode;
  regionHint?: NucleusRegionHint | undefined;
  jurisdiction?: NucleusJurisdiction | undefined;
  guarantee: ResidencyGuarantee;
  memoryCount: number;
  scopeCount: number;
  cacheHitRate?: number | undefined;
  updatedAt: number;
}

export interface NucleusHealth {
  nucleusId: string;
  status: string;
  placement: NucleusPlacement;
  counts: {
    scopes: number;
    memories: number;
    active: number;
    superseded: number;
    tombstoned: number;
    contextCapsules: number;
    topicCores: number;
    graphBonds: number;
    engrams: number;
  };
  performance: {
    cacheHitRate: number;
    averageRecallLatencyMs?: number | undefined;
    averageAgentContextLatencyMs?: number | undefined;
    vectorQueriesAvoided?: number | undefined;
    tokensSavedEstimate?: number | undefined;
  };
  latestAuditEvents: unknown[];
  warnings: string[];
}
