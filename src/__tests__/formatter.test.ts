import { describe, it, expect } from "vitest";
import { getDisplayText, formatGanZhiYear } from "../lunar/formatter";

describe("getDisplayText", () => {
  it("优先返回传统农历节日", () => {
    const result = getDisplayText(
      ["春节"], [], "",
      "初一", "正月"
    );
    expect(result).toEqual({ text: "春节", type: "festival" });
  });

  it("农历节日优先于公历节日", () => {
    const result = getDisplayText(
      ["中秋节"], ["国庆节"], "",
      "十五", "八月"
    );
    expect(result).toEqual({ text: "中秋节", type: "festival" });
  });

  it("无农历节日时返回公历节日", () => {
    const result = getDisplayText(
      [], ["元旦"], "",
      "初二", "正月"
    );
    expect(result).toEqual({ text: "元旦", type: "festival" });
  });

  it("无节日时返回节气", () => {
    const result = getDisplayText(
      [], [], "立春",
      "初六", "正月"
    );
    expect(result).toEqual({ text: "立春", type: "solar-term" });
  });

  it("初一显示为「某月」(lunar-month)", () => {
    // lunar-typescript month names already include "月" (e.g. "正月"),
    // so we use them as-is without appending another "月"
    const result = getDisplayText(
      [], [], "",
      "初一", "正月"
    );
    expect(result).toEqual({ text: "正月", type: "lunar-month" });
  });

  it("非初一的普通日期返回农历日名", () => {
    const result = getDisplayText(
      [], [], "",
      "初八", "三月"
    );
    expect(result).toEqual({ text: "初八", type: "lunar-day" });
  });

  it("多个农历节日时取第一个", () => {
    const result = getDisplayText(
      ["元宵节", "其他"], [], "",
      "十五", "正月"
    );
    expect(result).toEqual({ text: "元宵节", type: "festival" });
  });
});

describe("formatGanZhiYear", () => {
  it("格式化干支生肖年", () => {
    expect(formatGanZhiYear("甲辰", "龙")).toBe("甲辰龙年");
  });

  it("丙午马年", () => {
    expect(formatGanZhiYear("丙午", "马")).toBe("丙午马年");
  });
});
