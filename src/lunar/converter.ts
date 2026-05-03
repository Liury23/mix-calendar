/**
 * Lunar calendar conversion layer.
 * Wraps `lunar-typescript` and returns plugin-typed `LunarInfo` objects.
 */
import { Solar, HolidayUtil } from "lunar-typescript";
import type { LunarInfo } from "../types";
import { getDisplayText } from "./formatter";

/**
 * Get lunar calendar information for a Gregorian date.
 *
 * Returns `null` when the underlying library cannot produce a result (should
 * only happen for dates outside the supported range).
 */
export function getLunarInfo(
  year: number,
  month: number,
  day: number,
  holidayOverrides: Record<string, "holiday" | "workday"> = {}
): LunarInfo | null {
  try {
    const solar = Solar.fromYmd(year, month, day);
    const lunar = solar.getLunar();

    // Solar terms
    const jieQi = lunar.getJieQi(); // "" if none

    // Lunars festivals
    const lunarFestivals = lunar.getFestivals();
    const otherFestivals = lunar.getOtherFestivals();
    const allFestivals = [...lunarFestivals, ...otherFestivals];

    // Gregorian festivals (元旦, 劳动节, etc.)
    const solarFestivals = solar.getFestivals();

    // Statutory holiday / workday from 2025+ Chinese holiday schedule
    const holiday = HolidayUtil.getHoliday(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    const isHoliday = holiday !== null && !holiday.isWork();
    const isWorkday = holiday !== null && holiday.isWork();

    // Display text and type (priority: festival > solar term > lunar date)
    let { text, type } = getDisplayText(
      allFestivals,
      solarFestivals,
      jieQi,
      lunar.getDayInChinese(),
      lunar.getMonthInChinese()
    );

    // Custom holiday overrides — apply after library results
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const override = holidayOverrides[dateStr];
    let finalIsHoliday = isHoliday;
    let finalIsWorkday = isWorkday;
    if (override === "holiday") {
      finalIsHoliday = true;
      finalIsWorkday = false;
      // Only override display text if there's no existing festival
      if (type !== "festival") {
        text = "休";
        type = "festival";
      }
    } else if (override === "workday") {
      finalIsHoliday = false;
      finalIsWorkday = true;
    }

    return {
      displayText: text,
      displayType: type,
      isHoliday: finalIsHoliday,
      isWorkday: finalIsWorkday,
      ganZhiYear: lunar.getYearInGanZhi(),
      zodiac: lunar.getYearShengXiao(),
      lunarMonthChinese: lunar.getMonthInChinese(),
      // Additional fields for template variables
      lunarYearChinese: lunar.getYearInChinese(),
      lunarDayChinese: lunar.getDayInChinese(),
    };
  } catch {
    // Dates before 1900 or after 2100 may fail
    return null;
  }
}

/**
 * Get the Gan-Zhi year + zodiac for the given date's lunar year.
 * Used for the header display (e.g., "丙午马年").
 */
export function getGanZhiYearLabel(
  year: number,
  month: number,
  day: number
): string {
  try {
    const solar = Solar.fromYmd(year, month, day);
    const lunar = solar.getLunar();
    return `${lunar.getYearInGanZhi()}${lunar.getYearShengXiao()}年`;
  } catch {
    return "";
  }
}
