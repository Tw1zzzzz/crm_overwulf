export const PRODUCT_BRAND_NAME = "Atlant Technology";
export const PRODUCT_NAME = "Performance CRM";
export const PRODUCT_DESCRIPTOR =
  "A platform for monitoring esports player and team condition, rhythm, and performance";

export const PRODUCT_PLAYER_OUTCOMES = [
  "Understand your current condition and notice form drops before they affect your game.",
  "Track recovery, tests, and game signals in one working rhythm.",
  "Get clear prompts for what to do today to protect your form.",
];

export const PRODUCT_STAFF_OUTCOMES = [
  "See the team picture and quickly find players who need attention.",
  "Catch risk signals across recovery, form, and game rhythm without manual data collection.",
  "Make faster decisions on roster, workload, and daily player work.",
];

export const PRODUCT_PLAYER_JOURNEY = [
  "Create an account and land in a clear first-run flow.",
  "Fill in a quick profile, daily recovery check, and first tests.",
  "Get a basic form signal right away, then unlock deeper analytics when needed.",
];

export const PRODUCT_STAFF_JOURNEY = [
  "Connect a team and open the overview of roster condition and activity.",
  "See whose recovery, test rhythm, or game dynamics are dropping.",
  "Move to roster, player cards, and access settings only when they are actually needed.",
];

export type ProductPlanPresentation = {
  audience: string;
  outcome: string;
  preview: string;
  unlockLabel: string;
};

const DEFAULT_PLAN_PRESENTATION: ProductPlanPresentation = {
  audience: "For players and staff",
  outcome: "Gives a deeper view of condition, results, and team dynamics.",
  preview: "Before payment, the basic overview and early signals stay visible so the value is clear.",
  unlockLabel: "What unlocks",
};

export const getPlanPresentation = (planName: string): ProductPlanPresentation => {
  if (planName.startsWith("PerformanceCoach CRM")) {
    return {
      audience: "For players and staff who need the full working loop",
      outcome:
        "Shows the player baseline profile, recovery history, test signals, and deeper form interpretation.",
      preview:
        "Before purchase, users see the basic summary and first signals; after payment, full interpretation and history open up.",
      unlockLabel: "What you get after payment",
    };
  }

  if (planName.startsWith("Correlation analysis")) {
    return {
      audience: "For users who want to understand what affects form the most",
      outcome:
        "Shows which condition factors are most strongly connected with form growth or drops.",
      preview:
        "Before payment, users see basic dynamics; this unlocks relationship patterns and deeper factor analysis.",
      unlockLabel: "What opens deeper",
    };
  }

  if (planName.startsWith("Game statistics")) {
    return {
      audience: "For staff and players who need a match metrics workspace",
      outcome:
        "Collects game indicators into one clear table so strengths and weak spots are easier to read by period.",
      preview:
        "Before payment, limited form context remains; after purchase, tables, filters, and the full game metrics view open up.",
      unlockLabel: "What becomes available",
    };
  }

  return DEFAULT_PLAN_PRESENTATION;
};
