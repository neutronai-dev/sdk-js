import { describe, expect, it } from "vitest";
import { calculateBalloonDiscount, neutron_prepaid_credit_packs, neutron_pricing_plans } from "../src/pricing";

describe("pricing defaults", () => {
  it("defines the four public Neutron AI plans", () => {
    expect(neutron_pricing_plans.map((plan) => plan.planId)).toEqual(["free", "developer", "pro", "enterprise"]);
    expect(neutron_pricing_plans.find((plan) => plan.planId === "free")).toMatchObject({
      monthlyPriceUsdCents: 0,
      includedMemoryOps: 50_000,
      includedMemoryMb: 256,
      overageMemoryOpsUsdCentsPerMillion: 9_900,
      allowOverage: true,
    });
    expect(neutron_pricing_plans.find((plan) => plan.planId === "developer")).toMatchObject({
      monthlyPriceUsdCents: 2_900,
      annualPriceUsdCents: 34_800,
      standardMonthlyPriceUsdCents: 4_900,
      standardAnnualPriceUsdCents: 58_800,
      promotion: { endsOn: "2027-01-01" },
      includedMemoryOps: 500_000,
      overageMemoryOpsUsdCentsPerMillion: 9_900,
      allowOverage: true,
    });
    expect(neutron_pricing_plans.find((plan) => plan.planId === "pro")).toMatchObject({
      monthlyPriceUsdCents: 14_900,
      annualPriceUsdCents: 178_800,
      standardMonthlyPriceUsdCents: 29_900,
      standardAnnualPriceUsdCents: 358_800,
      promotion: { endsOn: "2027-01-01" },
      includedMemoryOps: 4_000_000,
      overageMemoryOpsUsdCentsPerMillion: 9_900,
      allowOverage: true,
    });
    expect(neutron_pricing_plans.find((plan) => plan.planId === "enterprise")).toMatchObject({
      isSelfServe: false,
      isEnterpriseCustom: true,
      annualAnchorUsdCents: 250_000,
    });

    expect(neutron_pricing_plans.find((plan) => plan.planId === "developer")?.standardMonthlyPriceUsdCents)
      .toBeGreaterThan(neutron_pricing_plans.find((plan) => plan.planId === "developer")?.monthlyPriceUsdCents ?? 0);
    expect(neutron_pricing_plans.find((plan) => plan.planId === "pro")?.standardMonthlyPriceUsdCents)
      .toBeGreaterThan(neutron_pricing_plans.find((plan) => plan.planId === "pro")?.monthlyPriceUsdCents ?? 0);
  });

  it("defines prepaid credit packs without discounting operation usage", () => {
    expect(neutron_prepaid_credit_packs).toEqual([
      expect.objectContaining({ packId: "starter", purchaseUsdCents: 10_000, creditUsdCents: 10_000 }),
      expect.objectContaining({ packId: "growth", purchaseUsdCents: 50_000, creditUsdCents: 50_000 }),
      expect.objectContaining({ packId: "scale", purchaseUsdCents: 200_000, creditUsdCents: 200_000 }),
    ]);
  });
});

describe("balloon discounts", () => {
  it("calculates deterministic annual commit discounts", () => {
    expect(calculateBalloonDiscount({ annualCommitUsdCents: 499_999 })).toMatchObject({
      eligible: false,
      discountUsdCents: 0,
      netUsdCents: 499_999,
    });
    expect(calculateBalloonDiscount({ annualCommitUsdCents: 500_000 })).toMatchObject({
      eligible: true,
      tierId: "commit_5k",
      discountBasisPoints: 1_000,
      discountUsdCents: 50_000,
      netUsdCents: 450_000,
    });
    expect(calculateBalloonDiscount({ annualCommitUsdCents: 1_500_000 })).toMatchObject({
      eligible: true,
      tierId: "commit_15k",
      discountBasisPoints: 1_500,
      discountUsdCents: 225_000,
      netUsdCents: 1_275_000,
    });
    expect(calculateBalloonDiscount({ annualCommitUsdCents: 10_000_000 })).toMatchObject({
      eligible: true,
      tierId: "commit_100k",
      discountBasisPoints: null,
      discountUsdCents: 0,
      netUsdCents: 10_000_000,
    });
  });
});
