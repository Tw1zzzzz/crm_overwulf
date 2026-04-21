import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { COLORS, COMPONENT_STYLES } from '@/styles/theme';

export interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: number;
  maxValue?: number;
  style?: React.CSSProperties;
}

/**
 * Компонент для отображения статистической карточки с опциональным
 * индикатором тренда и дополнительным описанием
 */
export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  description, 
  trend = 0,
  maxValue,
  style = COMPONENT_STYLES.card
}) => {
  // Определение иконки тренда на основе значения
  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUp className="h-4 w-4" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };
  
  // Определение цвета тренда на основе значения
  const getTrendColor = () => {
    if (trend > 0) return { color: COLORS.success };
    if (trend < 0) return { color: COLORS.danger };
    return { color: COLORS.textColorSecondary };
  };

  const TrendIcon = getTrendIcon();
  const trendColor = getTrendColor();

  return (
    <Card style={{ ...COMPONENT_STYLES.card, ...style }}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle 
            className="text-sm font-medium" 
            style={{ color: COLORS.textColorSecondary }}
          >
            {title}
          </CardTitle>
          
          {trend !== 0 ? (
            <Badge 
              variant="outline" 
              className="flex gap-1 items-center"
              style={{ borderColor: COLORS.borderColor, ...trendColor }}
            >
              {TrendIcon}
              <span className="text-xs">{Math.abs(trend)}%</span>
            </Badge>
          ) : (
            <span style={{ color: COLORS.textColorSecondary }}>{TrendIcon}</span>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <p 
          className="text-3xl font-semibold" 
          style={{ color: COLORS.textColor }}
        >
          {value}
        </p>
        
        {description && (
          <p 
            className="mt-1 text-sm" 
            style={{ color: COLORS.textColorSecondary }}
          >
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}; 