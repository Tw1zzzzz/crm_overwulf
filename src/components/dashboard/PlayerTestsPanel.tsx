import { Brain, ClipboardList, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { COLORS } from "@/styles/theme";

type PlayerTestsPanelProps = {
  hasResultsAccess: boolean;
  onOpenBrainLab: () => void;
  onOpenWeeklyTests: () => void;
};

export default function PlayerTestsPanel({
  hasResultsAccess,
  onOpenBrainLab,
  onOpenWeeklyTests
}: PlayerTestsPanelProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card
        className="rounded-[28px] border"
        style={{
          background: "linear-gradient(150deg, rgba(34, 211, 238, 0.14), rgba(15, 23, 42, 0.96) 70%)",
          borderColor: "rgba(34, 211, 238, 0.18)"
        }}
      >
        <CardHeader>
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
            <Brain className="h-5 w-5" />
          </div>
          <CardTitle className="mt-4 text-2xl" style={{ color: COLORS.textColor }}>
            Brain Lab
          </CardTitle>
          <CardDescription className="text-sm leading-7" style={{ color: COLORS.textColorSecondary }}>
            Open the live cognitive form battery to complete attention, reaction, memory, and switching tasks.
            {!hasResultsAccess ? " Full history and indexes open after purchasing a plan." : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="rounded-2xl" style={{ backgroundColor: COLORS.primary, color: "white" }} onClick={onOpenBrainLab}>
            Go to Brain Lab
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <Card
        className="rounded-[28px] border"
        style={{
          background: "linear-gradient(150deg, rgba(16, 185, 129, 0.14), rgba(15, 23, 42, 0.96) 70%)",
          borderColor: "rgba(16, 185, 129, 0.18)"
        }}
      >
        <CardHeader>
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
            <ClipboardList className="h-5 w-5" />
          </div>
          <CardTitle className="mt-4 text-2xl" style={{ color: COLORS.textColor }}>
            Test log
          </CardTitle>
          <CardDescription className="text-sm leading-7" style={{ color: COLORS.textColorSecondary }}>
            Jump into the weekly loop, add a result, or continue reviewing saved attempts.
            {!hasResultsAccess ? " Attempts can be saved for free; detailed analytics open after purchase." : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="rounded-2xl"
            style={{ borderColor: COLORS.borderColor, color: COLORS.textColor }}
            onClick={onOpenWeeklyTests}
          >
            Open тесты
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
