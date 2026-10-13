export type McpApprovalMode =
  | "always"
  | "never"
  | {
      always?: { tool_names?: string[] | undefined } | undefined;
      never?: { tool_names?: string[] | undefined } | undefined;
    };

export interface NeutronMcpServerOptions {
  serverUrl: string;
  serverLabel?: string | undefined;
  serverDescription?: string | undefined;
  authorization?: string | undefined;
  headers?: Record<string, string> | undefined;
  allowedTools?: string[] | undefined;
  requireApproval?: McpApprovalMode | undefined;
}

export interface AnthropicMcpToolConfig {
  enabled?: boolean | undefined;
  defer_loading?: boolean | undefined;
}

export interface AnthropicMcpConnector {
  mcp_servers: Array<{
    type: "url";
    url: string;
    name: string;
    authorization_token?: string | undefined;
  }>;
  tools: Array<{
    type: "mcp_toolset";
    mcp_server_name: string;
    default_config?: AnthropicMcpToolConfig | undefined;
    configs?: Record<string, AnthropicMcpToolConfig> | undefined;
  }>;
  betas: ["mcp-client-2025-11-20"];
}

export interface NeutronMcpToolMetadata {
  name: string;
  description: string;
  readOnlyHint: boolean;
  destructiveHint: boolean;
}

export const neutron_mcp_tools: NeutronMcpToolMetadata[] = [
  {
    name: "neutron_context_build",
    description: "Build budgeted context across memory, graph, decisions, consequences, outcomes, contradictions, and provenance.",
    readOnlyHint: true,
    destructiveHint: false,
  },
  {
    name: "neutron_search",
    description: "Search memory and intelligence records with an explainable hybrid trace.",
    readOnlyHint: true,
    destructiveHint: false,
  },
  {
    name: "neutron_graph_query",
    description: "Query across temporal graph dimensions.",
    readOnlyHint: true,
    destructiveHint: false,
  },
  {
    name: "neutron_graph_neighbours",
    description: "Traverse a bounded temporal graph neighbourhood.",
    readOnlyHint: true,
    destructiveHint: false,
  },
  {
    name: "neutron_entity_get",
    description: "Get a temporal entity version.",
    readOnlyHint: true,
    destructiveHint: false,
  },
  {
    name: "neutron_entity_search",
    description: "Search first-class entities across authorized Scopes.",
    readOnlyHint: true,
    destructiveHint: false,
  },
  {
    name: "neutron_recall",
    description: "Recall scoped memory with temporal, entity, agent, and decision signals.",
    readOnlyHint: true,
    destructiveHint: false,
  },
  {
    name: "neutron_decision_evaluate",
    description: "Evaluate feasibility, Pareto efficiency, and explicit trade-offs.",
    readOnlyHint: true,
    destructiveHint: false,
  },
  {
    name: "neutron_remember",
    description: "Store provenance-aware text or structured memory.",
    readOnlyHint: false,
    destructiveHint: false,
  },
  {
    name: "neutron_entity_upsert",
    description: "Append a temporal entity version.",
    readOnlyHint: false,
    destructiveHint: false,
  },
  {
    name: "neutron_graph_connect",
    description: "Append a first-class relationship in a named graph dimension.",
    readOnlyHint: false,
    destructiveHint: false,
  },
  {
    name: "neutron_decision_create",
    description: "Persist a multi-objective decision and immutable knowledge snapshot.",
    readOnlyHint: false,
    destructiveHint: false,
  },
  {
    name: "neutron_consequence_predict",
    description: "Create bounded evidence-linked consequence scenarios.",
    readOnlyHint: false,
    destructiveHint: false,
  },
  {
    name: "neutron_outcome_record",
    description: "Record observed outcomes and calculate comparable prediction errors.",
    readOnlyHint: false,
    destructiveHint: false,
  },
  {
    name: "neutron_simulate",
    description: "Persist clearly labelled simulations or counterfactuals.",
    readOnlyHint: false,
    destructiveHint: false,
  },
  {
    name: "memory_agent_context",
    description: "Build a scoped Neutron AI agent context pack with hybrid RAG-CAG retrieval.",
    readOnlyHint: true,
    destructiveHint: false,
  },
  {
    name: "memory_recall",
    description: "Recall relevant scoped Neutron AI memory summaries.",
    readOnlyHint: true,
    destructiveHint: false,
  },
  {
    name: "memory_remember",
    description: "Store compressed scoped memory for Neutron AI agents.",
    readOnlyHint: false,
    destructiveHint: false,
  },
  {
    name: "memory_reflect",
    description: "Store post-task experience and reusable tool lessons.",
    readOnlyHint: false,
    destructiveHint: false,
  },
  {
    name: "memory_cache_stats",
    description: "Return context-cache hit, miss, write, stale, and token metrics.",
    readOnlyHint: true,
    destructiveHint: false,
  },
  {
    name: "memory_cache_warm",
    description: "Prebuild safe context packs for repeated agent workflows.",
    readOnlyHint: false,
    destructiveHint: false,
  },
  {
    name: "memory_cache_invalidate",
    description: "Invalidate cached context packs by scope or cache key.",
    readOnlyHint: false,
    destructiveHint: true,
  },
  {
    name: "memory_forget",
    description: "Tombstone memory and remove external index or archive references.",
    readOnlyHint: false,
    destructiveHint: true,
  },
  {
    name: "memory_compact",
    description: "Expire and deduplicate memories in a scope.",
    readOnlyHint: false,
    destructiveHint: true,
  },
];

export function createNeutronMcpServerUrl(base_url: string, path = "/mcp"): string {
  const normalized_base_url = base_url.replace(/\/$/, "");
  const normalized_path = path.startsWith("/") ? path : `/${path}`;
  return `${normalized_base_url}${normalized_path}`;
}

export function createOpenAIMcpTool(options: NeutronMcpServerOptions): Record<string, unknown> {
  const server_label = options.serverLabel ?? "neutron_memory";
  const tool: Record<string, unknown> = {
    type: "mcp",
    server_label,
    server_url: options.serverUrl,
    require_approval: options.requireApproval ?? "never",
  };
  if (options.serverDescription) {
    tool.server_description = options.serverDescription;
  }
  if (options.authorization) {
    tool.authorization = options.authorization;
  }
  if (options.headers) {
    tool.headers = options.headers;
  }
  if (options.allowedTools) {
    tool.allowed_tools = options.allowedTools;
  }
  return tool;
}

export function createAnthropicMcpConnector(
  options: NeutronMcpServerOptions & {
    defaultConfig?: AnthropicMcpToolConfig | undefined;
    toolConfigs?: Record<string, AnthropicMcpToolConfig> | undefined;
  },
): AnthropicMcpConnector {
  const server_name = options.serverLabel ?? "neutron_memory";
  const server: AnthropicMcpConnector["mcp_servers"][number] = {
    type: "url",
    url: options.serverUrl,
    name: server_name,
  };
  if (options.authorization) {
    server.authorization_token = options.authorization;
  }

  const toolset: AnthropicMcpConnector["tools"][number] = {
    type: "mcp_toolset",
    mcp_server_name: server_name,
  };
  if (options.defaultConfig) {
    toolset.default_config = options.defaultConfig;
  }
  if (options.toolConfigs) {
    toolset.configs = options.toolConfigs;
  }

  return {
    mcp_servers: [server],
    tools: [toolset],
    betas: ["mcp-client-2025-11-20"],
  };
}
