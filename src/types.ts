import type { Moment } from "moment";
import type { TFile } from "obsidian";

/** Supported calendar view modes */
export type ViewMode = "month" | "year";

/** Supported note granularities */
export type Granularity = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

/** Week start day values */
export type WeekStart =
  | "locale"
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

/** Per-granularity periodic note settings */
export interface PeriodicNoteSettings {
  enabled: boolean;
  format: string;   // moment.js format string
  folder: string;   // vault-relative folder path
  template: string; // vault-relative template path
}

/** Task completion stats for a note */
export interface TaskStats {
  total: number;
  completed: number;
}

/** Full plugin settings */
export interface IMixCalendarSettings {
  // General
  weekStart: WeekStart;
  localeOverride: string;
  uiLocale: "zh" | "en";
  shouldConfirmBeforeCreate: boolean;

  // Appearance
  showLunarInfo: boolean;
  showHolidayBadges: boolean;
  showWeekNumbers: boolean;
  pastTimeTransparent: boolean;
  showTaskIndicators: boolean;
  showLinkCount: boolean;
  taskDotSize: number;   // px, task completion dot diameter
  linkDotSize: number;   // px, backlink dot diameter

  // Space-separated CSS classes injected onto the calendar container
  customCssClasses: string;

  // Custom overrides (date string → "holiday" | "workday")
  holidayOverrides: Record<string, "holiday" | "workday">;

  // Note settings (5 granularities)
  daily: PeriodicNoteSettings;
  weekly: PeriodicNoteSettings;
  monthly: PeriodicNoteSettings;
  quarterly: PeriodicNoteSettings;
  yearly: PeriodicNoteSettings;
}

/** Information about a date's lunar properties */
export interface LunarInfo {
  displayText: string;       // 节日 > 节气 > 农历日期
  displayType: "festival" | "solar-term" | "lunar-month" | "lunar-day";
  isHoliday: boolean;        // 法定节假日
  isWorkday: boolean;        // 调休上班日
  ganZhiYear: string;        // 干支年（如 "甲辰"）
  zodiac: string;            // 生肖（如 "龙"）
  lunarMonthChinese: string; // 农历月（如 "正月"）
  lunarYearChinese: string;  // 农历年中文（如 "二〇二六"）
  lunarDayChinese: string;   // 农历日中文（如 "初一"）
}

/** Indexed note data for a specific granularity */
export interface NoteIndex {
  /** dateUID → TFile mapping. dateUID format depends on granularity */
  notes: Record<string, TFile>;
  /** Re-index all notes for this granularity */
  reindex: () => Promise<void>;
}

/** Calendar day cell data for rendering */
export interface DayCellData {
  date: Moment;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isWeekend: boolean;
  isPast: boolean;
  lunar?: LunarInfo | null;
  hasNote: boolean;
  taskStats?: TaskStats | null;
  /** Number of other notes that link to this daily note (backlinks). */
  linkCount?: number;
  dateUID: string;
}

/** Month cell data for year view */
export interface MonthCellData {
  month: number;       // 1-12
  gregorianLabel: string;  // e.g. "3月"
  lunarLabel: string;      // e.g. "二月"
  hasNote: boolean;
  dateUID: string;
}

/** Week row data */
export interface WeekRowData {
  weekNum: number | null;
  hasWeeklyNote: boolean;
  weeklyTaskStats?: TaskStats | null;
  weekUID: string;
  weekDate: import("moment").Moment;
  days: DayCellData[];
}
