import { COLORS } from "@/styles/theme";

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

/**
 * Кастомный компонент для всплывающих подсказок на графиках
 */
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;
  
  return (
    <div style={{ 
      backgroundColor: COLORS.cardBackground, 
      borderColor: COLORS.borderColor,
      border: `1px solid ${COLORS.borderColor}`,
      borderRadius: '8px',
      padding: '10px 14px',
      color: COLORS.textColor,
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
    }}>
      <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: COLORS.textColor }}>
        {label}
      </p>
      {payload.map((entry: any, index: number) => (
        <p key={`tooltip-item-${index}`} style={{ 
          margin: '4px 0', 
          display: 'flex',
          alignItems: 'center'
        }}>
          <span 
            style={{ 
              display: 'inline-block', 
              width: '12px', 
              height: '12px', 
              marginRight: '8px',
              backgroundColor: entry.color,
              borderRadius: '50%'
            }} 
          />
          <span style={{ marginRight: '8px', color: COLORS.textColorSecondary }}>
            {entry.name}:
          </span>
          <span style={{ fontWeight: 'bold', color: COLORS.textColor }}>
            {entry.value}
          </span>
        </p>
      ))}
    </div>
  );
};

export default CustomTooltip; 