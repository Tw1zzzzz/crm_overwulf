
import { format, startOfWeek, endOfWeek, addWeeks, isSameDay, parseISO, isValid } from "date-fns";
import { ru } from "date-fns/locale";

/**
 * Format a date string in Russian locale
 */
export const formatDate = (date: Date | string, formatStr: string = "d MMMM yyyy"): string => {
  if (typeof date === 'string') {
    try {
      date = parseISO(date);
      if (!isValid(date)) {
        return 'Invalid date';
      }
    } catch (error) {
      return 'Invalid date';
    }
  }
  
  return format(date, formatStr, { locale: ru });
};

/**
 * Get the current week's range
 */
export const getCurrentWeekRange = (date: Date = new Date()): { start: Date; end: Date } => {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { start, end };
};

/**
 * Get week label (e.g., "15-21 мая 2023")
 */
export const getWeekLabel = (date: Date): string => {
  const { start, end } = getCurrentWeekRange(date);
  return `${format(start, "d", { locale: ru })}-${format(end, "d MMMM yyyy", { locale: ru })}`;
};

/**
 * Get previous week's date
 */
export const getPrevWeek = (date: Date): Date => {
  return addWeeks(date, -1);
};

/**
 * Get next week's date
 */
export const getNextWeek = (date: Date): Date => {
  return addWeeks(date, 1);
};

/**
 * Check if a date is today
 */
export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

/**
 * Get time of day based on current hour
 */
export const getTimeOfDay = (): "morning" | "afternoon" | "evening" => {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return "morning";
  } else if (hour < 18) {
    return "afternoon";
  } else {
    return "evening";
  }
};

/**
 * Format time of day in Russian
 */
export const formatTimeOfDay = (timeOfDay: "morning" | "afternoon" | "evening"): string => {
  switch (timeOfDay) {
    case "morning":
      return "Утро";
    case "afternoon":
      return "День";
    case "evening":
      return "Вечер";
    default:
      return "";
  }
};
