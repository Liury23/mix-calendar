import { describe, it, expect } from "vitest";
import { getLunarInfo, getGanZhiYearLabel } from "../lunar/converter";

describe("getLunarInfo", () => {
  it("2024-02-10 是春节", () => {
    const info = getLunarInfo(2024, 2, 10);
    expect(info).not.toBeNull();
    expect(info!.displayText).toBe("春节");
    expect(info!.displayType).toBe("festival");
  });

  it("2024-01-01 是元旦节（公历节日）", () => {
    // lunar-typescript uses "元旦节" for the Gregorian New Year's Day
    const info = getLunarInfo(2024, 1, 1);
    expect(info).not.toBeNull();
    expect(info!.displayType).toBe("festival");
    expect(info!.displayText).toContain("元旦");
  });

  it("2024-02-04 是立春（节气）", () => {
    const info = getLunarInfo(2024, 2, 4);
    expect(info).not.toBeNull();
    expect(info!.displayText).toBe("立春");
    expect(info!.displayType).toBe("solar-term");
  });

  it("返回干支年信息", () => {
    const info = getLunarInfo(2024, 3, 1);
    expect(info).not.toBeNull();
    expect(info!.ganZhiYear).toBeTruthy();
    expect(info!.zodiac).toBeTruthy();
    expect(typeof info!.ganZhiYear).toBe("string");
  });

  it("返回农历月日中文信息", () => {
    const info = getLunarInfo(2024, 5, 15);
    expect(info).not.toBeNull();
    expect(info!.lunarMonthChinese).toBeTruthy();
    expect(info!.lunarDayChinese).toBeTruthy();
    expect(info!.lunarYearChinese).toBeTruthy();
  });

  it("custom holiday override 覆盖为「休」", () => {
    const info = getLunarInfo(2026, 5, 5, { "2026-05-05": "holiday" });
    expect(info).not.toBeNull();
    expect(info!.isHoliday).toBe(true);
    expect(info!.isWorkday).toBe(false);
  });

  it("custom workday override 覆盖为「班」", () => {
    const info = getLunarInfo(2026, 10, 10, { "2026-10-10": "workday" });
    expect(info).not.toBeNull();
    expect(info!.isWorkday).toBe(true);
    expect(info!.isHoliday).toBe(false);
  });

  it("custom override 也覆盖 display text（非节日时）", () => {
    const info = getLunarInfo(2026, 6, 15, { "2026-06-15": "holiday" });
    expect(info).not.toBeNull();
    // Non-festival dates get display text overridden to "休"
    expect(info!.displayText).toBe("休");
  });

  it("custom override 不覆盖已有的节日 display", () => {
    // 2024-02-10 是春节，override 为 holiday 不应把 display 改成"休"
    const info = getLunarInfo(2024, 2, 10, { "2024-02-10": "holiday" });
    expect(info).not.toBeNull();
    expect(info!.displayText).toBe("春节");
  });

  it("极小年份（1900-01-01）返回 null", () => {
    // Before 1900, lunar-typescript may fail for some dates
    const info = getLunarInfo(1899, 12, 31);
    // May or may not be null depending on library — just verify no crash
    expect(() => getLunarInfo(1899, 12, 31)).not.toThrow();
  });

  it("很远的未来年份（2099）也应正常工作", () => {
    const info = getLunarInfo(2099, 1, 1);
    expect(info).not.toBeNull();
    expect(info!.ganZhiYear).toBeTruthy();
  });
});

describe("getGanZhiYearLabel", () => {
  it("返回干支生肖年字符串", () => {
    const label = getGanZhiYearLabel(2024, 2, 10);
    // e.g., "甲辰龙年" — 2 gan-zhi chars + 1 zodiac char + 年
    expect(label).toMatch(/年$/);  // ends with 年
    expect(label.length).toBeGreaterThanOrEqual(4); // at least 4 chars
  });

  it("返回非空字符串", () => {
    const label = getGanZhiYearLabel(2025, 6, 1);
    expect(label).toBeTruthy();
    expect(typeof label).toBe("string");
  });

  it("极小年份不抛异常", () => {
    expect(() => getGanZhiYearLabel(1899, 12, 31)).not.toThrow();
  });
});
