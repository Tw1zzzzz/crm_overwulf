import ROUTES from "@/lib/routes";
import { PRODUCT_NAME, PRODUCT_PLAYER_OUTCOMES, PRODUCT_STAFF_OUTCOMES } from "@/lib/productCopy";
import dashboardOverview from "@/assets/crm-guide/dashboard-overview.svg";
import calendarPlanner from "@/assets/crm-guide/calendar-planner.svg";
import dailyCheckin from "@/assets/crm-guide/daily-checkin.svg";
import testsRhythm from "@/assets/crm-guide/tests-rhythm.svg";
import analyticsOverview from "@/assets/crm-guide/analytics-overview.svg";
import playerCardWorkflow from "@/assets/crm-guide/player-card-workflow.svg";

export type GuideAudience = "common" | "player" | "staff";

export type GuideVisual = {
  src: string;
  alt: string;
  caption: string;
  focusLabel: string;
};

export type GuideQuickStartItem = {
  id: string;
  title: string;
  description: string;
};

export type GuideMapCard = {
  id: string;
  title: string;
  description: string;
  href: string;
  audience: "all" | "player" | "staff";
};

export type GuideSection = {
  id: string;
  title: string;
  audience: GuideAudience;
  summary: string;
  steps: string[];
  bullets: string[];
  href: string;
  hrefLabel: string;
  visual: GuideVisual;
};

export type GuideWorkflow = {
  id: string;
  title: string;
  description: string;
  audience: GuideAudience;
  href: string;
  hrefLabel: string;
  steps: string[];
};

export type GuideFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const guideQuickStart: GuideQuickStartItem[] = [
  {
    id: "open-dashboard",
    title: "Open the overview and read the current picture",
    description:
      "Start with the dashboard: it gathers early signals and shows where condition, rhythm, or activity already need attention.",
  },
  {
    id: "fill-daily-signal",
    title: "Update the daily signal",
    description:
      "Sleep, screen time, mood, and tests give the CRM context. The steadier this ritual is, the more useful history and analytics become.",
  },
  {
    id: "go-deeper-by-role",
    title: "Go deeper by your role",
    description:
      "Players move through personal form and their card; staff work through team overview, roster, player cards, and shared team rhythms.",
  },
];

export const guideMapCards: GuideMapCard[] = [
  {
    id: "dashboard",
    title: "Overview",
    description: "The main entry point: a short summary of form, activity, and next actions.",
    href: ROUTES.DASHBOARD,
    audience: "all",
  },
  {
    id: "calendar",
    title: "Calendar",
    description: "A personal and team planner for practice, reviews, meetings, and internal windows.",
    href: ROUTES.CALENDAR,
    audience: "all",
  },
  {
    id: "daily-questionnaire",
    title: "Daily questionnaire",
    description: "A fast recovery ritual: sleep, screen time, and the day's background.",
    href: ROUTES.DAILY_QUESTIONNAIRE,
    audience: "player",
  },
  {
    id: "tests",
    title: "Tests and rhythm",
    description: "Attempt history, weekly cadence, and how results connect to condition.",
    href: ROUTES.TEST_TRACKER,
    audience: "all",
  },
  {
    id: "analytics",
    title: "Statistics and analytics",
    description: "Summary charts, correlations, and game statistics for reading form dynamics.",
    href: ROUTES.STATISTICS,
    audience: "all",
  },
  {
    id: "player-card",
    title: "Player card",
    description: "Player context, signal history, and quick actions without losing working focus.",
    href: ROUTES.PLAYER_CARD,
    audience: "all",
  },
];

export const guideSections: GuideSection[] = [
  {
    id: "overview",
    title: "CRM overview and working rhythm",
    audience: "common",
    summary:
      `${PRODUCT_NAME} works best as one loop: first you collect baseline signals, then move to the form view, and only after that go into narrower tools.`,
    steps: [
      "Start the day with the overview: it shows what changed since the last visit fastest.",
      "Look at the connection between recovery, test rhythm, and game dynamics, not one metric alone.",
      "Use this guide as a product map when you connect a new player or staff role.",
    ],
    bullets: [
      "Works for players and staff",
      "Collects early signals in one place",
      "Helps keep module transitions in order",
    ],
    href: ROUTES.DASHBOARD,
    hrefLabel: "Open overview",
    visual: {
      src: dashboardOverview,
      alt: "Illustration of the main CRM overview with side navigation, widgets, and a working summary.",
      caption: "The main overview should answer what is happening now within a few seconds.",
      focusLabel: "What to watch: top summary, signal cards, and the central working view.",
    },
  },
  {
    id: "calendar",
    title: "Calendar and rhythm planning",
    audience: "common",
    summary:
      "The calendar is not a separate service here; it is a context layer for practice, matches, recovery, and overloaded team windows.",
    steps: [
      "Open the calendar when you need to understand week density before moving into analytics.",
      "Staff use the shared planner to coordinate team slots.",
      "Players keep personal events and weekly rhythm markers here.",
    ],
    bullets: [
      "Personal and team workflows in one module",
      "Helps read workload before analytics",
      "Works as a daily sync point",
    ],
    href: ROUTES.CALENDAR,
    hrefLabel: "Open calendar",
    visual: {
      src: calendarPlanner,
      alt: "Illustration of the CRM calendar with side filters and a weekly event grid.",
      caption: "The planner is useful when work schedule and form reading need to stay in one rhythm.",
      focusLabel: "What to watch: weekly grid, event density, and slot color accents.",
    },
  },
  {
    id: "daily-routine",
    title: "Daily questionnaire and recovery background",
    audience: "player",
    summary:
      "This section captures the day's baseline background. Even a short check-in gives the CRM more value than rare long weekly reports.",
    steps: [
      "Update sleep and screen time first so the system sees context before tests.",
      "Fill the block in the same part of the day so history stays comparable.",
      "If there is no energy for full analytics, the questionnaire remains the fastest useful action.",
    ],
    bullets: [
      "Personal ritual without extra navigation",
      "Sets the base for interpreting tests",
      "Makes condition history easier to read",
    ],
    href: ROUTES.DAILY_QUESTIONNAIRE,
    hrefLabel: "Open questionnaire",
    visual: {
      src: dailyCheckin,
      alt: "Illustration of the daily questionnaire with sleep, screen time, and signal dynamics.",
      caption: "The questionnaire works as a short condition update before tests and statistics.",
      focusLabel: "What to watch: input form on the left and final signal chart on the right.",
    },
  },
  {
    id: "tests",
    title: "Tests, weekly cadence, and condition link",
    audience: "common",
    summary:
      "The tests section is not only for entering results. It shows how consistently a player or team keeps rhythm and connects numbers to the day's background.",
    steps: [
      "Save the result first, then check history and weekly cadence.",
      "Use period and test-type filters when you need a cleaner view of dynamics.",
      "Staff also read the team summary and see whose rhythm is dropping.",
    ],
    bullets: [
      "Result and context on one screen",
      "Works for manual entry and Brain Lab",
      "Gives rhythm, not only one-off values",
    ],
    href: ROUTES.TEST_TRACKER,
    hrefLabel: "Open tests",
    visual: {
      src: testsRhythm,
      alt: "Illustration of the tests section with side menu, dynamics chart, and team summary.",
      caption: "It is more useful to watch sequence, period, and day background than a single score.",
      focusLabel: "What to watch: test list on the left, dynamics chart, and summary cards on the right.",
    },
  },
  {
    id: "analytics",
    title: "Statistics, correlations, and game view",
    audience: "common",
    summary:
      "Analytics modules are useful once data is already collected. Here you read dynamics, causes, and game metrics without assembling tables by hand.",
    steps: [
      "Go to statistics when you need a period overview, not only the current signal.",
      "Open correlation analysis when you want to understand which factors most often match form growth or drops.",
      "Use game statistics as the bridge between condition and match numbers.",
    ],
    bullets: [
      "Period summary view",
      "Relationship patterns without manual calculations",
      "Game metrics next to condition",
    ],
    href: ROUTES.STATISTICS,
    hrefLabel: "Open statistics",
    visual: {
      src: analyticsOverview,
      alt: "Illustration of the analytics block with several charts and metric comparison.",
      caption: "This layer is for reading dynamics, not as the starting point of the workday.",
      focusLabel: "What to watch: large charts at the top and compact analytics widgets below.",
    },
  },
  {
    id: "player-card",
    title: "Player card and working context",
    audience: "staff",
    summary:
      "For staff, the player card is where context stays intact. Signal history, personal details, and quick actions sit here without jumping between tables.",
    steps: [
      "Open the card after the overview, when it is already clear who needs attention.",
      "Use it as a working dossier: signals, history, notes, and quick player actions.",
      "Do not start the day from cards: first the big picture, then targeted work.",
    ],
    bullets: [
      "Main tool for targeted staff work",
      "Collects player history in one place",
      "Reduces unnecessary CRM navigation",
    ],
    href: ROUTES.PLAYER_CARD,
    hrefLabel: "Open player card",
    visual: {
      src: playerCardWorkflow,
      alt: "Illustration of a player card with profile, signal blocks, and extended context.",
      caption: "The card helps move from the general view to personal work without losing context.",
      focusLabel: "What to watch: player profile on the left and main working blocks on the right.",
    },
  },
];

export const guideWorkflows: GuideWorkflow[] = [
  {
    id: "staff-create-team",
    title: "Staff: create your team and get invite codes",
    description:
      "This workflow is for staff/team profiles. After team creation, the system immediately gives one code for players and one code for staff.",
    audience: "staff",
    href: ROUTES.PROFILE,
    hrefLabel: "Open profile",
    steps: [
      "Open Profile in the side menu.",
      "If you have staff/team access, switch to My team and invite codes.",
      "Enter the team name and press Create team.",
      "After creation, two codes appear below: one for players and one for staff.",
      "Copy the needed code and send it to the people you want to connect to the team.",
    ],
  },
  {
    id: "staff-edit-team",
    title: "Staff: change name, logo, or reissue a code",
    description:
      "Once a team exists, you can manage its branding here and issue a new invite code if needed.",
    audience: "staff",
    href: ROUTES.TEAM_MANAGEMENT,
    hrefLabel: "Open team",
    steps: [
      "Go to Team or open My team and invite codes in Profile.",
      "In My team, select the needed team if you have more than one.",
      "To refresh codes, press New player code or New staff code. Avoid sharing the old code after that.",
      "To change name or logo, open Branding and roster, make edits, and press Save branding.",
      "Check the roster on the right: it shows who is connected and how many seats are used.",
    ],
  },
  {
    id: "player-join-team",
    title: "Player: join a team with a player code",
    description:
      "A player needs the player code from the team owner. A staff code will not work for this path.",
    audience: "player",
    href: ROUTES.PROFILE,
    hrefLabel: "Open profile",
    steps: [
      "Ask staff for the player code for your exact team.",
      "Open Profile and find the Team profile link block.",
      "Paste the player code into the Team code field and press add or update link.",
      "If the system accepts the code, team context connects immediately or asks you to confirm relinking.",
      "After that, switch to the new team profile and open team sections without signing in again.",
    ],
  },
  {
    id: "staff-join-team",
    title: "Staff: join an existing team with a staff code",
    description:
      "This path is for staff who are not creating a new team, but joining an existing one and need team sections.",
    audience: "staff",
    href: ROUTES.PROFILE,
    hrefLabel: "Open profile",
    steps: [
      "Ask the team owner for the staff code.",
      "Open Profile and access, then find the Team profile link block.",
      "Enter the staff code and press the check button.",
      "If another team profile was already linked, the system will show a relink confirmation that must be confirmed separately.",
      "After successful linking, switch to the new staff/team context and open team tools.",
    ],
  },
];

export const guideFaq: GuideFaqItem[] = [
  {
    id: "start-where",
    question: "Which section is best for starting daily work?",
    answer:
      "Almost always the overview. It shows changes in condition, activity, and rhythm fastest. After that, it makes sense to move into tests, calendar, player card, or analytics.",
  },
  {
    id: "player-priority",
    question: "What matters more for a player: questionnaire or tests?",
    answer:
      "If time is short, update the daily background first. Tests are harder to read without it. The ideal rhythm is questionnaire as the base, tests as the next signal layer.",
  },
  {
    id: "staff-priority",
    question: "How can staff avoid getting lost in many sections?",
    answer:
      "Read the CRM in sequence: team overview, rhythm/analytics, then targeted work through player cards and roster. This reduces the chance of diving into details before the big picture is visible.",
  },
];

export const guideRoleHighlights: Record<Exclude<GuideAudience, "common">, string[]> = {
  player: PRODUCT_PLAYER_OUTCOMES,
  staff: PRODUCT_STAFF_OUTCOMES,
};
