// Определение цветов для темной темы по стилю black-dashboard-react
export const COLORS = {
  primary: "#3590FF",
  success: "#00E396",
  info: "#3590FF",
  warning: "#FEB019",
  danger: "#FF4560",
  backgroundColor: "#111827",
  cardBackground: "#1A202C",
  textColor: "#FFFFFF",
  textColorSecondary: "#A0AEC0",
  borderColor: "#2D3748",
  inputBackground: "#1E293B",
  inputBorder: "#4A5568",
  dialogBackground: "#1E293B",
  buttonSecondary: "#2D3748",
  chartColors: ["#3590FF", "#00E396", "#FEB019", "#FF4560", "#775DD0"]
};

// Общие стили для компонентов
export const COMPONENT_STYLES = {
  card: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.borderColor,
    boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)"
  },
  text: {
    title: { color: COLORS.textColor },
    description: { color: COLORS.textColorSecondary }
  },
  chart: {
    grid: { stroke: COLORS.borderColor },
    tooltip: { 
      contentStyle: { 
        backgroundColor: COLORS.cardBackground, 
        borderColor: COLORS.borderColor,
        color: COLORS.textColor 
      }
    }
  },
  tabs: {
    list: {
      backgroundColor: COLORS.cardBackground,
      borderColor: COLORS.borderColor
    },
    trigger: {
      base: "text-sm px-4 py-2 rounded-md hover:bg-gray-800",
      active: "data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:font-medium"
    }
  },
  button: {
    primary: {
      backgroundColor: COLORS.primary,
      color: COLORS.textColor
    },
    outline: {
      borderColor: COLORS.borderColor,
      color: COLORS.primary
    },
    ghost: {
      color: COLORS.primary
    }
  }
};

export default COLORS; 