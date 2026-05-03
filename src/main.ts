import { Plugin, type WorkspaceLeaf, TFile } from "obsidian";
import { get } from "svelte/store";
import { CalendarView } from "./calendar/CalendarView";
import { MixCalendarSettingTab } from "./settings";
import { VIEW_TYPE_MIX_CALENDAR, DEFAULT_SETTINGS, GRANULARITIES, TASK_REGEX, COMPLETED_TASK_REGEX } from "./constants";
import {
  settings,
  currentDate,
  activeFile,
  viewMode,
  noteStores,
} from "./calendar/stores";
import type { IMixCalendarSettings, Granularity, TaskStats } from "./types";

export default class MixCalendarPlugin extends Plugin {
  settings!: IMixCalendarSettings;

  async onload(): Promise<void> {
    console.log("[Mix Calendar] Loading plugin...");

    // 1. Load settings (or use defaults for first run)
    await this.loadSettings();

    // 2. Sync settings to Svelte stores
    settings.set(this.settings);

    // 3. Register view
    this.registerView(
      VIEW_TYPE_MIX_CALENDAR,
      (leaf: WorkspaceLeaf) => new CalendarView(leaf, this)
    );

    // 4. Add ribbon icon
    this.addRibbonIcon("calendar-days", "Open Mix Calendar", () => {
      this.activateView();
    });

    // 5. Add command to open calendar
    this.addCommand({
      id: "open-mix-calendar",
      name: "Open Mix Calendar",
      callback: () => this.activateView(),
    });

    // 5b. Add command to reveal the currently open note in the calendar
    this.addCommand({
      id: "reveal-open-note",
      name: "Reveal open note",
      callback: () => this.revealOpenNote(),
    });

    // 6. Track active file changes
    this.registerEvent(
      this.app.workspace.on("file-open", (file: TFile | null) => {
        if (file) {
          activeFile.set(file);
          // Update currentDate to match the opened daily note
          this.trySyncDateFromFile(file);
        }
      })
    );

    // 7a. Incremental updates on vault changes — no full reindex
    this.registerEvent(
      this.app.vault.on("create", (file) => {
        if (file instanceof TFile && file.extension === "md") {
          this.incrementalAddFile(file);
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (file instanceof TFile && file.extension === "md") {
          this.incrementalRemoveFile(file);
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        if (file instanceof TFile && file.extension === "md") {
          this.incrementalRemovePath(oldPath);
          this.incrementalAddFile(file);
        }
      })
    );

    // 7b. Incremental update on modify — only re-parse task stats for the
    //     changed file, skipping the expensive full vault scan.
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file instanceof TFile && file.extension === "md") {
          this.incrementalUpdateFile(file);
        }
      })
    );

    // 8. Register settings tab
    this.addSettingTab(new MixCalendarSettingTab(this.app, this));

    // 9. Initial note indexing (debounced)
    this.reindexAllWhenReady();

    // 10. Activate view if it was previously open
    this.app.workspace.onLayoutReady(() => {
      this.reindexAllWhenReady();
    });

    console.log("[Mix Calendar] Plugin loaded successfully");
  }

  onunload(): void {
    console.log("[Mix Calendar] Unloading plugin...");
    if (this.reindexDebounceTimer) {
      clearTimeout(this.reindexDebounceTimer);
      this.reindexDebounceTimer = null;
    }
    if (this.backlinkDebounceTimer) {
      clearTimeout(this.backlinkDebounceTimer);
      this.backlinkDebounceTimer = null;
    }
    // Svelte components are destroyed via CalendarView.onClose()
  }

  // ============================================================
  // Settings
  // ============================================================

  async loadSettings(): Promise<void> {
    const data = await this.loadData();
    if (data && Object.keys(data).length > 0) {
      // Merge with defaults to handle new fields
      this.settings = { ...DEFAULT_SETTINGS, ...data };
      // Ensure nested settings are also merged
      for (const gran of GRANULARITIES) {
        this.settings[gran] = { ...DEFAULT_SETTINGS[gran], ...(data[gran] || {}) };
      }
      // Migrate stale template paths (06-Templates → 04-Resources/Templates)
      this.migrateTemplatePaths();
    } else {
      this.settings = { ...DEFAULT_SETTINGS };
      // First run: auto-migrate from Core Daily Notes and Calendar plugin
      await this.migrateSettings();
    }
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    settings.set(this.settings);
    // Trigger reindex when settings change
    this.reindexAllWhenReady();
  }

  async migrateSettings(): Promise<void> {
    console.log("[Mix Calendar] First run detected, attempting settings migration...");

    try {
      // 1. Migrate from Core Daily Notes
      const dailyNotesPlugin = (this.app as any).internalPlugins
        ?.getPluginById?.("daily-notes");
      if (dailyNotesPlugin?.instance?.options) {
        const opts = dailyNotesPlugin.instance.options;
        if (opts.format) this.settings.daily.format = opts.format;
        if (opts.folder) this.settings.daily.folder = opts.folder;
        if (opts.template) this.settings.daily.template = opts.template;
        console.log("[Mix Calendar] Migrated daily note settings from Core Daily Notes");
      }

      // 2. Migrate from Calendar plugin (liamcain)
      const calendarPlugin = (this.app as any).plugins?.getPlugin?.("calendar");
      if (calendarPlugin?.options) {
        const opts = calendarPlugin.options;
        if (opts.weekStart) this.settings.weekStart = opts.weekStart;
        if (opts.localeOverride) this.settings.localeOverride = opts.localeOverride;
        if (opts.shouldConfirmBeforeCreate !== undefined) {
          this.settings.shouldConfirmBeforeCreate = opts.shouldConfirmBeforeCreate;
        }
        // Weekly settings
        if (opts.showWeeklyNote !== undefined) {
          this.settings.weekly.enabled = opts.showWeeklyNote;
        }
        if (opts.weeklyNoteFormat) this.settings.weekly.format = opts.weeklyNoteFormat;
        if (opts.weeklyNoteFolder) this.settings.weekly.folder = opts.weeklyNoteFolder;
        if (opts.weeklyNoteTemplate) this.settings.weekly.template = opts.weeklyNoteTemplate;
        console.log("[Mix Calendar] Migrated settings from Calendar plugin");
      }

      // 3. Migrate from Chinese Calendar plugin
      const chinesePlugin = (this.app as any).plugins?.getPlugin?.("chinese-calendar");
      if (chinesePlugin?.settings) {
        const opts = chinesePlugin.settings;
        if (opts.appearance?.pastTimeTransparent !== undefined) {
          this.settings.pastTimeTransparent = opts.appearance.pastTimeTransparent;
        }
        console.log("[Mix Calendar] Migrated appearance settings from Chinese Calendar plugin");
      }

      await this.saveSettings();
      console.log("[Mix Calendar] Settings migration complete");
    } catch (err) {
      console.warn("[Mix Calendar] Settings migration failed (non-critical):", err);
    }
  }

  /** Auto-update template paths from old 06-Templates/ to 04-Resources/Templates/ */
  private migrateTemplatePaths(): void {
    let changed = false;
    for (const gran of GRANULARITIES) {
      const tpl = this.settings[gran].template;
      if (tpl && tpl.startsWith("06-Templates/")) {
        this.settings[gran].template = tpl.replace("06-Templates/", "04-Resources/Templates/");
        changed = true;
      }
    }
    if (changed) {
      console.log("[Mix Calendar] Migrated template paths to 04-Resources/Templates/");
      this.saveSettings();
    }
  }

  // ============================================================
  // View management
  // ============================================================

  async activateView(): Promise<void> {
    const { workspace } = this.app;

    // Check if view is already open
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_MIX_CALENDAR)[0];
    if (!leaf) {
      // Open in right sidebar
      leaf = workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({
          type: VIEW_TYPE_MIX_CALENDAR,
          active: true,
        });
      }
    }

    // Reveal the leaf
    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }

  /** Jump the calendar to the month containing the currently active note. */
  private revealOpenNote(): void {
    const file = this.app.workspace.getActiveFile();
    if (!file) return;

    // Try parsing as a periodic note across all granularities
    for (const gran of GRANULARITIES) {
      const gs = this.settings[gran];
      if (!gs.enabled) continue;
      const parsed = window.moment(file.basename, this.basenameFormat(gs.format), true);
      if (parsed.isValid()) {
        currentDate.set(parsed);
        // Switch to month view if currently in year view
        if (get(viewMode) === "year") {
          viewMode.set("month");
        }
        this.activateView();
        return;
      }
    }

    // If not a periodic note, just reveal the calendar
    this.activateView();
  }

  // ============================================================
  // Date sync from active file
  // ============================================================

  private trySyncDateFromFile(file: TFile): void {
    if (!file) return;

    const format = this.basenameFormat(this.settings.daily.format);
    const parsed = window.moment(file.basename, format, true);
    if (parsed.isValid()) {
      currentDate.set(parsed);
    }
  }

  // ============================================================
  // Note indexing — full scan (only on load / settings change)
  // ============================================================

  private reindexDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  private reindexAllWhenReady(): void {
    if (this.reindexDebounceTimer) {
      clearTimeout(this.reindexDebounceTimer);
    }
    this.reindexDebounceTimer = setTimeout(() => {
      this.reindexAll();
    }, 300);
  }

  private async reindexAll(): Promise<void> {
    for (const gran of GRANULARITIES) {
      const store = noteStores[gran];
      if (this.settings[gran].enabled) {
        await this.indexGranularity(gran);
      } else {
        // Clear disabled indexes
        store.set({ notes: {}, taskStats: {}, linkCounts: {}, lastIndexed: Date.now() });
      }
    }
  }

  private async indexGranularity(gran: Granularity): Promise<void> {
    const granSettings = this.settings[gran];
    if (!granSettings.enabled || !granSettings.folder) return;

    const store = noteStores[gran];

    try {
      const format = granSettings.format;
      const folder = granSettings.folder;

      // Get the folder
      const folderObj = this.app.vault.getAbstractFileByPath(folder);
      if (!folderObj) {
        store.set({ notes: {}, taskStats: {}, linkCounts: {}, lastIndexed: Date.now() });
        return;
      }

      const notes: Record<string, TFile> = {};
      const matchingFiles: { file: TFile; uid: string }[] = [];

      // Recursively collect all .md files
      const basenameFmt = this.basenameFormat(format);
      const collectFiles = (f: any) => {
        if (f instanceof TFile && f.extension === "md") {
          const parsed = window.moment(f.basename, basenameFmt, true);
          if (parsed.isValid()) {
            const uid = this.fileToUID(f.basename, gran, format);
            notes[uid] = f;
            matchingFiles.push({ file: f, uid });
          }
        }
        if (f.children) {
          for (const child of f.children) {
            collectFiles(child);
          }
        }
      };

      collectFiles(folderObj);

      // ── Task stats for all granularities ────────────────────
      const taskStats = await this.computeTaskStats(matchingFiles, gran);

      // ── Backlink counts (daily only, when feature is enabled) ─
      const linkCounts = (gran === "daily" && this.settings.showLinkCount)
        ? this.computeLinkCounts(matchingFiles)
        : {};

      console.log(
        `[Mix Calendar] Indexed ${gran}: ` +
        `${Object.keys(notes).length} notes, ` +
        `${Object.keys(taskStats).length} with tasks, ` +
        `${Object.keys(linkCounts).length} with backlinks`
      );

      store.set({ notes, taskStats, linkCounts, lastIndexed: Date.now() });
    } catch (err) {
      console.warn(`[Mix Calendar] Failed to index ${gran} notes:`, err);
      store.set({ notes: {}, taskStats: {}, linkCounts: {}, lastIndexed: Date.now() });
    }
  }

  // ============================================================
  // Shared helpers — UID / task stats / link counts
  // ============================================================

  /**
   * Extract the basename portion from a format string.
   * E.g., "YYYY/YYYY-MM/YYYY-MM-DD" → "YYYY-MM-DD"
   *        "YYYY/YYYY-[W]WW"       → "YYYY-[W]WW"
   *        "YYYY"                  → "YYYY"
   */
  private basenameFormat(format: string): string {
    const idx = format.lastIndexOf("/");
    return idx >= 0 ? format.slice(idx + 1) : format;
  }

  /** Convert a filename (basename) to a dateUID for the given granularity. */
  private fileToUID(basename: string, gran: Granularity, format: string): string {
    const parsed = window.moment(basename, this.basenameFormat(format), true);
    switch (gran) {
      case "daily":     return parsed.format("YYYY-MM-DD");
      case "weekly":    return parsed.format("GGGG-[W]WW");
      case "monthly":   return parsed.format("YYYY-MM");
      case "quarterly": return parsed.format("YYYY-[Q]Q");
      case "yearly":    return parsed.format("YYYY");
      default:          return basename;
    }
  }

  /**
   * Match a TFile to a granularity (if any). Returns { gran, uid } or null.
   * Used by incremental add to avoid scanning all granularities.
   */
  private matchFileToGranularity(file: TFile): { gran: Granularity; uid: string } | null {
    for (const gran of GRANULARITIES) {
      const gs = this.settings[gran];
      if (!gs.enabled) continue;

      const folder = gs.folder.replace(/\/$/, "");
      if (folder && !file.path.startsWith(folder + "/") && file.path !== folder) continue;

      const parsed = window.moment(file.basename, this.basenameFormat(gs.format), true);
      if (!parsed.isValid()) continue;

      return { gran, uid: this.fileToUID(file.basename, gran, gs.format) };
    }
    return null;
  }

  /**
   * Strip regions that should not contribute to task counting:
   * HTML comments (<!-- ... -->) and fenced code blocks (``` ... ```).
   */
  private stripNonTaskContent(content: string): string {
    // Remove HTML comments (single- and multi-line)
    let cleaned = content.replace(/<!--[\s\S]*?-->/g, "");
    // Remove Obsidian inline comments (%% ... %%)
    cleaned = cleaned.replace(/%%[\s\S]*?%%/g, "");
    // Remove fenced code blocks
    cleaned = cleaned.replace(/```[\s\S]*?```/g, "");
    return cleaned;
  }

  /** Compute task stats for a batch of matching files (all granularities). */
  private async computeTaskStats(
    matchingFiles: { file: TFile; uid: string }[],
    _gran: Granularity
  ): Promise<Record<string, TaskStats>> {
    const taskStats: Record<string, TaskStats> = {};

    await Promise.all(
      matchingFiles.map(async ({ file, uid }) => {
        try {
          const content = this.stripNonTaskContent(await this.app.vault.cachedRead(file));
          // \s*\S ensures checkbox has non-whitespace content (excludes empty "- [ ]" lines)
          const total = (content.match(TASK_REGEX) || []).length;
          const completed = (content.match(COMPLETED_TASK_REGEX) || []).length;
          if (total > 0) {
            taskStats[uid] = { total, completed };
          }
        } catch {
          // Silently skip unreadable files
        }
      })
    );
    return taskStats;
  }

  /**
   * Compute backlink counts using resolvedLinks metadata cache.
   * Pure function — takes matchingFiles, returns linkCounts map.
   */
  private computeLinkCounts(
    matchingFiles: { file: TFile; uid: string }[]
  ): Record<string, number> {
    const linkCounts: Record<string, number> = {};

    // Build lookup: daily note path → dateUID (with & without .md)
    const pathToUID: Record<string, string> = {};
    for (const { file, uid } of matchingFiles) {
      pathToUID[file.path] = uid;
      pathToUID[file.path.replace(/\.md$/, "")] = uid;
    }

    // resolvedLinks: { sourcePath: { targetPath: count } }
    const resolvedLinks = (this.app.metadataCache as any).resolvedLinks as
      Record<string, Record<string, number>> | undefined;

    if (resolvedLinks) {
      for (const linksObj of Object.values(resolvedLinks)) {
        for (const toPath of Object.keys(linksObj)) {
          const uid = pathToUID[toPath];
          if (uid) {
            linkCounts[uid] = (linkCounts[uid] ?? 0) + 1;
          }
        }
      }
    }

    console.log(
      `[Mix Calendar] Computed link counts: ` +
      `${Object.keys(linkCounts).length} daily notes have backlinks ` +
      `(resolvedLinks available: ${!!resolvedLinks})`
    );
    return linkCounts;
  }

  // ============================================================
  // Incremental add / remove / rename — O(1) per file
  // ============================================================

  /** Add a newly created file to the matching granularity store. */
  private async incrementalAddFile(file: TFile): Promise<void> {
    const match = this.matchFileToGranularity(file);
    if (!match) return;

    const { gran, uid } = match;
    const store = noteStores[gran];

    // Add to notes map
    store.update((data) => ({
      ...data,
      notes: { ...data.notes, [uid]: file },
    }));

    // Compute task stats (checkbox parsing works for all granularities)
    try {
      const content = this.stripNonTaskContent(await this.app.vault.cachedRead(file));
      const total = (content.match(TASK_REGEX) || []).length;
      const completed = (content.match(COMPLETED_TASK_REGEX) || []).length;
      store.update((data) => {
        const newTaskStats = { ...data.taskStats };
        if (total > 0) {
          newTaskStats[uid] = { total, completed };
        }
        return { ...data, taskStats: newTaskStats };
      });
    } catch {
      // ignore unreadable files
    }

    // Backlinks may have changed — schedule a daily-only backlink refresh
    this.scheduleBacklinkRefresh();
  }

  /** Remove a deleted file from all stores. */
  private incrementalRemoveFile(file: TFile): void {
    let removed = false;
    for (const gran of GRANULARITIES) {
      const store = noteStores[gran];
      store.update((data) => {
        let foundUid: string | null = null;
        for (const [uid, f] of Object.entries(data.notes)) {
          if (f.path === file.path) {
            foundUid = uid;
            break;
          }
        }
        if (!foundUid) return data;

        const newNotes = { ...data.notes };
        delete newNotes[foundUid];
        const newTaskStats = { ...data.taskStats };
        delete newTaskStats[foundUid];

        removed = true;
        return { ...data, notes: newNotes, taskStats: newTaskStats };
      });
    }

    if (removed) this.scheduleBacklinkRefresh();
  }

  /** Remove a file by its old path (used during rename). */
  private incrementalRemovePath(oldPath: string): void {
    for (const gran of GRANULARITIES) {
      const store = noteStores[gran];
      store.update((data) => {
        let foundUid: string | null = null;
        for (const [uid, f] of Object.entries(data.notes)) {
          if (f.path === oldPath) {
            foundUid = uid;
            break;
          }
        }
        if (!foundUid) return data;

        const newNotes = { ...data.notes };
        delete newNotes[foundUid];
        const newTaskStats = { ...data.taskStats };
        delete newTaskStats[foundUid];

        return { ...data, notes: newNotes, taskStats: newTaskStats };
      });
    }
  }

  // ============================================================
  // Debounced backlink refresh (daily only, lightweight)
  // ============================================================

  private backlinkDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  /** Schedule a daily-only backlink refresh after a short debounce. */
  private scheduleBacklinkRefresh(): void {
    if (!this.settings.showLinkCount) return;
    if (this.backlinkDebounceTimer) clearTimeout(this.backlinkDebounceTimer);
    this.backlinkDebounceTimer = setTimeout(() => {
      this.refreshDailyBacklinks();
    }, 500);
  }

  /** Recompute backlinks for daily notes from the current store state. */
  private refreshDailyBacklinks(): void {
    if (!this.settings.daily.enabled || !this.settings.showLinkCount) return;

    const store = noteStores["daily"];
    // Use svelte/store's get() to read current notes synchronously
    const data = get(store) as { notes: Record<string, TFile> };
    const matchingFiles = Object.entries(data.notes).map(([uid, file]) => ({ file, uid }));
    const linkCounts = this.computeLinkCounts(matchingFiles);

    store.update((prev) => ({ ...prev, linkCounts }));
  }

  // ============================================================
  // Incremental update — modify event only updates task stats
  // ============================================================

  private incrementalUpdateFile(file: TFile): void {
    for (const gran of GRANULARITIES) {
      const granSettings = this.settings[gran];
      if (!granSettings.enabled) continue;

      // Verify file is in the configured folder (strip trailing slash for comparison)
      const folder = granSettings.folder.replace(/\/$/, "");
      if (folder && !file.path.startsWith(folder + "/") && file.path !== folder) {
        continue;
      }

      const parsed = window.moment(file.basename, this.basenameFormat(granSettings.format), true);
      if (!parsed.isValid()) continue;

      const uid = this.fileToUID(file.basename, gran, granSettings.format);
      const store = noteStores[gran];

      // Only update if already tracked (avoid adding unrelated files)
      if (!store.has(uid)) continue;

      this.app.vault.cachedRead(file).then((rawContent) => {
        const content = this.stripNonTaskContent(rawContent);
        const total = (content.match(TASK_REGEX) || []).length;
        const completed = (content.match(COMPLETED_TASK_REGEX) || []).length;

        store.update((data) => {
          const newTaskStats = { ...data.taskStats };
          if (total > 0) {
            newTaskStats[uid] = { total, completed };
          } else {
            delete newTaskStats[uid];
          }
          return { ...data, taskStats: newTaskStats };
        });
      }).catch(() => {
        // Silently ignore unreadable files
      });

      break; // A file matches at most one granularity
    }
  }
}
