import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoodEntry, SleepEntry, TestEntry, StatsData } from "@/types";
import MoodChart from "@/components/charts/MoodChart";
import TestChart from "@/components/charts/TestChart";
import TestDistributionChart from "@/components/charts/TestDistributionChart";
import { getMoodByDayOfWeek, getTestsByDayOfWeek, timeRangeLabel, prepareTestDistribution } from "@/utils/statsUtils";
import { getReadableTestTypeDescription, getReadableTestTypeLabel } from "@/utils/testTypeMetadata";
import { COLORS } from "@/styles/theme";

interface PersonalStatsProps {
 moodData: StatsData[];
 testData: any[];
 testDistribution: any[];
 moodEntries: MoodEntry[];
 sleepEntries: SleepEntry[];
 testEntries: TestEntry[];
 timeRange: "week" | "month" | "3months";
 onTimeRangeChange: (value: "week" | "month" | "3months") => void;
}

/**
 * Компонент для отображения личной статистики пользователя
 */
const PersonalStats = ({
 moodData,
 testData,
 testDistribution,
 moodEntries,
 sleepEntries,
 testEntries,
 timeRange,
 onTimeRangeChange
}: PersonalStatsProps) => {
 // Получаем данные о настроении по дням недели
 const moodByDayOfWeek = getMoodByDayOfWeek(moodEntries);
 
 // Получаем данные о тестах по дням недели
 const testsByDayOfWeek = getTestsByDayOfWeek(testEntries);
 
 // Расчет общих показателей
 const getAverageStats = () => {
  let totalMood = 0;
  let totalEnergy = 0;
  let count = 0;
  
  moodData.forEach(entry => {
   if (entry.mood > 0) {
    totalMood += entry.mood;
    totalEnergy += entry.energy;
    count++;
   }
  });
  
  return {
   avgMood: count ? +(totalMood / count).toFixed(1) : 0,
   avgEnergy: count ? +(totalEnergy / count).toFixed(1) : 0,
   avgSleep: sleepEntries.length
    ? +(sleepEntries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0) / sleepEntries.length).toFixed(1)
    : 0
  };
 };
 
 // Получаем среднее количество выполненных тестов
 const getCompletedTests = () => {
  const testTypes = [...new Set(testEntries.map(t => (t.testType ?? 'generic')))];
  let results: Record<string, { count: number; avgScore: number; description: string }> = {};

  testTypes.forEach(type => {
   const typeTests = testEntries.filter(t => (t.testType ?? 'generic') === type);
   const totalScore = typeTests.reduce((sum, test) => sum + (test.scoreNormalized ?? 0), 0);
   
   results[getReadableTestTypeLabel(type)] = {
    count: typeTests.length,
    avgScore: typeTests.length ? +(totalScore / typeTests.length).toFixed(1) : 0,
    description: getReadableTestTypeDescription(type)
   };
  });
  
  return {
   total: testEntries.length,
   types: results
  };
 };
 
 const avgStats = getAverageStats();
 const completedTests = getCompletedTests();

 // Проверка наличия данных
 const hasAnyData = moodEntries.length > 0 || sleepEntries.length > 0 || testEntries.length > 0;

 return (
  <div className="space-y-6">
   {!hasAnyData ? (
    <Card className="bg-[#1C1F3B] border-[#293056] shadow-none">
     <CardHeader>
      <CardTitle className="text-white">No data to display</CardTitle>
      <CardDescription className="text-gray-400">Fill in mood and energy data and complete tests to see your statistics</CardDescription>
     </CardHeader>
     <CardContent>
      <div className="p-6 text-center">
       <p className="text-white mb-2">To show statistics you need:</p>
       <ul className="text-left text-gray-300 list-disc pl-6 space-y-2">
        <li>Fill in mood and energy data on the tab "Mood and Energy"</li>
        <li>Complete tests on the Tests tab</li>
        <li>Fill in the balance wheel on the tab "Balance wheel"</li>
       </ul>
      </div>
     </CardContent>
    </Card>
   ) : (
    <>
   <div className="flex flex-col md:flex-row gap-4">
    <Card className="flex-1 bg-[#1C1F3B] border-[#293056] shadow-none">
     <CardHeader>
      <CardTitle className="text-white">Overall statistics</CardTitle>
      <CardDescription className="text-gray-400">Your average mood and energy indicators</CardDescription>
     </CardHeader>
     <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
       <div className="bg-[#14162D] p-4 rounded-lg">
        <p className="text-sm text-gray-400">Average mood</p>
        <p className="text-2xl font-bold text-white">{avgStats.avgMood}</p>
       </div>
       <div className="bg-[#14162D] p-4 rounded-lg">
        <p className="text-sm text-gray-400">Average energy</p>
        <p className="text-2xl font-bold text-white">{avgStats.avgEnergy}</p>
       </div>
       <div className="bg-[#14162D] p-4 rounded-lg">
        <p className="text-sm text-gray-400">Average sleep</p>
        <p className="text-2xl font-bold text-white">{avgStats.avgSleep > 0 ? `${avgStats.avgSleep}ч` : "0ч"}</p>
       </div>
       <div className="bg-[#14162D] p-4 rounded-lg">
        <p className="text-sm text-gray-400">Tests completed</p>
        <p className="text-2xl font-bold text-white">{completedTests.total}</p>
       </div>
       <div className="bg-[#14162D] p-4 rounded-lg">
        <p className="text-sm text-gray-400">Active days</p>
        <p className="text-2xl font-bold text-white">{
           [...new Set(moodEntries.map(entry => entry.date.toString().split('T')[0]))].length
        }</p>
       </div>
      </div>
     </CardContent>
    </Card>
   </div>

   <div className="flex items-center gap-2 mb-4">
    <Select value={timeRange} onValueChange={(value: "week" | "month" | "3months") => onTimeRangeChange(value)}>
     <SelectTrigger className="w-[180px] bg-[#1C1F3B] border-[#293056] text-white">
      <SelectValue placeholder="Choose period" />
     </SelectTrigger>
     <SelectContent className="bg-[#1C1F3B] border-[#293056] text-white">
      <SelectItem value="week">Week</SelectItem>
      <SelectItem value="month">Month</SelectItem>
      <SelectItem value="3months">3 months</SelectItem>
     </SelectContent>
    </Select>
   </div>

   <Tabs defaultValue="mood">
    <TabsList className="mb-4 bg-[#14162D] border-[#293056]">
     <TabsTrigger value="mood" className="data-[state=active]:bg-[#1E88F7] text-white">Mood</TabsTrigger>
     <TabsTrigger value="tests" className="data-[state=active]:bg-[#1E88F7] text-white">Tests</TabsTrigger>
     <TabsTrigger value="analysis" className="data-[state=active]:bg-[#1E88F7] text-white">Analysis</TabsTrigger>
    </TabsList>
    
    <TabsContent value="mood">
     <Card className="bg-[#1C1F3B] border-[#293056] shadow-none">
      <CardHeader>
       <CardTitle className="text-white">Mood and energy dynamics {timeRangeLabel(timeRange)}</CardTitle>
       <CardDescription className="text-gray-400">Chart of average mood and energy changes by day</CardDescription>
      </CardHeader>
      <CardContent>
         {moodData.length > 0 ? (
       <MoodChart data={moodData} height={400} />
         ) : (
          <div className="p-6 text-center">
           <p className="text-gray-400">No mood data for the selected period</p>
          </div>
         )}
      </CardContent>
     </Card>
    </TabsContent>
    
    <TabsContent value="tests">
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-[#1C1F3B] border-[#293056] shadow-none">
       <CardHeader>
        <CardTitle className="text-white">Test results {timeRangeLabel(timeRange)}</CardTitle>
        <CardDescription className="text-gray-400">
         Averageний score по каждому типу тестов, включая Brain Lab и ручные entries.
        </CardDescription>
       </CardHeader>
       <CardContent>
        {Object.keys(completedTests.types).length > 0 ? (
         <div className="mb-5 grid gap-3 lg:grid-cols-2">
          {Object.entries(completedTests.types).map(([label, value]) => (
           <div key={label} className="rounded-xl border border-[#293056] bg-[#14162D] p-4">
            <div className="text-sm font-medium text-white">{label}</div>
            <div className="mt-1 text-xs text-gray-400">{value.description}</div>
            <div className="mt-3 flex items-center justify-between text-sm text-gray-300">
             <span>Attempts: {value.count}</span>
             <span>Average score: {value.avgScore.toFixed(1)}</span>
            </div>
           </div>
          ))}
         </div>
        ) : null}
          {testData.length > 0 ? (
        <TestChart data={testData} height={300} />
          ) : (
           <div className="p-6 text-center">
            <p className="text-gray-400">No test data for the selected period</p>
           </div>
          )}
       </CardContent>
      </Card>
      
      <Card className="bg-[#1C1F3B] border-[#293056] shadow-none">
       <CardHeader>
        <CardTitle className="text-white">Test type distribution</CardTitle>
        <CardDescription className="text-gray-400">Breakdown of test types</CardDescription>
       </CardHeader>
       <CardContent>
          {testDistribution.length > 0 || testEntries.length > 0 ? (
        <TestDistributionChart 
         data={testDistribution.length > 0 ? testDistribution : prepareTestDistribution(testEntries)} 
         height={300} 
        />
          ) : (
           <div className="p-6 text-center">
            <p className="text-gray-400">No test data</p>
           </div>
          )}
       </CardContent>
      </Card>
     </div>
    </TabsContent>
    
    <TabsContent value="analysis">
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-[#1C1F3B] border-[#293056] shadow-none">
       <CardHeader>
        <CardTitle className="text-white">Mood by weekday</CardTitle>
        <CardDescription className="text-gray-400">Average metrics by weekday</CardDescription>
       </CardHeader>
       <CardContent>
          {moodByDayOfWeek.length > 0 ? (
        <div className="overflow-x-auto">
         <table className="w-full">
          <thead>
           <tr className="border-b border-[#293056]">
            <th className="text-left p-2 text-white">Weekday</th>
            <th className="text-center p-2 text-white">Mood</th>
            <th className="text-center p-2 text-white">Energy</th>
            <th className="text-center p-2 text-white">Sleep</th>
           </tr>
          </thead>
          <tbody>
           {moodByDayOfWeek.map((day, idx) => (
            <tr key={day.name} className={idx % 2 === 0 ? 'bg-[#14162D]/60' : ''}>
             <td className="p-2 text-white">{day.name}</td>
             <td className="text-center p-2 text-white">{day.mood}</td>
             <td className="text-center p-2 text-white">{day.energy}</td>
             <td className="text-center p-2 text-white">
              {(() => {
               const daySleepEntries = sleepEntries.filter((entry) => {
                const date = new Date(entry.date);
                const weekDayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
                const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(day.name);
                return weekDayIndex === dayIndex;
               });

               if (!daySleepEntries.length) return '0';
               const averageSleep = daySleepEntries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0) / daySleepEntries.length;
               return `${averageSleep.toFixed(1)}ч`;
              })()}
             </td>
            </tr>
           ))}
          </tbody>
         </table>
        </div>
          ) : (
           <div className="p-6 text-center">
            <p className="text-gray-400">No data о настроении for analysis</p>
           </div>
          )}
       </CardContent>
      </Card>
      
      <Card className="bg-[#1C1F3B] border-[#293056] shadow-none">
       <CardHeader>
        <CardTitle className="text-white">Tests by weekday</CardTitle>
        <CardDescription className="text-gray-400">Average number of tests by weekday</CardDescription>
       </CardHeader>
       <CardContent>
          {testsByDayOfWeek.length > 0 ? (
        <div className="overflow-x-auto">
         <table className="w-full">
          <thead>
           <tr className="border-b border-[#293056]">
            <th className="text-left p-2 text-white">Weekday</th>
            <th className="text-center p-2 text-white">Test count</th>
            <th className="text-center p-2 text-white">Average score</th>
           </tr>
          </thead>
          <tbody>
           {testsByDayOfWeek.map((day, idx) => (
            <tr key={day.name} className={idx % 2 === 0 ? 'bg-[#14162D]/60' : ''}>
             <td className="p-2 text-white">{day.name}</td>
             <td className="text-center p-2 text-white">{day.count}</td>
             <td className="text-center p-2 text-white">{day.average}</td>
            </tr>
           ))}
          </tbody>
         </table>
        </div>
          ) : (
           <div className="p-6 text-center">
            <p className="text-gray-400">No test data for analysis</p>
           </div>
          )}
       </CardContent>
      </Card>
     </div>
    </TabsContent>
   </Tabs>
    </>
   )}
  </div>
 );
};

export default PersonalStats; 
