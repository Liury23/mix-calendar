import { App, PluginSettingTab, Setting } from "obsidian";
import type MixCalendarPlugin from "./main";
import { GRANULARITIES } from "./constants";
import type { Granularity, PeriodicNoteSettings, WeekStart } from "./types";

const GRANULARITY_LABELS: Record<Granularity, string> = {
  daily: "日记 (Daily)",
  weekly: "周记 (Weekly)",
  monthly: "月记 (Monthly)",
  quarterly: "季记 (Quarterly)",
  yearly: "年记 (Yearly)",
};

export class MixCalendarSettingTab extends PluginSettingTab {
  plugin: MixCalendarPlugin;

  constructor(app: App, plugin: MixCalendarPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // ============================
    // General Settings
    // ============================
    containerEl.createEl("h3", { text: "通用设置 (General)" });

    new Setting(containerEl)
      .setName("每周起始日 (Week Start)")
      .setDesc("选择日历每周的第一天")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("locale", "系统默认 (Locale)")
          .addOption("sunday", "周日 (Sunday)")
          .addOption("monday", "周一 (Monday)")
          .setValue(this.plugin.settings.weekStart)
          .onChange(async (value: string) => {
            this.plugin.settings.weekStart = value as WeekStart;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("界面语言 (UI Language)")
      .setDesc("日历控件的显示语言")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("zh", "中文")
          .addOption("en", "English")
          .setValue(this.plugin.settings.uiLocale || "zh")
          .onChange(async (value: string) => {
            this.plugin.settings.uiLocale = value as "zh" | "en";
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("本地化覆盖 (Locale Override)")
      .setDesc("覆盖 moment.js 的地区设置，影响每周起始日。选择「系统默认」则跟随 Obsidian 语言。")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("system-default", "系统默认 (System Default)")
          .addOption("zh-cn", "简体中文 (zh-cn)")
          .addOption("zh-tw", "繁體中文 (zh-tw)")
          .addOption("en-us", "English (US)")
          .addOption("en-gb", "English (UK)")
          .addOption("ja-jp", "日本語")
          .addOption("ko-kr", "한국어")
          .setValue(this.plugin.settings.localeOverride || "system-default")
          .onChange(async (value: string) => {
            this.plugin.settings.localeOverride = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("创建前确认 (Confirm Before Create)")
      .setDesc("点击不存在的笔记时弹出确认框，关闭则直接创建")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.shouldConfirmBeforeCreate)
          .onChange(async (value) => {
            this.plugin.settings.shouldConfirmBeforeCreate = value;
            await this.plugin.saveSettings();
          });
      });

    // ============================
    // Appearance Settings
    // ============================
    containerEl.createEl("h3", { text: "显示设置 (Appearance)" });

    new Setting(containerEl)
      .setName("农历信息 (Show Lunar Info)")
      .setDesc("在日期单元格下方显示农历/节气/节日")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.showLunarInfo)
          .onChange(async (value) => {
            this.plugin.settings.showLunarInfo = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("休/班标记 (Show Holiday Badges)")
      .setDesc("显示法定节假日「休」和调休上班「班」的角标")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.showHolidayBadges)
          .onChange(async (value) => {
            this.plugin.settings.showHolidayBadges = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("周数显示 (Show Week Numbers)")
      .setDesc("在月视图左侧显示 ISO 周数")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.showWeekNumbers)
          .onChange(async (value) => {
            this.plugin.settings.showWeekNumbers = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("过去日期半透明 (Past Date Transparent)")
      .setDesc("将过去日期的单元格半透明显示")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.pastTimeTransparent)
          .onChange(async (value) => {
            this.plugin.settings.pastTimeTransparent = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("任务完成指示 (Show Task Indicators)")
      .setDesc("在日历单元格中显示笔记内任务复选框的完成状态（实心=全部完成，空心=有待办）")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.showTaskIndicators)
          .onChange(async (value) => {
            this.plugin.settings.showTaskIndicators = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("显示链接数 (Show Link Count)")
      .setDesc("在日期单元格右下角显示反向链接数量（需启用后等待下次索引，仅对日记生效）")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.showLinkCount)
          .onChange(async (value) => {
            this.plugin.settings.showLinkCount = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("任务圆点大小 (Task Dot Size)")
      .setDesc("调整任务完成状态圆点的直径（像素），默认 9px")
      .addSlider((slider) => {
        slider
          .setLimits(4, 20, 1)
          .setValue(this.plugin.settings.taskDotSize ?? 9)
          .setDynamicTooltip()
          .onChange(async (value: number) => {
            this.plugin.settings.taskDotSize = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("链接圆点大小 (Link Dot Size)")
      .setDesc("调整反向链接圆点的直径（像素），默认 5px")
      .addSlider((slider) => {
        slider
          .setLimits(2, 12, 1)
          .setValue(this.plugin.settings.linkDotSize ?? 5)
          .setDynamicTooltip()
          .onChange(async (value: number) => {
            this.plugin.settings.linkDotSize = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("自定义 CSS 类 (Custom CSS Classes)")
      .setDesc("空格分隔的 CSS class 名，会注入到日历容器上，可用于自定义样式。")
      .addText((text) => {
        text
          .setPlaceholder("my-custom-theme compact-mode")
          .setValue(this.plugin.settings.customCssClasses || "")
          .onChange(async (value) => {
            this.plugin.settings.customCssClasses = value;
            await this.plugin.saveSettings();
          });
      });

    // ============================
    // Custom Holiday Overrides
    // ============================
    containerEl.createEl("h3", { text: "自定义节假日 (Custom Holidays)" });

    const descDiv = containerEl.createEl("div");
    descDiv.createEl("p", {
      text: "此处覆盖法定节假日库的结果。格式：YYYY-MM-DD:休 或 YYYY-MM-DD:班，每行一条。",
    });
    descDiv.createEl("p", {
      text: "示例：2026-05-05:休  2026-10-10:班  （# 开头为注释，会被忽略）",
    });

    const overrides = this.plugin.settings.holidayOverrides || {};
    const lines = Object.entries(overrides)
      .map(([date, type]) => `${date}:${type === "holiday" ? "休" : "班"}`)
      .sort()
      .join("\n");

    const textareaDiv = containerEl.createEl("div");
    const textareaEl = textareaDiv.createEl("textarea", {
      attr: {
        rows: "6",
        placeholder: "# 公司放假\n2026-05-05:休\n# 公司调休\n2026-10-10:班",
      },
    });
    textareaEl.style.width = "100%";
    textareaEl.style.fontFamily = "var(--font-monospace)";
    textareaEl.style.fontSize = "12px";
    textareaEl.value = lines;

    const saveBtn = containerEl.createEl("button", {
      text: "保存自定义节假日",
      cls: "mod-cta",
    });
    saveBtn.style.marginTop = "8px";
    saveBtn.onclick = async () => {
      const newOverrides: Record<string, "holiday" | "workday"> = {};
      const raw = textareaEl.value.trim();
      if (raw) {
        for (const line of raw.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const parts = trimmed.split(":");
          if (parts.length !== 2) continue;
          const date = parts[0].trim();
          const type = parts[1].trim();
          if (
            /^\d{4}-\d{2}-\d{2}$/.test(date) &&
            (type === "休" || type === "班")
          ) {
            newOverrides[date] = type === "休" ? "holiday" : "workday";
          }
        }
      }
      this.plugin.settings.holidayOverrides = newOverrides;
      await this.plugin.saveSettings();
    };

    // ============================
    // Note Settings (5 granularities)
    // ============================
    containerEl.createEl("h3", { text: "笔记设置 (Note Settings)" });

    for (const gran of GRANULARITIES) {
      const label = GRANULARITY_LABELS[gran];
      this.addGranularitySettings(containerEl, gran, label);
    }
  }

  private addGranularitySettings(
    containerEl: HTMLElement,
    gran: Granularity,
    label: string
  ): void {
    const settings = this.plugin.settings[gran];

    containerEl.createEl("h4", { text: label });

    new Setting(containerEl)
      .setName("启用 (Enabled)")
      .addToggle((toggle) => {
        toggle
          .setValue(settings.enabled)
          .onChange(async (value) => {
            this.plugin.settings[gran].enabled = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("日期格式 (Date Format)")
      .setDesc("moment.js 格式字符串，用于生成文件名")
      .addText((text) => {
        text
          .setPlaceholder("YYYY/YYYY-MM/YYYY-MM-DD")
          .setValue(settings.format)
          .onChange(async (value) => {
            this.plugin.settings[gran].format = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("文件夹路径 (Folder)")
      .setDesc("笔记在 vault 内的存放路径")
      .addText((text) => {
        text
          .setPlaceholder("01-Daily")
          .setValue(settings.folder)
          .onChange(async (value) => {
            this.plugin.settings[gran].folder = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("模板路径 (Template)")
      .setDesc("笔记模板文件路径，留空则不使用模板")
      .addText((text) => {
        text
          .setPlaceholder("Templates/Daily.md")
          .setValue(settings.template)
          .onChange(async (value) => {
            this.plugin.settings[gran].template = value;
            await this.plugin.saveSettings();
          });
      });
  }
}
