import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from "recharts";
import { MoodEntry as GlobalMoodEntry, TestEntry, WeeklyData } from "@/types";
import { getMoodEntries, getTestEntries } from "@/utils/storage";
import { formatDate, formatTimeOfDay } from "@/utils/dateUtils";
import { useAuth } from "@/hooks/useAuth";
import { 
  getAllPlayersMoodStats, 
  getAllPlayersTestStats, 
  getTeamMoodChartData,
  getDailyQuestionnaireStatus,
  getAnalyticsMoodStats,
  getAnalyticsTestStats,
  getBrainPerformanceSummary,
  getMyBaselineAssessment
} from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Users, TrendingUp, BarChart2, ListChecks, ChevronRight, Zap, SmilePlus, PieChart as PieChartIcon, Activity, Brain } from "lucide-react";
import type { BrainPerformanceSummary } from "@/types";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { COLORS, COMPONENT_STYLES } from "@/styles/theme";
import { BalanceWheelChart } from "@/components/BalanceWheelChart";
import { useNavigate } from "react-router-dom";
import ROUTES from "@/lib/routes";
import PlayerQuickStartPanel from "@/components/dashboard/PlayerQuickStartPanel";
import PlayerTestsPanel from "@/components/dashboard/PlayerTestsPanel";
import type { BaselineAssessment } from "@/types";
import BaselineAssessmentCard from "@/components/onboarding/BaselineAssessmentCard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageIntro from "@/components/PageIntro";
import { PRODUCT_DESCRIPTOR, PRODUCT_NAME } from "@/lib/productCopy";
import { BASELINE_REGISTER_MODAL_FLAG, POST_REGISTER_WELCOME_FLAG, type PlayerDashboardTab } from "@/lib/onboarding";

// Обновим тип MoodEntry
type MoodEntry = {
  _id: string;
  userId: string;
  date: string | Date;
  mood: number;
  energy: number;
  notes?: string;
  created: string;
  updated: string;
  // Добавим поля для совместимости с ответом API
  value?: number;
  energyValue?: number;
};

// Определим тип для результатов обработки
type RecentStats = {
  avgMood: number;
  avgEnergy: number;
  entries: Array<{
    date: string;
    mood: number;
    energy: number;
  }>;
};

const Dashboard = () => {
  const { user, refreshUser } = useAuth();
  const isStaff = user?.role === "staff";
  const hasPerformanceCoachCrmAccess = Boolean(user?.hasPerformanceCoachCrmAccess);
  const navigate = useNavigate();
  
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [testEntries, setTestEntries] = useState<TestEntry[]>([]);
  const [recentStats, setRecentStats] = useState<RecentStats>({
    avgMood: 0,
    avgEnergy: 0,
    entries: [],
  });
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brainSummary, setBrainSummary] = useState<BrainPerformanceSummary | null>(null);
  const [baselineAssessment, setBaselineAssessment] = useState<BaselineAssessment | null>(user?.baselineAssessment || null);
  const [dailyCheckDone, setDailyCheckDone] = useState(false);
  const [playerTab, setPlayerTab] = useState<string>(user?.baselineAssessmentCompleted ? "overview" : "quick-start");
  const [showPostRegisterWelcomeModal, setShowPostRegisterWelcomeModal] = useState(false);
  const [showBaselineRegistrationModal, setShowBaselineRegistrationModal] = useState(false);
  const [showQuickStartBaselineModal, setShowQuickStartBaselineModal] = useState(false);
  
  // Статистика всех игроков (для персонала)
  const [playersMoodStats, setPlayersMoodStats] = useState<any[]>([]);
  const [playersTestStats, setPlayersTestStats] = useState<any[]>([]);
  const [averageStats, setAverageStats] = useState({
    avgMood: 0,
    avgEnergy: 0,
    completedTests: 0,
    totalPlayers: 0
  });

  useEffect(() => {
    setBaselineAssessment(user?.baselineAssessment || null);
    setPlayerTab((current) => {
      if (current === "quick-start" && user?.baselineAssessmentCompleted) {
        return "overview";
      }

      if (!user?.baselineAssessmentCompleted) {
        return "quick-start";
      }

      return current || "overview";
    });
  }, [user?.baselineAssessmentCompleted, user?.baselineAssessment?.completedAt]);

  useEffect(() => {
    if (typeof window === "undefined") {
      setShowPostRegisterWelcomeModal(false);
      setShowBaselineRegistrationModal(false);
      return;
    }

    const shouldShowWelcome = sessionStorage.getItem(POST_REGISTER_WELCOME_FLAG) === "1";

    if (shouldShowWelcome) {
      setShowPostRegisterWelcomeModal(true);
      setShowBaselineRegistrationModal(false);
      return;
    }

    setShowPostRegisterWelcomeModal(false);

    if (isStaff) {
      setShowBaselineRegistrationModal(false);
      return;
    }

    setShowBaselineRegistrationModal(
      sessionStorage.getItem(BASELINE_REGISTER_MODAL_FLAG) === "1" &&
        !user?.baselineAssessmentCompleted
    );
  }, [isStaff, user?.baselineAssessmentCompleted]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (isStaff) {
          // Для персонала загружаем общую статистику
          await loadStaffData();
        } else {
          // Для игроков загружаем персональные данные из API
          try {
            const todayKey = new Date().toISOString().slice(0, 10);
            // Получаем данные о настроении из API
            const [moodResponse, testResponse, baselineResponse, dailyStatusResponse] = await Promise.all([
              getAnalyticsMoodStats(),
              getAnalyticsTestStats(),
              getMyBaselineAssessment(),
              getDailyQuestionnaireStatus(todayKey)
            ]);
            const brainResponse = hasPerformanceCoachCrmAccess
              ? await getBrainPerformanceSummary()
              : null;
            console.log("[Dashboard] API Mood Response:", moodResponse);
            
            // Обработка данных о настроении
            let loadedMoodEntries = [];
            if (moodResponse && moodResponse.data) {
              // Проверяем формат ответа API
              if (Array.isArray(moodResponse.data)) {
                // Формат: [{userId, name, mood, energy, ...}, ...]
                if (moodResponse.data.length > 0 && moodResponse.data[0].chartData) {
                  // Если у нас есть данные графика для одного пользователя
                  const playerData = moodResponse.data[0];
                  // Преобразуем данные графика в формат MoodEntry
                  loadedMoodEntries = playerData.chartData.map((item: any) => ({
                    _id: `${playerData.userId}_${item.date}`,
                    userId: playerData.userId,
                    date: item.date,
                    mood: item.mood,
                    energy: item.energy,
                    created: new Date().toISOString(),
                    updated: new Date().toISOString()
                  }));
                } else {
                  // Сохраняем сырые данные как есть
                  loadedMoodEntries = moodResponse.data;
                }
              } else if (moodResponse.data.entries && Array.isArray(moodResponse.data.entries)) {
                // Формат: {entries: [...]}
                loadedMoodEntries = moodResponse.data.entries;
              }
            }
            
            console.log(`[Dashboard] Обработано ${loadedMoodEntries.length} records о настроении из API`);
            
            console.log("[Dashboard] API Test Response:", testResponse);
            
            // Обработка данных о тестах
            let loadedTestEntries = [];
            if (testResponse && testResponse.data) {
              if (Array.isArray(testResponse.data)) {
                // Аналогичная проверка для данных тестов
                if (testResponse.data.length > 0 && testResponse.data[0].tests) {
                  // Если у нас есть детальные тесты для одного пользователя
                  loadedTestEntries = testResponse.data[0].tests;
                } else {
                  loadedTestEntries = testResponse.data;
                }
              } else if (testResponse.data.entries && Array.isArray(testResponse.data.entries)) {
                loadedTestEntries = testResponse.data.entries;
              }
            }
            
            console.log(`[Dashboard] Обработано ${loadedTestEntries.length} records о тестах из API`);
            
            // Устанавливаем данные в состояние
            setMoodEntries(loadedMoodEntries as MoodEntry[]);
            setTestEntries(loadedTestEntries);
            setBrainSummary(brainResponse?.data?.data || null);
            setBaselineAssessment(baselineResponse?.data?.data || user?.baselineAssessment || null);
            setDailyCheckDone(Boolean(dailyStatusResponse?.data?.completed));
    
            // Обрабатываем данные для графиков
            const recentStats = processRecentStats(loadedMoodEntries);
            setRecentStats(recentStats);
            
            const weeklyDataResult = processWeeklyData(loadedMoodEntries);
            
            // Преобразуем результаты в формат для графика
            const weeklyChartData = [
              { date: 'Sun', mood: weeklyDataResult.mood[0], energy: weeklyDataResult.energy[0] },
              { date: 'Mon', mood: weeklyDataResult.mood[1], energy: weeklyDataResult.energy[1] },
              { date: 'Tue', mood: weeklyDataResult.mood[2], energy: weeklyDataResult.energy[2] },
              { date: 'Wed', mood: weeklyDataResult.mood[3], energy: weeklyDataResult.energy[3] },
              { date: 'Thu', mood: weeklyDataResult.mood[4], energy: weeklyDataResult.energy[4] },
              { date: 'Fri', mood: weeklyDataResult.mood[5], energy: weeklyDataResult.energy[5] },
              { date: 'Sat', mood: weeklyDataResult.mood[6], energy: weeklyDataResult.energy[6] }
            ];
            
            setWeeklyData(weeklyChartData);
          } catch (apiError) {
            console.error("Error получения данных из API:", apiError);
            // Резервный вариант: загружаем из локального хранилища
            console.log("[Dashboard] Использую данные из локального хранилища");
            const localMoodEntries = getMoodEntries();
            const localTestEntries = getTestEntries();
            
            setMoodEntries(localMoodEntries);
            setTestEntries(localTestEntries);
            setBrainSummary(null);
            setBaselineAssessment(user?.baselineAssessment || null);
            setDailyCheckDone(false);
            
            // Обрабатываем данные для графиков из локального хранилища
            const recentStats = processRecentStats(localMoodEntries);
            setRecentStats(recentStats);
            
            const weeklyDataResult = processWeeklyData(localMoodEntries);
            
            // Преобразуем результаты в формат для графика
            const weeklyChartData = [
              { date: 'Sun', mood: weeklyDataResult.mood[0], energy: weeklyDataResult.energy[0] },
              { date: 'Mon', mood: weeklyDataResult.mood[1], energy: weeklyDataResult.energy[1] },
              { date: 'Tue', mood: weeklyDataResult.mood[2], energy: weeklyDataResult.energy[2] },
              { date: 'Wed', mood: weeklyDataResult.mood[3], energy: weeklyDataResult.energy[3] },
              { date: 'Thu', mood: weeklyDataResult.mood[4], energy: weeklyDataResult.energy[4] },
              { date: 'Fri', mood: weeklyDataResult.mood[5], energy: weeklyDataResult.energy[5] },
              { date: 'Sat', mood: weeklyDataResult.mood[6], energy: weeklyDataResult.energy[6] }
            ];
            
            setWeeklyData(weeklyChartData);
          }
        }
      } catch (err) {
        console.error("Error загрузки данных:", err);
        setError("Failed to load data. Try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [isStaff, hasPerformanceCoachCrmAccess, user?._updateTimestamp]);
  
  const loadStaffData = async () => {
    try {
      // Загружаем данные о настроении игроков
      const moodResponse = await getAllPlayersMoodStats();
      if (moodResponse && Array.isArray(moodResponse.data)) {
        setPlayersMoodStats(moodResponse.data);
      } else {
        console.warn("Invalid mood data format");
        setPlayersMoodStats([]);
      }
      
      // Загружаем данные о тестах игроков
      const testsResponse = await getAllPlayersTestStats();
      if (testsResponse && Array.isArray(testsResponse.data)) {
        setPlayersTestStats(testsResponse.data);
      } else {
        console.warn("Invalid test data format");
        setPlayersTestStats([]);
      }
      
      // Загружаем агрегированные данные для графика
      const chartDataResponse = await getTeamMoodChartData();
      if (chartDataResponse && Array.isArray(chartDataResponse.data)) {
        setWeeklyData(chartDataResponse.data);
      } else {
        console.warn("Invalid chart data format");
        setWeeklyData([]);
      }
      
      // Рассчитываем средние показатели
      calculateAverageStats(
        moodResponse && Array.isArray(moodResponse.data) ? moodResponse.data : [],
        testsResponse && Array.isArray(testsResponse.data) ? testsResponse.data : []
      );
    } catch (err) {
      console.error("Error загрузки данных персонала:", err);
      throw err;
    }
  };
  
  const calculateAverageStats = (moodStats: any[], testStats: any[]) => {
    if (!moodStats.length && !testStats.length) {
      setAverageStats({
        avgMood: 0,
        avgEnergy: 0,
        completedTests: 0,
        totalPlayers: 0
      });
      return;
    }
    
    const uniquePlayerIds = new Set([
      ...moodStats.map((item: any) => item.userId),
      ...testStats.map((item: any) => item.userId)
    ]);
    
    let totalMood = 0;
    let totalEnergy = 0;
    let moodCount = 0;
    
    moodStats.forEach((stat: any) => {
      if (stat.mood && typeof stat.mood === 'number') {
        totalMood += stat.mood;
        moodCount++;
      }
      
      if (stat.energy && typeof stat.energy === 'number') {
        totalEnergy += stat.energy;
        moodCount++;
      }
    });
    
    const completedTests = testStats.reduce((total: number, stat: any): number => {
      return total + (stat.testCount || 0);
    }, 0);
    
    setAverageStats({
      avgMood: moodCount > 0 ? parseFloat((totalMood / moodCount).toFixed(1)) : 0,
      avgEnergy: moodCount > 0 ? parseFloat((totalEnergy / moodCount).toFixed(1)) : 0,
      completedTests,
      totalPlayers: uniquePlayerIds.size
    });
  };

  const processRecentStats = (entries: MoodEntry[]): RecentStats => {
    if (!entries || entries.length === 0) {
      return {
        avgMood: 0,
        avgEnergy: 0,
        entries: []
      };
    }

    // Сортируем записи по дате (от самых новых к старым)
    const sortedEntries = [...entries].sort((a, b) => {
      const dateA = typeof a.date === 'string' ? new Date(a.date) : a.date as Date;
      const dateB = typeof b.date === 'string' ? new Date(b.date) : b.date as Date;
      return dateB.getTime() - dateA.getTime();
    });

    // Берем последние 7 records для графика
    const recentEntries = sortedEntries.slice(0, 7).map(entry => {
      const entryDate = typeof entry.date === 'string' ? new Date(entry.date) : entry.date as Date;
      const formattedDate = `${entryDate.getDate().toString().padStart(2, '0')}.${(entryDate.getMonth() + 1).toString().padStart(2, '0')}`;
      
      return {
        date: formattedDate,
        mood: typeof entry.mood === 'number' ? entry.mood : 
              typeof entry.value === 'number' ? entry.value : 0,
        energy: typeof entry.energy === 'number' ? entry.energy : 
                typeof entry.energyValue === 'number' ? entry.energyValue : 0
      };
    });
    
    // Рассчитываем средние значения для всех records
    const moodSum = entries.reduce((sum, entry) => {
      const moodValue = typeof entry.mood === 'number' ? entry.mood : 
                       (typeof entry.value === 'number' ? entry.value : 0);
      return sum + moodValue;
    }, 0);

    const energySum = entries.reduce((sum, entry) => {
      const energyValue = typeof entry.energy === 'number' ? entry.energy : 
                         (typeof entry.energyValue === 'number' ? entry.energyValue : 0);
      return sum + energyValue;
    }, 0);

    const avgMood = entries.length > 0 ? parseFloat((moodSum / entries.length).toFixed(1)) : 0;
    const avgEnergy = entries.length > 0 ? parseFloat((energySum / entries.length).toFixed(1)) : 0;
      
      return {
      avgMood,
      avgEnergy,
      entries: recentEntries.reverse() // Возвращаем в хронологическом порядке
    };
  };

  const processWeeklyData = (entries: MoodEntry[]) => {
    if (!entries || entries.length === 0) return { mood: [0, 0, 0, 0, 0, 0, 0], energy: [0, 0, 0, 0, 0, 0, 0] };

    const weekDays = [0, 1, 2, 3, 4, 5, 6];
    const moodByDay = weekDays.map(day => {
      const dayEntries = entries.filter(entry => {
        if (!entry.date) return false;
        try {
          const entryDate = typeof entry.date === 'string' ? new Date(entry.date) : entry.date as Date;
          return entryDate.getDay() === day;
        } catch (e) {
          return false;
        }
      });

      if (dayEntries.length === 0) return 0;

      const moodSum = dayEntries.reduce((sum, entry) => {
        // Используем mood или value в зависимости от того, что доступно
        const moodValue = typeof entry.mood === 'number' ? entry.mood : 
                         (typeof entry.value === 'number' ? entry.value : 0);
        return sum + moodValue;
      }, 0);

      return parseFloat((moodSum / dayEntries.length).toFixed(1));
    });

    const energyByDay = weekDays.map(day => {
      const dayEntries = entries.filter(entry => {
        if (!entry.date) return false;
        try {
          const entryDate = typeof entry.date === 'string' ? new Date(entry.date) : entry.date as Date;
          return entryDate.getDay() === day;
        } catch (e) {
          return false;
        }
      });

      if (dayEntries.length === 0) return 0;

      const energySum = dayEntries.reduce((sum, entry) => {
        // Используем energy или energyValue в зависимости от того, что доступно
        const energyValue = typeof entry.energy === 'number' ? entry.energy : 
                           (typeof entry.energyValue === 'number' ? entry.energyValue : 0);
        return sum + energyValue;
      }, 0);

      return parseFloat((energySum / dayEntries.length).toFixed(1));
    });

    return { mood: moodByDay, energy: energyByDay };
  };

  // Обработчик для кнопки "View all"
  const handleViewAllUpdates = () => {
    // Перенаправляем на страницу истории активности
    navigate(ROUTES.ACTIVITY_HISTORY);
  };

  // Обработка состояния загрузки
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]" 
           style={{ color: COLORS.textColorSecondary }}>
        <p className="text-muted-foreground">Loading данных...</p>
      </div>
    );
  }
  
  // Обработка ошибок
  if (error) {
    return (
      <div className="flex justify-center items-center h-[50vh]" 
           style={{ color: COLORS.danger }}>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const chartCardStyle = {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.borderColor,
    boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)"
  };

  const chartGridProps = {
    stroke: COLORS.borderColor,
    strokeDasharray: "4 4"
  };

  const chartAxisProps = {
    stroke: COLORS.textColorSecondary,
    fontSize: 12,
    tickLine: false,
    axisLine: false
  };

  const chartTooltipStyle = {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.borderColor,
    color: COLORS.textColor
  };

  const moodDistributionData = isStaff
    ? [
        { name: 'Excellent', range: '8-10', value: playersMoodStats.filter((p: any) => p.mood >= 8 || p.value >= 8).length, color: '#22c55e' },
        { name: 'Good', range: '6-7', value: playersMoodStats.filter((p: any) => (p.mood >= 6 && p.mood < 8) || (p.value >= 6 && p.value < 8)).length, color: '#38bdf8' },
        { name: 'Average', range: '4-5', value: playersMoodStats.filter((p: any) => (p.mood >= 4 && p.mood < 6) || (p.value >= 4 && p.value < 6)).length, color: '#f59e0b' },
        { name: 'Poor', range: '1-3', value: playersMoodStats.filter((p: any) => (p.mood >= 1 && p.mood < 4) || (p.value >= 1 && p.value < 4)).length, color: '#f43f5e' }
      ]
    : [
        { name: 'Excellent', range: '8-10', value: moodEntries.filter(e => e.mood >= 8 || e.value >= 8).length || 0, color: '#22c55e' },
        { name: 'Good', range: '6-7', value: moodEntries.filter(e => (e.mood >= 6 && e.mood < 8) || (e.value >= 6 && e.value < 8)).length || 0, color: '#38bdf8' },
        { name: 'Average', range: '4-5', value: moodEntries.filter(e => (e.mood >= 4 && e.mood < 6) || (e.value >= 4 && e.value < 6)).length || 0, color: '#f59e0b' },
        { name: 'Poor', range: '1-3', value: moodEntries.filter(e => (e.mood >= 1 && e.mood < 4) || (e.value >= 1 && e.value < 4)).length || 0, color: '#f43f5e' }
      ];
  const moodDistributionTotal = moodDistributionData.reduce((sum, item) => sum + item.value, 0);
  const dominantMoodBucket = moodDistributionData.reduce((top, item) => (item.value > top.value ? item : top), moodDistributionData[0]);

  const staffEnergyByDay = new Map(
    weeklyData.map((entry: any) => [entry.date, typeof entry.energy === 'number' ? entry.energy : 0])
  );
  const energyDistributionData = [
    { day: 'Mon', energy: isStaff ? (staffEnergyByDay.get('Mon') ?? 0) : calcDayAvgEnergy(moodEntries, 1) },
    { day: 'Tue', energy: isStaff ? (staffEnergyByDay.get('Tue') ?? 0) : calcDayAvgEnergy(moodEntries, 2) },
    { day: 'Wed', energy: isStaff ? (staffEnergyByDay.get('Wed') ?? 0) : calcDayAvgEnergy(moodEntries, 3) },
    { day: 'Thu', energy: isStaff ? (staffEnergyByDay.get('Thu') ?? 0) : calcDayAvgEnergy(moodEntries, 4) },
    { day: 'Fri', energy: isStaff ? (staffEnergyByDay.get('Fri') ?? 0) : calcDayAvgEnergy(moodEntries, 5) },
    { day: 'Sat', energy: isStaff ? (staffEnergyByDay.get('Sat') ?? 0) : calcDayAvgEnergy(moodEntries, 6) },
    { day: 'Sun', energy: isStaff ? (staffEnergyByDay.get('Sun') ?? 0) : calcDayAvgEnergy(moodEntries, 0) }
  ];
  const nonZeroEnergyDays = energyDistributionData.filter((item) => item.energy > 0);
  const averageEnergyLevel = nonZeroEnergyDays.length
    ? (nonZeroEnergyDays.reduce((sum, item) => sum + item.energy, 0) / nonZeroEnergyDays.length).toFixed(1)
    : "0.0";
  const peakEnergyDay = nonZeroEnergyDays.length
    ? nonZeroEnergyDays.reduce((peak, item) => (item.energy > peak.energy ? item : peak), nonZeroEnergyDays[0])
    : null;
  const testsDone = Boolean(user?.completedTests || testEntries.length > 0);

  const dismissRegisterWelcome = () => {
    sessionStorage.removeItem(POST_REGISTER_WELCOME_FLAG);
    setShowPostRegisterWelcomeModal(false);
  };

  const handleWelcomeOpenBaseline = () => {
    dismissRegisterWelcome();
    if (!isStaff && !user?.baselineAssessmentCompleted) {
      sessionStorage.setItem(BASELINE_REGISTER_MODAL_FLAG, "1");
      setShowBaselineRegistrationModal(true);
    } else {
      setPlayerTab("quick-start");
    }
  };

  const handleWelcomeOpenPlayerTab = (tab: PlayerDashboardTab) => {
    sessionStorage.removeItem(BASELINE_REGISTER_MODAL_FLAG);
    dismissRegisterWelcome();
    setPlayerTab(tab);
  };

  const handleWelcomeOpenStaffRoute = (path: string) => {
    sessionStorage.removeItem(BASELINE_REGISTER_MODAL_FLAG);
    dismissRegisterWelcome();
    navigate(path);
  };

  const handleBaselineCompleted = async (assessment?: BaselineAssessment | null) => {
    setBaselineAssessment(assessment || null);
    setPlayerTab("overview");
    sessionStorage.removeItem(BASELINE_REGISTER_MODAL_FLAG);
    sessionStorage.removeItem(POST_REGISTER_WELCOME_FLAG);
    setShowBaselineRegistrationModal(false);
    setShowQuickStartBaselineModal(false);
    await refreshUser();
  };

  const handleSkipBaselineRegistrationModal = () => {
    sessionStorage.removeItem(BASELINE_REGISTER_MODAL_FLAG);
    setShowBaselineRegistrationModal(false);
    setPlayerTab("quick-start");
  };

  return (
    <div className="space-y-6" style={{ 
        backgroundColor: COLORS.backgroundColor, 
        color: COLORS.textColor, 
        padding: "20px", 
        borderRadius: "10px" 
      }}>
      <PageIntro
        eyebrow={PRODUCT_NAME}
        title={
          isStaff
            ? "Team overview for spotting risk signals and making decisions faster"
            : "Personal form overview for understanding your condition and next useful step"
        }
        description={
          isStaff
            ? `${PRODUCT_DESCRIPTOR}. This brings together the team picture, drop signals, and quick access to useful actions without extra operations.`
            : `${PRODUCT_DESCRIPTOR}. You first see the essentials: what is happening with form now, what is already filled in, and what the next useful step is.`
        }
        collapsible
        bullets={
          isStaff
            ? [
                "First, the team overview and players who need attention",
                "Then form and game dynamics analytics",
                "Roster and access settings go deeper without competing with the core value",
              ]
            : [
                "First, condition and recovery",
                "Then tests, form, and game signals",
                "Payment expands insight instead of hiding the whole point",
              ]
        }
      />

      <Dialog
        open={showPostRegisterWelcomeModal}
        onOpenChange={(open) => {
          if (!open) {
            dismissRegisterWelcome();
            if (!isStaff) {
              setPlayerTab("quick-start");
            }
          }
        }}
      >
        <DialogContent
          className="max-w-[920px] border p-0"
          style={{ backgroundColor: COLORS.backgroundColor, borderColor: COLORS.borderColor }}
        >
          <DialogHeader className="border-b px-6 pb-4 pt-6" style={{ borderColor: COLORS.borderColor }}>
            <DialogTitle style={{ color: COLORS.textColor }}>
              Welcome to {PRODUCT_NAME}
            </DialogTitle>
            <DialogDescription style={{ color: COLORS.textColorSecondary }}>
              {isStaff
                ? "This is the first screen after registration. It helps you quickly understand how the CRM gathers team signals and where to go next without extra operations."
                : "This is the first screen after registration. It helps you quickly understand how the CRM gathers form signals and which step shows value first."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-6 py-6">
            <div className="rounded-[24px] border px-5 py-4" style={{ borderColor: "rgba(96, 165, 250, 0.18)", background: "linear-gradient(145deg, rgba(53, 144, 255, 0.1), rgba(17, 24, 39, 0.94))" }}>
              <p className="text-sm leading-7" style={{ color: COLORS.textColorSecondary }}>
                {isStaff
                  ? "First, CRM collects signals about player condition, recovery, and activity. Then you read the team overview, find risk zones, and only after that move to roster, cards, and access."
                  : "First, CRM collects your baseline profile, daily recovery check, and test rhythm. Then it shows a basic form signal and gradually opens deeper analytics."}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {(isStaff
                ? [
                    "Where to read the team picture: overview and team statistics.",
                    "What counts as a signal: drops in mood, energy, and test rhythm.",
                    "When to go into operations: only after a player or risk that needs attention is found.",
                  ]
                : [
                    "What you fill in: quick start, daily recovery check, and tests.",
                    "Which signals CRM reads: mood, energy, test rhythm, and game data.",
                    "What to do first: complete quick start so the system builds the base for your card and form.",
                  ]).map((item) => (
                <div
                  key={item}
                  className="rounded-[22px] border px-4 py-4"
                  style={{ borderColor: COLORS.borderColor, backgroundColor: "rgba(255,255,255,0.03)" }}
                >
                  <p className="text-sm leading-7" style={{ color: COLORS.textColorSecondary }}>
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t px-6 py-4" style={{ borderColor: COLORS.borderColor }}>
            {isStaff ? (
              <>
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  style={{ borderColor: COLORS.borderColor, color: COLORS.textColor }}
                  onClick={() => handleWelcomeOpenStaffRoute(ROUTES.STATISTICS)}
                >
                  Open statistics
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  style={{ borderColor: COLORS.borderColor, color: COLORS.textColor }}
                  onClick={dismissRegisterWelcome}
                >
                  Open обзор
                </Button>
                <Button
                  className="rounded-2xl"
                  style={{ backgroundColor: COLORS.primary, color: COLORS.textColor }}
                  onClick={() => handleWelcomeOpenStaffRoute(ROUTES.PLAYERS_MANAGEMENT)}
                >
                  Open roster
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  style={{ borderColor: COLORS.borderColor, color: COLORS.textColor }}
                  onClick={() => {
                    sessionStorage.removeItem(BASELINE_REGISTER_MODAL_FLAG);
                    dismissRegisterWelcome();
                    navigate(ROUTES.DAILY_QUESTIONNAIRE);
                  }}
                >
                  Fill daily check-in
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  style={{ borderColor: COLORS.borderColor, color: COLORS.textColor }}
                  onClick={() => handleWelcomeOpenPlayerTab("overview")}
                >
                  Open overview
                </Button>
                <Button
                  className="rounded-2xl"
                  style={{ backgroundColor: COLORS.primary, color: COLORS.textColor }}
                  onClick={handleWelcomeOpenBaseline}
                >
                  Start onboarding
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {!isStaff && (
        <Dialog
          open={showBaselineRegistrationModal}
          onOpenChange={(open) => {
            if (!open) {
              handleSkipBaselineRegistrationModal();
            }
          }}
        >
          <DialogContent
            className="max-h-[92vh] max-w-[1080px] overflow-y-auto border p-0"
            style={{ backgroundColor: COLORS.backgroundColor, borderColor: COLORS.borderColor }}
          >
            <DialogHeader className="border-b px-6 pb-4 pt-6" style={{ borderColor: COLORS.borderColor }}>
              <DialogTitle style={{ color: COLORS.textColor }}>
                Let’s build your starting profile in {PRODUCT_NAME}.
              </DialogTitle>
              <DialogDescription style={{ color: COLORS.textColorSecondary }}>
                This baseline test helps CRM understand your player style. You can skip it now and return from Quick Start later.
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 py-6">
              <BaselineAssessmentCard
                initialAssessment={baselineAssessment}
                hasFullAccess={hasPerformanceCoachCrmAccess}
                onCompleted={handleBaselineCompleted}
              />
            </div>
            <div className="flex justify-end border-t px-6 py-4" style={{ borderColor: COLORS.borderColor }}>
              <Button
                variant="outline"
                className="rounded-2xl"
                style={{ borderColor: COLORS.borderColor, color: COLORS.textColor }}
                onClick={handleSkipBaselineRegistrationModal}
              >
                Later
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {!isStaff && (
        <Dialog open={showQuickStartBaselineModal} onOpenChange={setShowQuickStartBaselineModal}>
          <DialogContent
            className="max-h-[92vh] max-w-[1080px] overflow-y-auto border p-0"
            style={{ backgroundColor: COLORS.backgroundColor, borderColor: COLORS.borderColor }}
          >
            <DialogHeader className="border-b px-6 pb-4 pt-6" style={{ borderColor: COLORS.borderColor }}>
              <DialogTitle style={{ color: COLORS.textColor }}>
                Start baseline onboarding
              </DialogTitle>
              <DialogDescription style={{ color: COLORS.textColorSecondary }}>
                This is the Quick Start onboarding test. When you finish, CRM saves your baseline profile; deeper interpretation unlocks with {PRODUCT_NAME} plans.
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 py-6">
              <BaselineAssessmentCard
                initialAssessment={baselineAssessment}
                hasFullAccess={hasPerformanceCoachCrmAccess}
                onCompleted={handleBaselineCompleted}
              />
            </div>
            <div className="flex justify-between border-t px-6 py-4" style={{ borderColor: COLORS.borderColor }}>
              <Button
                variant="outline"
                className="rounded-2xl"
                style={{ borderColor: COLORS.borderColor, color: COLORS.textColor }}
                onClick={() => setShowQuickStartBaselineModal(false)}
              >
                Close
              </Button>
              <Button
                className="rounded-2xl"
                style={{ backgroundColor: COLORS.primary, color: COLORS.textColor }}
                onClick={() => {
                  setShowQuickStartBaselineModal(false);
                  setPlayerTab("quick-start");
                }}
              >
                Back to Quick Start
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Tabs
        value={isStaff ? "overview" : playerTab}
        onValueChange={(value) => {
          if (!isStaff) {
            setPlayerTab(value);
          }
        }}
        className="space-y-4"
        style={{ color: COLORS.textColor }}
      >
        <TabsList
          className={`grid w-full p-1 ${isStaff ? "grid-cols-1 max-w-[220px]" : "grid-cols-4"}`}
          style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor }}
        >
          <TabsTrigger 
            value="overview" 
            className="text-sm px-4 py-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:font-medium hover:bg-gray-800"
          >
            Overview
          </TabsTrigger>
          {!isStaff && (
            <>
              <TabsTrigger
                value="quick-start"
                className="text-sm px-4 py-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:font-medium hover:bg-gray-800"
              >
                Quick start
              </TabsTrigger>
              <TabsTrigger
                value="tests"
                className="text-sm px-4 py-2 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:font-medium hover:bg-gray-800"
              >
                Tests
              </TabsTrigger>
            </>
          )}
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {isStaff ? (
            // Информация для персонала
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" style={{ color: COLORS.textColorSecondary }}>
                    Total players
                  </CardTitle>
                  <Users className="h-4 w-4" style={{ color: COLORS.primary }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: COLORS.textColor }}>{averageStats.totalPlayers}</div>
                  <p className="text-xs" style={{ color: COLORS.textColorSecondary }}>
                    Active users
                  </p>
                </CardContent>
              </Card>
              
              <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" style={{ color: COLORS.textColorSecondary }}>
                    Average mood
                  </CardTitle>
                  <SmilePlus className="h-4 w-4" style={{ color: COLORS.success }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: COLORS.textColor }}>{averageStats.avgMood}</div>
                  <p className="text-xs" style={{ color: COLORS.textColorSecondary }}>
                    Across all players
                  </p>
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" style={{ color: COLORS.textColorSecondary }}>
                    Average energy
                  </CardTitle>
                  <Zap className="h-4 w-4" style={{ color: COLORS.warning }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: COLORS.textColor }}>{averageStats.avgEnergy}</div>
                  <p className="text-xs" style={{ color: COLORS.textColorSecondary }}>
                    Across all players
                  </p>
                </CardContent>
              </Card>
              
              <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" style={{ color: COLORS.textColorSecondary }}>
                    Tests completed
                  </CardTitle>
                  <ListChecks className="h-4 w-4" style={{ color: COLORS.info }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: COLORS.textColor }}>{averageStats.completedTests}</div>
                  <p className="text-xs" style={{ color: COLORS.textColorSecondary }}>
                    Total по команде
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Информация для игрока
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" style={{ color: COLORS.textColorSecondary }}>
                    Mood records
                  </CardTitle>
                  <SmilePlus className="h-4 w-4" style={{ color: COLORS.success }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: COLORS.textColor }}>{moodEntries.length}</div>
                  <p className="text-xs" style={{ color: COLORS.textColorSecondary }}>
                    Total records
                  </p>
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" style={{ color: COLORS.textColorSecondary }}>
                    Average mood
                  </CardTitle>
                  <SmilePlus className="h-4 w-4" style={{ color: COLORS.success }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: COLORS.textColor }}>
                    {moodEntries.length ? (() => {
                      const moodSum = moodEntries.reduce((sum, entry) => {
                        return sum + (entry.mood !== undefined ? entry.mood : 
                                      entry.value !== undefined ? entry.value : 0);
                      }, 0);
                      return (moodSum / moodEntries.length).toFixed(1);
                    })() : "N/A"}
                  </div>
                  <p className="text-xs" style={{ color: COLORS.textColorSecondary }}>
                    Your average mood
                  </p>
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" style={{ color: COLORS.textColorSecondary }}>
                    Average energy
                  </CardTitle>
                  <Zap className="h-4 w-4" style={{ color: COLORS.warning }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: COLORS.textColor }}>
                    {moodEntries.length ? (() => {
                      const energySum = moodEntries.reduce((sum, entry) => {
                        return sum + (entry.energy !== undefined ? entry.energy : 
                                      entry.energyValue !== undefined ? entry.energyValue : 0);
                      }, 0);
                      return (energySum / moodEntries.length).toFixed(1);
                    })() : "N/A"}
                  </div>
                  <p className="text-xs" style={{ color: COLORS.textColorSecondary }}>
                    Your energy level
                  </p>
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" style={{ color: COLORS.textColorSecondary }}>
                    Tests
                  </CardTitle>
                  <ListChecks className="h-4 w-4" style={{ color: COLORS.info }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: COLORS.textColor }}>{testEntries.length}</div>
                  <p className="text-xs" style={{ color: COLORS.textColorSecondary }}>
                    Total завершено
                  </p>
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" style={{ color: COLORS.textColorSecondary }}>
                    Latest activity
                  </CardTitle>
                  <TrendingUp className="h-4 w-4" style={{ color: COLORS.primary }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: COLORS.textColor }}>
                    {moodEntries.length > 0 || testEntries.length > 0 ? 
                     "Today" : "No activity"}
                  </div>
                  <p className="text-xs" style={{ color: COLORS.textColorSecondary }}>
                    Progress tracking
                  </p>
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium" style={{ color: COLORS.textColorSecondary }}>
                    Brain Lab
                  </CardTitle>
                  <Brain className="h-4 w-4" style={{ color: COLORS.primary }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: COLORS.textColor }}>
                    {brainSummary?.brainPerformanceIndex != null ? brainSummary.brainPerformanceIndex.toFixed(1) : "Calibration"}
                  </div>
                  <p className="text-xs" style={{ color: COLORS.textColorSecondary }}>
                    {brainSummary
                      ? `${brainSummary.confidence} confidence · батарей ${brainSummary.validBatteryCount}`
                      : "Launch Brain Lab from the tests tab"}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Обновленный график активности с новыми стилями */}
          <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)" }}>
            <CardHeader>
              <CardTitle style={{ color: COLORS.textColor }}>Activity statistics</CardTitle>
              <CardDescription style={{ color: COLORS.textColorSecondary }}>
                {isStaff ? "Team activity over the latest period" : "Your activity over the last week"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart
                  data={isStaff ? weeklyData : recentStats.entries}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <defs>
                    <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderColor} />
                  <XAxis 
                    dataKey={isStaff ? "date" : "date"} 
                    stroke={COLORS.textColorSecondary} 
                    fontSize={12} 
                  />
                  <YAxis stroke={COLORS.textColorSecondary} fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: COLORS.cardBackground, 
                      borderColor: COLORS.borderColor,
                      color: COLORS.textColor 
                    }} 
                  />
                  <Legend wrapperStyle={{ color: COLORS.textColor }} />
                  <Area 
                    type="monotone" 
                    dataKey={isStaff ? "mood" : "mood"} 
                    name="Mood" 
                    stroke={COLORS.primary} 
                    fillOpacity={1}
                    fill="url(#colorMood)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey={isStaff ? "energy" : "energy"} 
                    name="Energy" 
                    stroke={COLORS.success} 
                    fillOpacity={1}
                    fill="url(#colorEnergy)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Добавление диаграмм распределения настроения и энергии */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {/* Круговая диаграмма распределения настроения */}
            <Card
              className="overflow-hidden"
              style={{
                background: "linear-gradient(155deg, rgba(26,32,44,1) 0%, rgba(21,31,51,1) 55%, rgba(15,34,63,0.96) 100%)",
                borderColor: COLORS.borderColor,
                boxShadow: "0 22px 40px -28px rgba(0,0,0,0.65)"
              }}
            >
              <CardHeader className="border-b border-white/5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle style={{ color: COLORS.textColor }}>Distribution настроения</CardTitle>
                    <CardDescription style={{ color: COLORS.textColorSecondary }}>
                      {isStaff ? "Mood distribution across players" : "Your mood by category"}
                    </CardDescription>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium tracking-[0.14em] uppercase text-slate-300">
                    <PieChartIcon className="mr-2 inline h-3.5 w-3.5 text-cyan-300" />
                    {moodDistributionTotal} records
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <defs>
                        <linearGradient id="moodGlow" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#1f3b63" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#0f172a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <circle cx="50%" cy="50%" r="84" fill="url(#moodGlow)" />
                      <Pie
                        data={moodDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={104}
                        paddingAngle={3}
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth={2}
                        dataKey="value"
                        label={false}
                        labelLine={false}
                      >
                        {moodDistributionData.map((entry, index) => (
                          <Cell key={`mood-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <text x="50%" y="46%" textAnchor="middle" fill="#E5EEF9" fontSize="13" letterSpacing="1.8">
                        DOMINANT
                      </text>
                      <text x="50%" y="55%" textAnchor="middle" fill={dominantMoodBucket.color} fontSize="24" fontWeight="700">
                        {dominantMoodBucket.name}
                      </text>
                      <text x="50%" y="64%" textAnchor="middle" fill="#8FA3BF" fontSize="13">
                        {moodDistributionTotal ? `${Math.round((dominantMoodBucket.value / moodDistributionTotal) * 100)}% выборки` : "No data yet"}
                      </text>
                      <Tooltip contentStyle={chartTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-3">
                    {moodDistributionData.map((item) => {
                      const share = moodDistributionTotal ? Math.round((item.value / moodDistributionTotal) * 100) : 0;
                      return (
                        <div
                          key={item.name}
                          className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: item.color, boxShadow: `0 0 18px ${item.color}55` }}
                              />
                              <div>
                                <p className="text-sm font-semibold text-slate-100">{item.name}</p>
                                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{item.range}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-white">{share}%</p>
                              <p className="text-xs text-slate-400">{item.value} records</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Гистограмма распределения энергии */}
            <Card
              className="overflow-hidden"
              style={{
                background: "linear-gradient(155deg, rgba(26,32,44,1) 0%, rgba(22,30,47,1) 55%, rgba(43,27,5,0.18) 100%)",
                borderColor: COLORS.borderColor,
                boxShadow: "0 22px 40px -28px rgba(0,0,0,0.65)"
              }}
            >
              <CardHeader className="border-b border-white/5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle style={{ color: COLORS.textColor }}>Energy distribution</CardTitle>
                    <CardDescription style={{ color: COLORS.textColorSecondary }}>
                      {isStaff ? "Energy levels by weekday" : "Your energy by weekday"}
                    </CardDescription>
                  </div>
                  <div className="rounded-full border border-amber-300/15 bg-amber-300/10 px-3 py-1 text-xs font-medium tracking-[0.14em] uppercase text-amber-100">
                    <Zap className="mr-2 inline h-3.5 w-3.5" />
                    Average {averageEnergyLevel}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="mb-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Peak day</p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {peakEnergyDay ? peakEnergyDay.day : "No data"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Peak value</p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {peakEnergyDay ? peakEnergyDay.energy.toFixed(1) : "0.0"}
                    </p>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={energyDistributionData}
                    margin={{
                      top: 5,
                      right: 12,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <defs>
                      <linearGradient id="energyBarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="55%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#d97706" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...chartGridProps} vertical={false} />
                    <XAxis dataKey="day" {...chartAxisProps} />
                    <YAxis {...chartAxisProps} domain={[0, 10]} tickCount={6} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    />
                    <Bar dataKey="energy" fill="url(#energyBarGradient)" radius={[12, 12, 4, 4]} maxBarSize={52} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {!isStaff && (
          <TabsContent value="quick-start" className="space-y-4">
            <PlayerQuickStartPanel
              baselineAssessmentCompleted={Boolean(user?.baselineAssessmentCompleted)}
              sleepDoneToday={dailyCheckDone}
              testsDone={testsDone}
              hasResultsAccess={hasPerformanceCoachCrmAccess}
              onOpenBaselineAssessment={() => setShowQuickStartBaselineModal(true)}
              onOpenSleepTab={() => navigate(ROUTES.DAILY_QUESTIONNAIRE)}
              onOpenTests={() => setPlayerTab("tests")}
              onOpenFaceitProfile={() => navigate(ROUTES.PROFILE)}
            />
          </TabsContent>
        )}

        {!isStaff && (
          <TabsContent value="tests" className="space-y-4">
            {!hasPerformanceCoachCrmAccess && (
              <section
                className="rounded-[24px] border px-5 py-4"
                style={{
                  background: "linear-gradient(145deg, rgba(34, 211, 238, 0.08), rgba(17, 24, 39, 0.94))",
                  borderColor: "rgba(34, 211, 238, 0.18)"
                }}
              >
                <p className="text-sm leading-7" style={{ color: COLORS.textColorSecondary }}>
                  You can complete Brain Lab and enter tests for free. After purchase, history, score, and extended form analytics open.
                </p>
              </section>
            )}
            <PlayerTestsPanel
              hasResultsAccess={hasPerformanceCoachCrmAccess}
              onOpenBrainLab={() => navigate(`${ROUTES.TEST_TRACKER}?tab=brain`)}
              onOpenWeeklyTests={() => navigate(`${ROUTES.TEST_TRACKER}?tab=weekly`)}
            />
          </TabsContent>
        )}
        
        <TabsContent value="analytics" className="space-y-4">
          <Card style={COMPONENT_STYLES.card}>
            <CardHeader>
              <CardTitle style={{ color: COLORS.textColor }}>Detailed analytics</CardTitle>
              <CardDescription style={{ color: COLORS.textColorSecondary }}>Detailed data analysis for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] flex items-center justify-center">
                <p style={{ color: COLORS.textColorSecondary }}>
                  {isStaff 
                    ? "Go to Analytics for deeper team data analysis" 
                    : "Go to Statistics for deeper analysis of your data"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="balance" className="space-y-4">
          <Card style={COMPONENT_STYLES.card}>
            <CardHeader>
              <CardTitle style={{ color: COLORS.textColor }}>Balance wheel</CardTitle>
              <CardDescription style={{ color: COLORS.textColorSecondary }}>
                {isStaff ? "Team balance wheel" : "Your balance wheel"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isStaff ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor }}>
                    <CardHeader>
                      <CardTitle style={{ color: COLORS.textColor, fontSize: '1.25rem' }}>
                        Team average indicators
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="h-[600px]">
                        <BalanceWheelChart 
                          data={{
                            physical: 7.2,
                            emotional: 6.8,
                            intellectual: 8.1,
                            spiritual: 5.9,
                            occupational: 7.5,
                            social: 6.4,
                            environmental: 7.0,
                            financial: 6.2
                          }}
                          title="Team averaged indicators"
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="space-y-4">
                    <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor }}>
                      <CardHeader>
                        <CardTitle style={{ color: COLORS.textColor, fontSize: '1.25rem' }}>
                          Team balance recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-4">
                          <li className="flex items-start">
                            <ArrowUpRight className="mr-2 h-5 w-5" style={{ color: COLORS.primary }} />
                            <p className="text-sm" style={{ color: COLORS.textColor }}>
                              Pay attention to the team's spiritual growth - it is the lowest score
                            </p>
                          </li>
                          <li className="flex items-start">
                            <ArrowUpRight className="mr-2 h-5 w-5" style={{ color: COLORS.primary }} />
                            <p className="text-sm" style={{ color: COLORS.textColor }}>
                              Develop social connections between team players
                            </p>
                          </li>
                          <li className="flex items-start">
                            <ArrowUpRight className="mr-2 h-5 w-5" style={{ color: COLORS.primary }} />
                            <p className="text-sm" style={{ color: COLORS.textColor }}>
                              Check players' financial wellbeing - one of the lower scores
                            </p>
                          </li>
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" className="w-full" size="sm" 
                                style={{ borderColor: COLORS.borderColor, color: COLORS.primary }}>
                          Detailed analysis
                          <ChevronRight className="ml-auto h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor }}>
                      <CardHeader>
                        <CardTitle style={{ color: COLORS.textColor, fontSize: '1.25rem' }}>
                          Change dynamics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm" style={{ color: COLORS.textColorSecondary }}>
                          Compared with last month:
                        </p>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                            <span className="text-sm" style={{ color: COLORS.textColor }}>
                              Intellectual development: +0.7
                            </span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                            <span className="text-sm" style={{ color: COLORS.textColor }}>
                              Professional growth: +0.5
                            </span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                            <span className="text-sm" style={{ color: COLORS.textColor }}>
                              Emotional state: -0.3
                            </span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>
                            <span className="text-sm" style={{ color: COLORS.textColor }}>
                              Other indicators: unchanged
                            </span>
                          </div>
                  </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-[600px]">
                    <BalanceWheelChart 
                      data={{
                        physical: 8,
                        emotional: 6,
                        intellectual: 9,
                        spiritual: 5,
                        occupational: 7,
                        social: 6,
                        environmental: 8,
                        financial: 7
                      }}
                      title="Your balance wheel"
                    />
                  </div>
                  
                  <div className="space-y-6">
                    <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor }}>
                      <CardHeader>
                        <CardTitle style={{ color: COLORS.textColor, fontSize: '1.25rem' }}>
                          Personal recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-4">
                          <li className="flex items-start">
                            <ArrowUpRight className="mr-2 h-5 w-5" style={{ color: COLORS.primary }} />
                            <p className="text-sm" style={{ color: COLORS.textColor }}>
                              Pay attention to spiritual growth - meditation, reading, and self-reflection
                            </p>
                          </li>
                          <li className="flex items-start">
                            <ArrowUpRight className="mr-2 h-5 w-5" style={{ color: COLORS.primary }} />
                            <p className="text-sm" style={{ color: COLORS.textColor }}>
                              Work on emotional state - practice relaxation techniques
                            </p>
                          </li>
                          <li className="flex items-start">
                            <ArrowUpRight className="mr-2 h-5 w-5" style={{ color: COLORS.primary }} />
                            <p className="text-sm" style={{ color: COLORS.textColor }}>
                              Develop social connections - join team activities
                            </p>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor }}>
                      <CardHeader>
                        <CardTitle style={{ color: COLORS.textColor, fontSize: '1.25rem' }}>
                          Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          <li className="flex items-center">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.primary, marginRight: '0.5rem' }}></div>
                            <span className="text-sm" style={{ color: COLORS.textColor }}>
                              Intellectual development (9/10)
                            </span>
                          </li>
                          <li className="flex items-center">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.primary, marginRight: '0.5rem' }}></div>
                            <span className="text-sm" style={{ color: COLORS.textColor }}>
                              Physical health (8/10)
                            </span>
                          </li>
                          <li className="flex items-center">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.primary, marginRight: '0.5rem' }}></div>
                            <span className="text-sm" style={{ color: COLORS.textColor }}>
                              Environment (8/10)
                            </span>
                          </li>
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" className="w-full" size="sm" 
                                style={{ borderColor: COLORS.borderColor, color: COLORS.primary }}>
                          Go to section "Balance wheel"
                          <ChevronRight className="ml-auto h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <Card style={COMPONENT_STYLES.card}>
            <CardHeader>
              <CardTitle style={{ color: COLORS.textColor }}>Reports</CardTitle>
              <CardDescription style={{ color: COLORS.textColorSecondary }}>
                {isStaff ? "Team reports" : "Your team reports"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] flex items-center justify-center">
                <p style={{ color: COLORS.textColorSecondary }}>
                  {isStaff ? "Team reports" : "Your team reports"}
                    </p>
                  </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Обновим функцию calcDayAvgEnergy для корректной работы с типами
const calcDayAvgEnergy = (entries: MoodEntry[], dayIndex: number) => {
  const dayEntries = entries.filter(entry => {
    if (!entry.date) return false;
    try {
      const entryDate = typeof entry.date === 'string' ? new Date(entry.date) : entry.date as Date;
      return entryDate.getDay() === dayIndex;
    } catch (e) {
      return false;
    }
  });

  if (dayEntries.length === 0) return 0;

  const energySum = dayEntries.reduce((sum, entry) => {
    const energyValue = typeof entry.energy === 'number' ? entry.energy : 
                        (typeof entry.energyValue === 'number' ? entry.energyValue : 0);
    return sum + energyValue;
  }, 0);

  return parseFloat((energySum / dayEntries.length).toFixed(1));
};

// Обновим функцию calcDayAvgMood для работы с обоими форматами данных о настроении
const calcDayAvgMood = (entries: MoodEntry[], dayIndex: number) => {
  const dayEntries = entries.filter(entry => {
    if (!entry.date) return false;
    try {
      const entryDate = typeof entry.date === 'string' ? new Date(entry.date) : entry.date as Date;
      return entryDate.getDay() === dayIndex;
    } catch (e) {
      return false;
    }
  });

  if (dayEntries.length === 0) return 0;

  const moodSum = dayEntries.reduce((sum, entry) => {
    const moodValue = typeof entry.mood === 'number' ? entry.mood : 
                      (typeof entry.value === 'number' ? entry.value : 0);
    return sum + moodValue;
  }, 0);

  return parseFloat((moodSum / dayEntries.length).toFixed(1));
};

export default Dashboard;
