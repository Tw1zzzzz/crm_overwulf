import React, { useState, useEffect } from 'react';
import { 
 TrendingUp, 
 TrendingDown, 
 BarChart3, 
 Activity, 
 Target,
 Calendar,
 Filter,
 RefreshCw,
 Eye,
 AlertCircle,
 CheckCircle,
 Minus,
 ArrowUp,
 ArrowDown,
 Equal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
 Select, 
 SelectContent, 
 SelectItem, 
 SelectTrigger, 
 SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { COLORS } from "@/styles/theme";
import {
 getMoodReportsCorrelations,
 getPerformancePatterns,
 getBalanceWheelReportsCorrelations,
 getComprehensiveCorrelationAnalysis,
 getCorrelationStats,
 ReportMoodCorrelation,
 TeamPerformancePattern,
 BalanceWheelReportCorrelation,
 ComprehensiveCorrelationAnalysis,
 CorrelationStats,
 CorrelationResult
} from '@/lib/api';

const CorrelationAnalysis: React.FC = () => {
 // Состояния
 const [loading, setLoading] = useState(true);
 const [isFeatureInDevelopment, setIsFeatureInDevelopment] = useState(false);
 const [correlationStats, setCorrelationStats] = useState<CorrelationStats | null>(null);
 const [moodCorrelations, setMoodCorrelations] = useState<ReportMoodCorrelation[]>([]);
 const [performancePatterns, setPerformancePatterns] = useState<TeamPerformancePattern[]>([]);
 const [balanceCorrelations, setBalanceCorrelations] = useState<BalanceWheelReportCorrelation[]>([]);
 const [comprehensiveAnalysis, setComprehensiveAnalysis] = useState<ComprehensiveCorrelationAnalysis | null>(null);
 
 // Фильтры
 const [dateFrom, setDateFrom] = useState('');
 const [dateTo, setDateTo] = useState('');
 const [monthsBack, setMonthsBack] = useState(6);
 const [activeTab, setActiveTab] = useState<'overview' | 'mood' | 'patterns' | 'balance' | 'comprehensive'>('overview');

 const { toast } = useToast();
 const { user } = useAuth();
 const isStaff = user?.role === 'staff';

 // Проверка доступа
 if (!isStaff) {
  return (
   <div className="container mx-auto p-6">
    <div className="text-center py-12">
     <div className="bg-blue-50 rounded-lg p-8">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
       <Target className="w-8 h-8 text-blue-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Correlation analysis</h2>
      <p className="text-gray-600 mb-4">
       Yesнная функция доступна только персоналу for analysis эффективности team reports
      </p>
      <div className="text-sm text-blue-600">
       <p>✨ Analysis связей между reportsи и настроением team</p>
       <p>📊 Выявление паттернов performance</p>
       <p>🎯 Оптимofация стратегий управления командой</p>
      </div>
     </div>
    </div>
   </div>
  );
 }

 // Загрузка данных
 const fetchCorrelationStats = async () => {
  try {
   const response = await getCorrelationStats();
   setCorrelationStats(response.data);
   setIsFeatureInDevelopment(false);
  } catch (error: any) {
   console.error('Correlation statistics loading error:', error);
   
   // Проверяем, если функция в разработке (501 статус)
   if (error.response?.status === 501) {
    setIsFeatureInDevelopment(true);
   }
   
   // Не показываем toast для 404/501 ошибок (функция может быть не реалofована)
   if (error.response?.status !== 404 && error.response?.status !== 501) {
    toast({
     title: "Error",
     description: "Failed to load correlation statistics",
     variant: "destructive",
    });
   }
   setCorrelationStats(null);
  }
 };

 const fetchMoodCorrelations = async () => {
  try {
   const response = await getMoodReportsCorrelations({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined
   });
   setMoodCorrelations(response.data);
  } catch (error: any) {
   console.error('Mood correlation loading error:', error);
   // Не показываем toast для 404/501 ошибок (функция может быть не реалofована)
   if (error.response?.status !== 404 && error.response?.status !== 501) {
    toast({
     title: "Error",
     description: "Failed to load mood correlations",
     variant: "destructive",
    });
   }
   setMoodCorrelations([]); // Устанавливаем пустой массив при ошибке
  }
 };

 const fetchPerformancePatterns = async () => {
  try {
   const response = await getPerformancePatterns(monthsBack);
   setPerformancePatterns(response.data);
  } catch (error: any) {
   console.error('Performance pattern loading error:', error);
   if (error.response?.status !== 404 && error.response?.status !== 501) {
    toast({
     title: "Error",
     description: "Failed to load performance patterns",
     variant: "destructive",
    });
   }
   setPerformancePatterns([]);
  }
 };

 const fetchBalanceCorrelations = async () => {
  try {
   const response = await getBalanceWheelReportsCorrelations({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined
   });
   setBalanceCorrelations(response.data);
  } catch (error: any) {
   console.error('Balance correlation loading error:', error);
   if (error.response?.status !== 404 && error.response?.status !== 501) {
    toast({
     title: "Error",
     description: "Failed to load balance wheel correlations",
     variant: "destructive",
    });
   }
   setBalanceCorrelations([]);
  }
 };

 const fetchComprehensiveAnalysis = async () => {
  try {
   const response = await getComprehensiveCorrelationAnalysis({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined
   });
   setComprehensiveAnalysis(response.data);
  } catch (error: any) {
   console.error('Comprehensive analysis loading error:', error);
   if (error.response?.status !== 404 && error.response?.status !== 501) {
    toast({
     title: "Error",
     description: "Failed to load comprehensive analysis",
     variant: "destructive",
    });
   }
   setComprehensiveAnalysis(null);
  }
 };

 // Загрузка данных при монтировании компонента
 useEffect(() => {
  if (isStaff) {
   const loadData = async () => {
    setLoading(true);
    try {
     await Promise.all([
      fetchCorrelationStats(),
      fetchMoodCorrelations(),
      fetchPerformancePatterns()
     ]);
    } catch (error) {
     console.error('Data loading error корреляций:', error);
    } finally {
     setLoading(false);
    }
   };
   
   loadData();
  }
 }, [isStaff]);

 // Update данных при changении фильтров
 useEffect(() => {
  if (isStaff && !loading) {
   fetchMoodCorrelations();
   fetchBalanceCorrelations();
  }
 }, [dateFrom, dateTo, isStaff]);

 useEffect(() => {
  if (isStaff && !loading) {
   fetchPerformancePatterns();
  }
 }, [monthsBack, isStaff]);

 const handleRefresh = async () => {
  if (!isStaff) return;
  
  setLoading(true);
  try {
   await Promise.all([
    fetchCorrelationStats(),
    fetchMoodCorrelations(),
    fetchPerformancePatterns(),
    fetchBalanceCorrelations(),
    fetchComprehensiveAnalysis()
   ]);
  } finally {
   setLoading(false);
  }
 };

 // Sunпомогательные функции
 const getSignificanceColor = (significance: string): string => {
  switch (significance) {
   case 'high': return 'text-green-600 bg-green-50';
   case 'medium': return 'text-yellow-600 bg-yellow-50';
   case 'low': return 'text-orange-600 bg-orange-50';
   default: return 'text-gray-600 bg-gray-50';
  }
 };

 const getSignificanceLabel = (significance: string): string => {
  switch (significance) {
   case 'high': return 'High';
   case 'medium': return 'Medium';
   case 'low': return 'Low';
   default: return 'Missing';
  }
 };

 const getTrendIcon = (trend: string) => {
  switch (trend) {
   case 'improving': return <ArrowUp className="h-4 w-4 text-green-600" />;
   case 'declining': return <ArrowDown className="h-4 w-4 text-red-600" />;
   default: return <Equal className="h-4 w-4 text-gray-600" />;
  }
 };

 const getTrendColor = (trend: string): string => {
  switch (trend) {
   case 'improving': return 'text-green-600 bg-green-50';
   case 'declining': return 'text-red-600 bg-red-50';
   default: return 'text-gray-600 bg-gray-50';
  }
 };

 const formatPercentage = (value: number): string => {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
 };

 const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
   day: '2-digit',
   month: '2-digit',
   year: 'numeric'
  });
 };

 if (loading) {
  return (
   <div className="space-y-6">
    {/* Скелетон для карточек статистики */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
     {[...Array(4)].map((_, i) => (
      <Card key={i} className="animate-pulse">
       <CardContent className="p-6">
        <div className="flex items-center space-x-2">
         <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
         <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
         </div>
        </div>
       </CardContent>
      </Card>
     ))}
    </div>
    
    {/* Скелетон для таблицы */}
    <Card className="animate-pulse">
     <CardHeader>
      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
     </CardHeader>
     <CardContent>
      <div className="space-y-4">
       {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-200 rounded"></div>
       ))}
      </div>
     </CardContent>
    </Card>
   </div>
  );
 }

 return (
  <div className="space-y-6">
   {/* Title и управление */}
   <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
     <h1 className="text-3xl font-bold text-gray-900">Correlation analysis</h1>
     <p className="text-gray-600">
      Analysis of relationships between team reports and performance metrics
     </p>
    </div>
    <div className="flex items-center gap-3">
     <Button 
      variant="outline" 
      size="sm" 
      onClick={handleRefresh}
      disabled={loading}
     >
      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
      Update
     </Button>
    </div>
   </div>

   {/* Сообщение о разработке */}
   {isFeatureInDevelopment && (
    <Card className="border-orange-200 bg-orange-50">
     <CardContent className="p-4">
      <div className="flex items-center gap-3">
       <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
        <Activity className="w-4 h-4 text-orange-600" />
       </div>
       <div>
        <h3 className="font-medium text-orange-900">Feature in development</h3>
        <p className="text-sm text-orange-700">
         Correlation analysis находится в стадии активной разработки. 
         Полная функциональность будет доступна в ближайших обновлениях.
        </p>
       </div>
      </div>
     </CardContent>
    </Card>
   )}

   {/* Фильтры */}
   <Card>
    <CardContent className="p-6">
     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">
        From date
       </label>
       <Input
        type="date"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
        max={new Date().toISOString().split('T')[0]}
       />
      </div>
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">
        To date
       </label>
       <Input
        type="date"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        max={new Date().toISOString().split('T')[0]}
       />
      </div>
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1">
        Monthев for analysis
       </label>
       <Select value={monthsBack.toString()} onValueChange={(value) => setMonthsBack(parseInt(value))}>
        <SelectTrigger>
         <SelectValue />
        </SelectTrigger>
        <SelectContent>
         <SelectItem value="3">3 months</SelectItem>
         <SelectItem value="6">6 months</SelectItem>
         <SelectItem value="12">12 months</SelectItem>
         <SelectItem value="24">24 months</SelectItem>
        </SelectContent>
       </Select>
      </div>
      <div className="flex items-end">
       <Button onClick={handleRefresh} className="w-full">
        <Filter className="h-4 w-4 mr-2" />
        Apply
       </Button>
      </div>
     </div>
    </CardContent>
   </Card>

   {/* Statistics */}
   {correlationStats && (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
     <Card>
      <CardContent className="p-6">
       <div className="flex items-center space-x-2">
        <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.primary + '20' }}>
         <BarChart3 className="h-6 w-6" style={{ color: COLORS.primary }} />
        </div>
        <div className="flex-1">
         <p className="text-sm font-medium text-gray-600">Total reports</p>
         <p className="text-2xl font-bold text-gray-900">
          {correlationStats.totalReportsAnalyzed}
         </p>
        </div>
       </div>
      </CardContent>
     </Card>

     <Card>
      <CardContent className="p-6">
       <div className="flex items-center space-x-2">
        <div className="p-2 rounded-lg bg-green-100">
         <TrendingUp className="h-6 w-6 text-green-600" />
        </div>
        <div className="flex-1">
         <p className="text-sm font-medium text-gray-600">Positive impact</p>
         <p className="text-2xl font-bold text-gray-900">
          {correlationStats.positiveImpactReports}
         </p>
        </div>
       </div>
      </CardContent>
     </Card>

     <Card>
      <CardContent className="p-6">
       <div className="flex items-center space-x-2">
        <div className="p-2 rounded-lg bg-red-100">
         <TrendingDown className="h-6 w-6 text-red-600" />
        </div>
        <div className="flex-1">
         <p className="text-sm font-medium text-gray-600">Negative impact</p>
         <p className="text-2xl font-bold text-gray-900">
          {correlationStats.negativeImpactReports}
         </p>
        </div>
       </div>
      </CardContent>
     </Card>

     <Card>
      <CardContent className="p-6">
       <div className="flex items-center space-x-2">
        <div className="p-2 rounded-lg bg-blue-100">
         <Target className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
         <p className="text-sm font-medium text-gray-600">Strong corr.</p>
         <p className="text-2xl font-bold text-gray-900">
          {correlationStats.highCorrelations}
         </p>
        </div>
       </div>
      </CardContent>
     </Card>
    </div>
   )}

   {/* Табы с analysisом */}
   <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
    <TabsList className="grid w-full grid-cols-5">
     <TabsTrigger value="overview">Overview</TabsTrigger>
     <TabsTrigger value="mood">Mood</TabsTrigger>
     <TabsTrigger value="patterns">Patterns</TabsTrigger>
     <TabsTrigger value="balance">Balance</TabsTrigger>
     <TabsTrigger value="comprehensive">Comprehensive</TabsTrigger>
    </TabsList>

    {/* Overview */}
    <TabsContent value="overview" className="space-y-6">
     {comprehensiveAnalysis && (
      <Card>
       <CardHeader>
        <CardTitle className="flex items-center gap-2">
         <Activity className="h-5 w-5" />
         Ключевые инсайты
        </CardTitle>
       </CardHeader>
       <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="space-y-4">
          <div className="p-4 rounded-lg bg-blue-50">
           <h4 className="font-semibold text-blue-900 mb-2">Average mood impact</h4>
           <p className="text-2xl font-bold text-blue-700">
            {formatPercentage(comprehensiveAnalysis.insights.averageMoodImpact)}
           </p>
           <p className="text-sm text-blue-600">from baseline</p>
          </div>
          
          <div className="p-4 rounded-lg bg-green-50">
           <h4 className="font-semibold text-green-900 mb-2">Most effective type</h4>
           <p className="text-lg font-bold text-green-700">
            {comprehensiveAnalysis.insights.mostEffectiveReportType || 'Not defined'}
           </p>
           <p className="text-sm text-green-600">team reports</p>
          </div>
         </div>
         
         <div className="space-y-4">
          <div className={`p-4 rounded-lg ${getTrendColor(comprehensiveAnalysis.insights.overallTrend)}`}>
           <h4 className="font-semibold mb-2 flex items-center gap-2">
            {getTrendIcon(comprehensiveAnalysis.insights.overallTrend)}
            Общий тренд
           </h4>
           <p className="text-lg font-bold">
            {comprehensiveAnalysis.insights.overallTrend === 'improving' && 'Improvement'}
            {comprehensiveAnalysis.insights.overallTrend === 'declining' && 'Decline'}
            {comprehensiveAnalysis.insights.overallTrend === 'stable' && 'Stability'}
           </p>
           <p className="text-sm opacity-75">team performance</p>
          </div>
          
          <div className="p-4 rounded-lg bg-purple-50">
           <h4 className="font-semibold text-purple-900 mb-2">Reports analyzed</h4>
           <p className="text-2xl font-bold text-purple-700">
            {comprehensiveAnalysis.insights.totalReportsAnalyzed}
           </p>
           <p className="text-sm text-purple-600">for the selected period</p>
          </div>
         </div>
        </div>
       </CardContent>
      </Card>
     )}
    </TabsContent>

    {/* Mood correlations */}
    <TabsContent value="mood" className="space-y-6">
     <Card>
      <CardHeader>
       <CardTitle className="flex items-center gap-2">
        <Activity className="h-5 w-5" />
        Корреляции reports и настроения
       </CardTitle>
      </CardHeader>
      <CardContent>
       {moodCorrelations.length === 0 ? (
        <div className="text-center py-8">
         <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
         <p className="text-gray-600">No data for analysis корреляций</p>
        </div>
       ) : (
        <div className="space-y-4">
         {moodCorrelations.map((correlation, index) => (
          <div key={index} className="border rounded-lg p-4">
           <div className="flex items-start justify-between mb-3">
            <div>
             <h4 className="font-semibold text-gray-900">{correlation.reportTitle}</h4>
             <p className="text-sm text-gray-600">
              {correlation.reportType} • {formatDate(correlation.reportDate)}
             </p>
            </div>
            <Badge className={getSignificanceColor(correlation.correlations.timeWindow.correlation.significance)}>
             {getSignificanceLabel(correlation.correlations.timeWindow.correlation.significance)}
            </Badge>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
             <p className="text-sm text-gray-600">Before report</p>
             <p className="text-lg font-bold text-gray-900">
              {correlation.correlations.beforeAfter.moodBefore.toFixed(1)}
             </p>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded-lg">
             <p className="text-sm text-gray-600">After report</p>
             <p className="text-lg font-bold text-gray-900">
              {correlation.correlations.beforeAfter.moodAfter.toFixed(1)}
             </p>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded-lg">
             <p className="text-sm text-gray-600">Change</p>
             <p className={`text-lg font-bold ${
              correlation.correlations.beforeAfter.change > 0 ? 'text-green-600' : 
              correlation.correlations.beforeAfter.change < 0 ? 'text-red-600' : 'text-gray-600'
             }`}>
              {formatPercentage(correlation.correlations.beforeAfter.changePercent)}
             </p>
            </div>
           </div>
          </div>
         ))}
        </div>
       )}
      </CardContent>
     </Card>
    </TabsContent>

    {/* Patterns performance */}
    <TabsContent value="patterns" className="space-y-6">
     <Card>
      <CardHeader>
       <CardTitle className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        Patterns performance по месяцам
       </CardTitle>
      </CardHeader>
      <CardContent>
       {performancePatterns.length === 0 ? (
        <div className="text-center py-8">
         <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
         <p className="text-gray-600">No data for analysis паттернов</p>
        </div>
       ) : (
        <div className="space-y-4">
         {performancePatterns.map((pattern, index) => (
          <div key={index} className="border rounded-lg p-4">
           <div className="flex items-center justify-between mb-4">
            <div>
             <h4 className="font-semibold text-gray-900">{pattern.period}</h4>
             <p className="text-sm text-gray-600">
              {pattern.reportsCount} reports
             </p>
            </div>
            <div className="flex items-center gap-2">
             {getTrendIcon(pattern.moodTrend)}
             <Badge className={getTrendColor(pattern.moodTrend)}>
              {pattern.moodTrend === 'improving' && 'Improvement'}
              {pattern.moodTrend === 'declining' && 'Decline'}
              {pattern.moodTrend === 'stable' && 'Stable'}
             </Badge>
            </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
             <p className="text-sm text-blue-600">Average mood before</p>
             <p className="text-lg font-bold text-blue-700">
              {pattern.avgMoodBeforeReports.toFixed(1)}
             </p>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
             <p className="text-sm text-green-600">Average mood after</p>
             <p className="text-lg font-bold text-green-700">
              {pattern.avgMoodAfterReports.toFixed(1)}
             </p>
            </div>
           </div>
           
           {pattern.reportTypes.length > 0 && (
            <div>
             <h5 className="font-medium text-gray-900 mb-2">Typeы reports:</h5>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {pattern.reportTypes.map((type, typeIndex) => (
               <div key={typeIndex} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-700">{type.type}</span>
                <div className="flex items-center gap-2">
                 <span className="text-xs text-gray-500">{type.count}</span>
                 <span className={`text-sm font-medium ${
                  type.avgMoodImpact > 0 ? 'text-green-600' : 
                  type.avgMoodImpact < 0 ? 'text-red-600' : 'text-gray-600'
                 }`}>
                  {formatPercentage(type.avgMoodImpact)}
                 </span>
                </div>
               </div>
              ))}
             </div>
            </div>
           )}
          </div>
         ))}
        </div>
       )}
      </CardContent>
     </Card>
    </TabsContent>

    {/* Корреляции колеса баланса */}
    <TabsContent value="balance" className="space-y-6">
     <Card>
      <CardHeader>
       <CardTitle className="flex items-center gap-2">
        <Target className="h-5 w-5" />
        Корреляции reports и колеса баланса
       </CardTitle>
      </CardHeader>
      <CardContent>
       {balanceCorrelations.length === 0 ? (
        <div className="text-center py-8">
         <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
         <p className="text-gray-600">No data for analysis корреляций колеса баланса</p>
        </div>
       ) : (
        <div className="space-y-6">
         {balanceCorrelations.map((correlation, index) => (
          <div key={index} className="border rounded-lg p-4">
           <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">{correlation.reportTitle}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">Overall balance before</p>
              <p className="text-lg font-bold text-blue-700">
               {correlation.overallBalance.before.toFixed(1)}
              </p>
             </div>
             
             <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600">Overall balance after</p>
              <p className="text-lg font-bold text-green-700">
               {correlation.overallBalance.after.toFixed(1)}
              </p>
             </div>
             
             <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Improvement</p>
              <p className={`text-lg font-bold ${
               correlation.overallBalance.improvement > 0 ? 'text-green-600' : 
               correlation.overallBalance.improvement < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
               {correlation.overallBalance.improvement > 0 ? '+' : ''}{correlation.overallBalance.improvement.toFixed(1)}
              </p>
             </div>
            </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {correlation.balanceAreas.map((area, areaIndex) => (
             <div key={areaIndex} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
               <h6 className="text-sm font-medium text-gray-700">{area.area}</h6>
               <Badge className={getSignificanceColor(area.correlation.significance)} variant="outline">
                {getSignificanceLabel(area.correlation.significance)[0]}
               </Badge>
              </div>
              <div className="space-y-1">
               <div className="flex justify-between text-xs">
                <span className="text-gray-500">To:</span>
                <span className="font-medium">{area.beforeReport.toFixed(1)}</span>
               </div>
               <div className="flex justify-between text-xs">
                <span className="text-gray-500">After:</span>
                <span className="font-medium">{area.afterReport.toFixed(1)}</span>
               </div>
               <div className="flex justify-between text-xs">
                <span className="text-gray-500">Change:</span>
                <span className={`font-medium ${
                 area.change > 0 ? 'text-green-600' : 
                 area.change < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                 {area.change > 0 ? '+' : ''}{area.change.toFixed(1)}
                </span>
               </div>
              </div>
             </div>
            ))}
           </div>
          </div>
         ))}
        </div>
       )}
      </CardContent>
     </Card>
    </TabsContent>

    {/* Comprehensive analysis */}
    <TabsContent value="comprehensive" className="space-y-6">
     {comprehensiveAnalysis ? (
      <div className="space-y-6">
       {/* Итоговые инсайты */}
       <Card>
        <CardHeader>
         <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Comprehensive analysis
         </CardTitle>
        </CardHeader>
        <CardContent>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
           <h4 className="font-semibold text-gray-900">Key insights:</h4>
           <ul className="space-y-2">
            <li className="flex items-start gap-2">
             <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
             <span className="text-sm text-gray-700">
              Проanalysisировано {comprehensiveAnalysis.insights.totalReportsAnalyzed} team reports
             </span>
            </li>
            <li className="flex items-start gap-2">
             <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
             <span className="text-sm text-gray-700">
              Average mood impact: {formatPercentage(comprehensiveAnalysis.insights.averageMoodImpact)}
             </span>
            </li>
            {comprehensiveAnalysis.insights.mostEffectiveReportType && (
             <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span className="text-sm text-gray-700">
               Most effective type: {comprehensiveAnalysis.insights.mostEffectiveReportType}
              </span>
             </li>
            )}
            <li className="flex items-start gap-2">
             <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
             <span className="text-sm text-gray-700">
              Общий тренд: {
               comprehensiveAnalysis.insights.overallTrend === 'improving' ? 'улучшение' :
               comprehensiveAnalysis.insights.overallTrend === 'declining' ? 'ухудшение' : 'стабильность'
              }
             </span>
            </li>
           </ul>
          </div>
          
          <div className="space-y-4">
           <h4 className="font-semibold text-gray-900">Data for analysis:</h4>
           <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg text-center">
             <p className="text-sm text-blue-600">Mood correlations</p>
             <p className="text-lg font-bold text-blue-700">
              {comprehensiveAnalysis.moodCorrelations.length}
             </p>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg text-center">
             <p className="text-sm text-green-600">Patterns проofвод.</p>
             <p className="text-lg font-bold text-green-700">
              {comprehensiveAnalysis.performancePatterns.length}
             </p>
            </div>
            
            <div className="p-3 bg-purple-50 rounded-lg text-center">
             <p className="text-sm text-purple-600">Balance correlations</p>
             <p className="text-lg font-bold text-purple-700">
              {comprehensiveAnalysis.balanceCorrelations.length}
             </p>
            </div>
            
            <div className="p-3 bg-orange-50 rounded-lg text-center">
             <p className="text-sm text-orange-600">Date analysis</p>
             <p className="text-xs font-medium text-orange-700">
              {formatDate(comprehensiveAnalysis.generatedAt)}
             </p>
            </div>
           </div>
          </div>
         </div>
        </CardContent>
       </Card>
      </div>
     ) : (
      <Card>
       <CardContent className="flex items-center justify-center h-96">
        <div className="text-center">
         <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
         <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Comprehensive analysis недоступен
         </h3>
         <p className="text-gray-600">
          Not enough данных для проведения комплексного analysis
         </p>
        </div>
       </CardContent>
      </Card>
     )}
    </TabsContent>
   </Tabs>
  </div>
 );
};

export default CorrelationAnalysis; 