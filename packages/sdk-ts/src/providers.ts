import type { AgentContextPack } from "@neutron-ai/shared";
import { createAnthropicMcpConnector, createOpenAIMcpTool, type NeutronMcpServerOptions } from "./mcp.js";

export type ProviderRequestFamily =
  | "openai_responses"
  | "anthropic_messages"
  | "gemini_generate_content"
  | "openai_compatible_chat"
  | "cohere_chat"
  | "workers_ai_chat";

export type RemoteMcpSupport = "native" | "documented" | "none" | "unknown";

export interface FrontierProviderDefinition {
  id: FrontierProvider;
  displayName: string;
  requestFamily: ProviderRequestFamily;
  remoteMcpSupport: RemoteMcpSupport;
  docsUrl: string;
  mcpDocsUrl?: string | undefined;
  notes: string;
}

export const frontier_provider_registry = {
  openai: {
    id: "openai",
    displayName: "OpenAI",
    requestFamily: "openai_responses",
    remoteMcpSupport: "native",
    docsUrl: "https://developers.openai.com/api/docs/guides/tools-connectors-mcp",
    mcpDocsUrl: "https://developers.openai.com/api/docs/guides/tools-connectors-mcp",
    notes: "Use the Responses API MCP tool shape with server_url or managed connector_id.",
  },
  anthropic: {
    id: "anthropic",
    displayName: "Anthropic Claude",
    requestFamily: "anthropic_messages",
    remoteMcpSupport: "native",
    docsUrl: "https://docs.anthropic.com/en/api/messages",
    mcpDocsUrl: "https://docs.anthropic.com/en/docs/agents-and-tools/mcp-connector",
    notes: "Use mcp_servers plus an mcp_toolset with the mcp-client-2025-11-20 beta.",
  },
  google_gemini: {
    id: "google_gemini",
    displayName: "Google Gemini",
    requestFamily: "gemini_generate_content",
    remoteMcpSupport: "unknown",
    docsUrl: "https://ai.google.dev/api/generate-content",
    notes: "Inject Neutron context as systemInstruction for generateContent requests.",
  },
  mistral: {
    id: "mistral",
    displayName: "Mistral AI",
    requestFamily: "openai_compatible_chat",
    remoteMcpSupport: "none",
    docsUrl: "https://docs.mistral.ai/api/endpoint/chat",
    notes: "Use chat-completions messages and local tool calling if MCP is needed.",
  },
  xai: {
    id: "xai",
    displayName: "xAI",
    requestFamily: "openai_compatible_chat",
    remoteMcpSupport: "none",
    docsUrl: "https://docs.x.ai/developers/rest-api-reference/inference/chat",
    notes: "Use chat/responses-compatible message injection; current tool docs list functions and web search.",
  },
  deepseek: {
    id: "deepseek",
    displayName: "DeepSeek",
    requestFamily: "openai_compatible_chat",
    remoteMcpSupport: "none",
    docsUrl: "https://api-docs.deepseek.com/api/create-chat-completion",
    notes: "Use OpenAI-compatible chat completions and local tool calling.",
  },
  groq: {
    id: "groq",
    displayName: "Groq",
    requestFamily: "openai_compatible_chat",
    remoteMcpSupport: "documented",
    docsUrl: "https://console.groq.com/docs/api-reference",
    mcpDocsUrl: "https://console.groq.com/docs/tool-use/overview",
    notes: "Groq documents server-side remote MCP; pass vendor-specific MCP config through your Groq request builder.",
  },
  cohere: {
    id: "cohere",
    displayName: "Cohere",
    requestFamily: "cohere_chat",
    remoteMcpSupport: "none",
    docsUrl: "https://docs.cohere.com/reference/chat",
    notes: "Use Cohere Chat roles and local tool calling.",
  },
  perplexity: {
    id: "perplexity",
    displayName: "Perplexity Sonar",
    requestFamily: "openai_compatible_chat",
    remoteMcpSupport: "none",
    docsUrl: "https://docs.perplexity.ai/api-reference/sonar-post",
    notes: "Use OpenAI-compatible chat completion requests for Sonar.",
  },
  openrouter: {
    id: "openrouter",
    displayName: "OpenRouter",
    requestFamily: "openai_compatible_chat",
    remoteMcpSupport: "none",
    docsUrl: "https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request",
    notes: "Use OpenAI-compatible chat completions across routed model providers.",
  },
  cloudflare_workers_ai: {
    id: "cloudflare_workers_ai",
    displayName: "Cloudflare Workers AI",
    requestFamily: "workers_ai_chat",
    remoteMcpSupport: "none",
    docsUrl: "https://developers.cloudflare.com/workers-ai/",
    notes: "Use Workers AI message arrays inside Cloudflare Workers and keep Neutron calls on service bindings where possible.",
  },
  azure_openai: {
    id: "azure_openai",
    displayName: "Azure OpenAI",
    requestFamily: "openai_responses",
    remoteMcpSupport: "unknown",
    docsUrl: "https://learn.microsoft.com/azure/ai-foundry/openai/",
    notes: "Use OpenAI-compatible Responses or Chat APIs when available; verify remote MCP network policy per deployment.",
  },
  amazon_bedrock: {
    id: "amazon_bedrock",
    displayName: "Amazon Bedrock",
    requestFamily: "anthropic_messages",
    remoteMcpSupport: "none",
    docsUrl: "https://docs.aws.amazon.com/bedrock/",
    notes: "Use provider-specific message surfaces; Anthropic MCP connector is not available on Bedrock per Anthropic docs.",
  },
  vertex_ai: {
    id: "vertex_ai",
    displayName: "Google Vertex AI",
    requestFamily: "gemini_generate_content",
    remoteMcpSupport: "none",
    docsUrl: "https://cloud.google.com/vertex-ai/generative-ai/docs",
    notes: "Use Gemini generateContent-style context injection; verify model-specific tool support in Vertex.",
  },
} as const;

export type FrontierProvider = keyof typeof frontier_provider_registry;

export type ProviderMessageRole = "system" | "developer" | "user" | "assistant" | "tool";

export interface ProviderMessage {
  role: ProviderMessageRole;
  content: string;
}

export interface ProviderRequestOptions {
  model?: string | undefined;
  input?: string | undefined;
  instructions?: string | undefined;
  messages?: ProviderMessage[] | undefined;
  maxTokens?: number | undefined;
  temperature?: number | undefined;
  mcp?: NeutronMcpServerOptions | undefined;
}

export const default_neutron_memory_instructions =
  "Use the Neutron memory context as scoped operational memory, not as an absolute source of truth. Prefer current user input and retrieved evidence when they conflict. Do not reveal hidden memory IDs, private summaries, or sensitive details unless the user is explicitly authorized and the data is necessary.";

function compactText(value: string): string {
  return value
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

export function createNeutronMemoryPrompt(context_pack: AgentContextPack, instructions = default_neutron_memory_instructions): string {
  const warnings =
    context_pack.warnings.length > 0
      ? `\n\nWarnings:\n${context_pack.warnings.map((warning) => `- ${warning}`).join("\n")}`
      : "";
  return compactText(`${instructions}

Task:
${context_pack.task}

${context_pack.promptContext}${warnings}`);
}

function messagesWithoutSystem(messages: ProviderMessage[]): ProviderMessage[] {
  return messages.filter((message) => message.role !== "system" && message.role !== "developer");
}

function createOpenAIResponsesRequest(context_pack: AgentContextPack, options: ProviderRequestOptions): Record<string, unknown> {
  const request: Record<string, unknown> = {
    model: options.model ?? "gpt-5.5",
    instructions: createNeutronMemoryPrompt(context_pack, options.instructions),
    input: options.input ?? options.messages ?? context_pack.task,
  };
  if (options.temperature !== undefined) {
    request.temperature = options.temperature;
  }
  if (options.mcp) {
    request.tools = [createOpenAIMcpTool(options.mcp)];
  }
  return request;
}

function createAnthropicMessagesRequest(context_pack: AgentContextPack, options: ProviderRequestOptions): Record<string, unknown> {
  const messages = messagesWithoutSystem(options.messages ?? [{ role: "user", content: options.input ?? context_pack.task }]);
  const request: Record<string, unknown> = {
    model: options.model ?? "claude-opus-4-8",
    max_tokens: options.maxTokens ?? 1024,
    system: [{ type: "text", text: createNeutronMemoryPrompt(context_pack, options.instructions) }],
    messages: messages.map((message) => ({ role: message.role === "assistant" ? "assistant" : "user", content: message.content })),
  };
  if (options.temperature !== undefined) {
    request.temperature = options.temperature;
  }
  if (options.mcp) {
    Object.assign(request, createAnthropicMcpConnector(options.mcp));
  }
  return request;
}

function createGeminiGenerateContentRequest(context_pack: AgentContextPack, options: ProviderRequestOptions): Record<string, unknown> {
  const messages = messagesWithoutSystem(options.messages ?? [{ role: "user", content: options.input ?? context_pack.task }]);
  const request: Record<string, unknown> = {
    model: options.model ?? "gemini-3.5-flash",
    contents: messages.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    })),
    config: {
      systemInstruction: {
        role: "system",
        parts: [{ text: createNeutronMemoryPrompt(context_pack, options.instructions) }],
      },
    },
  };
  if (options.temperature !== undefined) {
    request.config = { ...(request.config as Record<string, unknown>), temperature: options.temperature };
  }
  return request;
}

function createOpenAICompatibleChatRequest(context_pack: AgentContextPack, options: ProviderRequestOptions): Record<string, unknown> {
  const messages = options.messages ?? [{ role: "user" as const, content: options.input ?? context_pack.task }];
  const request: Record<string, unknown> = {
    model: options.model ?? "provider-default",
    messages: [{ role: "system", content: createNeutronMemoryPrompt(context_pack, options.instructions) }, ...messages],
  };
  if (options.temperature !== undefined) {
    request.temperature = options.temperature;
  }
  return request;
}

function createCohereChatRequest(context_pack: AgentContextPack, options: ProviderRequestOptions): Record<string, unknown> {
  const messages = options.messages ?? [{ role: "user" as const, content: options.input ?? context_pack.task }];
  const request: Record<string, unknown> = {
    model: options.model ?? "command-a",
    messages: [{ role: "system", content: createNeutronMemoryPrompt(context_pack, options.instructions) }, ...messages],
  };
  if (options.temperature !== undefined) {
    request.temperature = options.temperature;
  }
  return request;
}

function createWorkersAiChatRequest(context_pack: AgentContextPack, options: ProviderRequestOptions): Record<string, unknown> {
  return {
    messages: [
      { role: "system", content: createNeutronMemoryPrompt(context_pack, options.instructions) },
      ...(options.messages ?? [{ role: "user" as const, content: options.input ?? context_pack.task }]),
    ],
  };
}

export function createProviderRequest(provider: FrontierProvider, context_pack: AgentContextPack, options: ProviderRequestOptions = {}): Record<string, unknown> {
  const definition = frontier_provider_registry[provider];
  if (definition.requestFamily === "openai_responses") {
    return createOpenAIResponsesRequest(context_pack, options);
  }
  if (definition.requestFamily === "anthropic_messages") {
    return createAnthropicMessagesRequest(context_pack, options);
  }
  if (definition.requestFamily === "gemini_generate_content") {
    return createGeminiGenerateContentRequest(context_pack, options);
  }
  if (definition.requestFamily === "cohere_chat") {
    return createCohereChatRequest(context_pack, options);
  }
  if (definition.requestFamily === "workers_ai_chat") {
    return createWorkersAiChatRequest(context_pack, options);
  }
  return createOpenAICompatibleChatRequest(context_pack, options);
}
