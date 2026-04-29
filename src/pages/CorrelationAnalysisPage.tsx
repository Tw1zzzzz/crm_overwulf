import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, BrainCircuit, Calendar, Clock, Sparkles, Target, TrendingUp, BarChart3, Trophy } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import SubscriptionFeatureGate from '@/components/SubscriptionFeatureGate';
import {
 CorrelationAssistantResponse,
 getCorrelationAssistantInsight as requestCorrelationAssistantInsight,
} from '@/lib/api';
import { buildCorrelationAssistantPayload } from '@/utils/correlationAiSummary';


/**
 * Интерфейс для метрики
 */
interface MetricData {
 date: string;
 [key: string]: string | number | null;
 mood: number | null;
 energy: number | null;
 sleepHours: number | null;
 balanceAvg: number | null;
 screenTime: number | null;
 winRate: number | null;
 kdRatio: number | null;
 kills: number | null;
 deaths: number | null;
 assists: number | null;
 adr: number | null;
 kpr: number | null;
 deathPerRound: number | null;
 avgKr: number | null;
 avgKd: number | null;
 kast: number | null;
 firstKills: number | null;
 firstDeaths: number | null;
 openingDuelDiff: number | null;
 udr: number | null;
 avgMultikills: number | null;
 clutchesWon: number | null;
 avgFlashTime: number | null;
 roundWinRate: number | null;
 currentElo: number | null;
 brainPerformanceIndex: number | null;
 brainBatteryCount: number | null;
 faceitMatches: number | null;
 faceitWinRate: number | null;
 faceitKdRatio: number | null;
 faceitAdr: number | null;
 faceitKast: number | null;
 faceitKr: number | null;
 faceitHsPercent: number | null;
 faceitKills: number | null;
 faceitDeaths: number | null;
 faceitAssists: number | null;
}

const FACEIT_GROUP_METRICS = [
 'faceitMatches',
 'faceitWinRate',
 'faceitKdRatio',
 'faceitAdr',
 'faceitKast',
 'faceitKr',
 'faceitHsPercent',
 'faceitKills',
 'faceitDeaths',
 'faceitAssists'
] as const;

const ELO_METRICS = ['currentElo'] as const;
const DEFAULT_SELECTED_METRICS = ['mood', 'energy', 'sleepHours', 'brainPerformanceIndex', 'currentElo', 'faceitKdRatio'] as const;
const CORRELATION_SESSION_STORAGE_KEY = 'correlation-analysis:last-session';

type CorrelationResultTab = 'overview' | 'analysis';

interface StatCard {
 title: string;
 value: string;
 change: string;
 icon: React.ReactNode;
 color: string;
}

interface GameStatsUser {
 _id?: string;
 name?: string;
 email?: string;
}

interface GameStatsEntry {
 _id: string;
 date: string;
 userId?: string | GameStatsUser;
 kills: number;
 deaths: number;
 assists: number;
 adr?: number | null;
 kpr?: number | null;
 deathPerRound?: number | null;
 avgKr?: number | null;
 avgKd?: number | null;
 kast?: number | null;
 firstKills?: number | null;
 firstDeaths?: number | null;
 openingDuelDiff?: number | null;
 udr?: number | null;
 avgMultikills?: number | null;
 clutchesWon?: number | null;
 avgFlashTime?: number | null;
 kdRatio: number;
 winRate: number;
 totalRounds: number;
 roundsWon: number;
 roundsLost: number;
 roundWinRate: number;
 ctSide?: {
  winRate?: number;
 };
 tSide?: {
  winRate?: number;
 };
}

type DailyGameStatsComparison = {
 date: string;
 entries: number;
 kills: number;
 deaths: number;
 assists: number;
 winRate: number | null;
 kdRatio: number | null;
};

type CorrelationComparisonRow = {
 date: string;
 [key: string]: string | number | null;
 mood: number | null;
 energy: number | null;
 sleepHours: number | null;
 balanceAvg: number | null;
 screenTime: number | null;
 currentElo: number | null;
 brainPerformanceIndex: number | null;
 brainBatteryCount: number | null;
 kills: number | null;
 deaths: number | null;
 assists: number | null;
 adr: number | null;
 kpr: number | null;
 deathPerRound: number | null;
 avgKr: number | null;
 avgKd: number | null;
 kast: number | null;
 firstKills: number | null;
 firstDeaths: number | null;
 openingDuelDiff: number | null;
 udr: number | null;
 avgMultikills: number | null;
 clutchesWon: number | null;
 avgFlashTime: number | null;
 roundWinRate: number | null;
 winRate: number | null;
 kdRatio: number | null;
 faceitMatches: number | null;
 faceitWinRate: number | null;
 faceitKdRatio: number | null;
 faceitAdr: number | null;
 faceitKast: number | null;
 faceitKr: number | null;
 faceitHsPercent: number | null;
 faceitKills: number | null;
 faceitDeaths: number | null;
 faceitAssists: number | null;
};

interface PersistedCorrelationSession {
 version: 2;
 activeTab: CorrelationResultTab;
 analysisGameStatsDaily: DailyGameStatsComparison[];
 analysisMode: 'team' | 'individual';
 assistantInsight: CorrelationAssistantResponse | null;
 chartData: MetricData[];
 chartMode: 'combined' | 'split';
 currentElo: number | null;
 dateFrom: string;
 dateTo: string;
 faceitMetricsStatus: 'ok' | 'partial' | 'unavailable';
 selectedMetrics: string[];
 selectedPlayerId: string;
 updatedAt: string;
}

const getDefaultDateRange = () => {
 const today = new Date();
 const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

 return {
  dateFrom: thirtyDaysAgo.toISOString().split('T')[0],
  dateTo: today.toISOString().split('T')[0]
 };
};

const readPersistedCorrelationSession = (): PersistedCorrelationSession | null => {
 if (typeof window === 'undefined') return null;

 try {
  const raw = window.localStorage.getItem(CORRELATION_SESSION_STORAGE_KEY);
  if (!raw) return null;

  const parsed = JSON.parse(raw) as Partial<PersistedCorrelationSession>;
  if (
   parsed.version !== 1 &&
   parsed.version !== 2 ||
   !parsed.dateFrom ||
   !parsed.dateTo ||
   !Array.isArray(parsed.chartData) ||
   !Array.isArray(parsed.analysisGameStatsDaily)
  ) {
   return null;
  }

  const migratedSelectedMetrics = Array.isArray(parsed.selectedMetrics) && parsed.selectedMetrics.length
   ? parsed.selectedMetrics.map((metric) => (metric === 'testsScore' ? 'brainPerformanceIndex' : metric))
   : [...DEFAULT_SELECTED_METRICS];

  return {
   version: 2,
   activeTab: parsed.activeTab === 'analysis' ? 'analysis' : 'overview',
   analysisGameStatsDaily: parsed.analysisGameStatsDaily,
   analysisMode: parsed.analysisMode === 'individual' ? 'individual' : 'team',
   assistantInsight: parsed.assistantInsight || null,
   chartData: parsed.chartData,
   chartMode: parsed.chartMode === 'split' ? 'split' : 'combined',
   currentElo: typeof parsed.currentElo === 'number' ? parsed.currentElo : null,
   dateFrom: parsed.dateFrom,
   dateTo: parsed.dateTo,
   faceitMetricsStatus: parsed.faceitMetricsStatus === 'ok' || parsed.faceitMetricsStatus === 'partial'
    ? parsed.faceitMetricsStatus
    : 'unavailable',
   selectedMetrics: migratedSelectedMetrics,
   selectedPlayerId: typeof parsed.selectedPlayerId === 'string' ? parsed.selectedPlayerId : '',
   updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
  };
 } catch (error) {
  console.error('[CorrelationAnalysisPage] Failed to restore the last session:', error);
  return null;
 }
};

const writePersistedCorrelationSession = (session: PersistedCorrelationSession) => {
 if (typeof window === 'undefined') return;

 try {
  window.localStorage.setItem(CORRELATION_SESSION_STORAGE_KEY, JSON.stringify(session));
 } catch (error) {
  console.error('[CorrelationAnalysisPage] Failed to save the last session:', error);
 }
};


/**
 *  СЃС‚СЂ  
 */
const CorrelationAnalysisPage: React.FC = () => {
 const { user } = useAuth();
 const isSoloPlayer = user?.role === 'player' && user?.playerType === 'solo';
 const hasCorrelationAnalysisAccess = Boolean(user?.hasCorrelationAnalysisAccess);
 const [restoredSession] = useState<PersistedCorrelationSession | null>(() => readPersistedCorrelationSession());
 const defaultDateRange = getDefaultDateRange();
 const hasRestoredResults = Boolean(
  restoredSession?.chartData.length ||
  restoredSession?.analysisGameStatsDaily.length ||
  restoredSession?.assistantInsight
 );
 const [dateFrom, setDateFrom] = useState(restoredSession?.dateFrom ?? defaultDateRange.dateFrom);
 const [dateTo, setDateTo] = useState(restoredSession?.dateTo ?? defaultDateRange.dateTo);
 const [selectedMetrics, setSelectedMetrics] = useState<string[]>(
  restoredSession?.selectedMetrics?.length ? restoredSession.selectedMetrics : [...DEFAULT_SELECTED_METRICS]
 );
 const [chartData, setChartData] = useState<MetricData[]>(restoredSession?.chartData ?? []);
 const [chartMode, setChartMode] = useState<'combined' | 'split'>(restoredSession?.chartMode ?? 'combined');
 const [loading, setLoading] = useState(false);
 const [stats, setStats] = useState<StatCard[]>([]);
 const [currentElo, setCurrentElo] = useState<number | null>(restoredSession?.currentElo ?? null);
 const [faceitMetricsStatus, setFaceitMetricsStatus] = useState<'ok' | 'partial' | 'unavailable'>(
  restoredSession?.faceitMetricsStatus ?? 'unavailable'
 );
 const [assistantLoading, setAssistantLoading] = useState(false);
 const [assistantInsight, setAssistantInsight] = useState<CorrelationAssistantResponse | null>(
  restoredSession?.assistantInsight ?? null
 );
 const [resultTab, setResultTab] = useState<CorrelationResultTab>(restoredSession?.activeTab ?? 'overview');
 const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(restoredSession?.updatedAt ?? null);
 
 //  СЃ   players
 const [analysisMode, setAnalysisMode] = useState<'team' | 'individual'>(
  isSoloPlayer ? 'individual' : restoredSession?.analysisMode ?? 'team'
 );
 const [players, setPlayers] = useState<any[]>([]);
 const [selectedPlayerId, setSelectedPlayerId] = useState(
  isSoloPlayer ? (user?.id || restoredSession?.selectedPlayerId || '') : restoredSession?.selectedPlayerId || ''
 );
 const [loadingPlayers, setLoadingPlayers] = useState(false);
 const [analysisGameStatsDaily, setAnalysisGameStatsDaily] = useState<DailyGameStatsComparison[]>(
  restoredSession?.analysisGameStatsDaily ?? []
 );
 const [autoRefreshDone, setAutoRefreshDone] = useState(!hasRestoredResults);

 const formatNumber = (value: number, decimals = 2) => {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString('en-US', {
   minimumFractionDigits: 0,
   maximumFractionDigits: decimals
  });
 };

 const formatPercent = (value: number, decimals = 1) => `${formatNumber(value, decimals)}%`;
 const formatNullable = (value: number | null, decimals = 2) => (value === null ? '' : formatNumber(value, decimals));
 const formatNullablePercent = (value: number | null, decimals = 1) => (value === null ? '' : formatPercent(value, decimals));

 const safeDivide = (numerator: number, denominator: number): number | null => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
  return numerator / denominator;
 };

 const buildDailyGameStatsComparison = (entries: GameStatsEntry[]): DailyGameStatsComparison[] => {
  const grouped = new Map<string, {
   entries: number;
   kills: number;
   deaths: number;
   assists: number;
   winRateSum: number;
   winRateCount: number;
   kdRatioSum: number;
   kdRatioCount: number;
  }>();

  entries.forEach((entry) => {
   const dateKey = new Date(entry.date).toISOString().split('T')[0];
   if (!grouped.has(dateKey)) {
    grouped.set(dateKey, {
     entries: 0,
     kills: 0,
     deaths: 0,
     assists: 0,
     winRateSum: 0,
     winRateCount: 0,
     kdRatioSum: 0,
     kdRatioCount: 0
    });
   }

   const bucket = grouped.get(dateKey)!;
   bucket.entries += 1;
   bucket.kills += entry.kills || 0;
   bucket.deaths += entry.deaths || 0;
   bucket.assists += entry.assists || 0;

   if (Number.isFinite(entry.winRate)) {
    bucket.winRateSum += entry.winRate;
    bucket.winRateCount += 1;
   }

   if (Number.isFinite(entry.kdRatio)) {
    bucket.kdRatioSum += entry.kdRatio;
    bucket.kdRatioCount += 1;
   }
  });

  return Array.from(grouped.entries())
   .map(([date, value]) => ({
    date,
    entries: value.entries,
    kills: value.kills,
    deaths: value.deaths,
    assists: value.assists,
    winRate: value.winRateCount ? value.winRateSum / value.winRateCount : null,
    kdRatio: value.kdRatioCount ? value.kdRatioSum / value.kdRatioCount : null
   }))
   .sort((a, b) => a.date.localeCompare(b.date));
 };

 const buildCorrelationComparisonRows = (
  metricsData: MetricData[],
  gameStatsDaily: DailyGameStatsComparison[]
 ): CorrelationComparisonRow[] => {
  const metricsByDate = new Map(metricsData.map((item) => [item.date, item]));
  const gameStatsByDate = new Map(gameStatsDaily.map((item) => [item.date, item]));
  const allDates = Array.from(new Set([
   ...metricsData.map((item) => item.date),
   ...gameStatsDaily.map((item) => item.date)
  ])).sort((a, b) => a.localeCompare(b));

  return allDates.map((date) => {
   const metric = metricsByDate.get(date);
   const game = gameStatsByDate.get(date);

   return {
    ...(metric || { date }),
    date,
    sleepHours: metric?.sleepHours ?? null,
    brainPerformanceIndex: metric?.brainPerformanceIndex ?? null,
    brainBatteryCount: metric?.brainBatteryCount ?? null,
    kills: game?.kills ?? metric?.kills ?? null,
    deaths: game?.deaths ?? metric?.deaths ?? null,
    assists: game?.assists ?? metric?.assists ?? null,
    adr: metric?.adr ?? null,
    kpr: metric?.kpr ?? null,
    deathPerRound: metric?.deathPerRound ?? null,
    avgKr: metric?.avgKr ?? null,
    avgKd: metric?.avgKd ?? null,
    kast: metric?.kast ?? null,
    firstKills: metric?.firstKills ?? null,
    firstDeaths: metric?.firstDeaths ?? null,
    openingDuelDiff: metric?.openingDuelDiff ?? null,
    udr: metric?.udr ?? null,
    avgMultikills: metric?.avgMultikills ?? null,
    clutchesWon: metric?.clutchesWon ?? null,
    avgFlashTime: metric?.avgFlashTime ?? null,
    roundWinRate: metric?.roundWinRate ?? null,
    winRate: game?.winRate ?? metric?.winRate ?? null,
    kdRatio: game?.kdRatio ?? metric?.kdRatio ?? null,
    faceitMatches: metric?.faceitMatches ?? null,
    faceitWinRate: metric?.faceitWinRate ?? null,
    faceitKdRatio: metric?.faceitKdRatio ?? null,
    faceitAdr: metric?.faceitAdr ?? null,
    faceitKast: metric?.faceitKast ?? null,
    faceitKr: metric?.faceitKr ?? null,
    faceitHsPercent: metric?.faceitHsPercent ?? null,
    faceitKills: metric?.faceitKills ?? null,
    faceitDeaths: metric?.faceitDeaths ?? null,
    faceitAssists: metric?.faceitAssists ?? null
   };
  });
 };

 /**
  *  СЃ players
  */
 const fetchPlayers = async () => {
  if (!hasCorrelationAnalysisAccess) {
   setPlayers([]);
   return;
  }

  setLoadingPlayers(true);
  try {
   //   API endpoint
   const response = await fetch('/api/users/players', {
    headers: {
     'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
   });
   
   if (response.ok) {
    const players = await response.json();
    setPlayers(players || []);
   } else {
    console.error('Player loading error:', response.statusText);
   }
  } catch (error) {
   console.error('Player loading error:', error);
   toast.error('Error while loading player list');
  } finally {
   setLoadingPlayers(false);
  }
 };

 /**
  *    
  */
 const fetchAnalysisData = async ({ resetAssistant = true, silent = false }: { resetAssistant?: boolean; silent?: boolean } = {}) => {
  if (!hasCorrelationAnalysisAccess) {
   if (!silent) {
    toast.error('This section requires a plan "Correlation analysis"');
   }
   return;
  }

  if (!dateFrom || !dateTo) {
   if (!silent) {
    toast.error('Choose a period for analysis');
   }
   return;
  }

  if (analysisMode === 'individual' && !selectedPlayerId) {
   if (!silent) {
    toast.error('Select a player for individual analysis');
   }
   return;
  }

  setLoading(true);
  if (resetAssistant) {
   setAssistantInsight(null);
  }
  try {
   //   
   const params = new URLSearchParams({
    dateFrom,
    dateTo,
    mode: analysisMode
   });
   
   if (analysisMode === 'individual' && selectedPlayerId) {
    params.append('playerId', selectedPlayerId);
   }

   const gameStatsParams = new URLSearchParams({
    startDate: dateFrom,
    endDate: dateTo,
    mode: analysisMode,
    limit: '500',
    page: '1'
   });

   if (analysisMode === 'individual' && selectedPlayerId) {
    gameStatsParams.append('playerId', selectedPlayerId);
   }
   
   console.log('Correlation data request:', {
    dateFrom,
    dateTo,
    mode: analysisMode,
    playerId: selectedPlayerId
   });

   // 'С‹   API 
   const [response, gameStatsResponse] = await Promise.all([
    fetch(`/api/correlations/multi-metrics?${params.toString()}`, {
     headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
     }
    }),
    fetch(`/api/game-stats?${gameStatsParams.toString()}`, {
     headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
     }
    })
   ]);

   if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
   }

   const result = await response.json();
   
   if (result.success) {
    console.log('Received correlation data:', result);
    const metricsData = result.data || [];
    const metaCurrentElo = typeof result.meta?.currentElo === 'number' ? result.meta.currentElo : null;
    const metaFaceitStatus = result.meta?.faceitMetricsStatus === 'ok' || result.meta?.faceitMetricsStatus === 'partial'
     ? result.meta.faceitMetricsStatus
     : 'unavailable';
    setCurrentElo(metaCurrentElo);
    setFaceitMetricsStatus(metaFaceitStatus);
    const metricsWithEloLine = metaCurrentElo != null
     ? metricsData.map((item) => ({ ...item, currentElo: metaCurrentElo }))
     : metricsData;
    let chartMergedData: MetricData[] = metricsWithEloLine;
    let nextDailyGameStats: DailyGameStatsComparison[] = [];
    if (gameStatsResponse.ok) {
     const gameStatsResult = await gameStatsResponse.json();
     nextDailyGameStats = buildDailyGameStatsComparison((gameStatsResult.data || []) as GameStatsEntry[]);
     setAnalysisGameStatsDaily(nextDailyGameStats);
     chartMergedData = buildCorrelationComparisonRows(metricsWithEloLine, nextDailyGameStats);
    } else {
     console.error('[CorrelationAnalysisPage] Failed to load game metrics for comparison:', gameStatsResponse.status);
     setAnalysisGameStatsDaily([]);
    }

    setChartData(chartMergedData);
    persistCurrentSession({
     assistant: resetAssistant ? null : assistantInsight,
     nextAnalysisGameStatsDaily: nextDailyGameStats,
     nextChartData: chartMergedData,
     nextCurrentElo: metaCurrentElo,
     nextFaceitMetricsStatus: metaFaceitStatus,
     updatedAt: new Date().toISOString(),
    });
    
    const playerName = analysisMode === 'individual' && selectedPlayerId 
     ? players.find(p => p._id === selectedPlayerId)?.name || ''
     : 'team';
    
    if (!silent) {
     toast.success(` ${analysisMode === 'individual' ? playerName : ''}  (${result.data?.length || 0} )`);
    }
   } else {
    throw new Error(result.message || 'Error while getting data');
   }
  } catch (error) {
   console.error('Data loading error:', error);
   setAnalysisGameStatsDaily([]);
   setCurrentElo(null);
   setFaceitMetricsStatus('unavailable');
   if (resetAssistant) {
    setAssistantInsight(null);
   }
   if (!silent) {
    toast.error(`Error while loading data: ${error.message}`);
   }
  } finally {
   setLoading(false);
  }
 };

 const generateStatsFromData = (data: MetricData[], mode: string): StatCard[] => {
  if (!data || data.length === 0) {
   return [];
  }

  // 'С‹h СЃСЂ 
  const validData = data.filter(d =>
   d.mood !== null ||
   d.energy !== null ||
   d.sleepHours !== null ||
   d.screenTime !== null ||
   d.winRate !== null ||
   d.brainPerformanceIndex !== null ||
   d.faceitKdRatio !== null ||
   d.faceitAdr !== null ||
   d.faceitHsPercent !== null
  );
  
  if (validData.length === 0) {
   return [];
  }

  const avgMood = validData.filter(d => d.mood !== null).reduce((sum, d) => sum + (d.mood || 0), 0) / validData.filter(d => d.mood !== null).length || 0;
  const avgEnergy = validData.filter(d => d.energy !== null).reduce((sum, d) => sum + (d.energy || 0), 0) / validData.filter(d => d.energy !== null).length || 0;
  const avgSleep = validData.filter(d => d.sleepHours !== null).reduce((sum, d) => sum + (d.sleepHours || 0), 0) / validData.filter(d => d.sleepHours !== null).length || 0;
  const avgBalance = validData.filter(d => d.balanceAvg !== null).reduce((sum, d) => sum + (d.balanceAvg || 0), 0) / validData.filter(d => d.balanceAvg !== null).length || 0;
  const avgScreenTime = validData.filter(d => d.screenTime !== null).reduce((sum, d) => sum + (d.screenTime || 0), 0) / validData.filter(d => d.screenTime !== null).length || 0;
  const avgWinRate = validData.filter(d => d.winRate !== null).reduce((sum, d) => sum + (d.winRate || 0), 0) / validData.filter(d => d.winRate !== null).length || 0;
  const avgBrainPerformanceIndex =
   validData.filter(d => d.brainPerformanceIndex !== null).reduce((sum, d) => sum + (d.brainPerformanceIndex || 0), 0) /
    validData.filter(d => d.brainPerformanceIndex !== null).length || 0;
  const avgFaceitKdRatio = validData.filter(d => d.faceitKdRatio !== null).reduce((sum, d) => sum + (d.faceitKdRatio || 0), 0) / validData.filter(d => d.faceitKdRatio !== null).length || 0;
  const avgFaceitAdr = validData.filter(d => d.faceitAdr !== null).reduce((sum, d) => sum + (d.faceitAdr || 0), 0) / validData.filter(d => d.faceitAdr !== null).length || 0;
  const avgFaceitHs = validData.filter(d => d.faceitHsPercent !== null).reduce((sum, d) => sum + (d.faceitHsPercent || 0), 0) / validData.filter(d => d.faceitHsPercent !== null).length || 0;

  const prefix = mode === 'team' ? '' : '';
  const suffix = mode === 'team' ? '' : '';

  const stats: StatCard[] = [];

  if (avgMood > 0) {
   stats.push({
    title: `${prefix} настроение ${suffix}`,
    value: avgMood.toFixed(1),
    change: '+0%', // TODO:  ·  СЃСЂ СЃ  
    icon: <Calendar className="h-4 w-4 text-white" />,
    color: 'text-blue-600'
   });
  }

  if (avgEnergy > 0) {
   stats.push({
    title: `${prefix} энергия ${suffix}`,
    value: avgEnergy.toFixed(1),
    change: '+0%',
    icon: <TrendingUp className="h-4 w-4 text-white" />,
    color: 'text-green-600'
   });
  }

  if (avgSleep > 0) {
   stats.push({
    title: `${prefix} сон ${suffix}`,
    value: `${avgSleep.toFixed(1)}ч`,
    change: '+0%',
    icon: <Clock className="h-4 w-4 text-white" />,
    color: 'text-amber-500'
   });
  }

  if (avgBalance > 0) {
   stats.push({
    title: `${prefix} life balance ${suffix}`,
    value: avgBalance.toFixed(1),
    change: '+0%',
    icon: <BarChart3 className="h-4 w-4 text-white" />,
    color: 'text-purple-600'
   });
  }

  if (avgScreenTime > 0) {
   stats.push({
    title: `${prefix} экранное время ${suffix}`,
    value: `${avgScreenTime.toFixed(1)}h`,
    change: '+0%',
    icon: <Clock className="h-4 w-4 text-white" />,
    color: 'text-orange-600'
   });
  }

  if (avgBrainPerformanceIndex > 0) {
   stats.push({
    title: `${prefix} индекс когнитивной формы ${suffix}`,
    value: avgBrainPerformanceIndex.toFixed(1),
    change: '+0%',
    icon: <BarChart3 className="h-4 w-4 text-white" />,
    color: 'text-cyan-600'
   });
  }

  if (avgWinRate > 0) {
   stats.push({
    title: `${prefix} Win rate (practice) ${suffix}`,
    value: `${avgWinRate.toFixed(1)}%`,
    change: '+0%',
    icon: <Target className="h-4 w-4 text-white" />,
    color: 'text-purple-600'
   });
  }

  if (avgFaceitKdRatio > 0) {
   stats.push({
    title: 'FACEIT K/D',
    value: avgFaceitKdRatio.toFixed(2),
    change: '+0%',
    icon: <Target className="h-4 w-4 text-white" />,
    color: 'text-sky-600'
   });
  }

  if (avgFaceitAdr > 0) {
   stats.push({
    title: 'FACEIT ADR',
    value: avgFaceitAdr.toFixed(1),
    change: '+0%',
    icon: <BarChart3 className="h-4 w-4 text-white" />,
    color: 'text-indigo-600'
   });
  }

  if (avgFaceitHs > 0) {
   stats.push({
    title: 'FACEIT HS%',
    value: `${avgFaceitHs.toFixed(1)}%`,
    change: '+0%',
    icon: <Trophy className="h-4 w-4 text-white" />,
    color: 'text-amber-600'
   });
  }

  return stats;
 };

 /**
  *    
  */
 const metricsConfig = {
  // Game metrics map: adr: kpr: deathPerRound: avgKr: avgKd: kast: firstKills:
  // firstDeaths: openingDuelDiff: udr: avgMultikills: clutchesWon:
  // avgFlashTime: roundWinRate:
  mood: { name: 'Mood', color: '#3b82f6', dataKey: 'mood' },
  energy: { name: 'Energy', color: '#10b981', dataKey: 'energy' },
  sleepHours: { name: 'Sleep (h)', color: '#f59e0b', dataKey: 'sleepHours' },
  balanceAvg: { name: 'Life balance', color: '#8b5cf6', dataKey: 'balanceAvg' },
  screenTime: { name: 'Screen time', color: '#f59e0b', dataKey: 'screenTime' },
  brainPerformanceIndex: { name: 'Cognitive form index', color: '#22d3ee', dataKey: 'brainPerformanceIndex' },
  currentElo: { name: 'Current ELO', color: '#1d4ed8', dataKey: 'currentElo' },
  winRate: { name: 'Win rate (practice)', color: '#ef4444', dataKey: 'winRate' },
  kdRatio: { name: 'K/D (practice)', color: '#06b6d4', dataKey: 'kdRatio' },
  kills: { name: 'Kills (practice)', color: '#dc2626', dataKey: 'kills' },
  deaths: { name: 'Deaths (practice)', color: '#9ca3af', dataKey: 'deaths' },
  assists: { name: 'Assists (practice)', color: '#84cc16', dataKey: 'assists' },
  adr: { name: 'ADR (practice)', color: '#f97316', dataKey: 'adr' },
  kpr: { name: 'KPR (practice)', color: '#0ea5e9', dataKey: 'kpr' },
  deathPerRound: { name: 'Death/Round (practice)', color: '#64748b', dataKey: 'deathPerRound' },
  avgKr: { name: 'AVG KR (practice)', color: '#14b8a6', dataKey: 'avgKr' },
  avgKd: { name: 'AVG KD (practice)', color: '#2563eb', dataKey: 'avgKd' },
  kast: { name: 'KAST (practice)', color: '#a855f7', dataKey: 'kast' },
  firstKills: { name: 'First Kills (practice)', color: '#ef4444', dataKey: 'firstKills' },
  firstDeaths: { name: 'First Deaths (practice)', color: '#94a3b8', dataKey: 'firstDeaths' },
  openingDuelDiff: { name: 'Opening duel difference (practice)', color: '#f59e0b', dataKey: 'openingDuelDiff' },
  udr: { name: 'UDR (practice)', color: '#22c55e', dataKey: 'udr' },
  avgMultikills: { name: 'Multikills (practice)', color: '#8b5cf6', dataKey: 'avgMultikills' },
  clutchesWon: { name: 'Clutches (practice)', color: '#e11d48', dataKey: 'clutchesWon' },
  avgFlashTime: { name: 'Flash Time (practice)', color: '#06b6d4', dataKey: 'avgFlashTime' },
  roundWinRate: { name: 'Round Win-Rate (practice)', color: '#f43f5e', dataKey: 'roundWinRate' },
  faceitMatches: { name: 'FACEIT matches', color: '#1e40af', dataKey: 'faceitMatches' },
  faceitWinRate: { name: 'FACEIT win rate', color: '#0f766e', dataKey: 'faceitWinRate' },
  faceitKdRatio: { name: 'FACEIT K/D', color: '#0284c7', dataKey: 'faceitKdRatio' },
  faceitAdr: { name: 'FACEIT ADR', color: '#7c3aed', dataKey: 'faceitAdr' },
  faceitKast: { name: 'FACEIT KAST', color: '#9333ea', dataKey: 'faceitKast' },
  faceitKr: { name: 'FACEIT K/R', color: '#ea580c', dataKey: 'faceitKr' },
  faceitHsPercent: { name: 'FACEIT HS%', color: '#d97706', dataKey: 'faceitHsPercent' },
  faceitKills: { name: 'Kills FACEIT', color: '#b91c1c', dataKey: 'faceitKills' },
  faceitDeaths: { name: 'Deaths FACEIT', color: '#475569', dataKey: 'faceitDeaths' },
  faceitAssists: { name: 'Assists FACEIT', color: '#4d7c0f', dataKey: 'faceitAssists' }
 };

 const isFaceitMetric = (metric: string) =>
  FACEIT_GROUP_METRICS.includes(metric as typeof FACEIT_GROUP_METRICS[number]);

 const isEloMetric = (metric: string) =>
  ELO_METRICS.includes(metric as typeof ELO_METRICS[number]);

 const visibleMetricEntries = Object.entries(metricsConfig).filter(([key]) => !isFaceitMetric(key));
 const faceitMetricEntries = Object.entries(metricsConfig).filter(([key]) => isFaceitMetric(key));
 const usesAbsoluteEloAxis = selectedMetrics.some((metric) => metric === 'elo' || metric === 'currentElo');
 const selectedMetricConfigs = selectedMetrics
  .map((metric) => ({ metric, config: metricsConfig[metric as keyof typeof metricsConfig] }))
  .filter((item) => Boolean(item.config));
 const selectedPlayerName = analysisMode === 'individual' && selectedPlayerId
  ? players.find((player) => player._id === selectedPlayerId)?.name || ''
  : '';
 const assistantSummaryCards = stats.map(({ title, value }) => ({ title, value }));

 const persistCurrentSession = ({
  activeTab = resultTab,
  assistant = assistantInsight,
  nextAnalysisGameStatsDaily = analysisGameStatsDaily,
  nextAnalysisMode = analysisMode,
  nextChartData = chartData,
  nextChartMode = chartMode,
  nextCurrentElo = currentElo,
  nextDateFrom = dateFrom,
  nextDateTo = dateTo,
  nextFaceitMetricsStatus = faceitMetricsStatus,
  nextSelectedMetrics = selectedMetrics,
  nextSelectedPlayerId = selectedPlayerId,
  updatedAt = new Date().toISOString(),
 }: {
  activeTab?: CorrelationResultTab;
  assistant?: CorrelationAssistantResponse | null;
  nextAnalysisGameStatsDaily?: DailyGameStatsComparison[];
  nextAnalysisMode?: 'team' | 'individual';
  nextChartData?: MetricData[];
  nextChartMode?: 'combined' | 'split';
  nextCurrentElo?: number | null;
  nextDateFrom?: string;
  nextDateTo?: string;
  nextFaceitMetricsStatus?: 'ok' | 'partial' | 'unavailable';
  nextSelectedMetrics?: string[];
  nextSelectedPlayerId?: string;
  updatedAt?: string;
 }) => {
  if (!nextChartData.length && !nextAnalysisGameStatsDaily.length && !assistant) {
   return;
  }

  writePersistedCorrelationSession({
   version: 2,
   activeTab,
   analysisGameStatsDaily: nextAnalysisGameStatsDaily,
   analysisMode: nextAnalysisMode,
   assistantInsight: assistant,
   chartData: nextChartData,
   chartMode: nextChartMode,
   currentElo: nextCurrentElo,
   dateFrom: nextDateFrom,
   dateTo: nextDateTo,
   faceitMetricsStatus: nextFaceitMetricsStatus,
   selectedMetrics: nextSelectedMetrics,
   selectedPlayerId: nextSelectedPlayerId,
   updatedAt,
  });

  setLastLoadedAt(updatedAt);
 };

 const handleResultTabChange = (tab: string) => {
  const nextTab: CorrelationResultTab = tab === 'analysis' ? 'analysis' : 'overview';
  setResultTab(nextTab);
  persistCurrentSession({ activeTab: nextTab });
 };

 const handleGenerateAssistantInsight = async () => {
  if (!hasCorrelationAnalysisAccess) {
   toast.error('AI analysis requires a plan "Correlation analysis"');
   return;
  }

  if (!comparisonRows.length) {
   toast.error('Load data for the period first');
   return;
  }

  const payload = buildCorrelationAssistantPayload({
   analysisMode,
   currentElo,
   dateFrom,
   dateTo,
   faceitMetricsStatus,
   metricsConfig,
   playerName: selectedPlayerName || undefined,
   rows: comparisonRows,
   selectedMetrics,
   summaryCards: assistantSummaryCards,
  });

  if (!payload.metricSummaries.length) {
   toast.error('Not enough complete metrics for AI summary yet');
   return;
  }

  setAssistantLoading(true);

  try {
   const response = await requestCorrelationAssistantInsight(payload);
   setAssistantInsight(response.data);
   setResultTab('overview');
   persistCurrentSession({
    activeTab: 'overview',
    assistant: response.data,
    updatedAt: response.data.generatedAt || new Date().toISOString(),
   });
   toast.success('AI insight generated');
  } catch (error: any) {
   console.error('AI insight generation error:', error);
   toast.error(error.response?.data?.message || 'Failed to generate AI insight');
  } finally {
   setAssistantLoading(false);
  }
 };

 /**
  *  ·  
  */
 const handleMetricToggle = (metric: string) => {
  setSelectedMetrics(prev => 
   prev.includes(metric) 
    ? prev.filter(m => m !== metric)
    : [...prev, metric]
  );
 };

 /**
  *  · СЂ 
  */
 const handleAnalysisModeChange = (mode: 'team' | 'individual') => {
  setAnalysisMode(mode);
  
  //   іСЂ     СЂ
  if (mode === 'team') {
   setSelectedPlayerId('');
  }
  
  //   , hС‚    ""
  setChartData([]);
  setStats([]);
  setAnalysisGameStatsDaily([]);
  setCurrentElo(null);
  setFaceitMetricsStatus('unavailable');
  setAssistantInsight(null);
 };

 useEffect(() => {
  if (!hasCorrelationAnalysisAccess) {
   setPlayers([]);
   return;
  }

  if (!isSoloPlayer) {
   fetchPlayers();
  }
 }, [hasCorrelationAnalysisAccess, isSoloPlayer]);

 useEffect(() => {
  if (isSoloPlayer && user?.id) {
   setSelectedPlayerId(user.id);
  }
 }, [isSoloPlayer, user?.id]);

 useEffect(() => {
  if (!chartData.length) {
   setStats([]);
   return;
  }

  const nextStats = generateStatsFromData(chartData, analysisMode);
  if (currentElo != null) {
   nextStats.push({
    title: 'Current ELO',
    value: `${Math.round(currentElo)}`,
    change: '+0%',
    icon: <Trophy className="h-4 w-4 text-white" />,
    color: 'text-blue-600'
   });
  }

  setStats(nextStats);
 }, [analysisMode, chartData, currentElo]);

 useEffect(() => {
  if (!hasCorrelationAnalysisAccess || !hasRestoredResults || autoRefreshDone) {
   return;
  }

  if (!dateFrom || !dateTo) {
   return;
  }

  if (analysisMode === 'individual' && !selectedPlayerId) {
   return;
  }

  setAutoRefreshDone(true);
  void fetchAnalysisData({ resetAssistant: false, silent: true });
 }, [analysisMode, autoRefreshDone, dateFrom, dateTo, hasCorrelationAnalysisAccess, hasRestoredResults, selectedPlayerId]);

 /**
  *  СЃ іСЂ 
  */
 const comparisonRows = buildCorrelationComparisonRows(chartData, analysisGameStatsDaily);
 const avgKills = analysisGameStatsDaily.length
  ? analysisGameStatsDaily.reduce((sum, row) => sum + row.kills, 0) / analysisGameStatsDaily.length
  : null;
 const avgDeaths = analysisGameStatsDaily.length
  ? analysisGameStatsDaily.reduce((sum, row) => sum + row.deaths, 0) / analysisGameStatsDaily.length
  : null;
 const avgAssists = analysisGameStatsDaily.length
  ? analysisGameStatsDaily.reduce((sum, row) => sum + row.assists, 0) / analysisGameStatsDaily.length
  : null;
 const avgWinRate = analysisGameStatsDaily.length
  ? analysisGameStatsDaily.reduce((sum, row) => sum + (row.winRate || 0), 0) / analysisGameStatsDaily.length
  : null;
 const faceitRows = comparisonRows.filter((row) =>
  row.faceitMatches !== null ||
  row.faceitKdRatio !== null ||
  row.faceitAdr !== null ||
  row.faceitHsPercent !== null
 );
 const faceitKdRows = faceitRows.filter((row) => row.faceitKdRatio !== null);
 const faceitAdrRows = faceitRows.filter((row) => row.faceitAdr !== null);
 const faceitHsRows = faceitRows.filter((row) => row.faceitHsPercent !== null);
 const avgFaceitKd = faceitKdRows.length
  ? faceitKdRows.reduce((sum, row) => sum + (row.faceitKdRatio || 0), 0) / faceitKdRows.length
  : null;
 const avgFaceitAdr = faceitAdrRows.length
  ? faceitAdrRows.reduce((sum, row) => sum + (row.faceitAdr || 0), 0) / faceitAdrRows.length
  : null;
 const avgFaceitHs = faceitHsRows.length
  ? faceitHsRows.reduce((sum, row) => sum + (row.faceitHsPercent || 0), 0) / faceitHsRows.length
  : null;
 const totalFaceitMatches = faceitRows.reduce((sum, row) => sum + (row.faceitMatches || 0), 0);

 return (
  <div className="container mx-auto p-6 space-y-6 performance-page">
   <div className="flex items-center space-x-2">
    <BarChart3 className="h-8 w-8 text-white" />
    <div>
     <span className="performance-eyebrow">Signal Matrix</span>
     <h1 className="text-3xl font-bold performance-title">Correlation analysis</h1>
     <p className="text-muted-foreground performance-subtitle">
      Analysis взаимосвязей между различными метриками players
     </p>
    </div>
   </div>

   <div className="w-full">
    <SubscriptionFeatureGate
     hasAccess={hasCorrelationAnalysisAccess}
     title="Correlation analysis is available after purchase"
     description="After purchase, period settings, correlation loading, charts, AI insight, and a comparative metric table for the selected period will unlock."
     minHeightClassName="min-h-[1400px]"
    >
    <div className="space-y-6">
     <Card>
      <CardHeader>
       <CardTitle>Analysis settings</CardTitle>
       <CardDescription>
        Choose mode, период и метрики for analysis корреляций
       </CardDescription>
      </CardHeader>
      <CardContent>
       {/* Выбор режима analysis — скрыт для solo-players */}
       {!isSoloPlayer && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
         <div className="space-y-2">
          <Label htmlFor="analysisMode">Analysis mode</Label>
          <Select value={analysisMode} onValueChange={(value: 'team' | 'individual') => handleAnalysisModeChange(value)}>
           <SelectTrigger id="analysisMode">
            <SelectValue placeholder="Select analysis mode" />
           </SelectTrigger>
           <SelectContent>
            <SelectItem value="team">Team statistics</SelectItem>
            <SelectItem value="individual">Individual statistics</SelectItem>
           </SelectContent>
          </Select>
         </div>

         {/* Выбор player (показывается только в индивидуальном режиме) */}
         {analysisMode === 'individual' && (
          <div className="space-y-2">
           <Label htmlFor="playerSelect">Player</Label>
           <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId} disabled={loadingPlayers}>
            <SelectTrigger id="playerSelect">
             <SelectValue placeholder={loadingPlayers ? "Loading players..." : "Select player"} />
            </SelectTrigger>
            <SelectContent>
             {players.map((player) => (
              <SelectItem key={player._id} value={player._id}>
               {player.name}
              </SelectItem>
             ))}
            </SelectContent>
           </Select>
          </div>
         )}
        </div>
       )}

       {/* 'С‹  */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
         <Label htmlFor="dateFrom">From date</Label>
         <Input
          id="dateFrom"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
         />
        </div>
        <div className="space-y-2">
         <Label htmlFor="dateTo">To date</Label>
         <Input
          id="dateTo"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
         />
        </div>
        <div className="space-y-2">
         <Label>Action</Label>
         <Button 
          onClick={fetchAnalysisData} 
          disabled={loading || (analysisMode === 'individual' && !selectedPlayerId)}
          className="w-full"
         >
          {loading ? 'Loading...' : 'Apply'}
         </Button>
        </div>
       </div>

       <div className="mt-6">
        <Label className="text-base font-medium">Core metrics</Label>
        <p className="text-sm text-muted-foreground mt-1">
         This brings together mood, questionnaires, cognitive form index, current ELO, and practice game data.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
         {visibleMetricEntries.map(([key, config]) => (
          <Button
           key={key}
           variant={selectedMetrics.includes(key) ? "default" : "outline"}
           size="sm"
           onClick={() => handleMetricToggle(key)}
           className="justify-start"
          >
           <div 
            className="w-3 h-3 rounded-full mr-2" 
            style={{ backgroundColor: config.color }}
           />
           {config.name}
          </Button>
         ))}
        </div>
       </div>

       <div className="mt-6 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4">
        <Label className="text-base font-medium">FACEIT data</Label>
        <p className="text-sm text-muted-foreground mt-1">
         Choose which FACEIT metrics to show on the chart and in separate chart mode. Daily ELO dynamics are not shown now because FACEIT does not provide them reliably in the current dataset.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
         {faceitMetricEntries.map(([key, config]) => (
          <Button
           key={key}
           variant={selectedMetrics.includes(key) ? "default" : "outline"}
           size="sm"
           onClick={() => handleMetricToggle(key)}
           className="justify-start"
          >
           <div
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: config.color }}
           />
           {config.name}
          </Button>
         ))}
        </div>
       </div>

       <div className="mt-6">
        <Label className="text-base font-medium">Chart mode</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 max-w-xl">
         <Button
          variant={chartMode === 'combined' ? 'default' : 'outline'}
          onClick={() => setChartMode('combined')}
          className="justify-start"
         >
          All in one
         </Button>
         <Button
          variant={chartMode === 'split' ? 'default' : 'outline'}
          onClick={() => setChartMode('split')}
          className="justify-start"
         >
          Separate charts
         </Button>
        </div>
       </div>
      </CardContent>
     </Card>

     <Tabs value={resultTab} onValueChange={handleResultTabChange}>
      <TabsList className="grid w-full grid-cols-2 bg-slate-950/70 p-1 text-slate-300">
       <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-slate-950">
        Overview
       </TabsTrigger>
       <TabsTrigger value="analysis" className="data-[state=active]:bg-white data-[state=active]:text-slate-950">
        Analysis
       </TabsTrigger>
      </TabsList>
     </Tabs>

     {resultTab === 'overview' ? (
      <>
       {chartData.length > 0 || assistantInsight ? (
        <>
         <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="border-slate-800/80 bg-[linear-gradient(145deg,#07111f_0%,#0d213d_58%,#14315e_100%)] text-slate-50 shadow-[0_24px_60px_-32px_rgba(15,39,68,0.95)]">
           <CardHeader>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-cyan-100">
             <Sparkles className="h-3.5 w-3.5" />
             Latest snapshot
            </div>
            <CardTitle className="mt-4 text-2xl text-slate-50">Data persists after reload</CardTitle>
            <CardDescription className="max-w-2xl text-slate-300">
             After reload, the latest successful analysis appears here: period, mode, selected metrics, and the latest generated AI insight.
            </CardDescription>
           </CardHeader>
           <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
             <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/80">Period</p>
             <p className="mt-2 text-lg font-semibold text-white">
              {new Date(dateFrom).toLocaleDateString('en-US')} - {new Date(dateTo).toLocaleDateString('en-US')}
             </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
             <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/80">Mode</p>
             <p className="mt-2 text-lg font-semibold text-white">
              {analysisMode === 'team' ? 'Team analysis' : selectedPlayerName || 'Individual analysis'}
             </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
             <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/80">Days in sample</p>
             <p className="mt-2 text-3xl font-semibold text-white">{comparisonRows.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
             <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/80">Last update</p>
             <p className="mt-2 text-base font-semibold text-white">
              {lastLoadedAt ? new Date(lastLoadedAt).toLocaleString('en-US') : 'Not yet'}
             </p>
            </div>
           </CardContent>
          </Card>

          <Card className="border-slate-800/80 bg-[linear-gradient(145deg,#07111f_0%,#0d213d_58%,#14315e_100%)] text-slate-50 shadow-[0_24px_60px_-32px_rgba(15,39,68,0.95)]">
           <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-slate-50">
             <Bot className="h-5 w-5 text-cyan-200" />
             Latest AI recommendations
            </CardTitle>
            <CardDescription className="text-slate-300">
             The latest AI insight is stored separately and appears here immediately after page reload.
            </CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
            {assistantInsight ? (
             <>
              <div className="flex flex-wrap gap-2">
               <Badge variant="secondary" className="border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/10">
                Confidence {assistantInsight.confidence}%
               </Badge>
               {assistantInsight.model && (
                <Badge variant="secondary" className="border border-white/10 bg-white/10 text-slate-100 hover:bg-white/10">
                 {assistantInsight.model}
                </Badge>
               )}
               <Badge variant="secondary" className="border border-white/10 bg-white/10 text-slate-100 hover:bg-white/10">
                {assistantInsight.generatedAt ? new Date(assistantInsight.generatedAt).toLocaleString('en-US') : 'Time not specified'}
               </Badge>
              </div>

              {assistantInsight.recommendedFocus.length > 0 && (
               <div>
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/80">Focus</p>
                <div className="mt-3 space-y-2">
                 {assistantInsight.recommendedFocus.map((item) => (
                  <div
                   key={item}
                   className="rounded-xl border border-cyan-200/10 bg-cyan-200/5 px-3 py-2 text-sm text-slate-100"
                  >
                   {item}
                  </div>
                 ))}
                </div>
               </div>
              )}

              <div className="grid gap-3 lg:grid-cols-3">
               <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/80">Trend</p>
                <p className="mt-2 text-sm leading-6 text-slate-100">{assistantInsight.trend}</p>
               </div>
               <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/80">Forecast</p>
                <p className="mt-2 text-sm leading-6 text-slate-100">{assistantInsight.forecast}</p>
               </div>
               <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/80">Summary</p>
                <p className="mt-2 text-sm leading-6 text-slate-100">{assistantInsight.conclusion}</p>
               </div>
              </div>
             </>
            ) : (
             <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-5 text-sm text-slate-300">
              The latest AI insight has not been generated yet. Go to the Analysis tab, load data, and click Generate AI insight.
             </div>
            )}
           </CardContent>
          </Card>
         </div>

         {stats.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
           {stats.map((stat, index) => (
            <Card key={index}>
             <CardContent className="p-6">
              <div className="flex items-center justify-between">
               <div>
                <p className="text-sm font-medium text-muted-foreground">
                 {stat.title}
                </p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className={`text-sm ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                 {stat.change}
                </p>
               </div>
               <div className={stat.color}>
                {stat.icon}
               </div>
              </div>
             </CardContent>
            </Card>
           ))}
          </div>
         )}
        </>
       ) : (
        <Card>
         <CardContent className="flex min-h-[280px] items-center justify-center">
          <div className="text-center text-muted-foreground">
           <BrainCircuit className="mx-auto mb-4 h-12 w-12 text-white/50" />
           <p className="text-base">Latest snapshot has not been saved yet</p>
           <p className="mt-2 text-sm">Click Apply to save data and recommendations for the overview tab.</p>
          </div>
         </CardContent>
        </Card>
       )}
      </>
     ) : (
      <>

     {stats.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
       {stats.map((stat, index) => (
        <Card key={index}>
         <CardContent className="p-6">
          <div className="flex items-center justify-between">
           <div>
            <p className="text-sm font-medium text-muted-foreground">
             {stat.title}
            </p>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className={`text-sm ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
             {stat.change}
            </p>
           </div>
           <div className={stat.color}>
            {stat.icon}
           </div>
          </div>
         </CardContent>
        </Card>
       ))}
      </div>
     )}

     {chartData.length > 0 && (
      <Card className="overflow-hidden border-slate-800/80 bg-[linear-gradient(135deg,#07111f_0%,#0f2744_48%,#132c52_100%)] text-slate-50 shadow-[0_24px_60px_-32px_rgba(15,39,68,0.95)]">
       <CardHeader className="border-b border-white/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
         <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-cyan-100">
           <Sparkles className="h-3.5 w-3.5" />
           Signal Desk AI
          </div>
          <div>
           <CardTitle className="flex items-center gap-2 text-2xl text-slate-50">
            <Bot className="h-5 w-5 text-cyan-200" />
            AI-correlation assistant
           </CardTitle>
           <CardDescription className="mt-2 max-w-3xl text-sm text-slate-300">
            Builds a trend, short forecast, and final summary for the current analysis window based on metrics, game data, FACEIT, and team report context.
           </CardDescription>
          </div>
         </div>

         <div className="flex flex-col items-start gap-2 lg:items-end">
          <Button
           onClick={handleGenerateAssistantInsight}
           disabled={assistantLoading}
           className="border border-cyan-200/20 bg-white/10 text-white backdrop-blur hover:bg-white/20"
          >
           {assistantLoading ? 'Generating AI summary...' : 'Generate AI insight'}
          </Button>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
           <Badge variant="secondary" className="bg-white/10 text-slate-100 hover:bg-white/10">
            {analysisMode === 'team' ? 'Team mode' : selectedPlayerName || 'Individual mode'}
           </Badge>
           <Badge variant="secondary" className="bg-white/10 text-slate-100 hover:bg-white/10">
            {comparisonRows.length} дней в выборке
           </Badge>
           {assistantInsight?.fallbackUsed && (
            <Badge variant="secondary" className="bg-amber-400/15 text-amber-100 hover:bg-amber-400/15">
             Local fallback
            </Badge>
           )}
          </div>
         </div>
        </div>
       </CardHeader>

       <CardContent className="space-y-5 pt-6">
        {!assistantInsight ? (
         <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
           <div className="flex items-center gap-2 text-sm font-medium text-cyan-100">
            <BrainCircuit className="h-4 w-4" />
            What goes into AI analysis
           </div>
           <p className="mt-3 text-sm leading-6 text-slate-300">
            The assistant will use current metric series, strongest correlations, and aggregated game indicators, статус FACEIT и выводы of комплексного analysis отчётов.
           </p>
           <div className="mt-4 flex flex-wrap gap-2">
            {assistantSummaryCards.slice(0, 5).map((card) => (
             <div
              key={card.title}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200"
             >
              {card.title}: {card.value}
             </div>
            ))}
           </div>
          </div>

          <div className="rounded-2xl border border-cyan-200/10 bg-cyan-300/5 p-5">
           <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/80">Analysis window</p>
           <p className="mt-3 text-xl font-semibold text-white">
            {new Date(dateFrom).toLocaleDateString('en-US')} - {new Date(dateTo).toLocaleDateString('en-US')}
           </p>
           <p className="mt-3 text-sm text-slate-300">
            There is already enough data for AI. Press the button above to get a text analysis for staff or player.
           </p>
          </div>
         </div>
        ) : (
         <>
          <div className="grid gap-4 xl:grid-cols-3">
           <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/80">Trend</p>
            <p className="mt-3 text-sm leading-6 text-slate-100">{assistantInsight.trend}</p>
           </div>
           <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/80">Forecast</p>
            <p className="mt-3 text-sm leading-6 text-slate-100">{assistantInsight.forecast}</p>
           </div>
           <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/80">Summary</p>
            <p className="mt-3 text-sm leading-6 text-slate-100">{assistantInsight.conclusion}</p>
           </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr_1fr]">
           <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/80">Confidence</p>
            <p className="mt-3 text-4xl font-semibold text-white">{assistantInsight.confidence}%</p>
            <p className="mt-3 text-xs text-slate-400">
             {assistantInsight.model ? `Model: ${assistantInsight.model}` : 'Model not specified'}
            </p>
           </div>

           <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/80">Key signals</p>
            <div className="mt-3 flex flex-wrap gap-2">
             {assistantInsight.keySignals.map((signal) => (
              <div
               key={signal}
               className="rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-50"
              >
               {signal}
              </div>
             ))}
            </div>
            {assistantInsight.recommendedFocus.length > 0 && (
             <div className="mt-5">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/80">Focus</p>
              <div className="mt-3 space-y-2">
               {assistantInsight.recommendedFocus.map((item) => (
                <div
                 key={item}
                 className="rounded-xl border border-cyan-200/10 bg-cyan-200/5 px-3 py-2 text-sm text-slate-100"
                >
                 {item}
                </div>
               ))}
              </div>
             </div>
            )}
           </div>

           <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/80">Risks</p>
            <div className="mt-3 space-y-2">
             {(assistantInsight.risks.length > 0 ? assistantInsight.risks : ['No obvious critical risks were detected for this period.']).map((risk) => (
              <div
               key={risk}
               className="rounded-xl border border-amber-300/15 bg-amber-300/10 px-3 py-2 text-sm text-amber-50"
              >
               {risk}
              </div>
             ))}
            </div>
           </div>
          </div>
         </>
        )}
       </CardContent>
      </Card>
     )}

     <Card>
      <CardHeader>
       <CardTitle>
        {analysisMode === 'team' 
         ? 'Team metric dynamics' 
         : selectedPlayerId && players.length > 0
          ? `Player metric dynamics: ${selectedPlayerName || 'Unknown player'}`
          : 'Player metric dynamics'
        }
       </CardTitle>
       <CardDescription>
        {analysisMode === 'team' 
         ? 'Time chart of team metrics for correlation analysis'
         : 'Time chart of individual metrics for correlation analysis'
        }
       </CardDescription>
      </CardHeader>
      <CardContent>
       {chartData.length > 0 ? (
        chartMode === 'combined' ? (
         <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
           <CartesianGrid strokeDasharray="3 3" />
           <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
             month: 'short', 
             day: 'numeric' 
            })}
           />
           <YAxis yAxisId="default" tick={{ fontSize: 12 }} />
           {usesAbsoluteEloAxis && (
            <YAxis
             yAxisId="elo"
             orientation="right"
             tick={{ fontSize: 12 }}
             tickFormatter={(value) => formatNumber(Number(value), 0)}
             width={72}
            />
           )}
           <Tooltip 
            labelFormatter={(value) => new Date(value).toLocaleDateString('en-US')}
            formatter={(value: any, name: any) => [
             typeof value === 'number'
              ? (isEloMetric(String(name))
               ? formatNumber(value, 0)
               : formatNumber(value, ['kdRatio', 'faceitKdRatio', 'faceitKr'].includes(String(name)) ? 2 : 1))
              : value,
             name
            ]}
           />
           <Legend />
           {selectedMetricConfigs.map(({ metric, config }) => (
            <Line
             key={metric}
             type="monotone"
             dataKey={config.dataKey}
             yAxisId={metric === 'elo' || metric === 'currentElo' ? 'elo' : 'default'}
             stroke={config.color}
             strokeWidth={isEloMetric(metric) ? 3 : 2}
             name={config.name}
             strokeDasharray={metric === 'currentElo' ? '6 4' : undefined}
             dot={false}
             activeDot={{ r: isEloMetric(metric) ? 5 : 4 }}
             connectNulls={false}
            />
           ))}
          </LineChart>
         </ResponsiveContainer>
        ) : (
         <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {selectedMetricConfigs.map(({ metric, config }) => (
           <Card key={metric} className="border-border/60">
            <CardHeader className="pb-2">
             <CardTitle className="text-base flex items-center gap-2">
              <span
               className="inline-block w-3 h-3 rounded-full"
               style={{ backgroundColor: config.color }}
              />
              {config.name}
             </CardTitle>
            </CardHeader>
            <CardContent>
             <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
               <CartesianGrid strokeDasharray="3 3" />
               <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', {
                 month: 'short',
                 day: 'numeric'
                })}
               />
               <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => formatNumber(Number(value), isEloMetric(metric) ? 0 : 1)}
                width={56}
               />
               <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleDateString('en-US')}
                formatter={(value: any) => [
                 typeof value === 'number'
                  ? formatNumber(value, ['kdRatio', 'faceitKdRatio', 'faceitKr'].includes(metric) ? 2 : 1)
                  : value,
                 config.name
                ]}
               />
               <Line
                type="monotone"
                dataKey={config.dataKey}
                stroke={config.color}
                strokeWidth={isEloMetric(metric) ? 3 : 2}
                strokeDasharray={metric === 'currentElo' ? '6 4' : undefined}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls={false}
                name={config.name}
               />
              </LineChart>
             </ResponsiveContainer>
            </CardContent>
           </Card>
          ))}
         </div>
        )
       ) : (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
         <div className="text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-white opacity-50" />
          <p>Click «Apply», чтобы загрузить данные</p>
         </div>
        </div>
       )}
      </CardContent>
     </Card>

     {chartData.length > 0 && (
      <Card className="overflow-hidden border-slate-800/80 bg-[linear-gradient(135deg,#07111f_0%,#0f2744_48%,#132c52_100%)] text-slate-50 shadow-[0_24px_60px_-32px_rgba(15,39,68,0.95)]">
       <CardHeader className="border-b border-white/10">
        <CardTitle className="text-slate-50">Comparison with game metrics</CardTitle>
        <CardDescription className="text-slate-300">
         Summary of local game metrics, FACEIT data, and cognitive form index for the same period.
        </CardDescription>
       </CardHeader>
       <CardContent className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
         {faceitMetricsStatus === 'ok' && 'Additional FACEIT metrics loaded successfully and shown by day.'}
         {faceitMetricsStatus === 'partial' && 'Some FACEIT metrics were loaded, but not for all linked accounts.'}
         {faceitMetricsStatus === 'unavailable' && 'Additional FACEIT metrics are unavailable: a linked FACEIT account and available API response are required.'}
        </div>

        {faceitRows.length > 0 && (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-cyan-200/10 bg-cyan-200/5 p-4">
           <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/80">FACEIT matches for period</p>
           <p className="mt-2 text-3xl font-semibold text-white">{formatNumber(totalFaceitMatches, 0)}</p>
          </div>
          <div className="rounded-2xl border border-cyan-200/10 bg-cyan-200/5 p-4">
           <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/80">Average FACEIT K/D</p>
           <p className="mt-2 text-3xl font-semibold text-white">{avgFaceitKd === null ? '' : formatNumber(avgFaceitKd, 2)}</p>
          </div>
          <div className="rounded-2xl border border-cyan-200/10 bg-cyan-200/5 p-4">
           <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/80">Average FACEIT ADR</p>
           <p className="mt-2 text-3xl font-semibold text-white">{avgFaceitAdr === null ? '' : formatNumber(avgFaceitAdr, 1)}</p>
          </div>
          <div className="rounded-2xl border border-cyan-200/10 bg-cyan-200/5 p-4">
           <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/80">Average FACEIT HS%</p>
           <p className="mt-2 text-3xl font-semibold text-white">{avgFaceitHs === null ? '' : formatNullablePercent(avgFaceitHs, 1)}</p>
          </div>
         </div>
        )}

        {comparisonRows.length > 0 ? (
         <>
          {analysisGameStatsDaily.length > 0 && (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
             <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/80">Average kills/day (practice)</p>
             <p className="mt-2 text-2xl font-semibold text-white">{avgKills === null ? '' : formatNumber(avgKills, 1)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
             <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/80">Average deaths/day (practice)</p>
             <p className="mt-2 text-2xl font-semibold text-white">{avgDeaths === null ? '' : formatNumber(avgDeaths, 1)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
             <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/80">Average assists/day (practice)</p>
             <p className="mt-2 text-2xl font-semibold text-white">{avgAssists === null ? '' : formatNumber(avgAssists, 1)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
             <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/80">Average win rate (practice)</p>
             <p className="mt-2 text-2xl font-semibold text-white">{avgWinRate === null ? '' : formatPercent(avgWinRate, 1)}</p>
            </div>
           </div>
          )}

          <div className="overflow-auto rounded-2xl border border-white/10 bg-[#081426]/80">
           <table className="min-w-[1120px] w-full border-collapse text-sm">
            <thead>
             <tr className="bg-white/5">
              <th className="border border-white/10 px-3 py-3 text-left text-slate-50">Date</th>
              <th className="border border-white/10 px-3 py-3 text-right text-slate-50">Mood</th>
              <th className="border border-white/10 px-3 py-3 text-right text-slate-50">Energy</th>
              <th className="border border-white/10 px-3 py-3 text-right text-slate-50">Sleep</th>
              <th className="border border-white/10 px-3 py-3 text-right text-slate-50">Balance</th>
              <th className="border border-white/10 px-3 py-3 text-right text-slate-50">Screen time</th>
              <th className="border border-violet-400/10 bg-violet-300/8 px-3 py-3 text-right text-violet-50">Cognitive form index</th>
              <th className="border border-cyan-400/10 bg-cyan-300/8 px-3 py-3 text-right text-cyan-50">Kills (practice)</th>
              <th className="border border-cyan-400/10 bg-cyan-300/8 px-3 py-3 text-right text-cyan-50">Deaths (practice)</th>
              <th className="border border-cyan-400/10 bg-cyan-300/8 px-3 py-3 text-right text-cyan-50">Assists (practice)</th>
              <th className="border border-cyan-400/10 bg-cyan-300/8 px-3 py-3 text-right text-cyan-50">ADR (practice)</th>
              <th className="border border-cyan-400/10 bg-cyan-300/8 px-3 py-3 text-right text-cyan-50">KAST (practice)</th>
              <th className="border border-cyan-400/10 bg-cyan-300/8 px-3 py-3 text-right text-cyan-50">Win rate (practice)</th>
              <th className="border border-cyan-400/10 bg-cyan-300/8 px-3 py-3 text-right text-cyan-50">K/D (practice)</th>
              <th className="border border-sky-400/10 bg-sky-300/8 px-3 py-3 text-right text-sky-50">FACEIT matches</th>
              <th className="border border-sky-400/10 bg-sky-300/8 px-3 py-3 text-right text-sky-50">FACEIT K/D</th>
              <th className="border border-sky-400/10 bg-sky-300/8 px-3 py-3 text-right text-sky-50">FACEIT ADR</th>
              <th className="border border-sky-400/10 bg-sky-300/8 px-3 py-3 text-right text-sky-50">FACEIT K/R</th>
              <th className="border border-sky-400/10 bg-sky-300/8 px-3 py-3 text-right text-sky-50">FACEIT KAST</th>
              <th className="border border-sky-400/10 bg-sky-300/8 px-3 py-3 text-right text-sky-50">FACEIT HS%</th>
              <th className="border border-sky-400/10 bg-sky-300/8 px-3 py-3 text-right text-sky-50">FACEIT win rate</th>
             </tr>
            </thead>
            <tbody>
             {comparisonRows.map((row) => (
              <tr key={row.date} className="odd:bg-transparent even:bg-white/[0.03]">
               <td className="border border-white/10 px-3 py-2 whitespace-nowrap text-slate-100">
                {new Date(row.date).toLocaleDateString('en-US')}
               </td>
               <td className="border border-white/10 px-3 py-2 text-right text-slate-100">{row.mood === null ? '' : formatNumber(row.mood, 1)}</td>
               <td className="border border-white/10 px-3 py-2 text-right text-slate-100">{row.energy === null ? '' : formatNumber(row.energy, 1)}</td>
               <td className="border border-white/10 px-3 py-2 text-right text-slate-100">{row.sleepHours === null ? '' : `${formatNumber(row.sleepHours, 1)}ч`}</td>
               <td className="border border-white/10 px-3 py-2 text-right text-slate-100">{row.balanceAvg === null ? '' : formatNumber(row.balanceAvg, 1)}</td>
               <td className="border border-white/10 px-3 py-2 text-right text-slate-100">{row.screenTime === null ? '' : formatNumber(row.screenTime, 1)}</td>
               <td className="border border-violet-400/10 bg-violet-300/[0.06] px-3 py-2 text-right text-violet-50">{row.brainPerformanceIndex === null ? '' : formatNumber(row.brainPerformanceIndex, 1)}</td>
               <td className="border border-cyan-400/10 bg-cyan-300/[0.06] px-3 py-2 text-right text-cyan-50">{row.kills === null ? '' : formatNumber(row.kills, 0)}</td>
               <td className="border border-cyan-400/10 bg-cyan-300/[0.06] px-3 py-2 text-right text-cyan-50">{row.deaths === null ? '' : formatNumber(row.deaths, 0)}</td>
               <td className="border border-cyan-400/10 bg-cyan-300/[0.06] px-3 py-2 text-right text-cyan-50">{row.assists === null ? '' : formatNumber(row.assists, 0)}</td>
               <td className="border border-cyan-400/10 bg-cyan-300/[0.06] px-3 py-2 text-right text-cyan-50">{row.adr === null ? '' : formatNumber(row.adr, 1)}</td>
               <td className="border border-cyan-400/10 bg-cyan-300/[0.06] px-3 py-2 text-right text-cyan-50">{row.kast === null ? '' : formatNumber(row.kast, 1)}</td>
               <td className="border border-cyan-400/10 bg-cyan-300/[0.06] px-3 py-2 text-right text-cyan-50">{row.winRate === null ? '' : formatPercent(row.winRate, 1)}</td>
               <td className="border border-cyan-400/10 bg-cyan-300/[0.06] px-3 py-2 text-right text-cyan-50">{row.kdRatio === null ? '' : formatNumber(row.kdRatio, 2)}</td>
               <td className="border border-sky-400/10 bg-sky-300/[0.06] px-3 py-2 text-right text-sky-50">{row.faceitMatches === null ? '' : formatNumber(row.faceitMatches, 0)}</td>
               <td className="border border-sky-400/10 bg-sky-300/[0.06] px-3 py-2 text-right text-sky-50">{row.faceitKdRatio === null ? '' : formatNumber(row.faceitKdRatio, 2)}</td>
               <td className="border border-sky-400/10 bg-sky-300/[0.06] px-3 py-2 text-right text-sky-50">{row.faceitAdr === null ? '' : formatNumber(row.faceitAdr, 1)}</td>
               <td className="border border-sky-400/10 bg-sky-300/[0.06] px-3 py-2 text-right text-sky-50">{row.faceitKr === null ? '' : formatNumber(row.faceitKr, 2)}</td>
               <td className="border border-sky-400/10 bg-sky-300/[0.06] px-3 py-2 text-right text-sky-50">{row.faceitKast === null ? '' : formatNumber(row.faceitKast, 1)}</td>
               <td className="border border-sky-400/10 bg-sky-300/[0.06] px-3 py-2 text-right text-sky-50">{row.faceitHsPercent === null ? '' : formatPercent(row.faceitHsPercent, 1)}</td>
               <td className="border border-sky-400/10 bg-sky-300/[0.06] px-3 py-2 text-right text-sky-50">{row.faceitWinRate === null ? '' : formatPercent(row.faceitWinRate, 1)}</td>
              </tr>
             ))}
            </tbody>
           </table>
          </div>
         </>
        ) : (
         <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-sm text-slate-300">
          No local game metrics were found for the selected period. FACEIT metrics may still be available in the chart and daily table.
         </div>
        )}
       </CardContent>
      </Card>
     )}
      </>
     )}
    </div>
    </SubscriptionFeatureGate>

   </div>
  </div>
 );
};

export default CorrelationAnalysisPage; 
