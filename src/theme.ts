import { createTheme } from '@mui/material/styles';
import { COLORS } from '@/styles/theme';

// Настройки темной темы в соответствии с существующей цветовой схемой
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: COLORS.primary,
      light: '#e3f2fd',
      dark: '#0b63c9',
    },
    secondary: {
      main: COLORS.success,
      light: '#b3fff0',
      dark: '#00a785',
    },
    warning: {
      main: COLORS.warning,
    },
    error: {
      main: COLORS.danger,
    },
    info: {
      main: COLORS.info,
    },
    background: {
      default: COLORS.backgroundColor,
      paper: COLORS.cardBackground,
    },
    text: {
      primary: COLORS.textColor,
      secondary: COLORS.textColorSecondary,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: COLORS.cardBackground,
          borderRadius: 8,
          boxShadow: '0 1px 20px 0 rgba(0,0,0,.1)',
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
          '&:last-child': {
            paddingBottom: 16,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
        containedPrimary: {
          backgroundColor: COLORS.primary,
          color: COLORS.textColor,
        },
        outlinedPrimary: {
          borderColor: COLORS.borderColor,
          color: COLORS.primary,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${COLORS.borderColor}`,
        },
        head: {
          fontWeight: 600,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
        },
      },
    },
  },
});

// Реэкспортируем COLORS для использования в других компонентах
export { COLORS };
export default darkTheme; 