import { describe, expect, it } from "vitest";
import { NeutronAIClient, createObsidianImportPlan, importObsidianVault } from "../src";

describe("Obsidian importer", () => {
  it("creates scoped remember requests from markdown, canvas, and base files", () => {
    const plan = createObsidianImportPlan(
      [
        {
          path: "Projects/Neutron.md",
          content: "---\ntags: [agent-memory, docs]\ntitle: Neutron project\n---\n# Neutron project\nLink to [[Architecture|arch]] and ![[diagram.canvas]].\n#release",
          modifiedAt: 1781952000000,
        },
        {
          path: "Maps/Product.canvas",
          content: JSON.stringify({
            nodes: [
              { id: "a", type: "text", text: "Agent memory workflow", x: 0, y: 0, width: 100, height: 100 },
              { id: "b", type: "file", file: "Projects/Neutron.md", x: 120, y: 0, width: 100, height: 100 },
            ],
            edges: [{ fromNode: "a", toNode: "b", label: "explains" }],
          }),
        },
        {
          path: "Databases/Research.base",
          content: "views:\n  - name: Reading list\n    type: table\n",
        },
        {
          path: ".obsidian/app.json",
          content: "{}",
        },
      ],
      {
        scopeId: "kb:obsidian",
        sourceName: "Product vault",
      },
    );

    expect(plan.stats).toMatchObject({
      scannedFiles: 4,
      importedFiles: 3,
      skippedFiles: 1,
      rememberRequests: 3,
    });
    expect(plan.skipped).toEqual([{ path: ".obsidian/app.json", reason: "unsupported_file_type" }]);
    expect(plan.requests[0]).toMatchObject({
      scopeId: "kb:obsidian",
      type: "knowledge",
      privacyClass: "tenant",
      metadata: {
        source: "obsidian",
        sourceName: "Product vault",
        path: "Projects/Neutron.md",
        kind: "markdown_note",
        title: "Neutron project",
        tags: ["agent-memory", "docs", "release"],
        links: ["Architecture"],
        embeds: ["diagram.canvas"],
      },
    });
    expect(plan.requests[0]?.text).toContain("Obsidian note: Neutron project");
    expect(plan.requests[1]?.text).toContain("Text node a");
    expect(plan.requests[1]?.metadata).toMatchObject({ canvasNodeCount: 2, canvasEdgeCount: 1 });
    expect(plan.requests[2]?.text).toContain("Views: Reading list");
  });

  it("chunks long notes before they cross the memory request limit", () => {
    const plan = createObsidianImportPlan(
      [
        {
          path: "Long.md",
          content: `# Long\n${"Paragraph\n\n".repeat(800)}`,
        },
      ],
      {
        scopeId: "kb:obsidian",
        maxRequestChars: 2_000,
      },
    );

    expect(plan.requests.length).toBeGreaterThan(1);
    expect(plan.requests.every((request) => request.text.length <= 2_200)).toBe(true);
    expect(plan.requests[0]?.metadata).toMatchObject({ partNumber: 1, partCount: plan.requests.length });
  });

  it("imports planned requests through the Neutron client", async () => {
    const requests: Request[] = [];
    const client = new NeutronAIClient({
      baseUrl: "https://memory.example.com",
      nucleusId: "neutron",
      fetchImpl: async (input, init) => {
        const request = new Request(input, init);
        requests.push(request);
        return Response.json({
          memoryId: `mem_${requests.length}`,
          tenantId: "neutron",
          nucleusId: "neutron",
          scopeId: "kb:obsidian",
          namespace: "default",
          accepted: true,
          queued: false,
          vectorId: `vec_${requests.length}`,
          warnings: [],
        });
      },
    });

    const result = await importObsidianVault(
      client,
      [{ path: "Neutron.md", content: "# Neutron\nScoped memory." }],
      { scopeId: "kb:obsidian", privacyClass: "user_private" },
    );

    expect(result.accepted).toBe(1);
    expect(requests[0]?.url).toBe("https://memory.example.com/v1/memory/remember");
    expect(await requests[0]?.json()).toMatchObject({
      nucleusId: "neutron",
      tenantId: "neutron",
      scopeId: "kb:obsidian",
      privacyClass: "user_private",
      metadata: {
        source: "obsidian",
        path: "Neutron.md",
      },
    });
  });
});
