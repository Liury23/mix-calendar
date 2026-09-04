import { writable, derived, get, type Writable, type Readable } from "svelte/store";
import { moment, type TFile } from "obsidian";
import type { IMixCalendarSettings, ViewMode, Granularity, TaskStats, Moment } from "../types";
import { DEFAULT_SETTINGS, I18N } from "../constants";

// ============================================================
// Core state stores
// ============================================================

/** Plugin settings — synced with Obsidian data.json */
export const settings: Writable<IMixCalendarSettings> = writable(DEFAULT_SETTINGS);

/** Currently displayed reference date (the month or year being viewed) */
export const currentDate: Writable<Moment> = writable(moment());

/** Current view mode (month / year) */
export const viewMode: Writable<ViewMode> = writable("month");

/** Currently selected date UID ("YYYY-MM-DD") for visual feedback in month view */
export const selectedDateUID: Writable<string | null> = writable(null);

// ============================================================
// Note index stores (one per granularity)
// ============================================================

interface NoteIndexData {
  notes: Record<string, TFile>;
  taskStats: Record<string, TaskStats>;
  /** Backlink counts per dateUID — populated for "daily" only */
  linkCounts: Record<string, number>;
  lastIndexed: number;
}

function createNoteIndexStore() {
  const { subscribe, set, update } = writable<NoteIndexData>({
    notes: {},
    taskStats: {},
    linkCounts: {},
    lastIndexed: 0,
  });

  return {
    subscribe,
    set,
    update,

    /** Check if a specific dateUID has a note */
    has(dateUID: string): boolean {
      return !!get({ subscribe }).notes[dateUID];
    },

    /** Get the TFile for a specific dateUID */
    get(dateUID: string): TFile | undefined {
      return get({ subscribe }).notes[dateUID];
    },
  };
}

/** Individual note stores per granularity */
export const dailyNotes = createNoteIndexStore();
export const weeklyNotes = createNoteIndexStore();
export const monthlyNotes = createNoteIndexStore();
export const quarterlyNotes = createNoteIndexStore();
export const yearlyNotes = createNoteIndexStore();

/** Map of granularity → store for generic access */
export const noteStores: Record<Granularity, ReturnType<typeof createNoteIndexStore>> = {
  daily: dailyNotes,
  weekly: weeklyNotes,
  monthly: monthlyNotes,
  quarterly: quarterlyNotes,
  yearly: yearlyNotes,
};

// ============================================================
// Derived stores
// ============================================================

/** Whether to show week numbers (derived from settings + viewMode) */
export const showWeekNumbers: Readable<boolean> = derived(
  [settings, viewMode],
  ([$settings, $viewMode]) => {
    return $viewMode === "month" && $settings.showWeekNumbers;
  }
);

/** Get week start as a number (0 = Sunday, 1 = Monday, ...) */
export const weekStartDay: Readable<number> = derived(settings, ($settings) => {
  const ws = $settings.weekStart;
  if (ws === "locale") {
    const locale = $settings.localeOverride !== "system-default"
      ? $settings.localeOverride
      : moment.locale();
    return locale.startsWith("zh") ? 1 : 0;
  }
  const map: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  };
  return map[ws] ?? 0;
});

/** Current UI locale ("zh" | "en") */
export const uiLocale: Readable<"zh" | "en"> = derived(settings, ($settings) => {
  return $settings.uiLocale || "zh";
});

/** I18n strings for current locale */
export const i18n: Readable<(typeof I18N)["zh" | "en"]> = derived(uiLocale, ($locale) => {
  return I18N[$locale];
});
