import { CheckCheck, ClipboardList, Link2, MoonStar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { COLORS } from "@/styles/theme";
import { PRODUCT_NAME } from "@/lib/productCopy";

type PlayerQuickStartPanelProps = {
  baselineAssessmentCompleted: boolean;
  sleepDoneToday: boolean;
  testsDone: boolean;
  hasResultsAccess: boolean;
  onOpenBaselineAssessment: () => void;
  onOpenSleepTab: () => void;
  onOpenTests: () => void;
  onOpenFaceitProfile: () => void;
};

const checklistCard = {
  backgroundColor: COLORS.cardBackground,
  borderColor: COLORS.borderColor,
  boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)"
};

export default function PlayerQuickStartPanel({
  baselineAssessmentCompleted,
  sleepDoneToday,
  testsDone,
  hasResultsAccess,
  onOpenBaselineAssessment,
  onOpenSleepTab,
  onOpenTests,
  onOpenFaceitProfile
}: PlayerQuickStartPanelProps) {
  const items = [
    {
      title: "Complete your baseline profile",
      description: baselineAssessmentCompleted
        ? hasResultsAccess
          ? "Your player profile is ready and visible in your card."
          : "Your answers are saved. The full interpretation unlocks with a plan."
        : "Answer a short onboarding test so CRM can understand your play style and role.",
      done: baselineAssessmentCompleted,
      action: onOpenBaselineAssessment,
      actionLabel: baselineAssessmentCompleted ? "Open profile" : "Start test"
    },
    {
      title: "Log sleep and screen time",
      description: sleepDoneToday
        ? hasResultsAccess
          ? "Today's recovery check-in is already saved."
          : "Today's recovery check-in is saved. Full history unlocks with a plan."
        : "Add your recovery context early so today's signals are easier to read.",
      done: sleepDoneToday,
      action: onOpenSleepTab,
      actionLabel: "Open check-in"
    },
    {
      title: "Run your first test",
      description: testsDone
        ? hasResultsAccess
          ? "Your test history has started. Keep the rhythm going."
          : "Your tests are saved. History and analytics unlock with a plan."
        : "Start Brain Lab or add a manual test so CRM has a baseline for your form.",
      done: testsDone,
      action: onOpenTests,
      actionLabel: "Open tests"
    },
    {
      title: "Connect FACEIT",
      description: "Link your FACEIT profile so CRM can pull match statistics and compare them with recovery, mood, and test data.",
      done: false,
      action: onOpenFaceitProfile,
      actionLabel: "Connect FACEIT"
    }
  ];

  return (
    <div className="space-y-5">
      <section
        className="rounded-[28px] border p-5 md:p-6"
        style={{
          background: "linear-gradient(145deg, rgba(53, 144, 255, 0.14), rgba(17, 24, 39, 0.96) 68%)",
          borderColor: "rgba(96, 165, 250, 0.2)"
        }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" />
              First run
            </div>
            <h3 className="mt-4 text-2xl font-semibold" style={{ color: COLORS.textColor }}>
              Quick start without extra friction
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-7" style={{ color: COLORS.textColorSecondary }}>
              Start with the essentials: onboarding profile, recovery check-in, FACEIT link, and first tests.
            </p>
            {!hasResultsAccess && (
              <p className="mt-2 max-w-2xl text-sm leading-7" style={{ color: "#B6F0FF" }}>
                The core flow is free. Deeper interpretation and full history unlock with a {PRODUCT_NAME} plan.
              </p>
            )}
          </div>
          <div className="rounded-[20px] border px-4 py-3" style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)" }}>
            <div className="text-[11px] uppercase tracking-[0.2em]" style={{ color: COLORS.textColorSecondary }}>
              Start progress
            </div>
            <div className="mt-1 text-2xl font-semibold" style={{ color: COLORS.textColor }}>
              {items.filter((item) => item.done).length}/{items.length}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-4">
        {items.map((item, index) => (
          <Card key={item.title} style={checklistCard} className="rounded-[24px]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border" style={{ borderColor: item.done ? "rgba(16,185,129,0.24)" : "rgba(96,165,250,0.24)", backgroundColor: item.done ? "rgba(16,185,129,0.12)" : "rgba(53,144,255,0.12)", color: item.done ? "#7EF3D1" : COLORS.primary }}>
                  {index === 0 ? <ClipboardList className="h-5 w-5" /> : index === 1 ? <MoonStar className="h-5 w-5" /> : index === 2 ? <CheckCheck className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: item.done ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)",
                    color: item.done ? "#7EF3D1" : COLORS.textColorSecondary
                  }}
                >
                  {item.done ? "Done" : "Next"}
                </span>
              </div>
              <CardTitle className="text-lg" style={{ color: COLORS.textColor }}>{item.title}</CardTitle>
              <CardDescription className="text-sm leading-7" style={{ color: COLORS.textColorSecondary }}>
                {item.description}
              </CardDescription>
            </CardHeader>
            {item.action && (
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full rounded-2xl"
                  style={{ borderColor: COLORS.borderColor, color: COLORS.textColor }}
                  onClick={item.action}
                >
                  {item.actionLabel}
                </Button>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
