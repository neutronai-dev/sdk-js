import type { JsonObject, JsonValue, MemoryType, PrivacyClass, RememberRequest, RememberResponse } from "@neutron-ai/shared";
import type { NeutronAIClient } from "./client.js";

export const obsidian_supported_extensions = [".md", ".canvas", ".base"] as const;

export type ObsidianSupportedExtension = (typeof obsidian_supported_extensions)[number];
export type ObsidianDocumentKind = "markdown_note" | "json_canvas" | "base";

export interface ObsidianVaultFile {
  path: string;
  content: string;
  modifiedAt?: number | undefined;
}

export interface ObsidianImportOptions {
  scopeId: string;
  agentId?: string | undefined;
  userId?: string | undefined;
  type?: MemoryType | undefined;
  privacyClass?: PrivacyClass | undefined;
  sourceName?: string | undefined;
  includePaths?: string[] | undefined;
  excludePaths?: string[] | undefined;
  maxFiles?: number | undefined;
  maxRequestChars?: number | undefined;
}

export interface ObsidianSkippedFile {
  path: string;
  reason: string;
}

export interface ObsidianImportStats {
  scannedFiles: number;
  importedFiles: number;
  skippedFiles: number;
  rememberRequests: number;
}

export type ObsidianRememberRequest = RememberRequest & { text: string };

export interface ObsidianImportPlan {
  requests: ObsidianRememberRequest[];
  skipped: ObsidianSkippedFile[];
  warnings: string[];
  stats: ObsidianImportStats;
}

export interface ObsidianImportResult extends ObsidianImportPlan {
  responses: RememberResponse[];
  accepted: number;
  duplicates: number;
}

interface ParsedObsidianDocument {
  path: string;
  kind: ObsidianDocumentKind;
  title: string;
  body: string;
  tags: string[];
  links: string[];
  embeds: string[];
  metadata: JsonObject;
  warnings: string[];
}

interface CanvasNode {
  id?: unknown;
  type?: unknown;
  text?: unknown;
  file?: unknown;
  url?: unknown;
  label?: unknown;
}

interface CanvasEdge {
  fromNode?: unknown;
  toNode?: unknown;
  label?: unknown;
}

const default_max_files = 1_000;
const default_max_request_chars = 90_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeVaultPath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+/g, "/");
}

function extensionFor(path: string): ObsidianSupportedExtension | undefined {
  const lower_path = path.toLowerCase();
  return obsidian_supported_extensions.find((extension) => lower_path.endsWith(extension));
}

function basenameWithoutExtension(path: string): string {
  const filename = path.split("/").pop() ?? path;
  return filename.replace(/\.[^.]+$/, "") || filename;
}

function compactList(values: string[], limit = 50): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(0, limit);
}

function boundedJsonValue(value: JsonValue): JsonValue {
  if (typeof value === "string") {
    return value.slice(0, 500);
  }
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => boundedJsonValue(item));
  }
  if (isRecord(value)) {
    return boundedJsonObject(value as Record<string, JsonValue>);
  }
  return value;
}

function boundedJsonObject(record: Record<string, JsonValue>): JsonObject {
  const entries = Object.entries(record).slice(0, 50);
  return Object.fromEntries(entries.map(([key, value]) => [key.slice(0, 80), boundedJsonValue(value)])) as JsonObject;
}

function pathMatches(path: string, patterns: string[] | undefined): boolean {
  if (!patterns?.length) {
    return false;
  }
  return patterns.some((pattern) => {
    const normalized_pattern = normalizeVaultPath(pattern);
    return path === normalized_pattern || path.startsWith(`${normalized_pattern.replace(/\/$/, "")}/`) || path.includes(normalized_pattern);
  });
}

function shouldSkipPath(path: string, options: ObsidianImportOptions): string | undefined {
  if (!extensionFor(path)) {
    return "unsupported_file_type";
  }
  if (path === ".obsidian" || path.startsWith(".obsidian/")) {
    return "obsidian_config";
  }
  if (pathMatches(path, options.excludePaths)) {
    return "excluded_path";
  }
  if (options.includePaths?.length && !pathMatches(path, options.includePaths)) {
    return "not_included";
  }
  return undefined;
}

function stripFrontmatter(content: string): { body: string; properties: Record<string, JsonValue> } {
  const normalized = content.replace(/^\uFEFF/, "");
  if (!normalized.startsWith("---\n") && !normalized.startsWith("---\r\n")) {
    return { body: normalized, properties: {} };
  }
  const lines = normalized.split(/\r?\n/);
  let closing_index = -1;
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index]?.trim() === "---") {
      closing_index = index;
      break;
    }
  }
  if (closing_index === -1) {
    return { body: normalized, properties: {} };
  }
  const properties: Record<string, JsonValue> = {};
  for (const line of lines.slice(1, closing_index)) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!match) {
      continue;
    }
    const [, key, raw_value] = match;
    if (!key) {
      continue;
    }
    properties[key] = parseFrontmatterValue(raw_value ?? "");
  }
  return {
    body: lines.slice(closing_index + 1).join("\n"),
    properties,
  };
}

function parseFrontmatterValue(raw_value: string): JsonValue {
  const value = raw_value.trim();
  if (!value) {
    return "";
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }
  if (value.startsWith("[") && value.endsWith("]")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }
  return value.replace(/^["']|["']$/g, "");
}

function frontmatterTags(properties: Record<string, JsonValue>): string[] {
  const tags = properties.tags ?? properties.tag;
  if (Array.isArray(tags)) {
    return tags.filter((tag): tag is string => typeof tag === "string");
  }
  if (typeof tags === "string") {
    return tags.split(/[,\s]+/);
  }
  return [];
}

function extractMarkdownTitle(path: string, body: string, properties: Record<string, JsonValue>): string {
  if (typeof properties.title === "string" && properties.title.trim()) {
    return properties.title.trim();
  }
  const heading = /^#\s+(.+)$/m.exec(body);
  return heading?.[1]?.trim() || basenameWithoutExtension(path);
}

function extractWikilinks(body: string): { links: string[]; embeds: string[] } {
  const links: string[] = [];
  const embeds: string[] = [];
  const wikilink_pattern = /(!?)\[\[([^\]]+)]]/g;
  for (const match of body.matchAll(wikilink_pattern)) {
    const target = (match[2] ?? "").split("|")[0]?.split("#")[0]?.trim();
    if (!target) {
      continue;
    }
    if (match[1] === "!") {
      embeds.push(target);
    } else {
      links.push(target);
    }
  }
  return {
    links: compactList(links),
    embeds: compactList(embeds),
  };
}

function extractMarkdownTags(body: string, properties: Record<string, JsonValue>): string[] {
  const tags = frontmatterTags(properties);
  const tag_pattern = /(?:^|\s)#([A-Za-z0-9][A-Za-z0-9/_-]*)/g;
  for (const match of body.matchAll(tag_pattern)) {
    if (match[1]) {
      tags.push(match[1]);
    }
  }
  return compactList(tags.map((tag) => tag.replace(/^#/, "")));
}

function markdownDocument(file: ObsidianVaultFile): ParsedObsidianDocument {
  const { body, properties } = stripFrontmatter(file.content);
  const title = extractMarkdownTitle(file.path, body, properties);
  const wikilinks = extractWikilinks(body);
  const tags = extractMarkdownTags(body, properties);
  const text = [
    `Obsidian note: ${title}`,
    `Path: ${file.path}`,
    tags.length ? `Tags: ${tags.join(", ")}` : undefined,
    wikilinks.links.length ? `Links: ${wikilinks.links.join(", ")}` : undefined,
    wikilinks.embeds.length ? `Embeds: ${wikilinks.embeds.join(", ")}` : undefined,
    "",
    body.trim(),
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");

  return {
    path: file.path,
    kind: "markdown_note",
    title,
    body: text,
    tags,
    links: wikilinks.links,
    embeds: wikilinks.embeds,
    metadata: {
      properties: boundedJsonObject(properties),
    },
    warnings: [],
  };
}

function canvasDocument(file: ObsidianVaultFile): ParsedObsidianDocument {
  const warnings: string[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(file.content);
  } catch {
    return {
      path: file.path,
      kind: "json_canvas",
      title: basenameWithoutExtension(file.path),
      body: [`Obsidian canvas: ${basenameWithoutExtension(file.path)}`, `Path: ${file.path}`, "", file.content.trim()].join("\n"),
      tags: [],
      links: [],
      embeds: [],
      metadata: { parseStatus: "invalid_json" },
      warnings: [`${file.path} is not valid JSON Canvas; imported as plain text.`],
    };
  }

  const record = isRecord(parsed) ? parsed : {};
  const nodes = Array.isArray(record.nodes) ? (record.nodes as CanvasNode[]) : [];
  const edges = Array.isArray(record.edges) ? (record.edges as CanvasEdge[]) : [];
  const lines: string[] = [`Obsidian canvas: ${basenameWithoutExtension(file.path)}`, `Path: ${file.path}`];
  const links: string[] = [];
  const embeds: string[] = [];

  for (const node of nodes) {
    if (!isRecord(node)) {
      continue;
    }
    const type = typeof node.type === "string" ? node.type : "unknown";
    const id = typeof node.id === "string" ? node.id : "unknown";
    if (type === "text" && typeof node.text === "string") {
      lines.push("", `Text node ${id}:`, node.text.trim());
    } else if (type === "file" && typeof node.file === "string") {
      embeds.push(node.file);
      lines.push("", `File node ${id}: ${node.file}`);
    } else if (type === "link" && typeof node.url === "string") {
      links.push(node.url);
      lines.push("", `Link node ${id}: ${node.url}`);
    } else if (type === "group" && typeof node.label === "string") {
      lines.push("", `Group ${id}: ${node.label}`);
    }
  }

  if (edges.length) {
    lines.push("", "Canvas edges:");
    for (const edge of edges.slice(0, 100)) {
      if (!isRecord(edge)) {
        continue;
      }
      const from_node = typeof edge.fromNode === "string" ? edge.fromNode : "unknown";
      const to_node = typeof edge.toNode === "string" ? edge.toNode : "unknown";
      const label = typeof edge.label === "string" && edge.label.trim() ? ` (${edge.label.trim()})` : "";
      lines.push(`- ${from_node} -> ${to_node}${label}`);
    }
    if (edges.length > 100) {
      warnings.push(`${file.path} has ${edges.length} canvas edges; only the first 100 are included in memory text.`);
    }
  }

  return {
    path: file.path,
    kind: "json_canvas",
    title: basenameWithoutExtension(file.path),
    body: lines.join("\n").trim(),
    tags: [],
    links: compactList(links),
    embeds: compactList(embeds),
    metadata: {
      canvasNodeCount: nodes.length,
      canvasEdgeCount: edges.length,
    },
    warnings,
  };
}

function baseDocument(file: ObsidianVaultFile): ParsedObsidianDocument {
  const title = basenameWithoutExtension(file.path);
  const view_names = compactList(
    [...file.content.matchAll(/^\s{0,4}-?\s*name:\s*["']?([^"'\n]+)["']?\s*$/gm)].map((match) => match[1] ?? ""),
    20,
  );
  const text = [
    `Obsidian base: ${title}`,
    `Path: ${file.path}`,
    view_names.length ? `Views: ${view_names.join(", ")}` : undefined,
    "",
    file.content.trim(),
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");

  return {
    path: file.path,
    kind: "base",
    title,
    body: text,
    tags: [],
    links: [],
    embeds: [],
    metadata: {
      viewNames: view_names,
    },
    warnings: [],
  };
}

function parseObsidianDocument(file: ObsidianVaultFile): ParsedObsidianDocument {
  const extension = extensionFor(file.path);
  if (extension === ".canvas") {
    return canvasDocument(file);
  }
  if (extension === ".base") {
    return baseDocument(file);
  }
  return markdownDocument(file);
}

function baseMetadata(file: ObsidianVaultFile, document: ParsedObsidianDocument, options: ObsidianImportOptions): JsonObject {
  return {
    source: "obsidian",
    sourceName: options.sourceName ?? "Obsidian vault",
    path: file.path,
    kind: document.kind,
    title: document.title,
    tags: document.tags,
    links: document.links,
    embeds: document.embeds,
    modifiedAt: file.modifiedAt ?? null,
    ...document.metadata,
  };
}

function makeRequestText(document: ParsedObsidianDocument, part: { index: number; count: number; text: string }): string {
  if (part.count === 1) {
    return document.body;
  }
  return [
    `${document.title} (part ${part.index + 1} of ${part.count})`,
    `Obsidian path: ${document.path}`,
    "",
    part.text.trim(),
  ].join("\n");
}

function splitText(text: string, max_chars: number): Array<{ index: number; count: number; text: string }> {
  if (text.length <= max_chars) {
    return [{ index: 0, count: 1, text }];
  }
  const chunks: string[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const target_end = Math.min(cursor + max_chars, text.length);
    const next_break = text.lastIndexOf("\n\n", target_end);
    const end = next_break > cursor + Math.floor(max_chars * 0.6) ? next_break : target_end;
    chunks.push(text.slice(cursor, end));
    cursor = end;
  }
  return chunks.map((chunk, index) => ({ index, count: chunks.length, text: chunk }));
}

export function createObsidianImportPlan(files: ObsidianVaultFile[], options: ObsidianImportOptions): ObsidianImportPlan {
  const max_files = options.maxFiles ?? default_max_files;
  const max_request_chars = options.maxRequestChars ?? default_max_request_chars;
  if (!options.scopeId.trim()) {
    throw new Error("scopeId is required");
  }
  if (max_files <= 0) {
    throw new Error("maxFiles must be positive");
  }
  if (max_request_chars < 2_000 || max_request_chars > 95_000) {
    throw new Error("maxRequestChars must be between 2000 and 95000");
  }

  const requests: ObsidianRememberRequest[] = [];
  const skipped: ObsidianSkippedFile[] = [];
  const warnings: string[] = [];
  let imported_files = 0;

  for (const raw_file of files) {
    const file: ObsidianVaultFile = {
      ...raw_file,
      path: normalizeVaultPath(raw_file.path),
    };
    const skip_reason = shouldSkipPath(file.path, options);
    if (skip_reason) {
      skipped.push({ path: file.path, reason: skip_reason });
      continue;
    }
    if (imported_files >= max_files) {
      skipped.push({ path: file.path, reason: "max_files_reached" });
      continue;
    }

    const document = parseObsidianDocument(file);
    imported_files += 1;
    warnings.push(...document.warnings);
    const chunks = splitText(document.body, max_request_chars);
    const metadata = baseMetadata(file, document, options);
    for (const chunk of chunks) {
      requests.push({
        scopeId: options.scopeId,
        agentId: options.agentId,
        userId: options.userId,
        type: options.type ?? "knowledge",
        text: makeRequestText(document, chunk),
        privacyClass: options.privacyClass ?? "tenant",
        metadata: {
          ...metadata,
          partNumber: chunk.index + 1,
          partCount: chunk.count,
        },
      });
    }
  }

  return {
    requests,
    skipped,
    warnings,
    stats: {
      scannedFiles: files.length,
      importedFiles: imported_files,
      skippedFiles: skipped.length,
      rememberRequests: requests.length,
    },
  };
}

export async function importObsidianVault(client: NeutronAIClient, files: ObsidianVaultFile[], options: ObsidianImportOptions): Promise<ObsidianImportResult> {
  const plan = createObsidianImportPlan(files, options);
  const responses: RememberResponse[] = [];
  for (const request of plan.requests) {
    responses.push(await client.remember(request));
  }
  return {
    ...plan,
    responses,
    accepted: responses.filter((response) => response.accepted).length,
    duplicates: responses.filter((response) => response.duplicateOf).length,
  };
}
