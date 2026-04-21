import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { COLORS, COMPONENT_STYLES } from '@/styles/theme';

// Типы данных для отображения в графике
type ChartDataItem = {
  subject: string;
  value: number;
}

interface BalanceWheelChartProps {
  data: ChartDataItem[] | Record<string, number>;
  title?: string;
  style?: React.CSSProperties;
  compact?: boolean;
}

/**
 * Компонент для отображения показателей баланса в виде радарного графика
 */
export const BalanceWheelChart: React.FC<BalanceWheelChartProps> = ({ 
  data, 
  title = "Колесо баланса", 
  style,
  compact = false
}) => {
  // Преобразование данных в формат, подходящий для RadarChart
  const chartData = Array.isArray(data) && data[0]?.subject 
    ? data 
    : [
        { subject: 'Физическое здоровье', value: (data as Record<string, number>).physical || 0 },
        { subject: 'Эмоциональное состояние', value: (data as Record<string, number>).emotional || 0 },
        { subject: 'Интеллектуальное развитие', value: (data as Record<string, number>).intellectual || 0 },
        { subject: 'Духовное развитие', value: (data as Record<string, number>).spiritual || 0 },
        { subject: 'Профессиональный рост', value: (data as Record<string, number>).occupational || 0 },
        { subject: 'Социальные отношения', value: (data as Record<string, number>).social || 0 },
        { subject: 'Окружающая среда', value: (data as Record<string, number>).environmental || 0 },
        { subject: 'Финансовое благополучие', value: (data as Record<string, number>).financial || 0 },
      ];

  // Кастомный рендер меток осей для поддержки переноса длинных текстов
  const renderPolarAngleAxisTick = (props: any) => {
    const { x, y, payload, textAnchor, fontSize = compact ? 8 : 16 } = props;
    const text = payload.value;
    
    // Для компактного режима показываем только короткие метки
    if (compact) {
      // Не показываем метки в компактном режиме для улучшения видимости самого графика
      return null;
    }
    
    const words = text.split(' ');
    
    // Если текст короткий, возвращаем его без изменений
    if (words.length <= 1) {
      return (
        <g transform={`translate(${x},${y})`}>
          <text 
            x={0} 
            y={0} 
            dy={16} 
            textAnchor={textAnchor} 
            fill={COLORS.textColor} 
            fontSize={fontSize} 
            fontWeight="500"
          >
            {text}
          </text>
        </g>
      );
    }
    
    // Разделение текста на две части
    const midpoint = Math.floor(words.length / 2);
    const line1 = words.slice(0, midpoint).join(' ');
    const line2 = words.slice(midpoint).join(' ');
    
    // Расчет оптимальных отступов в зависимости от позиции метки
    const clockPos = (Math.atan2(y - 450, x - 450) * 180 / Math.PI + 360) % 360;
    const isTop = clockPos > 45 && clockPos < 135;
    
    const dy1 = isTop ? -5 : 0;
    const dy2 = isTop ? 15 : 20;
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={0} 
          y={0} 
          dy={dy1} 
          textAnchor={textAnchor} 
          fill={COLORS.textColor} 
          fontSize={fontSize} 
          fontWeight="500"
        >
          {line1}
        </text>
        <text 
          x={0} 
          y={0} 
          dy={dy2} 
          textAnchor={textAnchor} 
          fill={COLORS.textColor} 
          fontSize={fontSize} 
          fontWeight="500"
        >
          {line2}
        </text>
      </g>
    );
  };

  // Для компактного режима используем упрощенный рендеринг напрямую, без карточки
  if (compact) {
    return (
      <div className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart 
            data={chartData} 
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <PolarGrid 
              stroke="#3f4468" 
              strokeWidth={1}
            />
            <Radar
              name="Баланс"
              dataKey="value"
              stroke="#4d82ff"
              fill="#4d82ff"
              fillOpacity={0.75}
              dot={{ 
                stroke: "#4d82ff", 
                strokeWidth: 2,
                r: 3, 
                fill: "#ffffff" 
              }}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Стили для полного режима
  const cardStyle = {
    ...COMPONENT_STYLES.card,
    ...style,
    width: '100%',
    height: '100%',
    backgroundColor: compact ? "#1a1d2d" : COLORS.cardBackground,
  };

  const tooltipStyle = {
    ...COMPONENT_STYLES.chart.tooltip.contentStyle,
    fontSize: '16px',
    padding: '10px 14px',
    backgroundColor: "#2d3148",
    color: "#ffffff",
    border: "1px solid #3f4468"
  };

  // Полный режим с карточкой и дополнительной информацией
  return (
    <Card style={cardStyle}>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle style={{ color: COLORS.textColor, fontSize: '1.5rem' }}>
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="h-[900px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart 
              data={chartData} 
              margin={{ top: 100, right: 100, bottom: 100, left: 100 }}
            >
              <PolarGrid 
                stroke={COLORS.borderColor} 
                strokeWidth={1.5} 
              />
              <PolarAngleAxis
                dataKey="subject"
                tick={renderPolarAngleAxisTick}
                tickSize={25}
                axisLine={{ stroke: COLORS.borderColor, strokeWidth: 2 }}
                tickLine={{ stroke: COLORS.borderColor }}
              />
              <Radar
                name="Баланс"
                dataKey="value"
                stroke={COLORS.primary}
                fill={COLORS.primary}
                fillOpacity={0.6}
                dot={{ 
                  stroke: COLORS.primary, 
                  strokeWidth: 3, 
                  r: 8, 
                  fill: "#fff" 
                }}
                strokeWidth={3}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
              />
              <Legend 
                wrapperStyle={{ color: COLORS.textColor, fontWeight: 'bold', paddingTop: '15px' }}
                iconSize={18}
                iconType="circle"
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}; 