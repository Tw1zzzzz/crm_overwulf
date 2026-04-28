import type {
  BaselineRole,
  BaselineRoundStrength,
  BaselineSidePreference
} from "@/types";

export type BaselineQuestionOption = {
  id: string;
  label: string;
};

export type BaselineQuestion = {
  id: string;
  prompt: string;
  options: BaselineQuestionOption[];
};

export const BASELINE_PERSONALITY_QUESTIONS: BaselineQuestion[] = [
  {
    id: "personality_prep",
    prompt: "Before an important match, what helps you get into your working rhythm fastest?",
    options: [
      { id: "prep_action", label: "I need movement and a fast ramp-up through activity." },
      { id: "prep_team_sync", label: "I sync with the team first and align on key points." },
      { id: "prep_structure", label: "A calm plan and clear structure work best for me." },
      { id: "prep_calm", label: "I try to settle my head and avoid overloading emotions." }
    ]
  },
  {
    id: "personality_info",
    prompt: "When a round has a lot of incomplete information, you usually:",
    options: [
      { id: "info_push", label: "Take initiative quickly and claim space." },
      { id: "info_call", label: "Gather info through the team and agree on a shared action." },
      { id: "info_model", label: "Build probabilities and choose the most logical scenario." },
      { id: "info_patience", label: "Hold the pause and wait for better timing instead of forcing." }
    ]
  },
  {
    id: "personality_comms",
    prompt: "Which communication style feels closest to you in a tense game?",
    options: [
      { id: "comms_sharp", label: "Short, sharp, and direct to keep the tempo." },
      { id: "comms_guiding", label: "Calmly guide the team and keep everyone aligned." },
      { id: "comms_precise", label: "Precise and structured, with no extra words." },
      { id: "comms_stable", label: "Keep a steady tone so the team's emotions do not swing." }
    ]
  },
  {
    id: "personality_shift",
    prompt: "If the plan breaks, you usually:",
    options: [
      { id: "shift_force", label: "Rebuild immediately through aggression and a new tempo." },
      { id: "shift_sync", label: "Make sure everyone understands the new plan at the same time." },
      { id: "shift_reframe", label: "Quickly rebuild the decision from the new conditions." },
      { id: "shift_compose", label: "Stabilize first, then act." }
    ]
  },
  {
    id: "personality_pressure",
    prompt: "What usually gets stronger for you in a clutch situation?",
    options: [
      { id: "pressure_instinct", label: "Tempo sense and the courage to take a fast risk." },
      { id: "pressure_comms", label: "Clear communication and keeping the team connected." },
      { id: "pressure_read", label: "Reading the opponent and calculating probabilities." },
      { id: "pressure_calm", label: "A cool head and emotional control." }
    ]
  },
  {
    id: "personality_value",
    prompt: "At your best, what do you give the team most of all?",
    options: [
      { id: "value_drive", label: "Acceleration, momentum, and the feeling that we can press." },
      { id: "value_glue", label: "Connection, trust, and a shared team shape." },
      { id: "value_clarity", label: "Decision clarity and structure in difficult moments." },
      { id: "value_stability", label: "Calm and stability under load." }
    ]
  }
];

export const BASELINE_ROLE_OPTIONS: BaselineRole[] = [
  "IGL",
  "AWPer",
  "Entry",
  "Support",
  "Lurker",
  "Anchor",
  "Flex"
];

export const BASELINE_SIDE_OPTIONS: BaselineSidePreference[] = ["T-side", "CT-side", "Balanced"];
export const BASELINE_ROUND_STRENGTH_OPTIONS: BaselineRoundStrength[] = [
  "Openings",
  "Mid-round",
  "Clutches",
  "Support protocols"
];
