import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import {
  NeutronAIClient,
  NeutronAISdkError,
  createObsidianImportPlan,
  importObsidianVault,
  obsidian_supported_extensions,
  type NeutronAIClientOptions,
  type ObsidianImportOptions,
  type ObsidianVaultFile,
} from "@neutron-ai/sdk";

export interface CliEnvironment {
  NEUTRON_API_URL?: string | undefined;
  NEUTRON_API_TOKEN?: string | undefined;
  NEUTRON_NUCLEUS_ID?: string | undefined;
  NEUTRON_TENANT_ID?: string | undefined;
  [key: string]: string | undefined;
}

export interface CliIo {
  stdout?: (value: string) => void;
  stderr?: (value: string) => void;
  fetchImpl?: typeof fetch | undefined;
}

export interface CliResult {
  exitCode: number;
}

interface ParsedArgs {
  command: string;
  flags: Record<string, string | boolean>;
}

const help_text = `Neutron AI CLI

Usage:
  neutron health
  neutron remember --scope <scope_id> --text <text> [--type preference]
  neutron recall --scope <scope_id>[,<scope_id>] --query <query> [--limit 10]
  neutron context --scope <scope_id>[,<scope_id>] --task <task>
  neutron import-obsidian --vault <path> --scope <scope_id> [--dry-run]
  neutron mcp-tools

Environment:
  NEUTRON_API_URL      Base API URL, for example https://neutronai.dev/api
  NEUTRON_API_TOKEN    Optional bearer token
  NEUTRON_NUCLEUS_ID   Required for Nucleus-scoped memory calls
  NEUTRON_TENANT_ID    Legacy alias for NEUTRON_NUCLEUS_ID
`;

const memory_types = [
  "semantic",
  "episodic",
  "procedural",
  "preference",
  "experience",
  "usage_pattern",
  "skill",
  "knowledge",
  "project",
  "tool_trace",
  "tool_lesson",
  "safety",
  "compliance",
  "temporary",
] as const;

const privacy_classes = ["public", "tenant", "user_private", "sensitive"] as const;

type CliMemoryType = (typeof memory_types)[number];
type CliPrivacyClass = (typeof privacy_classes)[number];

function parseArgs(args: string[]): ParsedArgs {
  const command = args[0] ?? "help";
  const flags: Record<string, string | boolean> = {};
  for (let index = 1; index < args.length; index += 1) {
    const value = args[index];
    if (!value?.startsWith("--")) {
      continue;
    }
    const key = value.slice(2);
    const next_value = args[index + 1];
    if (!next_value || next_value.startsWith("--")) {
      flags[key] = true;
      continue;
    }
    flags[key] = next_value;
    index += 1;
  }
  return { command, flags };
}

function getFlag(flags: Record<string, string | boolean>, key: string): string | undefined {
  const value = flags[key];
  return typeof value === "string" ? value : undefined;
}

function requireFlag(flags: Record<string, string | boolean>, key: string): string {
  const value = getFlag(flags, key);
  if (!value) {
    throw new Error(`--${key} is required`);
  }
  return value;
}

function parseChoice<const T extends readonly string[]>(value: string, choices: T, field: string): T[number] {
  if (choices.includes(value)) {
    return value;
  }
  throw new Error(`${field} must be one of: ${choices.join(", ")}`);
}

function parseScopes(value: string): string[] {
  return value
    .split(",")
    .map((scope_id) => scope_id.trim())
    .filter(Boolean);
}

function parsePositiveInteger(value: string | undefined, fallback: number, field: string): number {
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${field} must be a positive integer`);
  }
  return parsed;
}

function writeJson(io: CliIo, value: unknown): void {
  (io.stdout ?? console.log)(JSON.stringify(value, null, 2));
}

function createClient(env: CliEnvironment, io: CliIo): NeutronAIClient {
  const base_url = env.NEUTRON_API_URL;
  if (!base_url) {
    throw new Error("NEUTRON_API_URL is required");
  }
  const options: NeutronAIClientOptions = {
    baseUrl: base_url,
  };
  if (env.NEUTRON_API_TOKEN) {
    options.token = env.NEUTRON_API_TOKEN;
  }
  if (env.NEUTRON_NUCLEUS_ID) {
    options.nucleusId = env.NEUTRON_NUCLEUS_ID;
  }
  if (env.NEUTRON_TENANT_ID) {
    options.tenantId = env.NEUTRON_TENANT_ID;
  }
  if (io.fetchImpl) {
    options.fetchImpl = io.fetchImpl;
  }
  return new NeutronAIClient(options);
}

function isSupportedObsidianFile(file_path: string): boolean {
  const lower_path = file_path.toLowerCase();
  return obsidian_supported_extensions.some((extension) => lower_path.endsWith(extension));
}

function shouldSkipDirectory(name: string): boolean {
  return name === ".obsidian" || name === ".git" || name === "node_modules";
}

async function readObsidianVaultFiles(vault_path: string): Promise<ObsidianVaultFile[]> {
  const root = path.resolve(vault_path);
  const root_stat = await stat(root);
  if (!root_stat.isDirectory()) {
    throw new Error("--vault must point to an Obsidian vault directory");
  }

  const files: ObsidianVaultFile[] = [];
  async function walk(current_dir: string): Promise<void> {
    const entries = await readdir(current_dir, { withFileTypes: true });
    for (const entry of entries) {
      const absolute_path = path.join(current_dir, entry.name);
      if (entry.isDirectory()) {
        if (!shouldSkipDirectory(entry.name)) {
          await walk(absolute_path);
        }
        continue;
      }
      if (!entry.isFile() || !isSupportedObsidianFile(entry.name)) {
        continue;
      }
      const file_stat = await stat(absolute_path);
      files.push({
        path: path.relative(root, absolute_path).split(path.sep).join("/"),
        content: await readFile(absolute_path, "utf8"),
        modifiedAt: Math.floor(file_stat.mtimeMs),
      });
    }
  }

  await walk(root);
  return files.sort((left, right) => left.path.localeCompare(right.path));
}

function obsidianOptionsFromFlags(flags: Record<string, string | boolean>): ObsidianImportOptions {
  return {
    scopeId: requireFlag(flags, "scope"),
    type: parseChoice(getFlag(flags, "type") ?? "knowledge", memory_types, "--type"),
    privacyClass: parseChoice(getFlag(flags, "privacy-class") ?? "tenant", privacy_classes, "--privacy-class"),
    agentId: getFlag(flags, "agent-id"),
    userId: getFlag(flags, "user-id"),
    sourceName: getFlag(flags, "source-name"),
    maxFiles: parsePositiveInteger(getFlag(flags, "max-files"), 1_000, "--max-files"),
    maxRequestChars: parsePositiveInteger(getFlag(flags, "max-request-chars"), 90_000, "--max-request-chars"),
  };
}

function obsidianImportSummary(input: {
  dryRun: boolean;
  vaultPath: string;
  plan: ReturnType<typeof createObsidianImportPlan>;
  responses?: Awaited<ReturnType<typeof importObsidianVault>>["responses"] | undefined;
  accepted?: number | undefined;
  duplicates?: number | undefined;
}): Record<string, unknown> {
  return {
    source: "obsidian",
    dryRun: input.dryRun,
    vaultPath: path.resolve(input.vaultPath),
    stats: input.plan.stats,
    skipped: input.plan.skipped,
    warnings: input.plan.warnings,
    plannedRequests: input.plan.requests.map((request) => ({
      scopeId: request.scopeId,
      type: request.type,
      privacyClass: request.privacyClass,
      textChars: request.text.length,
      metadata: request.metadata,
    })),
    accepted: input.accepted,
    duplicates: input.duplicates,
    memoryIds: input.responses?.map((response) => response.memoryId),
  };
}

async function runCommand(parsed: ParsedArgs, env: CliEnvironment, io: CliIo): Promise<void> {
  if (parsed.command === "help" || parsed.command === "--help" || parsed.command === "-h") {
    (io.stdout ?? console.log)(help_text);
    return;
  }

  if (parsed.command === "health") {
    const client = createClient(env, io);
    writeJson(io, await client.health());
    return;
  }

  if (parsed.command === "remember") {
    const client = createClient(env, io);
    const memory_type: CliMemoryType = parseChoice(getFlag(parsed.flags, "type") ?? "preference", memory_types, "--type");
    const privacy_class: CliPrivacyClass = parseChoice(getFlag(parsed.flags, "privacy-class") ?? "tenant", privacy_classes, "--privacy-class");
    writeJson(
      io,
      await client.remember({
        scopeId: requireFlag(parsed.flags, "scope"),
        type: memory_type,
        text: requireFlag(parsed.flags, "text"),
        privacyClass: privacy_class,
      }),
    );
    return;
  }

  if (parsed.command === "recall") {
    const client = createClient(env, io);
    const limit = getFlag(parsed.flags, "limit");
    writeJson(
      io,
      await client.recall({
        scopeIds: parseScopes(requireFlag(parsed.flags, "scope")),
        query: requireFlag(parsed.flags, "query"),
        limit: limit ? Number(limit) : undefined,
      }),
    );
    return;
  }

  if (parsed.command === "context") {
    const client = createClient(env, io);
    writeJson(
      io,
      await client.agentContext({
        scopeIds: parseScopes(requireFlag(parsed.flags, "scope")),
        task: requireFlag(parsed.flags, "task"),
      }),
    );
    return;
  }

  if (parsed.command === "import-obsidian") {
    const vault_path = requireFlag(parsed.flags, "vault");
    const files = await readObsidianVaultFiles(vault_path);
    const options = obsidianOptionsFromFlags(parsed.flags);
    if (!options.sourceName) {
      options.sourceName = path.basename(path.resolve(vault_path));
    }
    const plan = createObsidianImportPlan(files, options);
    if (parsed.flags["dry-run"]) {
      writeJson(io, obsidianImportSummary({ dryRun: true, vaultPath: vault_path, plan }));
      return;
    }
    const client = createClient(env, io);
    const result = await importObsidianVault(client, files, options);
    writeJson(
      io,
      obsidianImportSummary({
        dryRun: false,
        vaultPath: vault_path,
        plan,
        responses: result.responses,
        accepted: result.accepted,
        duplicates: result.duplicates,
      }),
    );
    return;
  }

  if (parsed.command === "mcp-tools") {
    const client = createClient(env, io);
    writeJson(io, await client.listMcpTools());
    return;
  }

  throw new Error(`Unknown command: ${parsed.command}`);
}

export async function runCli(args: string[], env: CliEnvironment, io: CliIo = {}): Promise<number> {
  try {
    await runCommand(parseArgs(args), env, io);
    return 0;
  } catch (error) {
    const write_error = io.stderr ?? console.error;
    if (error instanceof NeutronAISdkError) {
      write_error(JSON.stringify({ status: error.status, body: error.body }, null, 2));
      return 1;
    }
    write_error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}
