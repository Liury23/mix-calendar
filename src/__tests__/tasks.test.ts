import { describe, it, expect } from "vitest";
import { TASK_REGEX, COMPLETED_TASK_REGEX } from "../constants";

/** Count helper mirroring the plugin's counting (fresh regex copy per call). */
function countTotal(content: string): number {
  return (content.match(new RegExp(TASK_REGEX.source, "g")) || []).length;
}
function countCompleted(content: string): number {
  return (content.match(new RegExp(COMPLETED_TASK_REGEX.source, "g")) || []).length;
}

describe("task counting regexes", () => {
  it("不统计空白占位待办（行尾即换行）", () => {
    expect(countTotal("- [ ] \n")).toBe(0);
    expect(countTotal("- [ ]\n")).toBe(0);
    expect(countCompleted("- [x] \n")).toBe(0);
  });

  it("不跨行配对：空待办后跟标题/另一条任务也不计数", () => {
    const md = "### 运动\n\n- [ ] \n\n### 作息\n";
    expect(countTotal(md)).toBe(0);

    const md2 = "- [ ]\n- [ ] 真实任务\n";
    expect(countTotal(md2)).toBe(1);
  });

  it("统计同行有内容的待办", () => {
    const md = "- [ ] ANE 写作 🔺\n- [x] 已完成事项 ✅\n";
    expect(countTotal(md)).toBe(2);
    expect(countCompleted(md)).toBe(1);
  });

  it("大写 X 的已完成项也被识别", () => {
    expect(countCompleted("- [X] done\n")).toBe(1);
    expect(countTotal("- [X] done\n")).toBe(1);
  });

  it("空待办在文件末尾（无换行内容）不计数", () => {
    expect(countTotal("- [ ] ")).toBe(0);
    expect(countTotal("- [ ]")).toBe(0);
  });
});
