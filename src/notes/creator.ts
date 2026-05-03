import { App, TFile, normalizePath } from "obsidian";
import type { Moment } from "moment";
import type { PeriodicNoteSettings, Granularity } from "../types";
import { getLunarInfo } from "../lunar/converter";

/**
 * Template variable map for substitution in note templates.
 */
interface TemplateVars {
  [key: string]: string;
}

/**
 * Create a periodic note for the given date and granularity.
 * Handles template reading, variable substitution, folder creation, and file creation.
 */
export async function createPeriodicNote(
  app: App,
  date: Moment,
  granularity: Granularity,
  settings: PeriodicNoteSettings,
  holidayOverrides: Record<string, "holiday" | "workday"> = {}
): Promise<TFile | null> {
  if (!settings.enabled) {
    console.warn(`[Mix Calendar] ${granularity} notes are disabled`);
    return null;
  }

  // 1. Generate note path
  const notePath = getNotePath(date, settings);
  if (!notePath) return null;

  // 2. Check if note already exists
  const existing = app.vault.getAbstractFileByPath(notePath);
  if (existing instanceof TFile) {
    return existing;
  }

  // 3. Build note content
  const content = await buildNoteContent(app, date, granularity, settings, holidayOverrides);

  // 4. Ensure folder exists
  const folderPath = notePath.substring(0, notePath.lastIndexOf("/"));
  if (folderPath) {
    const folder = app.vault.getAbstractFileByPath(folderPath);
    if (!folder) {
      await app.vault.createFolder(folderPath);
    }
  }

  // 5. Create the file
  const file = await app.vault.create(notePath, content);
  return file;
}

/**
 * Get the full vault-relative path for a note.
 */
export function getNotePath(
  date: Moment,
  settings: PeriodicNoteSettings
): string {
  const name = date.format(settings.format);
  const folder = settings.folder ? settings.folder.replace(/\/$/, "") : "";
  const fileName = folder ? `${folder}/${name}.md` : `${name}.md`;
  return fileName;
}

/**
 * Build note content by reading the template and substituting variables.
 */
async function buildNoteContent(
  app: App,
  date: Moment,
  granularity: Granularity,
  settings: PeriodicNoteSettings,
  holidayOverrides: Record<string, "holiday" | "workday"> = {}
): Promise<string> {
  // Read template file
  let templateContent = "";
  if (settings.template) {
    try {
      // Normalize: Core Daily Notes stores template without .md, but
      // getAbstractFileByPath needs the full path
      const templatePath = settings.template.endsWith(".md")
        ? settings.template
        : settings.template + ".md";
      const templateFile = app.vault.getAbstractFileByPath(templatePath);
      if (templateFile) {
        templateContent = await app.vault.read(templateFile as TFile);
      } else {
        console.warn(
          `[Mix Calendar] Template not found: ${templatePath}`
        );
      }
    } catch {
      console.warn(
        `[Mix Calendar] Template not found: ${settings.template}`
      );
    }
  }

  // Build variable map
  const vars = buildTemplateVars(date, granularity, holidayOverrides);

  // Substitute variables
  let content = templateContent || "";
  for (const [key, value] of Object.entries(vars)) {
    content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }

  // Handle date offsets: {{date+Nd:format}}
  content = content.replace(
    /\{\{date([+-]?\d+)d(?::([^}]+))?\}\}/g,
    (_match, offset: string, fmt: string) => {
      const d = date.clone().add(parseInt(offset), "days");
      return d.format(fmt || "YYYY-MM-DD");
    }
  );

  // Handle weekdays: {{sunday:format}} through {{saturday:format}}
  const dayNames = [
    "sunday", "monday", "tuesday", "wednesday",
    "thursday", "friday", "saturday",
  ];
  for (let i = 0; i < 7; i++) {
    const regex = new RegExp(
      `\\{\\{${dayNames[i]}(?::([^}]+))?\\}\\}`,
      "g"
    );
    content = content.replace(regex, (_match, fmt: string) => {
      const d = date.clone().startOf("week").add(i, "days");
      return d.format(fmt || "YYYY-MM-DD");
    });
  }

  // If no template, add a default heading
  if (!templateContent) {
    const heading = date.format("YYYY-MM-DD dddd");
    content = `# ${heading}\n\n`;
  }

  return content;
}

/**
 * Build the template variable substitution map.
 */
function buildTemplateVars(
  date: Moment,
  granularity: Granularity,
  holidayOverrides: Record<string, "holiday" | "workday"> = {}
): TemplateVars {
  const vars: TemplateVars = {
    date: date.format("YYYY-MM-DD"),
    time: date.format("HH:mm"),
    title: date.format("YYYY-MM-DD dddd"),
    yesterday: date.clone().subtract(1, "day").format("YYYY-MM-DD"),
    tomorrow: date.clone().add(1, "day").format("YYYY-MM-DD"),
  };

  // Lunar variables
  const lunar = getLunarInfo(date.year(), date.month() + 1, date.date(), holidayOverrides);
  if (lunar) {
    vars.lunarYear = lunar.ganZhiYear + lunar.zodiac + "年";
    vars.lunarMonth = lunar.lunarMonthChinese;
    vars.lunarDay = lunar.lunarDayChinese;
    vars.solarTerm = lunar.displayType === "solar-term" ? lunar.displayText : "";
    vars.festival = lunar.displayType === "festival" ? lunar.displayText : "";
    vars.ganZhiYear = lunar.ganZhiYear;
    vars.zodiac = lunar.zodiac;
  } else {
    vars.lunarYear = "";
    vars.lunarMonth = "";
    vars.lunarDay = "";
    vars.solarTerm = "";
    vars.festival = "";
    vars.ganZhiYear = "";
    vars.zodiac = "";
  }

  // Granularity-specific
  if (granularity === "weekly") {
    const startOfWeek = date.clone().startOf("isoWeek");
    const endOfWeek = date.clone().endOf("isoWeek");
    vars.sunday = startOfWeek.format("YYYY-MM-DD");
    vars.saturday = endOfWeek.format("YYYY-MM-DD");
    vars.weekStart = startOfWeek.format("YYYY-MM-DD");
    vars.weekEnd = endOfWeek.format("YYYY-MM-DD");
  }

  if (granularity === "quarterly") {
    const quarterNum = date.quarter();
    vars.quarter = `Q${quarterNum}`;
    vars.quarterStart = date.clone().startOf("quarter").format("YYYY-MM-DD");
    vars.quarterEnd = date.clone().endOf("quarter").format("YYYY-MM-DD");
  }

  return vars;
}
