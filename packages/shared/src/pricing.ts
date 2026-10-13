export type NeutronPlanId = "free" | "developer" | "pro" | "enterprise";

export interface NeutronPricingPlan {
  planId: NeutronPlanId;
  name: string;
  monthlyPriceUsdCents: number;
  annualPriceUsdCents?: number;
  standardMonthlyPriceUsdCents?: number;
  standardAnnualPriceUsdCents?: number;
  promotion?: NeutronPricingPromotion;
  annualAnchorUsdCents?: number;
  includedMemoryOps: number;
  includedMemoryMb: number;
  includedProjects: number | "custom" | "sandbox";
  overageMemoryOpsUsdCentsPerMillion: number;
  overageMemoryGbUsdCents: number;
  includedCreditsUsdCents: number;
  creditExpirationDays: number;
  allowOverage: boolean;
  isSelfServe: boolean;
  isEnterpriseCustom: boolean;
  isPublic: boolean;
  features: string[];
  checkoutLabel: string;
  bestFor: string;
}

export interface NeutronPricingPromotion {
  endsOn: string;
}

export interface PrepaidCreditPack {
  packId: "starter" | "growth" | "scale";
  name: string;
  purchaseUsdCents: number;
  creditUsdCents: number;
  expiresAfterDays: number;
}

export interface BalloonDiscountTier {
  tierId: string;
  annualCommitUsdCents: number;
  discountBasisPoints: number | null;
  label: string;
}

export const neutron_pricing_plan_ids = ["free", "developer", "pro", "enterprise"] as const satisfies readonly NeutronPlanId[];
export const neutron_usage_rate_usd_cents_per_million = 9_900;
export const neutron_launch_promotion = {
  endsOn: "2027-01-01",
} as const satisfies NeutronPricingPromotion;

export const neutron_pricing_plans: NeutronPricingPlan[] = [
  {
    planId: "free",
    name: "Free",
    monthlyPriceUsdCents: 0,
    includedMemoryOps: 50_000,
    includedMemoryMb: 256,
    includedProjects: "sandbox",
    overageMemoryOpsUsdCentsPerMillion: neutron_usage_rate_usd_cents_per_million,
    overageMemoryGbUsdCents: 0,
    includedCreditsUsdCents: 0,
    creditExpirationDays: 0,
    allowOverage: true,
    isSelfServe: true,
    isEnterpriseCustom: false,
    isPublic: true,
    features: ["50k memory operations per month", "256 MB retained memory", "SDKs, CLI, REST, and MCP", "Basic usage analytics", "Community support"],
    checkoutLabel: "Start free",
    bestFor: "Local testing, prototypes, and SDK/MCP evaluation.",
  },
  {
    planId: "developer",
    name: "Developer",
    monthlyPriceUsdCents: 2_900,
    annualPriceUsdCents: 34_800,
    standardMonthlyPriceUsdCents: 4_900,
    standardAnnualPriceUsdCents: 58_800,
    promotion: neutron_launch_promotion,
    includedMemoryOps: 500_000,
    includedMemoryMb: 2_048,
    includedProjects: 3,
    overageMemoryOpsUsdCentsPerMillion: neutron_usage_rate_usd_cents_per_million,
    overageMemoryGbUsdCents: 0,
    includedCreditsUsdCents: 0,
    creditExpirationDays: 365,
    allowOverage: true,
    isSelfServe: true,
    isEnterpriseCustom: false,
    isPublic: true,
    features: ["500k memory operations per month", "2 GB retained memory", "3 projects", "Context cache included", "Email support"],
    checkoutLabel: "Start developer",
    bestFor: "Early builders moving from prototype to first production workload.",
  },
  {
    planId: "pro",
    name: "Pro",
    monthlyPriceUsdCents: 14_900,
    annualPriceUsdCents: 178_800,
    standardMonthlyPriceUsdCents: 29_900,
    standardAnnualPriceUsdCents: 358_800,
    promotion: neutron_launch_promotion,
    includedMemoryOps: 4_000_000,
    includedMemoryMb: 20_480,
    includedProjects: 15,
    overageMemoryOpsUsdCentsPerMillion: neutron_usage_rate_usd_cents_per_million,
    overageMemoryGbUsdCents: 0,
    includedCreditsUsdCents: 0,
    creditExpirationDays: 365,
    allowOverage: true,
    isSelfServe: true,
    isEnterpriseCustom: false,
    isPublic: true,
    features: [
      "4M memory operations per month",
      "20 GB retained memory",
      "15 projects",
      "Admin seats bundled",
      "Audit exports and custom retention controls",
    ],
    checkoutLabel: "Start pro",
    bestFor: "Teams shipping agent memory into customer-facing products.",
  },
  {
    planId: "enterprise",
    name: "Enterprise",
    monthlyPriceUsdCents: 0,
    annualAnchorUsdCents: 250_000,
    includedMemoryOps: 0,
    includedMemoryMb: 0,
    includedProjects: "custom",
    overageMemoryOpsUsdCentsPerMillion: 0,
    overageMemoryGbUsdCents: 0,
    includedCreditsUsdCents: 0,
    creditExpirationDays: 0,
    allowOverage: true,
    isSelfServe: false,
    isEnterpriseCustom: true,
    isPublic: true,
    features: [
      "Custom included operations and memory",
      "Regions, SLAs, SSO/SAML, and compliance contracts",
      "Dedicated support",
      "Negotiated overages",
      "Custom annual contracts and Stripe prices",
    ],
    checkoutLabel: "Contact sales",
    bestFor: "Regulated, high-scale, and dedicated deployment requirements.",
  },
];

export const neutron_prepaid_credit_packs: PrepaidCreditPack[] = [
  { packId: "starter", name: "Starter", purchaseUsdCents: 10_000, creditUsdCents: 10_000, expiresAfterDays: 365 },
  { packId: "growth", name: "Growth", purchaseUsdCents: 50_000, creditUsdCents: 50_000, expiresAfterDays: 365 },
  { packId: "scale", name: "Scale", purchaseUsdCents: 200_000, creditUsdCents: 200_000, expiresAfterDays: 365 },
];

export const neutron_balloon_discount_tiers: BalloonDiscountTier[] = [
  { tierId: "commit_5k", annualCommitUsdCents: 500_000, discountBasisPoints: 1_000, label: "$5k annual commit" },
  { tierId: "commit_15k", annualCommitUsdCents: 1_500_000, discountBasisPoints: 1_500, label: "$15k annual commit" },
  { tierId: "commit_50k", annualCommitUsdCents: 5_000_000, discountBasisPoints: 2_200, label: "$50k annual commit" },
  { tierId: "commit_100k", annualCommitUsdCents: 10_000_000, discountBasisPoints: null, label: "$100k+ annual commit" },
];

export function getNeutronPricingPlan(plan_id: string): NeutronPricingPlan | undefined {
  return neutron_pricing_plans.find((plan) => plan.planId === plan_id);
}

export function calculateBalloonDiscount(input: {
  annualCommitUsdCents: number;
  enterpriseCustom?: boolean | undefined;
}): {
  eligible: boolean;
  tierId?: string | undefined;
  discountBasisPoints: number | null;
  discountUsdCents: number;
  netUsdCents: number;
} {
  const annual_commit = Math.max(0, Math.floor(input.annualCommitUsdCents));
  const matching_tiers = neutron_balloon_discount_tiers
    .filter((tier) => annual_commit >= tier.annualCommitUsdCents)
    .sort((left, right) => right.annualCommitUsdCents - left.annualCommitUsdCents);
  const tier = matching_tiers[0];

  if (!tier || (!input.enterpriseCustom && annual_commit < tier.annualCommitUsdCents)) {
    return {
      eligible: false,
      discountBasisPoints: 0,
      discountUsdCents: 0,
      netUsdCents: annual_commit,
    };
  }

  if (tier.discountBasisPoints === null) {
    return {
      eligible: true,
      tierId: tier.tierId,
      discountBasisPoints: null,
      discountUsdCents: 0,
      netUsdCents: annual_commit,
    };
  }

  const discount_usd_cents = Math.floor((annual_commit * tier.discountBasisPoints) / 10_000);
  return {
    eligible: true,
    tierId: tier.tierId,
    discountBasisPoints: tier.discountBasisPoints,
    discountUsdCents: discount_usd_cents,
    netUsdCents: annual_commit - discount_usd_cents,
  };
}
