import type { LunarInfo } from "../../types";

/**
 * Display priority: festival > solar term > lunar month (1st or 15th) > lunar day.
 *
 * Returns the best display text and its type for a given date.
 */
export function getDisplayText(
  lunarFestivals: string[],
  solarFestivals: string[],
  jieQi: string,
  lunarDayChinese: string,
  lunarMonthChinese: string
): { text: string; type: LunarInfo["displayType"] } {
  // 1. Priority: traditional lunar festival
  if (lunarFestivals.length > 0) {
    return {
      text: lunarFestivals[0],
      type: "festival",
    };
  }

  // 2. Gregorian festival
  if (solarFestivals.length > 0) {
    return {
      text: solarFestivals[0],
      type: "festival",
    };
  }

  // 3. Solar term
  if (jieQi) {
    return {
      text: jieQi,
      type: "solar-term",
    };
  }

  // 4. Lunar calendar display
  //    Show month name on the 1st (初一), and use shorter forms otherwise
  //    lunar-typescript already includes "月" in month names (e.g. "正月")
  if (lunarDayChinese === "初一") {
    return {
      text: lunarMonthChinese,
      type: "lunar-month",
    };
  }

  return {
    text: lunarDayChinese,
    type: "lunar-day",
  };
}

/**
 * Format the Gan-Zhi year + zodiac into a compact label.
 * e.g. "丙午马年"
 */
export function formatGanZhiYear(ganZhi: string, zodiac: string): string {
  return `${ganZhi}${zodiac}年`;
}
