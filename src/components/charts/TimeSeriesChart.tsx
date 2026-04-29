import React, { useState } from 'react';
import {
 LineChart,
 Line,
 AreaChart,
 Area,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer,
 ReferenceLine,
 Dot,
 ComposedChart,
 Bar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { COLORS } from '@/styles/theme';
import { TrendingUp, TrendingDown, Minus, Target, Calendar, BarChart3 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TimeSeriesDataPoint {
 date: string;
 value: number;
 forecast?: number;
 confidenceUpper?: number;
 confidenceLower?: number;
 type: 'historical' | 'forecast';
}

interface TimeSeriesPattern {
 name: string;
 type: 'seasonal' | 'cyclical' | 'trending' | 'random';
 description: string;
 strength: number;
 period?: number;
 trend: {
  direction: 'increasing' | 'decreasing' | 'stable';
  slope: number;
  rSquared: number;
 };
}

interface TimeSeriesChartProps {
 data: TimeSeriesDataPoint[];
 patterns: TimeSeriesPattern[];
 metric: string;
 title?: string;
 showConfidenceInterval?: boolean;
 showTrendLine?: boolean;
 height?: number;
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
 data,
 patterns,
 metric,
 title = 'Time series analysis',
 showConfidenceInterval = true,
 showTrendLine = true,
 height = 400
}) => {
 const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
 const [selectedPattern, setSelectedPattern] = useState<string>('all');
 const [chartType, setChartType] = useState<'line' | 'area' | 'composed'>('area');

 // Фильтрация данных по временному диапазону
 const filteredData = React.useMemo(() => {
  if (selectedTimeRange === 'all') return data;
  
  const now = new Date();
  const daysBack = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 90;
  const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  
  return data.filter(point => new Date(point.date) >= cutoffDate);
 }, [data, selectedTimeRange]);

 // Sectionение исторических и прогнозных данных
 const historicalData = filteredData.filter(point => point.type === 'historical');
 const forecastData = filteredData.filter(point => point.type === 'forecast');

 // Получение основного паттерна или выбранного
 const mainPattern = selectedPattern === 'all' 
  ? patterns.find(p => p.strength === Math.max(...patterns.map(pattern => pattern.strength))) || patterns[0]
  : patterns.find(p => p.name === selectedPattern) || patterns[0];

 // Statistics по данным
 const stats = React.useMemo(() => {
  if (historicalData.length === 0) return null;

  const values = historicalData.map(point => point.value);
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  //  тренда
  const recentValues = values.slice(-7); // Последние 7 точек
  const previousValues = values.slice(-14, -7); // Prevыдущие 7 точек
  
  const recentAvg = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
  const previousAvg = previousValues.reduce((sum, val) => sum + val, 0) / previousValues.length;
  
  const trendChange = recentAvg - previousAvg;
  const trendPercent = previousAvg !== 0 ? (trendChange / previousAvg) * 100 : 0;

  return {
   average: avg,
   min,
   max,
   trendChange,
   trendPercent,
   volatility: Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length)
  };
 }, [historicalData]);

 // Кастомный Tooltip
 const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
   const point = payload[0].payload;
   const isHistorical = point.type === 'historical';
   
   return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
     <p className="font-medium">
      {new Date(label).toLocaleDateString('en-US', {
       year: 'numeric',
       month: 'short',
       day: 'numeric'
      })}
     </p>
     <div className="space-y-1 mt-2">
      {isHistorical ? (
       <p className="text-sm">
        <span className="font-medium text-blue-600">{metric}:</span>{' '}
        <span className="font-medium">{point.value.toFixed(2)}</span>
       </p>
      ) : (
       <>
        <p className="text-sm">
         <span className="font-medium text-green-600">Forecast:</span>{' '}
         <span className="font-medium">{point.forecast?.toFixed(2)}</span>
        </p>
        {point.confidenceUpper && point.confidenceLower && (
         <p className="text-xs text-gray-500">
          Интервал: {point.confidenceLower.toFixed(2)} - {point.confidenceUpper.toFixed(2)}
         </p>
        )}
       </>
      )}
     </div>
    </div>
   );
  }
  return null;
 };

 // Formatирование метки оси Y
 const formatYAxisLabel = (value: number): string => {
  if (metric.toLowerCase().includes('percent') || metric.toLowerCase().includes('%')) {
   return `${value.toFixed(0)}%`;
  }
  return value.toFixed(1);
 };

 // Получение цвета тренда
 const getTrendColor = (direction: string) => {
  switch (direction) {
   case 'increasing': return 'text-green-600';
   case 'decreasing': return 'text-red-600';
   default: return 'text-gray-600';
  }
 };

 // Получение иконки тренда
 const getTrendIcon = (direction: string) => {
  switch (direction) {
   case 'increasing': return <TrendingUp className="h-4 w-4" />;
   case 'decreasing': return <TrendingDown className="h-4 w-4" />;
   default: return <Minus className="h-4 w-4" />;
  }
 };

 return (
  <div className="space-y-6">
   {/* Элементы управления */}
   <div className="flex flex-wrap gap-4 items-center">
    <div className="flex items-center gap-2">
     <Calendar className="h-4 w-4 text-gray-500" />
     <Select value={selectedTimeRange} onValueChange={(value: any) => setSelectedTimeRange(value)}>
      <SelectTrigger className="w-32">
       <SelectValue />
      </SelectTrigger>
      <SelectContent>
       <SelectItem value="7d">7 days</SelectItem>
       <SelectItem value="30d">30 days</SelectItem>
       <SelectItem value="90d">90 days</SelectItem>
       <SelectItem value="all">All time</SelectItem>
      </SelectContent>
     </Select>
    </div>

    <div className="flex items-center gap-2">
     <BarChart3 className="h-4 w-4 text-gray-500" />
     <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
      <SelectTrigger className="w-32">
       <SelectValue />
      </SelectTrigger>
      <SelectContent>
       <SelectItem value="line">Line</SelectItem>
       <SelectItem value="area">Area</SelectItem>
       <SelectItem value="composed">Composed</SelectItem>
      </SelectContent>
     </Select>
    </div>

    <div className="flex items-center gap-2">
     <Target className="h-4 w-4 text-gray-500" />
     <Select value={selectedPattern} onValueChange={setSelectedPattern}>
      <SelectTrigger className="w-40">
       <SelectValue />
      </SelectTrigger>
      <SelectContent>
       <SelectItem value="all">All patterns</SelectItem>
       {patterns.map(pattern => (
        <SelectItem key={pattern.name} value={pattern.name}>
         {pattern.name}
        </SelectItem>
       ))}
      </SelectContent>
     </Select>
    </div>
   </div>

   {/* Статистические карточки */}
   {stats && (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
     <Card>
      <CardContent className="p-4">
       <div className="flex items-center justify-between">
        <div>
         <p className="text-sm text-gray-600">Average value</p>
         <p className="text-2xl font-bold">{formatYAxisLabel(stats.average)}</p>
        </div>
       </div>
      </CardContent>
     </Card>

     <Card>
      <CardContent className="p-4">
       <div className="flex items-center justify-between">
        <div>
         <p className="text-sm text-gray-600">Current trend</p>
         <p className={`text-2xl font-bold ${getTrendColor(mainPattern?.trend.direction || 'stable')}`}>
          {stats.trendPercent > 0 ? '+' : ''}{stats.trendPercent.toFixed(1)}%
         </p>
        </div>
        <div className={`p-2 rounded-full ${
         mainPattern?.trend.direction === 'increasing' 
          ? 'bg-green-100 text-green-600' 
          : mainPattern?.trend.direction === 'decreasing'
          ? 'bg-red-100 text-red-600' 
          : 'bg-gray-100 text-gray-600'
        }`}>
         {getTrendIcon(mainPattern?.trend.direction || 'stable')}
        </div>
       </div>
      </CardContent>
     </Card>

     <Card>
      <CardContent className="p-4">
       <p className="text-sm text-gray-600">Value range</p>
       <p className="text-lg font-bold">
        {formatYAxisLabel(stats.min)} - {formatYAxisLabel(stats.max)}
       </p>
       <p className="text-xs text-gray-500">
        Range: {formatYAxisLabel(stats.max - stats.min)}
       </p>
      </CardContent>
     </Card>

     <Card>
      <CardContent className="p-4">
       <p className="text-sm text-gray-600">Volatility</p>
       <p className="text-2xl font-bold">{formatYAxisLabel(stats.volatility)}</p>
       <p className="text-xs text-gray-500">
        R² = {mainPattern?.trend.rSquared.toFixed(3)}
       </p>
      </CardContent>
     </Card>
    </div>
   )}

   {/* Основной график */}
   <Card>
    <CardHeader>
     <CardTitle className="flex items-center gap-2">
      📈 {title}
      {mainPattern && (
       <span className="text-sm font-normal text-gray-500">
        - {mainPattern.name} ({mainPattern.type})
       </span>
      )}
     </CardTitle>
    </CardHeader>
    <CardContent>
     <ResponsiveContainer width="100%" height={height}>
      {chartType === 'line' ? (
       <LineChart data={filteredData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
         dataKey="date" 
         tick={{ fontSize: 12 }}
         tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis 
         tick={{ fontSize: 12 }}
         tickFormatter={formatYAxisLabel}
        />
        <Tooltip content={<CustomTooltip />} />
        
        {/* Историческая линия */}
        <Line
         type="monotone"
         dataKey="value"
         stroke="#2563eb"
         strokeWidth={2}
         dot={{ fill: '#2563eb', strokeWidth: 2, r: 3 }}
         connectNulls={false}
        />
        
        {/* Forecastная линия */}
        <Line
         type="monotone"
         dataKey="forecast"
         stroke="#10b981"
         strokeWidth={2}
         strokeDasharray="5 5"
         dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
         connectNulls={false}
        />
        
        {/* Линия тренда */}
        {showTrendLine && mainPattern && (
         <ReferenceLine 
          segment={[
           { x: filteredData[0]?.date, y: stats?.average },
           { x: filteredData[filteredData.length - 1]?.date, y: stats?.average + stats?.trendChange }
          ]}
          stroke="#ef4444"
          strokeDasharray="3 3"
         />
        )}
       </LineChart>
      ) : chartType === 'area' ? (
       <AreaChart data={filteredData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
         dataKey="date" 
         tick={{ fontSize: 12 }}
         tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis 
         tick={{ fontSize: 12 }}
         tickFormatter={formatYAxisLabel}
        />
        <Tooltip content={<CustomTooltip />} />
        
        {/* Доверительный интервал */}
        {showConfidenceInterval && (
         <>
          <Area
           type="monotone"
           dataKey="confidenceUpper"
           stackId="confidence"
           stroke="none"
           fill="#10b981"
           fillOpacity={0.1}
          />
          <Area
           type="monotone"
           dataKey="confidenceLower"
           stackId="confidence"
           stroke="none"
           fill="#ffffff"
           fillOpacity={1}
          />
         </>
        )}
        
        {/* Историческая область */}
        <Area
         type="monotone"
         dataKey="value"
         stroke="#2563eb"
         fill="#2563eb"
         fillOpacity={0.3}
        />
        
        {/* Forecastная область */}
        <Area
         type="monotone"
         dataKey="forecast"
         stroke="#10b981"
         fill="#10b981"
         fillOpacity={0.2}
         strokeDasharray="5 5"
        />
       </AreaChart>
      ) : (
       <ComposedChart data={filteredData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
         dataKey="date" 
         tick={{ fontSize: 12 }}
         tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis 
         tick={{ fontSize: 12 }}
         tickFormatter={formatYAxisLabel}
        />
        <Tooltip content={<CustomTooltip />} />
        
        {/* Исторические столбцы */}
        <Bar dataKey="value" fill="#2563eb" opacity={0.6} />
        
        {/* Forecastная линия */}
        <Line
         type="monotone"
         dataKey="forecast"
         stroke="#10b981"
         strokeWidth={3}
         strokeDasharray="5 5"
         dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
        />
       </ComposedChart>
      )}
     </ResponsiveContainer>
    </CardContent>
   </Card>

   {/* Информация о паттернах */}
   {mainPattern && (
    <Card>
     <CardHeader>
      <CardTitle className="flex items-center gap-2">
       🔍 Analysis паттерна: {mainPattern.name}
      </CardTitle>
     </CardHeader>
     <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       <div>
        <h4 className="font-medium mb-2">Pattern characteristics</h4>
        <ul className="space-y-2 text-sm">
         <li><strong>Type:</strong> {getPatternTypeText(mainPattern.type)}</li>
         <li><strong>Сила паттерна:</strong> {(mainPattern.strength * 100).toFixed(1)}%</li>
         {mainPattern.period && (
          <li><strong>Period:</strong> {mainPattern.period} дней</li>
         )}
         <li><strong>Description:</strong> {mainPattern.description}</li>
        </ul>
       </div>
       <div>
        <h4 className="font-medium mb-2">Trend statistics</h4>
        <ul className="space-y-2 text-sm">
         <li>
          <strong>Направление:</strong>{' '}
          <span className={getTrendColor(mainPattern.trend.direction)}>
           {getTrendDirectionText(mainPattern.trend.direction)}
          </span>
         </li>
         <li><strong>Наклон:</strong> {mainPattern.trend.slope.toFixed(4)}</li>
         <li><strong>Качество модели (R²):</strong> {mainPattern.trend.rSquared.toFixed(3)}</li>
         <li>
          <strong>Достоверность:</strong>{' '}
          <span className={mainPattern.trend.rSquared > 0.7 ? 'text-green-600' : mainPattern.trend.rSquared > 0.4 ? 'text-yellow-600' : 'text-red-600'}>
           {mainPattern.trend.rSquared > 0.7 ? 'High' : mainPattern.trend.rSquared > 0.4 ? 'Medium' : 'Low'}
          </span>
         </li>
        </ul>
       </div>
      </div>
     </CardContent>
    </Card>
   )}
  </div>
 );
};

// Sunпомогательные функции
function getPatternTypeText(type: string): string {
 const types: Record<string, string> = {
  seasonal: 'Seasonal',
  cyclical: 'Cyclical',
  trending: 'Trending',
  random: 'Random'
 };
 return types[type] || type;
}

function getTrendDirectionText(direction: string): string {
 const directions: Record<string, string> = {
  increasing: 'Increasing',
  decreasing: 'Decreasing',
  stable: 'Stable'
 };
 return directions[direction] || direction;
}

export default TimeSeriesChart; 