import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { runCli } from "../dist/cli.js";

test("remember command injects nucleus, legacy tenant, and bearer token", async () => {
  const requests = [];
  const output = [];
  const exit_code = await runCli(
    ["remember", "--scope", "user:derek", "--text", "prefers short updates"],
    {
      NEUTRON_API_URL: "https://api.example.test",
      NEUTRON_API_TOKEN: "test_token",
      NEUTRON_NUCLEUS_ID: "tenant_demo",
    },
    {
      stdout: (value) => output.push(value),
      fetchImpl: async (input, init) => {
        requests.push(new Request(input, init));
        return Response.json({ memoryId: "mem_1", accepted: true, warnings: [] });
      },
    },
  );

  assert.equal(exit_code, 0);
  assert.equal(requests[0].headers.get("authorization"), "Bearer test_token");
  assert.deepEqual(await requests[0].json(), {
    nucleusId: "tenant_demo",
    tenantId: "tenant_demo",
    scopeId: "user:derek",
    type: "preference",
    text: "prefers short updates",
    privacyClass: "tenant",
  });
  assert.match(output[0], /mem_1/);
});

test("missing API URL exits with an error", async () => {
  const errors = [];
  const exit_code = await runCli(["health"], {}, { stderr: (value) => errors.push(value) });

  assert.equal(exit_code, 1);
  assert.equal(errors[0], "NEUTRON_API_URL is required");
});

test("import-obsidian reads a local vault and remembers supported files", async () => {
  const vault = await mkdtemp(path.join(os.tmpdir(), "neutron-obsidian-"));
  try {
    await mkdir(path.join(vault, "Projects"), { recursive: true });
    await mkdir(path.join(vault, ".obsidian"), { recursive: true });
    await writeFile(path.join(vault, "Projects", "Neutron.md"), "# Neutron\nRemember [[Architecture]].\n#agent-memory\n", "utf8");
    await writeFile(path.join(vault, "Map.canvas"), JSON.stringify({ nodes: [{ id: "a", type: "text", text: "Canvas memory" }] }), "utf8");
    await writeFile(path.join(vault, ".obsidian", "workspace.json"), "{}", "utf8");

    const requests = [];
    const output = [];
    const exit_code = await runCli(
      ["import-obsidian", "--vault", vault, "--scope", "kb:obsidian", "--privacy-class", "user_private"],
      {
        NEUTRON_API_URL: "https://api.example.test",
        NEUTRON_API_TOKEN: "test_token",
        NEUTRON_NUCLEUS_ID: "tenant_demo",
      },
      {
        stdout: (value) => output.push(value),
        fetchImpl: async (input, init) => {
          requests.push(new Request(input, init));
          return Response.json({
            memoryId: `mem_${requests.length}`,
            tenantId: "tenant_demo",
            nucleusId: "tenant_demo",
            scopeId: "kb:obsidian",
            namespace: "default",
            accepted: true,
            queued: false,
            vectorId: `vec_${requests.length}`,
            warnings: [],
          });
        },
      },
    );

    assert.equal(exit_code, 0);
    assert.equal(requests.length, 2);
    assert.deepEqual(
      requests.map((request) => request.url),
      ["https://api.example.test/v1/memory/remember", "https://api.example.test/v1/memory/remember"],
    );
    const first_body = await requests[0].json();
    assert.equal(first_body.nucleusId, "tenant_demo");
    assert.equal(first_body.scopeId, "kb:obsidian");
    assert.equal(first_body.privacyClass, "user_private");
    assert.equal(first_body.metadata.source, "obsidian");
    assert.ok(["Map.canvas", "Projects/Neutron.md"].includes(first_body.metadata.path));

    const summary = JSON.parse(output[0]);
    assert.equal(summary.source, "obsidian");
    assert.equal(summary.stats.importedFiles, 2);
    assert.equal(summary.accepted, 2);
    assert.deepEqual(summary.memoryIds, ["mem_1", "mem_2"]);
    assert.equal(JSON.stringify(summary).includes("Remember [[Architecture]]"), false);
  } finally {
    await rm(vault, { recursive: true, force: true });
  }
});

test("import-obsidian dry-run does not require API credentials", async () => {
  const vault = await mkdtemp(path.join(os.tmpdir(), "neutron-obsidian-dry-"));
  try {
    await writeFile(path.join(vault, "Readme.md"), "# Readme\nDry run.", "utf8");
    const output = [];
    const exit_code = await runCli(["import-obsidian", "--vault", vault, "--scope", "kb:obsidian", "--dry-run"], {}, { stdout: (value) => output.push(value) });

    assert.equal(exit_code, 0);
    const summary = JSON.parse(output[0]);
    assert.equal(summary.dryRun, true);
    assert.equal(summary.stats.rememberRequests, 1);
  } finally {
    await rm(vault, { recursive: true, force: true });
  }
});
