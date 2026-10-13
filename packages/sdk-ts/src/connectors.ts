import type { AgentContextPack, AgentContextRequest, CachePolicy, ReflectRequest, RememberRequest } from "@neutron-ai/shared";
import type { NeutronAIClient } from "./client.js";
import { createProviderRequest, type FrontierProvider, type ProviderRequestOptions } from "./providers.js";

export interface NeutronConnectorDefaults {
  scopeIds?: string[] | undefined;
  agentId?: string | undefined;
  userId?: string | undefined;
  tokenBudget?: number | undefined;
  cachePolicy?: CachePolicy | undefined;
}

export interface ProviderContextResult {
  contextPack: AgentContextPack;
  request: Record<string, unknown>;
}

export interface RememberInteractionInput {
  scopeId: string;
  type?: RememberRequest["type"] | undefined;
  text: string;
  agentId?: string | undefined;
  userId?: string | undefined;
  privacyClass?: RememberRequest["privacyClass"] | undefined;
  metadata?: RememberRequest["metadata"] | undefined;
}

export function createNeutronConnector(client: NeutronAIClient, defaults: NeutronConnectorDefaults = {}) {
  async function buildContext(input: Omit<AgentContextRequest, "scopeIds"> & { scopeIds?: string[] | undefined }): Promise<AgentContextPack> {
    const scope_ids = input.scopeIds ?? defaults.scopeIds;
    if (!scope_ids || scope_ids.length === 0) {
      throw new Error("scopeIds are required");
    }
    return client.agentContext({
      ...input,
      scopeIds: scope_ids,
      agentId: input.agentId ?? defaults.agentId,
      userId: input.userId ?? defaults.userId,
      tokenBudget: input.tokenBudget ?? defaults.tokenBudget,
      cachePolicy: input.cachePolicy ?? defaults.cachePolicy,
    });
  }

  async function createProviderContextRequest(
    provider: FrontierProvider,
    input: Omit<AgentContextRequest, "scopeIds"> & { scopeIds?: string[] | undefined },
    options: ProviderRequestOptions = {},
  ): Promise<ProviderContextResult> {
    const context_pack = await buildContext(input);
    return {
      contextPack: context_pack,
      request: createProviderRequest(provider, context_pack, options),
    };
  }

  async function rememberInteraction(input: RememberInteractionInput) {
    return client.remember({
      scopeId: input.scopeId,
      agentId: input.agentId ?? defaults.agentId,
      userId: input.userId ?? defaults.userId,
      type: input.type ?? "experience",
      text: input.text,
      privacyClass: input.privacyClass ?? "tenant",
      metadata: input.metadata,
    });
  }

  async function reflect(input: Omit<ReflectRequest, "agentId" | "userId"> & { agentId?: string | undefined; userId?: string | undefined }) {
    return client.reflect({
      ...input,
      agentId: input.agentId ?? defaults.agentId,
      userId: input.userId ?? defaults.userId,
    });
  }

  return {
    buildContext,
    createProviderContextRequest,
    rememberInteraction,
    reflect,
  };
}
