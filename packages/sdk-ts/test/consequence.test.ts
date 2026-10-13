import { describe, expect, it } from "vitest";
import { NeutronAIClient } from "../src";

describe("NeutronAIClient consequence APIs", () => {
  it("scopes consequence mutations and reads to the configured Nucleus", async () => {
    const requests: Request[] = [];
    const client = new NeutronAIClient({
      baseUrl: "https://api.example.test/",
      token: "sdk-token",
      nucleusId: "nucleus_demo",
      fetchImpl: async (input, init) => {
        requests.push(new Request(input, init));
        return Response.json({
          runId: "crun_1",
          runs: [],
          decisions: [],
          evals: [],
          safeArtifactsOnly: true,
        });
      },
    });

    await client.consequencePlan({
      scopeIds: ["repo:root"],
      task: "Compare safe delivery options",
    });
    await client.consequenceSimulate({
      runId: "crun_1",
      policy: { depth: 10 },
    });
    await client.getConsequenceRun("crun_1", { scopeIds: ["repo:root"] });
    await client.listConsequenceRuns({ scopeIds: ["repo:root"], status: "completed", limit: 5 });
    await client.listDecisionRecords({ scopeIds: ["repo:root"], limit: 5 });
    await client.listConsequenceEvals({ limit: 5 });
    await client.runConsequenceEval({ datasetId: "fixtures_v1" });
    await client.consequenceApprove({
      decisionId: "decision_1",
      scopeIds: ["repo:root"],
      externalProvenance: {
        sourceSystem: "buildrr",
        externalApprovalId: "approval_1",
        approvedByExternalUserId: "actor_1",
        approvedAt: 1_754_000_000_000,
        attestationDigest: `sha256:${"a".repeat(64)}`,
      },
    });
    await client.deleteConsequenceRun({
      runId: "crun_1",
      scopeIds: ["repo:root"],
      reason: "fixture_cleanup",
    });
    await client.deleteConsequenceRuns({
      userId: "user_1",
      reason: "account_closed",
    });

    expect(
      requests.map(
        (request) =>
          `${request.method} ${new URL(request.url).pathname}${new URL(request.url).search}`,
      ),
    ).toEqual([
      "POST /v1/consequence/plan",
      "POST /v1/consequence/simulate",
      "GET /v1/consequence/runs/crun_1?nucleusId=nucleus_demo&scopeId=repo%3Aroot",
      "GET /v1/consequence/runs?nucleusId=nucleus_demo&status=completed&limit=5&scopeId=repo%3Aroot",
      "GET /v1/consequence/decisions?nucleusId=nucleus_demo&limit=5&scopeId=repo%3Aroot",
      "GET /v1/consequence/evals?nucleusId=nucleus_demo&limit=5",
      "POST /v1/consequence/evals/run",
      "POST /v1/consequence/approve",
      "POST /v1/consequence/delete",
      "POST /v1/consequence/delete-scoped",
    ]);
    expect(requests.every((request) => request.headers.get("authorization") === "Bearer sdk-token")).toBe(true);
    expect(await requests[0]?.json()).toMatchObject({
      nucleusId: "nucleus_demo",
      tenantId: "nucleus_demo",
      scopeIds: ["repo:root"],
    });
    expect(await requests[1]?.json()).toMatchObject({
      nucleusId: "nucleus_demo",
      runId: "crun_1",
      policy: { depth: 10 },
    });
    expect(await requests[6]?.json()).toMatchObject({
      nucleusId: "nucleus_demo",
      datasetId: "fixtures_v1",
    });
    expect(await requests[7]?.json()).toMatchObject({
      nucleusId: "nucleus_demo",
      decisionId: "decision_1",
      scopeIds: ["repo:root"],
      externalProvenance: {
        sourceSystem: "buildrr",
        externalApprovalId: "approval_1",
        approvedByExternalUserId: "actor_1",
        attestationDigest: `sha256:${"a".repeat(64)}`,
      },
    });
    expect(await requests[8]?.json()).toMatchObject({
      nucleusId: "nucleus_demo",
      runId: "crun_1",
      scopeIds: ["repo:root"],
      reason: "fixture_cleanup",
    });
    expect(await requests[9]?.json()).toMatchObject({
      nucleusId: "nucleus_demo",
      userId: "user_1",
      reason: "account_closed",
    });
  });
});
