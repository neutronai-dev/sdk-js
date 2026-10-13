import type {
  ConsequenceDepth,
  ConsequenceMode,
  SearchStrategy,
} from "@neutron-ai/shared";

export const consequence_depths = [1, 3, 5, 10, 20, 50, 100, 1000] as const satisfies readonly ConsequenceDepth[];
export const consequence_modes = ["quick", "balanced", "deep", "strategic", "exhaustive"] as const satisfies readonly ConsequenceMode[];
export const consequence_search_strategies = [
  "greedy",
  "beam",
  "tree_of_thoughts",
  "monte_carlo",
  "solver_guided",
  "hybrid",
] as const satisfies readonly SearchStrategy[];

export function consequenceDepthRequiresAsync(depth: ConsequenceDepth): boolean {
  return depth >= 50;
}

export function consequenceDepthRequiresExplicitApproval(depth: ConsequenceDepth): boolean {
  return depth === 1000;
}
