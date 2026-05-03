import { describe, it, expect, vi } from "vitest";
import type { Moment } from "moment";

// Mock the obsidian module before importing anything that depends on it
vi.mock("obsidian", () => {
  class TFile {
    path: string;
    basename: string;
    extension: string;
    constructor(path: string) {
      this.path = path;
      this.basename = path.split("/").pop()?.replace(".md", "") ?? "";
      this.extension = "md";
    }
  }
  return {
    App: class {},
    TFile,
    normalizePath: (p: string) => p,
    PluginSettingTab: class {},
    Setting: class {},
    ItemView: class {},
    WorkspaceLeaf: class {},
    Plugin: class {},
  };
});

import { getNotePath } from "../notes/creator";

// moment mock: format() returns whatever we set via the initial result,
// regardless of the format string (sufficient for path-building tests).
function mk(formatResult: string): Moment {
  return {
    format: (_fmt: string) => formatResult,
    clone: () => mk(formatResult),
    add: () => mk(formatResult),
    subtract: () => mk(formatResult),
    startOf: () => mk(formatResult),
    endOf: () => mk(formatResult),
    isoWeekday: () => 1,
    isoWeek: () => 5,
    year: () => 2024,
    month: () => 1,
    date: () => 10,
    day: () => 5,
    isSame: () => false,
    isBefore: () => false,
    isAfter: () => false,
  } as unknown as Moment;
}

describe("getNotePath", () => {
  it("生成带 folder 的日记路径", () => {
    const date = mk("2024/2024-02/2024-02-10");
    const settings = { enabled: true, format: "YYYY/YYYY-MM/YYYY-MM-DD", folder: "01-Daily", template: "" };
    expect(getNotePath(date, settings)).toBe("01-Daily/2024/2024-02/2024-02-10.md");
  });

  it("生成周记路径", () => {
    const date = mk("2024/2024-W05");
    const settings = { enabled: true, format: "YYYY/YYYY-[W]WW", folder: "01-Daily", template: "" };
    expect(getNotePath(date, settings)).toBe("01-Daily/2024/2024-W05.md");
  });

  it("folder 末尾有斜杠时也正确处理", () => {
    const date = mk("2024-02-10");
    const settings = { enabled: true, format: "YYYY-MM-DD", folder: "01-Daily/", template: "" };
    expect(getNotePath(date, settings)).toBe("01-Daily/2024-02-10.md");
  });

  it("无 folder 时只有文件名", () => {
    const date = mk("2024-02-10");
    const settings = { enabled: true, format: "YYYY-MM-DD", folder: "", template: "" };
    expect(getNotePath(date, settings)).toBe("2024-02-10.md");
  });

  it("月记格式生成月记路径", () => {
    const date = mk("2024/2024-02");
    const settings = { enabled: true, format: "YYYY/YYYY-MM", folder: "01-Daily", template: "" };
    expect(getNotePath(date, settings)).toBe("01-Daily/2024/2024-02.md");
  });

  it("季记格式生成季记路径", () => {
    const date = mk("2024/2024-Q1");
    const settings = { enabled: true, format: "YYYY/YYYY-[Q]Q", folder: "01-Daily", template: "" };
    expect(getNotePath(date, settings)).toBe("01-Daily/2024/2024-Q1.md");
  });

  it("年记格式生成年记路径", () => {
    const date = mk("2024");
    const settings = { enabled: true, format: "YYYY", folder: "01-Daily", template: "" };
    expect(getNotePath(date, settings)).toBe("01-Daily/2024.md");
  });
});
