import type { App } from "obsidian";
import type { PeriodicNoteSettings, Granularity } from "../types";

/**
 * Read Core Daily Notes plugin settings from Obsidian internal plugins.
 * Used as initial migration source for daily note settings.
 */
export function readCoreDailyNotesSettings(
  app: App
): PeriodicNoteSettings | null {
  try {
    const dailyNotesPlugin = (app as any).internalPlugins?.getPluginById?.(
      "daily-notes"
    );
    if (!dailyNotesPlugin?.instance?.options) return null;

    const opts = dailyNotesPlugin.instance.options;
    return {
      enabled: true,
      format: opts.format || "YYYY-MM-DD",
      folder: opts.folder || "",
      template: opts.template || "",
    };
  } catch {
    return null;
  }
}

/**
 * Read Calendar plugin (liamcain) settings for weekly notes migration.
 */
export function readCalendarPluginSettings(
  app: App
): PeriodicNoteSettings | null {
  try {
    const plugin = (app as any).plugins?.getPlugin?.("calendar");
    if (!plugin?.options) return null;

    const opts = plugin.options;
    return {
      enabled: opts.showWeeklyNote ?? false,
      format: opts.weeklyNoteFormat || "YYYY-[W]WW",
      folder: opts.weeklyNoteFolder || "",
      template: opts.weeklyNoteTemplate || "",
    };
  } catch {
    return null;
  }
}
