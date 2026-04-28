import { TEST_TYPE_METADATA, TestType } from "@/types";

const FALLBACK_TEST_LABEL = "General test";

export const BRAIN_TEST_TYPE_METADATA = {
  visual_search: {
    label: "Visual Search",
    description: "A selective attention and target search speed test."
  },
  go_no_go: {
    label: "Go / No-Go",
    description: "A reaction, self-control, and response inhibition test."
  },
  n_back_2: {
    label: "2-Back",
    description: "A working memory and sequence retention test."
  },
  stroop_switch: {
    label: "Stroop Switch",
    description: "A rule-switching and stimulus conflict resilience test."
  },
  spatial_span: {
    label: "Spatial Span",
    description: "A spatial memory and sequence capacity test."
  }
} as const;

const LEGACY_TEST_TYPE_LABELS: Record<string, { label: string; description: string }> = {
  generic: {
    label: "General test",
    description: "Manual or general test without a specific classification."
  },
  reaction: {
    label: "Reaction",
    description: "A reaction speed test."
  },
  aim: {
    label: "Aim",
    description: "An aiming and hit accuracy test."
  },
  cognitive: {
    label: "Cognitive",
    description: "A cognitive test for attention, memory, or thinking."
  }
};

const INVALID_REASON_COPY: Record<
  string,
  {
    title: string;
    description: string;
  }
> = {
  tab_hidden_over_15_percent: {
    title: "The test window was inactive for too long",
    description:
      "During the attempt, the test tab or window was hidden for more than 15% of the time, so the result is not considered reliable."
  },
  accuracy_below_threshold: {
    title: "Accuracy was below the minimum threshold",
    description:
      "This test had too many errors, so the attempt is not used in the baseline and does not affect the index."
  },
  too_many_fast_responses: {
    title: "Too many unusually fast responses",
    description:
      "The system detected many reactions faster than 120 ms. This usually points to random or premature inputs."
  }
};

export function getReadableTestTypeLabel(testType?: string | null) {
  const normalizedType = (testType || "").trim().toLowerCase();

  if (!normalizedType) {
    return FALLBACK_TEST_LABEL;
  }

  if (normalizedType in BRAIN_TEST_TYPE_METADATA) {
    return BRAIN_TEST_TYPE_METADATA[normalizedType as keyof typeof BRAIN_TEST_TYPE_METADATA].label;
  }

  if (normalizedType in TEST_TYPE_METADATA) {
    return TEST_TYPE_METADATA[normalizedType as TestType].label;
  }

  if (normalizedType in LEGACY_TEST_TYPE_LABELS) {
    return LEGACY_TEST_TYPE_LABELS[normalizedType].label;
  }

  return testType || FALLBACK_TEST_LABEL;
}

export function getReadableTestTypeDescription(testType?: string | null) {
  const normalizedType = (testType || "").trim().toLowerCase();

  if (!normalizedType) {
    return LEGACY_TEST_TYPE_LABELS.generic.description;
  }

  if (normalizedType in BRAIN_TEST_TYPE_METADATA) {
    return BRAIN_TEST_TYPE_METADATA[normalizedType as keyof typeof BRAIN_TEST_TYPE_METADATA].description;
  }

  if (normalizedType in TEST_TYPE_METADATA) {
    return TEST_TYPE_METADATA[normalizedType as TestType].description;
  }

  if (normalizedType in LEGACY_TEST_TYPE_LABELS) {
    return LEGACY_TEST_TYPE_LABELS[normalizedType].description;
  }

  return LEGACY_TEST_TYPE_LABELS.generic.description;
}

export function getReadableInvalidReason(reason?: string | null) {
  const normalizedReason = (reason || "").trim().toLowerCase();

  if (!normalizedReason) {
    return {
      title: "Attempt excluded from the index",
      description: "The system marked this attempt as unreliable and does not use it in the baseline."
    };
  }

  if (normalizedReason in INVALID_REASON_COPY) {
    return INVALID_REASON_COPY[normalizedReason];
  }

  return {
    title: "Attempt excluded from the index",
    description: reason || "The system marked this attempt as unreliable."
  };
}
