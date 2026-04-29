import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MoodChart from "@/components/charts/MoodChart";
import TestChart from "@/components/charts/TestChart";
import TestDistributionChart from "@/components/charts/TestDistributionChart";
import { prepareTestDistribution } from "@/utils/statsUtils";
import { COLORS } from "@/styles/theme";

interface PlayersStatsProps {
 playersMoodStats: any[];
 playersSleepStats: any[];
 playersTestStats: any[];
 averagePlayerStats: {
  avgMood: number;
  avgEnergy: number;
  avgSleep: number;
  completedTests: number;
  totalPlayers: number;
 };
 players: any[];
 selectedPlayerId: string;
 onPlayerChange: (playerId: string) => void;
 playerStatsData: any;
 loadingPlayerStats: boolean;
 loadingPlayersData: boolean;
 loadingError: string | null;
}

/**
 * Компонент для отображения статистики по игрокам (режим тренера)
 */
const PlayersStats = ({
 playersMoodStats,
 playersSleepStats,
 playersTestStats,
 averagePlayerStats,
 players,
 selectedPlayerId,
 onPlayerChange,
 playerStatsData,
 loadingPlayerStats,
 loadingPlayersData,
 loadingError
}: PlayersStatsProps) => {
 const [statsView, setStatsView] = useState<"mood" | "tests">("mood");
 const combinedMoodStats = playersMoodStats.map((player) => {
  const sleepStats = playersSleepStats.find((entry) => entry.userId === player.userId);
  return {
   ...player,
   sleepHours: typeof sleepStats?.avgSleep === "number" ? sleepStats.avgSleep : undefined
  };
 });

 return (
  <div className="space-y-6">
   <div className="flex flex-col md:flex-row gap-4">
    <Card className="flex-1 bg-[#1C1F3B] border-[#293056] shadow-none">
     <CardHeader>
      <CardTitle className="text-white">Overall statistics players</CardTitle>
      <CardDescription className="text-gray-400">Average player mood and energy metrics</CardDescription>
     </CardHeader>
     <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
       <div className="bg-[#14162D] p-4 rounded-lg">
        <p className="text-sm text-gray-400">Average mood</p>
        <p className="text-2xl font-bold text-white">{averagePlayerStats.avgMood.toFixed(1)}</p>
       </div>
       <div className="bg-[#14162D] p-4 rounded-lg">
        <p className="text-sm text-gray-400">Average energy</p>
        <p className="text-2xl font-bold text-white">{averagePlayerStats.avgEnergy.toFixed(1)}</p>
       </div>
       <div className="bg-[#14162D] p-4 rounded-lg">
        <p className="text-sm text-gray-400">Average sleep</p>
        <p className="text-2xl font-bold text-white">{averagePlayerStats.avgSleep.toFixed(1)}ч</p>
       </div>
       <div className="bg-[#14162D] p-4 rounded-lg">
        <p className="text-sm text-gray-400">Tests completed</p>
        <p className="text-2xl font-bold text-white">{averagePlayerStats.completedTests}</p>
       </div>
       <div className="bg-[#14162D] p-4 rounded-lg">
        <p className="text-sm text-gray-400">Total players</p>
        <p className="text-2xl font-bold text-white">{averagePlayerStats.totalPlayers}</p>
       </div>
      </div>
     </CardContent>
    </Card>
   </div>

   <div className="flex items-center gap-2 mb-4">
    <Select value={statsView} onValueChange={(value: "mood" | "tests") => setStatsView(value)}>
     <SelectTrigger className="w-[180px] bg-[#1C1F3B] border-[#293056] text-white">
      <SelectValue placeholder="Choose statistics type" />
     </SelectTrigger>
     <SelectContent className="bg-[#1C1F3B] border-[#293056] text-white">
      <SelectItem value="mood">Mood</SelectItem>
      <SelectItem value="tests">Tests</SelectItem>
     </SelectContent>
    </Select>
   </div>

   {loadingPlayersData ? (
    <div className="flex justify-center items-center py-20">
     <p className="text-white">Loading data...</p>
    </div>
   ) : loadingError ? (
    <div className="flex justify-center items-center py-20">
     <p className="text-red-500">{loadingError}</p>
    </div>
   ) : statsView === "mood" ? (
    <Card className="bg-[#1C1F3B] border-[#293056] shadow-none">
     <CardHeader>
      <CardTitle className="text-white">Statistics настроения players</CardTitle>
      <CardDescription className="text-gray-400">Average mood, energy, and sleep metrics across all players</CardDescription>
     </CardHeader>
     <CardContent>
      <MoodChart data={combinedMoodStats} height={400} />
     </CardContent>
    </Card>
   ) : (
    <Card className="bg-[#1C1F3B] border-[#293056] shadow-none">
     <CardHeader>
      <CardTitle className="text-white">Statistics тестов players</CardTitle>
      <CardDescription className="text-gray-400">Player test results by type</CardDescription>
     </CardHeader>
     <CardContent>
      <TestChart data={playersTestStats} height={400} />
     </CardContent>
    </Card>
   )}

   <div className="flex flex-col md:flex-row gap-6">
    <Card className="flex-1 bg-[#1C1F3B] border-[#293056] shadow-none">
     <CardHeader>
      <CardTitle className="text-white">Player statistics</CardTitle>
      <CardDescription className="text-gray-400">Detailed statistics for the selected player</CardDescription>
     </CardHeader>
     <CardContent>
      <div className="mb-4">
       <Select value={selectedPlayerId} onValueChange={onPlayerChange}>
        <SelectTrigger className="bg-[#1C1F3B] border-[#293056] text-white">
         <SelectValue placeholder="Select player" />
        </SelectTrigger>
        <SelectContent className="bg-[#1C1F3B] border-[#293056] text-white">
         {players.map((player) => (
          <SelectItem key={player._id} value={player._id}>
           {player.name}
          </SelectItem>
         ))}
        </SelectContent>
       </Select>
      </div>

      {loadingPlayerStats ? (
       <div className="flex justify-center items-center py-20">
        <p className="text-white">Loading player data...</p>
       </div>
      ) : !playerStatsData ? (
       <div className="flex justify-center items-center py-20">
        <p className="text-white">Select a player to view statistics</p>
       </div>
      ) : (
       <div className="space-y-6">
        <div>
         <h3 className="text-lg font-semibold mb-4 text-white">Mood and energy</h3>
         <MoodChart data={playerStatsData.moodStats || []} height={300} />
        </div>
        {playerStatsData.testStats && playerStatsData.testStats.length > 0 && (
         <div>
          <h3 className="text-lg font-semibold mb-4 text-white">Test results</h3>
          <TestChart data={playerStatsData.testStats || []} height={300} />
         </div>
        )}
        {playerStatsData.testEntries && playerStatsData.testEntries.length > 0 && (
         <div>
          <h3 className="text-lg font-semibold mb-4 text-white">Test type distribution</h3>
          <TestDistributionChart 
           data={prepareTestDistribution(playerStatsData.testEntries || [])} 
           height={300} 
          />
         </div>
        )}
       </div>
      )}
     </CardContent>
    </Card>
   </div>
  </div>
 );
};

export default PlayersStats; 
