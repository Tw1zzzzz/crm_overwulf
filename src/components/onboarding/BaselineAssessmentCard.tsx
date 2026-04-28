import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BrainCircuit, CheckCheck, ShieldCheck, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { submitBaselineAssessment } from "@/lib/api";
import {
  BASELINE_PERSONALITY_QUESTIONS,
  BASELINE_ROLE_OPTIONS,
  BASELINE_ROUND_STRENGTH_OPTIONS,
  BASELINE_SIDE_OPTIONS
} from "@/lib/baselineAssessment";
import ROUTES from "@/lib/routes";
import { COLORS } from "@/styles/theme";
import { PRODUCT_NAME } from "@/lib/productCopy";
import type { BaselineAssessment, BaselineRole } from "@/types";

type BaselineAssessmentCardProps = {
  initialAssessment?: BaselineAssessment | null;
  hasFullAccess?: boolean;
  onCompleted?: (assessment?: BaselineAssessment | null) => void | Promise<void>;
};

const selectStyle = {
  backgroundColor: "rgba(255,255,255,0.03)",
  borderColor: COLORS.borderColor,
  color: COLORS.textColor
};

export default function BaselineAssessmentCard({
  initialAssessment,
  hasFullAccess = true,
  onCompleted
}: BaselineAssessmentCardProps) {
  const { toast } = useToast();
  const [localAssessment, setLocalAssessment] = useState<BaselineAssessment | null>(initialAssessment || null);
  const [step, setStep] = useState<1 | 2>(1);
  const [editing, setEditing] = useState(!initialAssessment?.completedAt);
  const [submitting, setSubmitting] = useState(false);
  const [personalityAnswers, setPersonalityAnswers] = useState<Record<string, string>>(
    () =>
      initialAssessment?.personality?.answers?.reduce<Record<string, string>>((acc, answer) => {
        acc[answer.questionId] = answer.optionId;
        return acc;
      }, {}) || {}
  );
  const [primaryRole, setPrimaryRole] = useState<BaselineRole | "">(
    (initialAssessment?.cs2Role?.primaryRole as BaselineRole) || ""
  );
  const [secondaryRole, setSecondaryRole] = useState<BaselineRole | "">(
    (initialAssessment?.cs2Role?.secondaryRole as BaselineRole) || ""
  );
  const [sidePreference, setSidePreference] = useState(initialAssessment?.cs2Role?.sidePreference || "");
  const [roundStrength, setRoundStrength] = useState(initialAssessment?.cs2Role?.roundStrength || "");

  const completedQuestions = useMemo(
    () => BASELINE_PERSONALITY_QUESTIONS.filter((question) => personalityAnswers[question.id]).length,
    [personalityAnswers]
  );
  const resolvedAssessment = localAssessment || initialAssessment || null;
  const isResultLocked = Boolean(
    resolvedAssessment?.completedAt &&
    !hasFullAccess
  );

  useEffect(() => {
    if (initialAssessment?.completedAt) {
      setLocalAssessment(initialAssessment);
      setEditing(false);
    }
  }, [initialAssessment?.completedAt]);

  const handleSubmit = async () => {
    if (!primaryRole || !sidePreference || !roundStrength) {
      toast({
        title: "Some fields are missing",
        description: "Choose your primary role, side preference, and strongest round phase.",
        variant: "destructive"
      });
      return;
    }

    if (secondaryRole && secondaryRole === primaryRole) {
      toast({
        title: "Check the roles",
        description: "The secondary role must be different from the primary role.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await submitBaselineAssessment({
        personalityAnswers: BASELINE_PERSONALITY_QUESTIONS.map((question) => ({
          questionId: question.id,
          optionId: personalityAnswers[question.id]
        })),
        cs2Role: {
          primaryRole,
          secondaryRole: secondaryRole || "",
          sidePreference: sidePreference as any,
          roundStrength: roundStrength as any
        }
      });

      toast({
        title: "Profile saved",
        description: "The baseline assessment is complete. The profile is already available in the player card."
      });

      setLocalAssessment(response.data.data);
      setEditing(false);
      await onCompleted?.(response.data.data);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Failed to save the assessment";
      toast({
        title: "Save failed",
        description: message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!editing && isResultLocked && resolvedAssessment?.cs2Role) {
    return (
      <Card
        className="rounded-[28px] border"
        style={{
          background: "linear-gradient(145deg, rgba(25, 35, 56, 0.96), rgba(12, 19, 31, 0.98))",
          borderColor: "rgba(96, 165, 250, 0.16)"
        }}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-cyan-100">
                <CheckCheck className="h-3.5 w-3.5" />
                Assessment complete
              </div>
              <CardTitle className="mt-4 text-2xl" style={{ color: COLORS.textColor }}>
                Result already saved
              </CardTitle>
              <CardDescription className="mt-2 max-w-2xl text-sm leading-7" style={{ color: COLORS.textColorSecondary }}>
                The baseline assessment is complete. The final archetype, interpretation, and player style open after purchasing {PRODUCT_NAME}.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              className="rounded-2xl"
              style={{ borderColor: COLORS.borderColor, color: COLORS.textColor }}
              onClick={() => {
                setEditing(true);
                setStep(1);
              }}
            >
              Update answers
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[22px] border p-4" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: COLORS.textColor }}>
                <BrainCircuit className="h-4 w-4" />
                What opens after payment
              </div>
              <p className="mt-3 text-sm leading-7" style={{ color: COLORS.textColorSecondary }}>
                Player archetype, headline, behavioral interpretation, and personal style tags.
              </p>
            </div>
            <div className="rounded-[22px] border p-4" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: COLORS.textColor }}>
                <Swords className="h-4 w-4" />
                Game role already captured
              </div>
              <div className="mt-3 space-y-2 text-sm" style={{ color: COLORS.textColorSecondary }}>
                <p>Primary role: <span style={{ color: COLORS.textColor }}>{resolvedAssessment.cs2Role.primaryRole}</span></p>
                <p>Secondary role: <span style={{ color: COLORS.textColor }}>{resolvedAssessment.cs2Role.secondaryRole || "Not specified"}</span></p>
                <p>Preference: <span style={{ color: COLORS.textColor }}>{resolvedAssessment.cs2Role.sidePreference}</span></p>
                <p>Strongest phase: <span style={{ color: COLORS.textColor }}>{resolvedAssessment.cs2Role.roundStrength}</span></p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border px-4 py-4" style={{ borderColor: "rgba(96, 165, 250, 0.18)", backgroundColor: "rgba(53, 144, 255, 0.08)" }}>
            <div>
              <div className="text-sm font-medium" style={{ color: COLORS.textColor }}>
                Full interpretation is ready
              </div>
              <div className="mt-1 text-sm leading-6" style={{ color: COLORS.textColorSecondary }}>
                Open the plan and the result will appear without repeating the assessment.
              </div>
            </div>
            <Link to={ROUTES.PRICING}>
              <Button className="rounded-2xl" style={{ backgroundColor: COLORS.primary, color: "white" }}>
                Open result
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!editing && resolvedAssessment?.personality?.summary && resolvedAssessment?.cs2Role) {
    const summary = resolvedAssessment.personality.summary;

    return (
      <Card
        className="rounded-[28px] border"
        style={{
          background: "linear-gradient(145deg, rgba(25, 35, 56, 0.96), rgba(12, 19, 31, 0.98))",
          borderColor: "rgba(96, 165, 250, 0.16)"
        }}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-emerald-100">
                <CheckCheck className="h-3.5 w-3.5" />
                Baseline profile complete
              </div>
              <CardTitle className="mt-4 text-2xl" style={{ color: COLORS.textColor }}>
                {summary.archetype}
              </CardTitle>
              <CardDescription className="mt-2 max-w-2xl text-sm leading-7" style={{ color: COLORS.textColorSecondary }}>
                {summary.headline}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              className="rounded-2xl"
              style={{ borderColor: COLORS.borderColor, color: COLORS.textColor }}
              onClick={() => {
                setEditing(true);
                setStep(1);
              }}
            >
              Update answers
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {summary.styleTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border px-3 py-1 text-xs uppercase tracking-[0.16em]"
                style={{ borderColor: "rgba(255,255,255,0.08)", color: COLORS.textColorSecondary }}
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[22px] border p-4" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: COLORS.textColor }}>
                <BrainCircuit className="h-4 w-4" />
                Psychological profile
              </div>
              <p className="mt-3 text-sm leading-7" style={{ color: COLORS.textColorSecondary }}>
                {summary.description}
              </p>
            </div>
            <div className="rounded-[22px] border p-4" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: COLORS.textColor }}>
                <Swords className="h-4 w-4" />
                Game role
              </div>
              <div className="mt-3 space-y-2 text-sm" style={{ color: COLORS.textColorSecondary }}>
                <p>Primary role: <span style={{ color: COLORS.textColor }}>{resolvedAssessment.cs2Role.primaryRole}</span></p>
                <p>Secondary role: <span style={{ color: COLORS.textColor }}>{resolvedAssessment.cs2Role.secondaryRole || "Not specified"}</span></p>
                <p>Preference: <span style={{ color: COLORS.textColor }}>{resolvedAssessment.cs2Role.sidePreference}</span></p>
                <p>Strongest phase: <span style={{ color: COLORS.textColor }}>{resolvedAssessment.cs2Role.roundStrength}</span></p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="rounded-[28px] border"
      style={{
        background: "linear-gradient(145deg, rgba(25, 35, 56, 0.96), rgba(12, 19, 31, 0.98))",
        borderColor: "rgba(96, 165, 250, 0.16)"
      }}
    >
      <CardHeader>
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-cyan-100">
          <ShieldCheck className="h-3.5 w-3.5" />
          Step {step} of 2
        </div>
        <CardTitle className="mt-4 text-2xl" style={{ color: COLORS.textColor }}>
          {step === 1 ? "Baseline personality assessment" : "CS2 player role"}
        </CardTitle>
        <CardDescription className="mt-2 max-w-2xl text-sm leading-7" style={{ color: COLORS.textColorSecondary }}>
          {step === 1
            ? "First we capture your game and psychological profile. This is not a diagnosis, but a starting map of how you make decisions, communicate, and handle pressure."
            : "Now we define the game frame: primary and secondary role, preferred side, and strongest round phase."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {step === 1 ? (
          <>
            <div className="rounded-[22px] border p-4 text-sm" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)", color: COLORS.textColorSecondary }}>
              Completed {completedQuestions} of {BASELINE_PERSONALITY_QUESTIONS.length} questions.
            </div>
            <div className="space-y-4">
              {BASELINE_PERSONALITY_QUESTIONS.map((question, index) => (
                <div key={question.id} className="rounded-[22px] border p-4" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
                  <div className="text-xs uppercase tracking-[0.18em]" style={{ color: COLORS.textColorSecondary }}>
                    Question {index + 1}
                  </div>
                  <div className="mt-2 text-base font-semibold" style={{ color: COLORS.textColor }}>
                    {question.prompt}
                  </div>
                  <div className="mt-4 grid gap-2">
                    {question.options.map((option) => {
                      const active = personalityAnswers[question.id] === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          className="rounded-2xl border px-4 py-3 text-left text-sm transition-all"
                          style={{
                            borderColor: active ? "rgba(96, 165, 250, 0.5)" : COLORS.borderColor,
                            backgroundColor: active ? "rgba(53, 144, 255, 0.16)" : "rgba(255,255,255,0.02)",
                            color: COLORS.textColor
                          }}
                          onClick={() =>
                            setPersonalityAnswers((current) => ({
                              ...current,
                              [question.id]: option.id
                            }))
                          }
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button
                className="rounded-2xl px-5"
                style={{ backgroundColor: COLORS.primary, color: "white" }}
                disabled={completedQuestions !== BASELINE_PERSONALITY_QUESTIONS.length}
                onClick={() => setStep(2)}
              >
                Go to role
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4 rounded-[22px] border p-4" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
              <div className="text-sm font-medium" style={{ color: COLORS.textColor }}>
                Role profile
              </div>
              <div className="space-y-2">
                <Label style={{ color: COLORS.textColor }}>Primary role</Label>
                <Select value={primaryRole} onValueChange={(value) => setPrimaryRole(value as BaselineRole)}>
                  <SelectTrigger className="rounded-2xl" style={selectStyle}>
                    <SelectValue placeholder="Choose primary role" />
                  </SelectTrigger>
                  <SelectContent>
                    {BASELINE_ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label style={{ color: COLORS.textColor }}>Secondary role</Label>
                <Select value={secondaryRole || "__none__"} onValueChange={(value) => setSecondaryRole(value === "__none__" ? "" : (value as BaselineRole))}>
                  <SelectTrigger className="rounded-2xl" style={selectStyle}>
                    <SelectValue placeholder="Can be left empty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Do not specify</SelectItem>
                    {BASELINE_ROLE_OPTIONS.filter((role) => role !== primaryRole).map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 rounded-[22px] border p-4" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
              <div className="text-sm font-medium" style={{ color: COLORS.textColor }}>
                Game context
              </div>
              <div className="space-y-2">
                <Label style={{ color: COLORS.textColor }}>Preferred side</Label>
                <Select value={sidePreference} onValueChange={setSidePreference}>
                  <SelectTrigger className="rounded-2xl" style={selectStyle}>
                    <SelectValue placeholder="Choose side" />
                  </SelectTrigger>
                  <SelectContent>
                    {BASELINE_SIDE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label style={{ color: COLORS.textColor }}>Strongest round phase</Label>
                <Select value={roundStrength} onValueChange={setRoundStrength}>
                  <SelectTrigger className="rounded-2xl" style={selectStyle}>
                    <SelectValue placeholder="Choose phase" />
                  </SelectTrigger>
                  <SelectContent>
                    {BASELINE_ROUND_STRENGTH_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between lg:col-span-2">
              <Button
                variant="outline"
                className="rounded-2xl"
                style={{ borderColor: COLORS.borderColor, color: COLORS.textColor }}
                onClick={() => setStep(1)}
              >
                Back to personality
              </Button>
              <Button
                className="rounded-2xl px-5"
                style={{ backgroundColor: COLORS.primary, color: "white" }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Complete assessment"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
