import type { IMixCalendarSettings } from "./types";

/** Plugin view type identifier */
export const VIEW_TYPE_MIX_CALENDAR = "mix-calendar-view";

/** CSS class prefixes */
export const CSS_CLASS = "mix-calendar";

/** Supported note granularities in display order */
export const GRANULARITIES = ["daily", "weekly", "monthly", "quarterly", "yearly"] as const;

/** Week day abbreviations (index 0 = Sunday) */
export const DOW_ABBR = ["日", "一", "二", "三", "四", "五", "六"];

/** Week day abbreviations in English */
export const DOW_ABBR_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Regex: match any checkbox with non-whitespace content (excludes empty "- [ ]" lines) */
export const TASK_REGEX = /- \[[ xX]\]\s*\S/g;

/** Regex: match completed checkbox with non-whitespace content */
export const COMPLETED_TASK_REGEX = /- \[[xX]\]\s*\S/g;

/** Default settings — matching current vault configuration */
export const DEFAULT_SETTINGS: IMixCalendarSettings = {
  weekStart: "locale",
  localeOverride: "system-default",
  uiLocale: "zh",
  shouldConfirmBeforeCreate: true,
  showLunarInfo: true,
  showHolidayBadges: true,
  showWeekNumbers: true,
  pastTimeTransparent: true,
  showTaskIndicators: true,
  showLinkCount: true,
  taskDotSize: 9,
  linkDotSize: 5,
  customCssClasses: "",
  holidayOverrides: {},

  daily: {
    enabled: true,
    format: "YYYY/YYYY-MM/YYYY-MM-DD",
    folder: "01-Daily",
    template: "Templates/Daily.md",
  },
  weekly: {
    enabled: true,
    format: "YYYY/YYYY-[W]WW",
    folder: "01-Daily",
    template: "Templates/Weekly.md",
  },
  monthly: {
    enabled: false,
    format: "YYYY/YYYY-MM",
    folder: "02-Monthly",
    template: "",
  },
  quarterly: {
    enabled: false,
    format: "YYYY/YYYY-[Q]Q",
    folder: "03-Quarterly",
    template: "",
  },
  yearly: {
    enabled: false,
    format: "YYYY",
    folder: "04-Yearly",
    template: "",
  },
};

/** Translated strings for UI */
export const I18N = {
  zh: {
    weekDays: DOW_ABBR,
    monthFormat: "YYYY 年 M 月",
    yearFormat: "YYYY 年",
    today: "今",
    monthLabel: "月",
    yearLabel: "年",
    quarters: ["Q1 (1-3月)", "Q2 (4-6月)", "Q3 (7-9月)", "Q4 (10-12月)"],
  },
  en: {
    weekDays: DOW_ABBR_EN,
    monthFormat: "MMMM YYYY",
    yearFormat: "YYYY",
    today: "Today",
    monthLabel: "Mo",
    yearLabel: "Yr",
    quarters: ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"],
  },
} as const;

