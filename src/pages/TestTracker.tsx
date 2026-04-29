import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Link as LinkIcon, Calendar as CalendarIcon, Image, ExternalLink, Edit, Trash2, Sparkles, ClipboardList, Clock3, Brain, Gauge, CheckCheck, AlertCircle, FilterX, Loader2, ListFilter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TestEntry } from "@/types";
import { testRepository } from "@/lib/dataRepository";
import { createTestEntry, deleteTestEntry, getMyTestEntries, getTeamTestSummary, getTestsStateImpact } from "@/lib/api";
import { formatDate, getCurrentWeekRange, getWeekLabel, getPrevWeek, getNextWeek } from "@/utils/dateUtils";
import { useAuth } from "@/hooks/useAuth";
import { COLORS } from "@/styles/theme";
import { getReadableTestTypeLabel } from "@/utils/testTypeMetadata";
import axios from "axios";
import BrainLabPanel from "@/components/brain-lab/BrainLabPanel";
import LockedResultsGate from "@/components/LockedResultsGate";
import { useSearchParams } from "react-router-dom";
import { PRODUCT_NAME } from "@/lib/productCopy";

const predefinedTests = [
 {
  name: "Interpersonal relationships",
  link: "https://psytests.org/classic/leary.html",
  isWeeklyTest: false
 }
];

type StateImpactSummary = {
 totals: {
  entries: number;
  scoredEntries: number;
  avgScore: number;
  avgStateIndex: number;
 };
 stateToResult: {
  fatigue: { low: number; mid: number; high: number };
  focus: { low: number; mid: number; high: number };
  stress: { low: number; mid: number; high: number };
 };
};

type TeamTestSummary = {
 summary: {
  teamId: string | null;
  teamName: string;
  playersCount: number;
  totalEntries: number;
  weeklyEntries: number;
  scoredEntries: number;
  avgScore: number | null;
  avgStateIndex: number | null;
  avgSleepHours: number | null;
  avgScreenTimeHours: number | null;
 };
 byPlayer: Array<{
  userId: string;
  name: string;
  entries: number;
  weeklyEntries: number;
  avgScore: number | null;
  avgSleepHours: number | null;
  avgScreenTimeHours: number | null;
  lastTestAt: string | null;
 }>;
 byTestType: Array<{
  type: string;
  entries: number;
  avgScore: number | null;
 }>;
 recentEntries: Array<{
  id: string;
  userId: string;
  playerName: string;
  name: string;
  testType: string;
  scoreNormalized: number | null;
  measuredAt: string;
  isWeeklyTest: boolean;
 }>;
};

const TestTracker = () => {
 const { toast } = useToast();
 const { user } = useAuth();
 const [searchParams] = useSearchParams();
 const [entries, setEntries] = useState<TestEntry[]>([]);
 const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
 const [name, setName] = useState<string>("");
 const [link, setLink] = useState<string>("");
 const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
 const [isWeeklyTest, setIsWeeklyTest] = useState<boolean>(false);
 const [screenshotUrl, setScreenshotUrl] = useState<string>("");
 const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
 const [editingTest, setEditingTest] = useState<TestEntry | null>(null);
 const [activeTab, setActiveTab] = useState<"weekly">("weekly");
 const [isLoading, setIsLoading] = useState<boolean>(false);
 const [entriesLoadError, setEntriesLoadError] = useState<string | null>(null);
 const [stateImpactError, setStateImpactError] = useState<string | null>(null);
 const [teamSummaryError, setTeamSummaryError] = useState<string | null>(null);
 const [isStateImpactLoading, setIsStateImpactLoading] = useState<boolean>(false);
 const [isTeamSummaryLoading, setIsTeamSummaryLoading] = useState<boolean>(false);

 //  ( ѕ С‚)
 const [qDate, setQDate] = useState<string>(new Date().toISOString().split('T')[0]);
 const [qSleepStart, setQSleepStart] = useState<string>("");
 const [qSleepEnd, setQSleepEnd] = useState<string>("");
 const [qSleep, setQSleep] = useState<string>("");
 const [qScreen, setQScreen] = useState<string>("");
 const [qScreenEntertainment, setQScreenEntertainment] = useState<string>("");
 const [qScreenCommunication, setQScreenCommunication] = useState<string>("");
 const [qScreenBrowser, setQScreenBrowser] = useState<string>("");
 const [qScreenStudy, setQScreenStudy] = useState<string>("");
 const [qSubmitting, setQSubmitting] = useState<boolean>(false);
 const [testType, setTestType] = useState<string>("generic");
 const [rawScore, setRawScore] = useState<string>("");
 const [scoreNormalized, setScoreNormalized] = useState<string>("");
 const [unit, setUnit] = useState<string>("%");
 const [durationSec, setDurationSec] = useState<string>("");
 const [attempts, setAttempts] = useState<string>("1");
 const [fatigue, setFatigue] = useState<string>("");
 const [focus, setFocus] = useState<string>("");
 const [stress, setStress] = useState<string>("");
 const [sleepHours, setSleepHours] = useState<string>("");
 const [snapshotMood, setSnapshotMood] = useState<string>("");
 const [snapshotEnergy, setSnapshotEnergy] = useState<string>("");
 const [matchType, setMatchType] = useState<string>("");
 const [contextMap, setContextMap] = useState<string>("");
 const [contextRole, setContextRole] = useState<string>("");
 const [periodFilter, setPeriodFilter] = useState<string>("30");
 const [testTypeFilter, setTestTypeFilter] = useState<string>("all");
 const [contextRoleFilter, setContextRoleFilter] = useState<string>("all");
 const [sourceFilter, setSourceFilter] = useState<string>("all");
 const [stateImpact, setStateImpact] = useState<StateImpactSummary | null>(null);
 const [teamSummary, setTeamSummary] = useState<TeamTestSummary | null>(null);
 
 const isStaff = user?.role === "staff";
 const isTeamStaff = isStaff && user?.playerType === "team";
 const hasPerformanceCoachCrmAccess = Boolean(user?.hasPerformanceCoachCrmAccess);
 const isEntriesInitialLoading = isLoading && entries.length === 0;

 const parseOptionalNumber = (value: string) => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
 };

 const parseTimeToMinutes = (value: string) => {
  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
 };

 const getSleepHoursByRange = (from: string, to: string) => {
  const fromMinutes = parseTimeToMinutes(from);
  const toMinutes = parseTimeToMinutes(to);
  if (fromMinutes === null || toMinutes === null) return undefined;
  const diffMinutes = toMinutes >= fromMinutes
   ? toMinutes - fromMinutes
   : (24 * 60 - fromMinutes) + toMinutes;
  return Number((diffMinutes / 60).toFixed(2));
 };

 useEffect(() => {
  if (!qSleepStart || !qSleepEnd) return;
  const hours = getSleepHoursByRange(qSleepStart, qSleepEnd);
  if (hours === undefined) return;
  setQSleep(String(hours));
 }, [qSleepStart, qSleepEnd]);

 const submitQuestionnaire = async () => {
  try {
   setQSubmitting(true);
   const token = localStorage.getItem("token");
   const sleepByRange = qSleepStart && qSleepEnd ? getSleepHoursByRange(qSleepStart, qSleepEnd) : undefined;
   const sleepHours = parseOptionalNumber(qSleep) ?? sleepByRange;

   if ((qSleepStart && !qSleepEnd) || (!qSleepStart && qSleepEnd)) {
    toast({
     title: "Check sleep",
     description: "Fill in both sleep time fields: from and to.",
     variant: "destructive"
    });
    return;
   }

   const entertainment = parseOptionalNumber(qScreenEntertainment);
   const communication = parseOptionalNumber(qScreenCommunication);
   const browser = parseOptionalNumber(qScreenBrowser);
   const study = parseOptionalNumber(qScreenStudy);
   const hasBreakdown = [entertainment, communication, browser, study].some((v) => v !== undefined);
   const breakdownSum = (entertainment || 0) + (communication || 0) + (browser || 0) + (study || 0);
   const totalScreenTime = parseOptionalNumber(qScreen) ?? (hasBreakdown ? Number(breakdownSum.toFixed(2)) : undefined);

   if (totalScreenTime !== undefined && hasBreakdown && breakdownSum > totalScreenTime) {
    toast({
     title: "Screen time error",
     description: `Category total (${breakdownSum.toFixed(1)} ч) exceeds total screen time (${totalScreenTime.toFixed(1)} ч).`,
     variant: "destructive"
    });
    return;
   }

   await axios.post(
    "/api/questionnaires/daily",
    {
     date: qDate,
     sleepHours,
     sleepStartTime: qSleepStart || undefined,
     sleepEndTime: qSleepEnd || undefined,
     screenTimeHours: totalScreenTime,
     screenBreakdown: hasBreakdown
      ? {
        entertainment,
        communication,
        browser,
        study
       }
      : undefined
    },
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
   );
   toast({ title: "Saved", description: "Questionnaire data saved" });
  } catch (e: unknown) {
   const messageFromResponse =
    typeof e === "object" &&
    e !== null &&
    "response" in e &&
    typeof (e as { response?: { data?: { message?: unknown } } }).response?.data?.message === "string"
     ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
     : null;
   const messageFromError = e instanceof Error ? e.message : null;
   const msg = messageFromResponse || messageFromError || "Save error";
   toast({ title: "Error", description: msg, variant: "destructive" });
  } finally {
   setQSubmitting(false);
  }
 };
 
 useEffect(() => {
  void loadEntries();
 }, [hasPerformanceCoachCrmAccess, user, isTeamStaff]);

 useEffect(() => {
  const requestedTab = searchParams.get("tab");
  if (requestedTab === "weekly") {
   setActiveTab(requestedTab);
   return;
  }

  if (requestedTab === "brain") {
   window.scrollTo({ top: 0, behavior: "smooth" });
  }
 }, [searchParams]);

 useEffect(() => {
  const loadStateImpact = async () => {
   setIsStateImpactLoading(true);
   setStateImpactError(null);

   try {
    const now = new Date();
    const days = Number(periodFilter);
    const fromDate = new Date(now);
    fromDate.setDate(now.getDate() - days);

    const response = await getTestsStateImpact({
     from: fromDate.toISOString().slice(0, 10),
     to: now.toISOString().slice(0, 10),
     testType: testTypeFilter !== "all" ? testTypeFilter : undefined,
     role: contextRoleFilter !== "all" ? contextRoleFilter : undefined,
     source: sourceFilter !== "all" ? sourceFilter : undefined
    });

    setStateImpact(response.data);
   } catch (error) {
    console.error("Error loading tests state impact:", error);
    setStateImpact(null);
    setStateImpactError("Failed to refresh the analytics summary for the selected filters.");
   } finally {
    setIsStateImpactLoading(false);
   }
  };

  if (user && hasPerformanceCoachCrmAccess) {
   loadStateImpact();
   return;
  }

  setStateImpact(null);
  setStateImpactError(null);
  setIsStateImpactLoading(false);
 }, [user, hasPerformanceCoachCrmAccess, periodFilter, testTypeFilter, contextRoleFilter, sourceFilter]);

 useEffect(() => {
  const loadTeamSummary = async () => {
   if (!user || !hasPerformanceCoachCrmAccess || !isTeamStaff) {
    setTeamSummary(null);
    setTeamSummaryError(null);
    setIsTeamSummaryLoading(false);
    return;
   }

   setIsTeamSummaryLoading(true);
   setTeamSummaryError(null);

   try {
    const now = new Date();
    const days = Number(periodFilter);
    const fromDate = new Date(now);
    fromDate.setDate(now.getDate() - days);
    const response = await getTeamTestSummary({
     from: fromDate.toISOString().slice(0, 10),
     to: now.toISOString().slice(0, 10),
    });
    setTeamSummary(response.data);
   } catch (error) {
    console.error("Error loading team test summary:", error);
    setTeamSummary(null);
    setTeamSummaryError("Failed to load the team summary for the selected period.");
   } finally {
    setIsTeamSummaryLoading(false);
   }
  };

  void loadTeamSummary();
 }, [user, hasPerformanceCoachCrmAccess, isTeamStaff, periodFilter]);
 
 const loadEntries = async () => {
  try {
   setIsLoading(true);
   setEntriesLoadError(null);

   if (isTeamStaff) {
    setEntries([]);
    return;
   }
   
   if (user) {
    //   СЃ СЃ
    try {
     const response = await getMyTestEntries();
     const serverEntries = (Array.isArray(response.data) ? response.data : []).map((entry) => {
      const serverEntry = entry as TestEntry & { _id?: string; id?: string };
      return {
       ...serverEntry,
       id: serverEntry.id || serverEntry._id || crypto.randomUUID(),
       date: new Date(serverEntry.date)
      };
     });
     setEntries(serverEntries);
     
     //  ѕ С…СЂ СЃ  СЃ СЃ
     testRepository.updateFromServer(serverEntries);
     
     console.log('Test entries loaded from server');
    } catch (error) {
     console.error('Error loading test entries from server:', error);
     
     //   Сѓ  СЃ СЃ,  ѕ 
     const localEntries = testRepository.getAll();
     setEntries(localEntries);
     setEntriesLoadError("The server is unavailable, so locally saved records are shown now.");
     
     toast({
      title: "Loading error",
      description: "Failed to load records from the server; local data is being used.",
      variant: "destructive"
     });
    }
   } else {
    //    ,  ѕ 
    const localEntries = testRepository.getAll();
    setEntries(localEntries);
   }
  } catch (error) {
   console.error('Error loading test entries:', error);
   setEntriesLoadError("Failed to load test records.");
   
   toast({
    title: "Loading error",
    description: "Failed to load test records.",
    variant: "destructive"
   });
  } finally {
   setIsLoading(false);
  }
 };
 
 const resetForm = () => {
  setDate(new Date().toISOString().split('T')[0]);
  setName("");
  setLink("");
  setScreenshotUrl("");
  setIsWeeklyTest(false);
  setEditingTest(null);
  setTestType("generic");
  setRawScore("");
  setScoreNormalized("");
  setUnit("%");
  setDurationSec("");
  setAttempts("1");
  setFatigue("");
  setFocus("");
  setStress("");
  setSleepHours("");
  setSnapshotMood("");
  setSnapshotEnergy("");
  setMatchType("");
  setContextMap("");
  setContextRole("");
 };
 
 const handlePrevWeek = () => {
  setCurrentWeek(getPrevWeek(currentWeek));
 };
 
 const handleNextWeek = () => {
  setCurrentWeek(getNextWeek(currentWeek));
 };
 
 const handleSubmit = async () => {
  if (!name && !testType) {
   toast({
    title: "Required fields missing",
    description: "Enter a test name or test type",
    variant: "destructive"
   });
   return;
  }
  
  try {
   setIsLoading(true);
   
   const newEntry: Omit<TestEntry, "id"> = {
    date: new Date(date),
    name,
    link,
    screenshotUrl: screenshotUrl || undefined,
    isWeeklyTest,
    testType,
    rawScore: rawScore ? Number(rawScore) : undefined,
    scoreNormalized: scoreNormalized ? Number(scoreNormalized) : undefined,
    unit: unit || undefined,
    durationSec: durationSec ? Number(durationSec) : undefined,
    attempts: attempts ? Number(attempts) : 1,
    stateSnapshot: {
     fatigue: fatigue ? Number(fatigue) : undefined,
     focus: focus ? Number(focus) : undefined,
     stress: stress ? Number(stress) : undefined,
     sleepHours: sleepHours ? Number(sleepHours) : undefined,
     mood: snapshotMood ? Number(snapshotMood) : undefined,
     energy: snapshotEnergy ? Number(snapshotEnergy) : undefined
    },
    context: {
     matchType: matchType || undefined,
     map: contextMap || undefined,
     role: contextRole || undefined
    },
    measuredAt: new Date(date).toISOString()
   };
   
   //  СЂ  СЃ 
   const savedEntry = testRepository.create(newEntry);
   
   //   ,  СЃСЂ СЃ  СЃ
   if (user) {
    try {
     const response = await createTestEntry(newEntry);
     console.log('Test entry saved to server:', response.data);
    } catch (error) {
     console.error('Error saving test entry to server (will be synced later):', error);
    }
   }
   
   //  СЃ 
   await loadEntries();
   resetForm();
   
   toast({
    title: "Record added",
    description: "Test record saved successfully.",
   });
  } catch (error) {
   console.error('Error saving test entry:', error);
   
   toast({
    title: "Save error",
    description: "Failed to save test record.",
    variant: "destructive"
   });
  } finally {
   setIsLoading(false);
  }
 };
 
 const handleEdit = (test: TestEntry) => {
  setEditingTest(test);
  setName(test.name || "");
  setLink(test.link || "");
  setDate(test.date.toISOString().split('T')[0]);
  setIsWeeklyTest(test.isWeeklyTest);
  setTestType(test.testType || "generic");
  setRawScore(test.rawScore !== undefined ? String(test.rawScore) : "");
  setScoreNormalized(test.scoreNormalized !== undefined ? String(test.scoreNormalized) : "");
  setUnit(test.unit || "%");
  setDurationSec(test.durationSec !== undefined ? String(test.durationSec) : "");
  setAttempts(test.attempts !== undefined ? String(test.attempts) : "1");
  setFatigue(test.stateSnapshot?.fatigue !== undefined ? String(test.stateSnapshot.fatigue) : "");
  setFocus(test.stateSnapshot?.focus !== undefined ? String(test.stateSnapshot.focus) : "");
  setStress(test.stateSnapshot?.stress !== undefined ? String(test.stateSnapshot.stress) : "");
  setSleepHours(test.stateSnapshot?.sleepHours !== undefined ? String(test.stateSnapshot.sleepHours) : "");
  setSnapshotMood(test.stateSnapshot?.mood !== undefined ? String(test.stateSnapshot.mood) : "");
  setSnapshotEnergy(test.stateSnapshot?.energy !== undefined ? String(test.stateSnapshot.energy) : "");
  setMatchType(test.context?.matchType || "");
  setContextMap(test.context?.map || "");
  setContextRole(test.context?.role || "");
  setIsDialogOpen(true);
 };
 
 const handleDelete = async (id: string) => {
  try {
   setIsLoading(true);

   if (user) {
    try {
     await deleteTestEntry(id);
    } catch (error) {
     console.error("Error deleting test entry on server:", error);
    }
   }
   
   //   h СЂ
   testRepository.delete(id);
   
   //  СЃ 
   await loadEntries();
   
   toast({
    title: "Record deleted",
    description: "Test record deleted successfully."
   });
  } catch (error) {
   console.error('Error deleting test entry:', error);
  
  toast({
    title: "Deletion error",
    description: "Failed to delete test record.",
    variant: "destructive"
  });
  } finally {
   setIsLoading(false);
  }
 };
 
 const applyEntryFilters = (items: TestEntry[]) => {
  const days = Number(periodFilter);
  const now = new Date();
  const fromDate = new Date(now);
  fromDate.setDate(now.getDate() - days);

  return items.filter((test) => {
   const measuredAt = test.measuredAt ? new Date(test.measuredAt) : new Date(test.date);
   const inPeriod = measuredAt >= fromDate && measuredAt <= now;
   const byType = testTypeFilter === "all" || (test.testType || "generic") === testTypeFilter;
   const byRole = contextRoleFilter === "all" || test.context?.role === contextRoleFilter;
   const bySource = sourceFilter === "all" || (test.context?.source || "manual") === sourceFilter;
   return inPeriod && byType && byRole && bySource;
  });
 };

 const getWeekTests = () => {
  const { start, end } = getCurrentWeekRange(currentWeek);
  const weekEntries = entries.filter((test) => {
   const testDate = new Date(test.date);
   return testDate >= start && testDate <= end;
  });
  return applyEntryFilters(weekEntries);
 };
 
 const getWeeklyTests = () => {
  return getWeekTests().filter((test) => test.isWeeklyTest);
 };

 const filteredEntries = applyEntryFilters(entries);
 const weeklyTests = getWeeklyTests().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
 const recommendedWeeklyTests = predefinedTests.filter((test) => test.isWeeklyTest);
 const recentTests = [...filteredEntries]
  .sort((a, b) => {
   const first = a.measuredAt ? new Date(a.measuredAt).getTime() : new Date(a.date).getTime();
   const second = b.measuredAt ? new Date(b.measuredAt).getTime() : new Date(b.date).getTime();
   return second - first;
  })
  .slice(0, 3);
 const scoredEntries = filteredEntries.filter((test) => typeof test.scoreNormalized === "number");
 const averageNormalizedScore = scoredEntries.length > 0
  ? Number((scoredEntries.reduce((sum, test) => sum + (test.scoreNormalized || 0), 0) / scoredEntries.length).toFixed(1))
  : null;
 const currentWeekTestsCount = getWeekTests().length;
 const heroEntriesCount = isTeamStaff ? teamSummary?.summary.totalEntries ?? 0 : filteredEntries.length;
 const heroAverageScore = isTeamStaff ? teamSummary?.summary.avgScore ?? null : averageNormalizedScore;
 const heroWeeklyEntries = isTeamStaff ? teamSummary?.summary.weeklyEntries ?? 0 : currentWeekTestsCount;
 const heroStateIndex = stateImpact?.totals.avgStateIndex ?? (isTeamStaff ? teamSummary?.summary.avgStateIndex ?? "-" : "-");
 const questionnaireBreakdownSum = (parseFloat(qScreenEntertainment) || 0) +
  (parseFloat(qScreenCommunication) || 0) +
  (parseFloat(qScreenBrowser) || 0) +
  (parseFloat(qScreenStudy) || 0);
 const questionnaireTotalScreen = parseFloat(qScreen) || 0;
 const hasQuestionnaireTotal = qScreen.trim() !== "";
 const isQuestionnaireExceeded = hasQuestionnaireTotal && questionnaireBreakdownSum > questionnaireTotalScreen;
 const selectedDateLabel = formatDate(new Date(date), "d MMMM yyyy");
 const qDateLabel = formatDate(new Date(qDate), "d MMMM yyyy");
 const fieldStyle = {
  backgroundColor: "rgba(255,255,255,0.04)",
  color: COLORS.textColor,
  borderColor: "rgba(255,255,255,0.08)"
 };
 const hasActiveFilters = periodFilter !== "30" || testTypeFilter !== "all" || contextRoleFilter !== "all" || sourceFilter !== "all";
 const activeFilterBadges = [
  `Period: ${periodFilter} дней`,
  testTypeFilter !== "all" ? `Type: ${getReadableTestTypeLabel(testTypeFilter)}` : null,
  contextRoleFilter !== "all" ? `Role: ${contextRoleFilter.toUpperCase()}` : null,
  sourceFilter !== "all" ? `Source: ${sourceFilter === "manual" ? "Manual entry" : "Brain Lab"}` : null
 ].filter(Boolean) as string[];
 const filtersScopeSummary = isTeamStaff
  ? `${heroEntriesCount} entries по команде, ${heroWeeklyEntries} weekly и средний score ${heroAverageScore ?? "-"}`
  : `${filteredEntries.length} entries, ${scoredEntries.length} of них со score и ${weeklyTests.length} weekly в текущем периоде`;
 const resetAnalyticsFilters = () => {
  setPeriodFilter("30");
  setTestTypeFilter("all");
  setContextRoleFilter("all");
  setSourceFilter("all");
 };

 const getTestTypeLabel = (value?: string) => {
  return getReadableTestTypeLabel(value);
 };

 const renderInsightSkeletons = () => (
  <div className="mt-5 grid gap-3 md:grid-cols-4">
   {Array.from({ length: 4 }).map((_, index) => (
    <div
     key={`insight-skeleton-${index}`}
     className="rounded-[22px] border p-4"
     style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}
    >
     <Skeleton className="h-3 w-24 bg-white/10" />
     <Skeleton className="mt-4 h-8 w-16 bg-white/10" />
     <Skeleton className="mt-3 h-3 w-28 bg-white/10" />
    </div>
   ))}
  </div>
 );

 return (
  <div className="container mx-auto py-4">
   <div className="space-y-6">
    <section
     className="overflow-hidden rounded-[32px] border px-5 py-6 md:px-7"
     style={{
      background: "linear-gradient(135deg, rgba(53, 144, 255, 0.18), rgba(0, 227, 150, 0.1) 45%, rgba(17, 24, 39, 0.96))",
      borderColor: "rgba(96, 165, 250, 0.32)",
      boxShadow: "0 36px 100px -68px rgba(53, 144, 255, 0.95)"
     }}
    >
     <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
      <div className="max-w-3xl space-y-4">
       <div
        className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.28em]"
        style={{
         backgroundColor: "rgba(11, 16, 32, 0.38)",
         border: "1px solid rgba(125, 211, 252, 0.2)",
         color: "#B6F0FF"
        }}
       >
        <Sparkles className="h-3.5 w-3.5" />
        Tests
       </div>
       <div className="space-y-2">
        <h1 className="text-3xl font-semibold md:text-4xl" style={{ color: COLORS.textColor }}>
         Tests and recovery checks
        </h1>
        <p className="max-w-2xl text-sm leading-7 md:text-base" style={{ color: "rgba(226, 232, 240, 0.82)" }}>
         Keep the useful parts: run Brain Lab, add key weekly results, and attach recovery context without extra tab noise.
        </p>
       </div>
       <div className="flex flex-wrap gap-2">
        {[
         "1. Run the test",
         "2. Add recovery context",
         "3. Keep the weekly rhythm"
        ].map((item) => (
         <Badge
          key={item}
          variant="outline"
          className="rounded-full border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium tracking-[0.12em]"
          style={{ color: "#D9F6FF" }}
         >
          {item}
         </Badge>
        ))}
       </div>
      </div>

      <div className="xl:min-w-[420px]">
       <LockedResultsGate
        hasAccess={hasPerformanceCoachCrmAccess}
        hasData={heroEntriesCount > 0}
        title="Test results are being collected"
        description={`Run Brain Lab and save tests for free. Full scores, weekly summaries, and form index unlock with a ${PRODUCT_NAME} plan.`}
        ctaText="Open test results"
        minHeightClassName="min-h-[280px]"
        compact
       >
        <div className="grid grid-cols-2 gap-3">
         <div className="rounded-[22px] border p-4" style={{ backgroundColor: "rgba(9, 14, 26, 0.34)", borderColor: "rgba(148, 163, 184, 0.18)" }}>
          <div className="text-[11px] uppercase tracking-[0.22em]" style={{ color: "rgba(191, 219, 254, 0.78)" }}>Entries</div>
          <div className="mt-2 text-2xl font-semibold" style={{ color: COLORS.textColor }}>{heroEntriesCount}</div>
          <div className="mt-1 text-sm" style={{ color: "rgba(226, 232, 240, 0.68)" }}>for the selected period</div>
         </div>
         <div className="rounded-[22px] border p-4" style={{ backgroundColor: "rgba(9, 14, 26, 0.34)", borderColor: "rgba(148, 163, 184, 0.18)" }}>
          <div className="text-[11px] uppercase tracking-[0.22em]" style={{ color: "rgba(191, 219, 254, 0.78)" }}>Average score</div>
          <div className="mt-2 text-2xl font-semibold" style={{ color: COLORS.textColor }}>{heroAverageScore ?? "-"}</div>
          <div className="mt-1 text-sm" style={{ color: "rgba(226, 232, 240, 0.68)" }}>from saved results</div>
         </div>
         <div className="rounded-[22px] border p-4" style={{ backgroundColor: "rgba(9, 14, 26, 0.34)", borderColor: "rgba(148, 163, 184, 0.18)" }}>
          <div className="text-[11px] uppercase tracking-[0.22em]" style={{ color: "rgba(191, 219, 254, 0.78)" }}>This week</div>
          <div className="mt-2 text-2xl font-semibold" style={{ color: COLORS.textColor }}>{heroWeeklyEntries}</div>
          <div className="mt-1 text-sm" style={{ color: "rgba(226, 232, 240, 0.68)" }}>tests in the current window</div>
         </div>
         <div className="rounded-[22px] border p-4" style={{ backgroundColor: "rgba(9, 14, 26, 0.34)", borderColor: "rgba(148, 163, 184, 0.18)" }}>
          <div className="text-[11px] uppercase tracking-[0.22em]" style={{ color: "rgba(191, 219, 254, 0.78)" }}>State index</div>
          <div className="mt-2 text-2xl font-semibold" style={{ color: COLORS.textColor }}>{heroStateIndex}</div>
          <div className="mt-1 text-sm" style={{ color: "rgba(226, 232, 240, 0.68)" }}>condition and result link</div>
         </div>
        </div>
       </LockedResultsGate>
      </div>
     </div>
    </section>

    {!isStaff && <BrainLabPanel hasResultsAccess={hasPerformanceCoachCrmAccess} />}

     <section
      className="rounded-[28px] border p-5 md:p-6"
      style={{
       background: "linear-gradient(160deg, rgba(26, 32, 44, 0.96), rgba(17, 24, 39, 0.96))",
       borderColor: "rgba(96, 165, 250, 0.16)"
      }}
     >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
       <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-[0.24em]" style={{ color: COLORS.textColorSecondary }}>
         Analytics filter
        </div>
        <p className="max-w-2xl text-sm leading-6" style={{ color: COLORS.textColorSecondary }}>
         Filter by period, test types, and game context to find useful patterns faster without overloading the screen.
        </p>
       </div>

       <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
         type="button"
         variant="outline"
         onClick={resetAnalyticsFilters}
         disabled={!hasActiveFilters}
         className="h-11 rounded-2xl px-4"
         style={{
          borderColor: "rgba(255,255,255,0.1)",
          color: hasActiveFilters ? COLORS.textColor : COLORS.textColorSecondary,
          backgroundColor: "rgba(255,255,255,0.02)"
         }}
        >
         <FilterX className="mr-2 h-4 w-4" />
         Reset filters
        </Button>

        {!isStaff && (
         <Button
          onClick={() => {
           resetForm();
           setDate(new Date().toISOString().split("T")[0]);
           setIsDialogOpen(true);
          }}
          className="h-12 rounded-2xl px-5"
          style={{ backgroundColor: COLORS.primary, color: "white" }}
         >
          <Plus className="mr-2 h-4 w-4" />
          Add test
         </Button>
        )}
       </div>
      </div>

      <LockedResultsGate
       hasAccess={hasPerformanceCoachCrmAccess}
       hasData={heroEntriesCount > 0}
       isLoading={isStateImpactLoading}
       error={stateImpactError}
       title="Result analytics locked"
       description={`Фильтры, индекс текущей формы и агрегаты по тестам откроются после покупки. Само прохождение и сохранение тестов уже доступны в ${PRODUCT_NAME}.`}
       ctaText="Open test analytics"
       minHeightClassName="min-h-[420px]"
      >
      <div className="mt-5 grid gap-3 md:grid-cols-4">
       <div className="space-y-2">
        <Label style={{ color: COLORS.textColor }}>Period</Label>
        <select
         value={periodFilter}
         onChange={(e) => setPeriodFilter(e.target.value)}
         className="w-full rounded-2xl border px-4 py-3"
         style={fieldStyle}
        >
         <option value="7">7 days</option>
         <option value="30">30 days</option>
         <option value="90">90 days</option>
        </select>
       </div>
       <div className="space-y-2">
        <Label style={{ color: COLORS.textColor }}>Test type</Label>
        <select
         value={testTypeFilter}
         onChange={(e) => setTestTypeFilter(e.target.value)}
         className="w-full rounded-2xl border px-4 py-3"
         style={fieldStyle}
        >
         <option value="all">All types</option>
         <option value="generic">{getTestTypeLabel("generic")}</option>
         <option value="reaction">{getTestTypeLabel("reaction")}</option>
         <option value="aim">{getTestTypeLabel("aim")}</option>
         <option value="cognitive">{getTestTypeLabel("cognitive")}</option>
         <option value="visual_search">{getTestTypeLabel("visual_search")}</option>
         <option value="go_no_go">{getTestTypeLabel("go_no_go")}</option>
         <option value="n_back_2">{getTestTypeLabel("n_back_2")}</option>
         <option value="stroop_switch">{getTestTypeLabel("stroop_switch")}</option>
         <option value="spatial_span">{getTestTypeLabel("spatial_span")}</option>
        </select>
       </div>
       <div className="space-y-2">
        <Label style={{ color: COLORS.textColor }}>Context / role</Label>
        <select
         value={contextRoleFilter}
         onChange={(e) => setContextRoleFilter(e.target.value)}
         className="w-full rounded-2xl border px-4 py-3"
         style={fieldStyle}
        >
         <option value="all">All roles</option>
         <option value="entry">Entry</option>
         <option value="support">Support</option>
         <option value="awp">AWP</option>
         <option value="igl">IGL</option>
        </select>
       </div>
       <div className="space-y-2">
        <Label style={{ color: COLORS.textColor }}>Source</Label>
        <select
         value={sourceFilter}
         onChange={(e) => setSourceFilter(e.target.value)}
         className="w-full rounded-2xl border px-4 py-3"
         style={fieldStyle}
        >
         <option value="all">All sources</option>
         <option value="manual">Manual entry</option>
         <option value="brain_lab">Brain Lab</option>
        </select>
       </div>
      </div>

      <div
       className="mt-5 rounded-[24px] border p-4 md:p-5"
       style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)" }}
      >
       <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1.5">
         <div className="flex items-center gap-2 text-sm font-medium" style={{ color: COLORS.textColor }}>
          <ListFilter className="h-4 w-4" />
          What you see now
         </div>
         <p className="text-sm leading-6" style={{ color: COLORS.textColorSecondary }}>
          {filtersScopeSummary}
         </p>
        </div>

        <div className="flex flex-wrap gap-2">
         {activeFilterBadges.map((item) => (
          <Badge
           key={item}
           variant="outline"
           className="rounded-full border-white/10 bg-white/5 px-3 py-1 text-xs"
           style={{ color: COLORS.textColor }}
          >
           {item}
          </Badge>
         ))}
         {!hasActiveFilters && (
          <Badge
           variant="outline"
           className="rounded-full border-white/10 bg-white/5 px-3 py-1 text-xs"
           style={{ color: COLORS.textColorSecondary }}
          >
           Basic filter set
          </Badge>
         )}
        </div>
       </div>

       {entriesLoadError && (
        <div
         className="mt-4 flex items-start gap-3 rounded-[18px] border px-4 py-3"
         style={{ borderColor: "rgba(251, 191, 36, 0.24)", backgroundColor: "rgba(251, 191, 36, 0.08)" }}
        >
         <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: "#FBBF24" }} />
         <p className="text-sm leading-6" style={{ color: COLORS.textColor }}>
          {entriesLoadError}
         </p>
        </div>
       )}
      </div>

      {isStateImpactLoading ? (
       renderInsightSkeletons()
      ) : stateImpact ? (
       <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-[22px] border p-4" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
         <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em]" style={{ color: COLORS.textColorSecondary }}>
          <Gauge className="h-3.5 w-3.5" />
          Average score
         </div>
         <div className="mt-3 text-2xl font-semibold" style={{ color: COLORS.textColor }}>{stateImpact.totals.avgScore}</div>
        </div>
        <div className="rounded-[22px] border p-4" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
         <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em]" style={{ color: COLORS.textColorSecondary }}>
          <Brain className="h-3.5 w-3.5" />
          Condition index
         </div>
         <div className="mt-3 text-2xl font-semibold" style={{ color: COLORS.textColor }}>{stateImpact.totals.avgStateIndex}</div>
        </div>
        <div className="rounded-[22px] border p-4" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
         <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em]" style={{ color: COLORS.textColorSecondary }}>
          <CheckCheck className="h-3.5 w-3.5" />
          High focus
         </div>
         <div className="mt-3 text-2xl font-semibold" style={{ color: COLORS.textColor }}>{stateImpact.stateToResult.focus.high}</div>
        </div>
        <div className="rounded-[22px] border p-4" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
         <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em]" style={{ color: COLORS.textColorSecondary }}>
          <Clock3 className="h-3.5 w-3.5" />
          High fatigue
         </div>
         <div className="mt-3 text-2xl font-semibold" style={{ color: COLORS.textColor }}>{stateImpact.stateToResult.fatigue.high}</div>
        </div>
       </div>
      ) : (
       <div
        className="mt-5 rounded-[22px] border border-dashed p-4"
        style={{ borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.02)" }}
       >
        <div className="flex items-start gap-3">
         <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: stateImpactError ? "#FBBF24" : COLORS.textColorSecondary }} />
         <div>
          <p className="text-sm font-medium" style={{ color: COLORS.textColor }}>
           {stateImpactError ? "Filter summary temporarily unavailable" : "Summary appears after the first records"}
          </p>
          <p className="mt-1 text-sm leading-6" style={{ color: COLORS.textColorSecondary }}>
           {stateImpactError || "When the sample has enough tests, quick score, focus, and condition pointers will appear here."}
          </p>
         </div>
        </div>
       </div>
      )}
      </LockedResultsGate>
     </section>

     {isTeamStaff ? (
      <LockedResultsGate
       hasAccess={hasPerformanceCoachCrmAccess}
       hasData={Boolean(teamSummary?.summary.totalEntries)}
       isLoading={isTeamSummaryLoading}
       error={teamSummaryError}
       title="Team summary opens after purchase"
       description="Read-only the team player block, aggregates, and latest results become available after plan activation."
       ctaText="Open team summary"
       minHeightClassName="min-h-[680px]"
      >
      <div className="space-y-5">
       <section
        className="rounded-[28px] border p-5 md:p-6"
        style={{
         background: "linear-gradient(150deg, rgba(0, 227, 150, 0.08), rgba(17, 24, 39, 0.96) 68%)",
         borderColor: "rgba(52, 211, 153, 0.2)"
        }}
       >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
         <div>
          <div className="text-[11px] uppercase tracking-[0.24em]" style={{ color: COLORS.textColorSecondary }}>
           Team mode
          </div>
          <h3 className="mt-2 text-2xl font-semibold" style={{ color: COLORS.textColor }}>
           Team statistics for tests and daily signals
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-7" style={{ color: COLORS.textColorSecondary }}>
           For the staff profile `team` the tab is read-only: it contains only your team data without input forms.
          </p>
         </div>
         <div className="rounded-[22px] border p-4" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
          <div className="text-[11px] uppercase tracking-[0.22em]" style={{ color: COLORS.textColorSecondary }}>Team</div>
          <div className="mt-2 text-xl font-semibold" style={{ color: COLORS.textColor }}>
           {teamSummary?.summary.teamName || user?.teamName || "My team"}
          </div>
         </div>
        </div>

        {isTeamSummaryLoading ? (
         renderInsightSkeletons()
        ) : (
         <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-[22px] border p-4" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
           <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: COLORS.textColorSecondary }}>Players</div>
           <div className="mt-2 text-2xl font-semibold" style={{ color: COLORS.textColor }}>{teamSummary?.summary.playersCount ?? 0}</div>
          </div>
          <div className="rounded-[22px] border p-4" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
           <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: COLORS.textColorSecondary }}>Sleep</div>
           <div className="mt-2 text-2xl font-semibold" style={{ color: COLORS.textColor }}>{teamSummary?.summary.avgSleepHours ?? "-"}</div>
           <div className="mt-1 text-sm" style={{ color: COLORS.textColorSecondary }}>team average</div>
          </div>
          <div className="rounded-[22px] border p-4" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
           <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: COLORS.textColorSecondary }}>Screen time</div>
           <div className="mt-2 text-2xl font-semibold" style={{ color: COLORS.textColor }}>{teamSummary?.summary.avgScreenTimeHours ?? "-"}</div>
           <div className="mt-1 text-sm" style={{ color: COLORS.textColorSecondary }}>average hours</div>
          </div>
          <div className="rounded-[22px] border p-4" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
           <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: COLORS.textColorSecondary }}>State index</div>
           <div className="mt-2 text-2xl font-semibold" style={{ color: COLORS.textColor }}>{teamSummary?.summary.avgStateIndex ?? "-"}</div>
           <div className="mt-1 text-sm" style={{ color: COLORS.textColorSecondary }}>condition and result link</div>
          </div>
         </div>
        )}

        {teamSummaryError && (
         <div
          className="mt-4 flex items-start gap-3 rounded-[18px] border px-4 py-3"
          style={{ borderColor: "rgba(251, 191, 36, 0.24)", backgroundColor: "rgba(251, 191, 36, 0.08)" }}
         >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: "#FBBF24" }} />
          <p className="text-sm leading-6" style={{ color: COLORS.textColor }}>
           {teamSummaryError}
          </p>
         </div>
        )}
       </section>

       <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor }}>
         <CardHeader>
          <CardTitle style={{ color: COLORS.textColor }}>Team players</CardTitle>
          <CardDescription style={{ color: COLORS.textColorSecondary }}>
           Summary of your team test activity, sleep, and screen time.
          </CardDescription>
         </CardHeader>
         <CardContent className="space-y-3">
          {isTeamSummaryLoading ? (
           Array.from({ length: 3 }).map((_, index) => (
            <div key={`team-player-skeleton-${index}`} className="rounded-[18px] border p-4" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
             <Skeleton className="h-5 w-40 bg-white/10" />
             <Skeleton className="mt-3 h-4 w-28 bg-white/10" />
             <Skeleton className="mt-4 h-4 w-36 bg-white/10" />
            </div>
           ))
          ) : (teamSummary?.byPlayer || []).length === 0 ? (
           <p style={{ color: COLORS.textColorSecondary }}>No team player data yet.</p>
          ) : (
           teamSummary!.byPlayer.map((player) => (
            <div key={player.userId} className="rounded-[18px] border p-4" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
             <div className="flex items-start justify-between gap-3">
              <div>
               <div className="text-lg font-semibold" style={{ color: COLORS.textColor }}>{player.name}</div>
               <div className="mt-1 text-sm" style={{ color: COLORS.textColorSecondary }}>
                Records: {player.entries} • Weekly: {player.weeklyEntries}
               </div>
              </div>
              <div className="text-right text-sm" style={{ color: COLORS.textColorSecondary }}>
               <div>Score: {player.avgScore ?? "-"}</div>
               <div>Sleep: {player.avgSleepHours ?? "-"}</div>
               <div>Экран: {player.avgScreenTimeHours ?? "-"}</div>
              </div>
             </div>
            </div>
           ))
          )}
         </CardContent>
        </Card>

        <div className="space-y-5">
         <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor }}>
          <CardHeader>
           <CardTitle style={{ color: COLORS.textColor }}>By test type</CardTitle>
           <CardDescription style={{ color: COLORS.textColorSecondary }}>
            Which test types appear most often and their average score.
          </CardDescription>
         </CardHeader>
         <CardContent className="space-y-3">
          {isTeamSummaryLoading ? (
           Array.from({ length: 3 }).map((_, index) => (
            <div key={`team-type-skeleton-${index}`} className="rounded-[16px] border px-4 py-3" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
             <Skeleton className="h-4 w-full bg-white/10" />
            </div>
           ))
          ) : (teamSummary?.byTestType || []).length === 0 ? (
           <p style={{ color: COLORS.textColorSecondary }}>No saved results yet.</p>
          ) : (
           teamSummary!.byTestType.map((item) => (
             <div key={item.type} className="flex items-center justify-between rounded-[16px] border px-4 py-3" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
              <span style={{ color: COLORS.textColor }}>{getTestTypeLabel(item.type)}</span>
              <span style={{ color: COLORS.textColorSecondary }}>
               {item.entries} • score {item.avgScore ?? "-"}
              </span>
             </div>
            ))
           )}
          </CardContent>
         </Card>

         <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor }}>
          <CardHeader>
           <CardTitle style={{ color: COLORS.textColor }}>Latest records</CardTitle>
           <CardDescription style={{ color: COLORS.textColorSecondary }}>
            Latest results from your team players.
          </CardDescription>
         </CardHeader>
         <CardContent className="space-y-3">
          {isTeamSummaryLoading ? (
           Array.from({ length: 3 }).map((_, index) => (
            <div key={`team-recent-skeleton-${index}`} className="rounded-[16px] border px-4 py-3" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
             <Skeleton className="h-4 w-28 bg-white/10" />
             <Skeleton className="mt-3 h-4 w-full bg-white/10" />
            </div>
           ))
          ) : (teamSummary?.recentEntries || []).length === 0 ? (
           <p style={{ color: COLORS.textColorSecondary }}>No latest records yet.</p>
          ) : (
           teamSummary!.recentEntries.map((entry) => (
             <div key={entry.id} className="rounded-[16px] border px-4 py-3" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-start justify-between gap-3">
               <div>
                <div className="font-medium" style={{ color: COLORS.textColor }}>{entry.playerName}</div>
                <div className="text-sm" style={{ color: COLORS.textColorSecondary }}>
                 {entry.name} • {getTestTypeLabel(entry.testType)}
                </div>
               </div>
               <div className="text-right text-sm" style={{ color: COLORS.textColorSecondary }}>
                <div>{entry.scoreNormalized ?? "-"}</div>
                <div>{new Date(entry.measuredAt).toLocaleDateString("en-US")}</div>
               </div>
              </div>
             </div>
            ))
           )}
          </CardContent>
         </Card>
        </div>
       </section>
      </div>
      </LockedResultsGate>
     ) : (
     <Tabs
      defaultValue="weekly"
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as "weekly")}
      className="space-y-5"
     >
     <div className="sr-only">
      <div className="text-[11px] uppercase tracking-[0.24em]" style={{ color: COLORS.textColorSecondary }}>
       Test mode
      </div>
      <p className="text-sm leading-6" style={{ color: COLORS.textColorSecondary }}>
       Weekly tests and recovery checks are combined into one workflow.
      </p>
     </div>
     <TabsList
      className="sr-only"
      style={{ backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
     >
      <TabsTrigger
       value="weekly"
       className="rounded-[16px] px-4 py-3 text-sm"
       style={{
        color: activeTab === "weekly" ? COLORS.textColor : COLORS.textColorSecondary,
        backgroundColor: activeTab === "weekly" ? "rgba(53, 144, 255, 0.18)" : "transparent"
       }}
      >
       Weekly tests
       <span className="ml-2 text-xs opacity-80">{weeklyTests.length}</span>
      </TabsTrigger>
     </TabsList>

     <TabsContent value="weekly" className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
       <section
        className="rounded-[28px] border p-5 md:p-6"
        style={{
         background: "linear-gradient(150deg, rgba(53, 144, 255, 0.12), rgba(26, 32, 44, 0.95) 65%)",
         borderColor: "rgba(96, 165, 250, 0.2)"
        }}
       >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
         <div>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.24em]" style={{ backgroundColor: "rgba(255,255,255,0.05)", color: COLORS.textColorSecondary }}>
           <ClipboardList className="h-3.5 w-3.5" />
           Weekly work
          </div>
          <h3 className="mt-3 text-2xl font-semibold" style={{ color: COLORS.textColor }}>
           Keep required tests simple
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-7" style={{ color: COLORS.textColorSecondary }}>
           Recommended tasks, the current week, and saved results live in one clean view.
          </p>
         </div>
         <div className="flex items-center gap-2 rounded-full px-2 py-1.5" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
          <Button variant="outline" size="sm" onClick={handlePrevWeek} className="rounded-full" style={{ borderColor: COLORS.borderColor, color: COLORS.primary, backgroundColor: "transparent" }}>
           <CalendarIcon className="mr-2 h-4 w-4" />
           Back
          </Button>
          <span className="px-2 text-sm font-medium" style={{ color: COLORS.textColor }}>{getWeekLabel(currentWeek)}</span>
          <Button variant="outline" size="sm" onClick={handleNextWeek} className="rounded-full" style={{ borderColor: COLORS.borderColor, color: COLORS.primary, backgroundColor: "transparent" }}>
           Forward
          </Button>
         </div>
        </div>

        <div className="mt-5">
         <LockedResultsGate
          hasAccess={hasPerformanceCoachCrmAccess}
          hasData={weeklyTests.length > 0}
          title="Weekly results locked"
          description="Weekly tests are already available, while the weekly summary and latest results unlock after purchase."
          ctaText="Open weekly summary"
          minHeightClassName="min-h-[220px]"
         >
          <div className="grid gap-3 md:grid-cols-3">
           <div className="rounded-[22px] border p-4" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
            <div className="text-[11px] uppercase tracking-[0.22em]" style={{ color: COLORS.textColorSecondary }}>This week</div>
            <div className="mt-2 text-2xl font-semibold" style={{ color: COLORS.textColor }}>{currentWeekTestsCount}</div>
            <div className="mt-1 text-sm" style={{ color: COLORS.textColorSecondary }}>total test records</div>
           </div>
           <div className="rounded-[22px] border p-4" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
            <div className="text-[11px] uppercase tracking-[0.22em]" style={{ color: COLORS.textColorSecondary }}>Weekly</div>
            <div className="mt-2 text-2xl font-semibold" style={{ color: COLORS.textColor }}>{weeklyTests.length}</div>
            <div className="mt-1 text-sm" style={{ color: COLORS.textColorSecondary }}>results this week</div>
           </div>
           <div className="rounded-[22px] border p-4" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
            <div className="text-[11px] uppercase tracking-[0.22em]" style={{ color: COLORS.textColorSecondary }}>Last entry</div>
            <div className="mt-2 text-base font-semibold" style={{ color: COLORS.textColor }}>
             {recentTests[0] ? formatDate(recentTests[0].date, "d MMMM") : "-"}
            </div>
            <div className="mt-1 text-sm" style={{ color: COLORS.textColorSecondary }}>most recent record</div>
           </div>
          </div>
         </LockedResultsGate>
        </div>
       </section>

       <section
        className="rounded-[28px] border p-5 md:p-6"
        style={{
         background: "linear-gradient(150deg, rgba(0, 227, 150, 0.1), rgba(17, 24, 39, 0.95) 68%)",
         borderColor: "rgba(52, 211, 153, 0.2)"
        }}
       >
        <div className="flex items-start gap-3">
         <div className="flex h-11 w-11 items-center justify-center rounded-2xl border" style={{ backgroundColor: "rgba(0, 227, 150, 0.12)", borderColor: "rgba(0, 227, 150, 0.26)", color: "#7EF3D1" }}>
          <Sparkles className="h-5 w-5" />
         </div>
         <div>
          <div className="text-[11px] uppercase tracking-[0.22em]" style={{ color: COLORS.textColorSecondary }}>Recommended weekly</div>
          <h3 className="mt-1 text-xl font-semibold" style={{ color: COLORS.textColor }}>Quick access to tasks</h3>
         </div>
        </div>

        {recommendedWeeklyTests.length > 0 ? (
         <div className="mt-5 space-y-3">
          {recommendedWeeklyTests.map((test, index) => (
           <div key={`weekly-card-${index}`} className="rounded-[22px] border p-4" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
             <div>
              <div className="text-lg font-semibold" style={{ color: COLORS.textColor }}>{test.name}</div>
              <div className="mt-1 text-sm leading-6" style={{ color: COLORS.textColorSecondary }}>
               Open the test and enter the result right away so the weekly rhythm stays intact.
              </div>
             </div>
             <div className="flex gap-2">
              <a href={test.link} target="_blank" rel="noopener noreferrer">
               <Button variant="ghost" className="rounded-2xl" style={{ border: `1px solid ${COLORS.borderColor}`, color: COLORS.primary, backgroundColor: "rgba(255,255,255,0.03)" }}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open
               </Button>
              </a>
              {!isStaff && (
               <Button
                className="rounded-2xl"
                style={{ backgroundColor: COLORS.primary, color: "white" }}
                onClick={() => {
                 setName(test.name);
                 setLink(test.link);
                 setIsWeeklyTest(true);
                 setDate(new Date().toISOString().split("T")[0]);
                 setIsDialogOpen(true);
                }}
               >
                <Plus className="mr-2 h-4 w-4" />
                Result
               </Button>
              )}
             </div>
            </div>
           </div>
          ))}
         </div>
        ) : (
         <div className="mt-5 rounded-[22px] border border-dashed p-5" style={{ borderColor: "rgba(0, 227, 150, 0.22)", backgroundColor: "rgba(255,255,255,0.02)" }}>
          <p className="text-sm font-medium" style={{ color: COLORS.textColor }}>The weekly test list is not filled yet</p>
          <p className="mt-1 text-sm leading-6" style={{ color: COLORS.textColorSecondary }}>
           For now, you can enter your own weekly tests manually. Later, we can shape a separate curated set.
          </p>
         </div>
        )}
       </section>
      </div>

      <LockedResultsGate
       hasAccess={hasPerformanceCoachCrmAccess}
       hasData={weeklyTests.length > 0 || filteredEntries.length > 0}
       isLoading={isEntriesInitialLoading}
       error={entriesLoadError}
       title="Weekly summary already saved"
       description="Weekly tests can be recorded for free. The full result list, score, and weekly history unlock after purchase."
       ctaText="Open weekly results"
       minHeightClassName="min-h-[520px]"
      >
      {isEntriesInitialLoading ? (
       <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
         <div
          key={`weekly-skeleton-${index}`}
          className="rounded-[26px] border p-5"
          style={{
           background: "linear-gradient(155deg, rgba(53, 144, 255, 0.08), rgba(17, 24, 39, 0.96) 70%)",
           borderColor: "rgba(96, 165, 250, 0.18)"
          }}
         >
          <Skeleton className="h-5 w-24 bg-white/10" />
          <Skeleton className="mt-4 h-7 w-3/4 bg-white/10" />
          <div className="mt-5 grid grid-cols-2 gap-3">
           <Skeleton className="h-20 rounded-[18px] bg-white/10" />
           <Skeleton className="h-20 rounded-[18px] bg-white/10" />
          </div>
          <Skeleton className="mt-5 h-10 w-full bg-white/10" />
         </div>
        ))}
       </section>
      ) : weeklyTests.length === 0 ? (
       <section
        className="rounded-[28px] border p-8 text-center"
        style={{ backgroundColor: "rgba(255,255,255,0.03)", borderColor: COLORS.borderColor }}
       >
        <ClipboardList className="mx-auto h-12 w-12" style={{ color: COLORS.primary }} />
        <h3 className="mt-4 text-xl font-semibold" style={{ color: COLORS.textColor }}>No weekly tests recorded for this week yet</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-7" style={{ color: COLORS.textColorSecondary }}>
         Change the period or add a new weekly test so this area becomes your quick guide for the current week.
        </p>
        {!isStaff && (
         <Button
          className="mt-5 rounded-2xl"
          style={{ backgroundColor: COLORS.primary, color: "white" }}
          onClick={() => {
           resetForm();
           setIsWeeklyTest(true);
           setIsDialogOpen(true);
          }}
         >
          <Plus className="mr-2 h-4 w-4" />
          Add weekly test
         </Button>
        )}
       </section>
      ) : (
       <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {weeklyTests.map((test) => (
         <article
          key={test.id}
          className="rounded-[26px] border p-5"
          style={{
           background: "linear-gradient(155deg, rgba(53, 144, 255, 0.1), rgba(17, 24, 39, 0.96) 70%)",
           borderColor: "rgba(96, 165, 250, 0.18)"
          }}
         >
          <div className="flex items-start justify-between gap-3">
           <div>
            <div className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.18em]" style={{ backgroundColor: "rgba(255,255,255,0.06)", color: COLORS.textColorSecondary }}>
             <CalendarIcon className="h-3.5 w-3.5" />
             {formatDate(test.date, "d MMMM")}
            </div>
            <h3 className="mt-3 text-lg font-semibold" style={{ color: COLORS.textColor }}>{test.name || "Untitled"}</h3>
            <p className="mt-2 text-sm leading-6" style={{ color: COLORS.textColorSecondary }}>
             {typeof test.scoreNormalized === "number"
              ? "The result has already been recorded and is included in analytics."
              : "The card was saved without a score; you can add the result later."}
            </p>
           </div>
           <div className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: "rgba(0, 227, 150, 0.14)", color: "#7EF3D1" }}>
            {getTestTypeLabel(test.testType)}
           </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
           <div className="rounded-[18px] border px-4 py-3" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
            <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: COLORS.textColorSecondary }}>Score</div>
            <div className="mt-1 text-xl font-semibold" style={{ color: COLORS.textColor }}>
             {typeof test.scoreNormalized === "number" ? `${test.scoreNormalized}${test.unit || "%"}` : "-"}
            </div>
           </div>
           <div className="rounded-[18px] border px-4 py-3" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
            <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: COLORS.textColorSecondary }}>Attempts</div>
            <div className="mt-1 text-xl font-semibold" style={{ color: COLORS.textColor }}>{test.attempts || 1}</div>
           </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm" style={{ color: COLORS.textColorSecondary }}>
           {test.durationSec && (
            <span className="rounded-full px-3 py-1" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
             {Math.round(test.durationSec / 60)} мин
            </span>
           )}
           {test.context?.role && (
            <span className="rounded-full px-3 py-1" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
             {test.context.role}
            </span>
           )}
           {test.context?.map && (
            <span className="rounded-full px-3 py-1" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
             {test.context.map}
            </span>
           )}
          </div>

          <div className="mt-5 flex items-center justify-between">
           <div className="flex items-center gap-2">
            {test.link && (
             <a href={test.link} target="_blank" rel="noopener noreferrer">
              <Button
               variant="ghost"
               size="icon"
               className="rounded-2xl"
               title="Open test"
               aria-label={`Open test ${test.name || "без названия"}`}
               style={{ color: COLORS.primary, border: `1px solid ${COLORS.borderColor}`, backgroundColor: "rgba(255,255,255,0.03)" }}
              >
               <ExternalLink className="h-4 w-4" />
              </Button>
             </a>
            )}
            {test.screenshotUrl && (
             <Dialog>
              <DialogTrigger asChild>
               <Button
                variant="ghost"
                size="icon"
                className="rounded-2xl"
                title="Open screenshot"
                aria-label={`Open screenshot теста ${test.name || "без названия"}`}
                style={{ color: COLORS.primary, border: `1px solid ${COLORS.borderColor}`, backgroundColor: "rgba(255,255,255,0.03)" }}
               >
                <Image className="h-4 w-4" />
               </Button>
              </DialogTrigger>
              <DialogContent style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor }}>
               <DialogHeader>
                <DialogTitle style={{ color: COLORS.textColor }}>Test screenshot: {test.name}</DialogTitle>
               </DialogHeader>
               <img src={test.screenshotUrl} alt={test.name} className="w-full rounded-md" />
              </DialogContent>
             </Dialog>
            )}
           </div>

           {!isStaff && (
            <div className="flex items-center gap-2">
             <Button
              variant="ghost"
              size="icon"
              className="rounded-2xl"
              title="Edit record"
              aria-label={`Edit test ${test.name || "без названия"}`}
              style={{ color: COLORS.primary, border: `1px solid ${COLORS.borderColor}`, backgroundColor: "rgba(255,255,255,0.03)" }}
              onClick={() => handleEdit(test)}
             >
              <Edit className="h-4 w-4" />
             </Button>
             <Button
              variant="ghost"
              size="icon"
              className="rounded-2xl"
              title="Delete record"
              aria-label={`Delete тест ${test.name || "без названия"}`}
              style={{ color: COLORS.danger, border: `1px solid ${COLORS.borderColor}`, backgroundColor: "rgba(255,255,255,0.03)" }}
              onClick={() => handleDelete(test.id)}
             >
              <Trash2 className="h-4 w-4" />
             </Button>
            </div>
           )}
          </div>
         </article>
        ))}
       </section>
      )}
      </LockedResultsGate>
     </TabsContent>

     </Tabs>
     )}
   </div>
   
   <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
    <DialogContent
     className="flex max-h-[calc(100vh-2rem)] flex-col gap-0 overflow-hidden border p-0 sm:max-w-[760px]"
     style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor }}
    >
     <div
      className="absolute inset-x-0 top-0 h-40"
      style={{ background: "linear-gradient(180deg, rgba(53, 144, 255, 0.18), rgba(53, 144, 255, 0))" }}
     />
     <DialogHeader className="relative space-y-3 border-b px-6 pb-4 pt-6" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <div className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.24em]" style={{ backgroundColor: "rgba(255,255,255,0.05)", color: COLORS.textColorSecondary }}>
       <CalendarIcon className="h-3.5 w-3.5" />
       {selectedDateLabel}
      </div>
      <DialogTitle style={{ color: COLORS.textColor }}>
       {editingTest ? "Edit test" : "Add test"}
      </DialogTitle>
      <DialogDescription style={{ color: COLORS.textColorSecondary }}>
       {editingTest
        ? "Update the result, metrics, and context so analytics stay clean."
        : "Build the test record in one place: basic info, score, condition, and game context."}
      </DialogDescription>
     </DialogHeader>

     <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
      <div className="space-y-5">
       <div className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-5">
         <div className="rounded-[24px] border p-5" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
          <div className="flex items-start gap-3">
           <div className="flex h-11 w-11 items-center justify-center rounded-2xl border" style={{ backgroundColor: "rgba(53, 144, 255, 0.12)", borderColor: "rgba(53, 144, 255, 0.26)", color: COLORS.primary }}>
            <ClipboardList className="h-5 w-5" />
           </div>
           <div>
            <div className="text-lg font-semibold" style={{ color: COLORS.textColor }}>Basic information</div>
            <p className="mt-1 text-sm leading-6" style={{ color: COLORS.textColorSecondary }}>
             What test it is, when it was taken, and whether it belongs to the weekly rhythm.
            </p>
           </div>
          </div>
          <div className="mt-5 space-y-4">
           <div className="space-y-2">
            <Label htmlFor="name" style={{ color: COLORS.textColor }}>Test name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-2xl" style={fieldStyle} />
            <p className="text-xs leading-5" style={{ color: COLORS.textColorSecondary }}>
             Can be left empty if you record only by test type.
            </p>
           </div>
           <div className="space-y-2">
            <Label htmlFor="link" style={{ color: COLORS.textColor }}>Link</Label>
            <Input id="link" value={link} onChange={(e) => setLink(e.target.value)} className="rounded-2xl" style={fieldStyle} />
           </div>
           <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
             <Label htmlFor="date" style={{ color: COLORS.textColor }}>Date</Label>
             <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-2xl" style={fieldStyle} />
            </div>
            <div className="space-y-2">
             <Label htmlFor="testType" style={{ color: COLORS.textColor }}>Test type</Label>
             <Input id="testType" value={testType} onChange={(e) => setTestType(e.target.value)} className="rounded-2xl" style={fieldStyle} />
             <p className="text-xs leading-5" style={{ color: COLORS.textColorSecondary }}>
              For example: reaction, aim, cognitive, visual_search.
             </p>
            </div>
           </div>
           <div className="rounded-[20px] border px-4 py-3" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
            <div className="flex items-center justify-between gap-3">
             <div>
              <div className="text-sm font-medium" style={{ color: COLORS.textColor }}>Weekly test</div>
              <div className="mt-1 text-sm" style={{ color: COLORS.textColorSecondary }}>
               {isWeeklyTest ? "This record will enter the weekly loop." : "This record will remain a regular test."}
              </div>
             </div>
             <Switch id="weekly-test" checked={isWeeklyTest} onCheckedChange={setIsWeeklyTest} />
            </div>
           </div>
          </div>
         </div>

         <div className="rounded-[24px] border p-5" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
          <div className="flex items-start gap-3">
           <div className="flex h-11 w-11 items-center justify-center rounded-2xl border" style={{ backgroundColor: "rgba(0, 227, 150, 0.12)", borderColor: "rgba(0, 227, 150, 0.26)", color: "#7EF3D1" }}>
            <Gauge className="h-5 w-5" />
           </div>
           <div>
            <div className="text-lg font-semibold" style={{ color: COLORS.textColor }}>Test result</div>
            <p className="mt-1 text-sm leading-6" style={{ color: COLORS.textColorSecondary }}>
             Core metrics used later for comparison and analytics.
            </p>
           </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
           <div className="space-y-2">
            <Label htmlFor="rawScore" style={{ color: COLORS.textColor }}>Raw score</Label>
            <Input id="rawScore" placeholder="For example, 42" value={rawScore} onChange={(e) => setRawScore(e.target.value)} inputMode="decimal" className="rounded-2xl" style={fieldStyle} />
           </div>
           <div className="space-y-2">
            <Label htmlFor="scoreNormalized" style={{ color: COLORS.textColor }}>Normalized score</Label>
            <Input id="scoreNormalized" placeholder="0-100" value={scoreNormalized} onChange={(e) => setScoreNormalized(e.target.value)} inputMode="decimal" className="rounded-2xl" style={fieldStyle} />
           </div>
           <div className="space-y-2">
            <Label htmlFor="unit" style={{ color: COLORS.textColor }}>Unit</Label>
            <Input id="unit" placeholder="%" value={unit} onChange={(e) => setUnit(e.target.value)} className="rounded-2xl" style={fieldStyle} />
           </div>
           <div className="space-y-2">
            <Label htmlFor="durationSec" style={{ color: COLORS.textColor }}>Duration, sec.</Label>
            <Input id="durationSec" placeholder="For example, 180" value={durationSec} onChange={(e) => setDurationSec(e.target.value)} inputMode="numeric" className="rounded-2xl" style={fieldStyle} />
           </div>
           <div className="space-y-2 md:col-span-2">
            <Label htmlFor="attempts" style={{ color: COLORS.textColor }}>Attempt count</Label>
            <Input id="attempts" placeholder="1" value={attempts} onChange={(e) => setAttempts(e.target.value)} inputMode="numeric" className="rounded-2xl" style={fieldStyle} />
           </div>
          </div>
         </div>
        </div>

        <div className="space-y-5">
         <div className="rounded-[24px] border p-5" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
          <div className="flex items-start gap-3">
           <div className="flex h-11 w-11 items-center justify-center rounded-2xl border" style={{ backgroundColor: "rgba(164, 108, 255, 0.12)", borderColor: "rgba(164, 108, 255, 0.26)", color: "#C4A5FF" }}>
            <Brain className="h-5 w-5" />
           </div>
           <div>
            <div className="text-lg font-semibold" style={{ color: COLORS.textColor }}>Condition snapshot</div>
            <p className="mt-1 text-sm leading-6" style={{ color: COLORS.textColorSecondary }}>
             Resource and focus state at the time of completion.
            </p>
           </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
           <div className="space-y-2">
            <Label htmlFor="fatigue" style={{ color: COLORS.textColor }}>Fatigue</Label>
            <Input id="fatigue" placeholder="0-10" value={fatigue} onChange={(e) => setFatigue(e.target.value)} inputMode="decimal" className="rounded-2xl" style={fieldStyle} />
           </div>
           <div className="space-y-2">
            <Label htmlFor="focus" style={{ color: COLORS.textColor }}>Focus</Label>
            <Input id="focus" placeholder="0-10" value={focus} onChange={(e) => setFocus(e.target.value)} inputMode="decimal" className="rounded-2xl" style={fieldStyle} />
           </div>
           <div className="space-y-2">
            <Label htmlFor="stress" style={{ color: COLORS.textColor }}>Stress</Label>
            <Input id="stress" placeholder="0-10" value={stress} onChange={(e) => setStress(e.target.value)} inputMode="decimal" className="rounded-2xl" style={fieldStyle} />
           </div>
           <div className="space-y-2">
            <Label htmlFor="sleepHours" style={{ color: COLORS.textColor }}>Sleep, hours</Label>
            <Input id="sleepHours" placeholder="For example, 7.5" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} inputMode="decimal" className="rounded-2xl" style={fieldStyle} />
           </div>
           <div className="space-y-2">
            <Label htmlFor="snapshotMood" style={{ color: COLORS.textColor }}>Mood</Label>
            <Input id="snapshotMood" placeholder="0-10" value={snapshotMood} onChange={(e) => setSnapshotMood(e.target.value)} inputMode="decimal" className="rounded-2xl" style={fieldStyle} />
           </div>
           <div className="space-y-2">
            <Label htmlFor="snapshotEnergy" style={{ color: COLORS.textColor }}>Energy</Label>
            <Input id="snapshotEnergy" placeholder="0-10" value={snapshotEnergy} onChange={(e) => setSnapshotEnergy(e.target.value)} inputMode="decimal" className="rounded-2xl" style={fieldStyle} />
           </div>
          </div>
         </div>

         <div className="rounded-[24px] border p-5" style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}>
          <div className="flex items-start gap-3">
           <div className="flex h-11 w-11 items-center justify-center rounded-2xl border" style={{ backgroundColor: "rgba(253, 186, 116, 0.12)", borderColor: "rgba(253, 186, 116, 0.26)", color: "#FDBA74" }}>
            <LinkIcon className="h-5 w-5" />
           </div>
           <div>
            <div className="text-lg font-semibold" style={{ color: COLORS.textColor }}>Game context</div>
            <p className="mt-1 text-sm leading-6" style={{ color: COLORS.textColorSecondary }}>
             If the test relates to a role, map, or game type, capture it right away.
            </p>
           </div>
          </div>
          <div className="mt-5 grid gap-4">
           <div className="space-y-2">
            <Label htmlFor="matchType" style={{ color: COLORS.textColor }}>Match type</Label>
            <Input id="matchType" placeholder="For example, scrim or officials" value={matchType} onChange={(e) => setMatchType(e.target.value)} className="rounded-2xl" style={fieldStyle} />
           </div>
           <div className="space-y-2">
            <Label htmlFor="contextMap" style={{ color: COLORS.textColor }}>Map</Label>
            <Input id="contextMap" placeholder="For example, Mirage" value={contextMap} onChange={(e) => setContextMap(e.target.value)} className="rounded-2xl" style={fieldStyle} />
           </div>
           <div className="space-y-2">
            <Label htmlFor="contextRole" style={{ color: COLORS.textColor }}>Role</Label>
            <Input id="contextRole" placeholder="For example, IGL" value={contextRole} onChange={(e) => setContextRole(e.target.value)} className="rounded-2xl" style={fieldStyle} />
           </div>
          </div>
         </div>
        </div>
       </div>
      </div>
     </div>

     <DialogFooter
      className="border-t px-6 py-4"
      style={{
       borderColor: "rgba(255,255,255,0.06)",
       backgroundColor: "rgba(11, 16, 32, 0.72)",
       backdropFilter: "blur(16px)"
      }}
     >
      <Button 
       type="button" 
       variant="outline" 
       onClick={() => setIsDialogOpen(false)}
       disabled={isLoading}
       style={{ borderColor: COLORS.borderColor, color: COLORS.textColor }}
      >
       Cancel
      </Button>
      <Button 
       type="submit" 
       onClick={handleSubmit}
       disabled={isLoading}
       className="rounded-2xl"
       style={{ backgroundColor: COLORS.primary, color: "white" }}
      >
       {isLoading ? (
        <>
         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
         Saving...
        </>
       ) : editingTest ? "Save" : "Add"}
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </div>
 );
};

export default TestTracker;
