import { describe, expect, it } from "vitest";
import type { AgentContextRequest, CacheInvalidateRequest, CachePolicy, CacheStatsResponse, ContextCacheMetadata, MemoryType } from "../src";

describe("shared types", () => {
  it("exports memory types", () => {
    const memory_type: MemoryType = "preference";
    expect(memory_type).toBe("preference");
  });

  it("exports cache policy and metadata types", () => {
    const policy: CachePolicy = {
      mode: "prefer_cache",
      keyMode: "intent_profile",
      ttlSeconds: 300,
      includeDynamicRag: true,
    };
    const request: AgentContextRequest = {
      scopeIds: ["user:derek"],
      task: "Prepare context",
      cachePolicy: policy,
    };
    const metadata: ContextCacheMetadata = {
      status: "hit",
      key: "ctx_abc",
      strategy: "hybrid",
      keyMode: "intent_profile",
      hit: true,
      cacheable: true,
    };
    const stats: CacheStatsResponse = {
      tenantId: "tenant_demo",
      entries: 1,
      hits: 1,
      misses: 0,
      stale: 0,
      writes: 1,
      invalidations: 0,
      hitRate: 1,
      averagePromptContextTokens: 100,
      estimatedVectorQueriesAvoided: 1,
      estimatedTokensSaved: 100,
    };
    const invalidate: CacheInvalidateRequest = { reason: "test", scopeId: "user:derek" };
    expect(request.cachePolicy?.mode).toBe("prefer_cache");
    expect(metadata.hit).toBe(true);
    expect(stats.hitRate).toBe(1);
    expect(invalidate.reason).toBe("test");
  });
});
