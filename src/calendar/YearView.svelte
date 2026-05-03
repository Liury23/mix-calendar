<script lang="ts">
  import { onMount } from "svelte";
  import type { Moment } from "moment";
  import type { TFile } from "obsidian";
  import type MixCalendarPlugin from "../main";
  import { currentDate, viewMode, settings, monthlyNotes, quarterlyNotes, dailyNotes, yearlyNotes, i18n } from "./stores";
  import { createPeriodicNote, getNotePath } from "../notes/creator";
  import { ConfirmCreateModal } from "../ui/ConfirmModal";
  import { showNoteContextMenu } from "../ui/fileMenu";
  import { getLunarInfo } from "../lunar/converter";
  import type { TaskStats, IMixCalendarSettings } from "../types";

  export let plugin: MixCalendarPlugin;

  interface MonthData {
    month: number;
    label: string;
    lunarLabel: string;
    lunarText: string;
    hasNote: boolean;
    taskStats?: TaskStats | null;
    /** Aggregated daily task stats for this month */
    dailyAggregate: { total: number; completed: number };
    dateUID: string;
    isPast: boolean;
    refDate: Moment;
  }

  interface QuarterData {
    label: string;
    months: MonthData[];
    quarterUID: string;
    hasQuarterlyNote: boolean;
    quarterlyTaskStats?: TaskStats | null;
  }

  let quarters: QuarterData[] = [];
  let yearGridEl: HTMLElement;
  let lastScrolledYear: number | null = null;

  // Yearly note reactive data
  $: yearUID = $currentDate ? `${$currentDate.year()}` : "";
  $: hasYearlyNote = $settings.yearly.enabled && !!$yearlyNotes.notes[yearUID];
  $: yearlyStats = $settings.yearly.enabled ? ($yearlyNotes.taskStats[yearUID] ?? null) : null;

  $: buildYearGrid(
    $currentDate, $settings, $monthlyNotes, $quarterlyNotes,
    $dailyNotes, $i18n.quarters
  );

  onMount(() => {
    scrollToCurrentQuarter();
  });

  // After reactive re-render: scroll only when displayed year changes
  $: if (quarters.length > 0 && $currentDate) {
    const yr = $currentDate.year();
    if (lastScrolledYear !== yr) {
      lastScrolledYear = yr;
      requestAnimationFrame(() => scrollToCurrentQuarter());
    }
  }


  function scrollToCurrentQuarter() {
    if (!yearGridEl) return;
    const today = window.moment();
    const currentMonth = today.month() + 1;
    // Find which quarter contains the current month
    const quarterIdx = currentMonth <= 3 ? 0
      : currentMonth <= 6 ? 1
      : currentMonth <= 9 ? 2
      : 3;
    const row = yearGridEl.querySelectorAll(".mix-calendar-quarter-row")[quarterIdx];
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  /**
   * Pre-compute daily task aggregates grouped by YYYY-MM, O(n) single pass.
   */
  function buildDailyAggregates(
    year: number,
    dailyNotesData: { taskStats: Record<string, TaskStats> }
  ): Map<string, { total: number; completed: number }> {
    const map = new Map<string, { total: number; completed: number }>();
    const yearPrefix = `${year}-`;
    for (const [uid, stats] of Object.entries(dailyNotesData.taskStats)) {
      if (!uid.startsWith(yearPrefix)) continue;
      // Extract YYYY-MM from "YYYY-MM-DD"
      const monthKey = uid.slice(0, 7);
      const prev = map.get(monthKey) ?? { total: 0, completed: 0 };
      map.set(monthKey, {
        total: prev.total + stats.total,
        completed: prev.completed + stats.completed,
      });
    }
    return map;
  }

  function buildYearGrid(
    date: Moment,
    pluginSettings: IMixCalendarSettings,
    monthlyNoteData: { notes: Record<string, TFile>; taskStats: Record<string, TaskStats> },
    quarterlyNoteData: { notes: Record<string, TFile>; taskStats: Record<string, TaskStats> },
    dailyNotesData: { notes: Record<string, TFile>; taskStats: Record<string, TaskStats> },
    quarterLabels: readonly string[]
  ) {
    if (!date) return;

    const year = date.year();
    const today = window.moment();

    // Pre-compute daily aggregates for all months in this year (single pass)
    const dailyAggMap = buildDailyAggregates(year, dailyNotesData);

    const result: QuarterData[] = [];

    const quarterDefs = [
      { months: [1, 2, 3], label: quarterLabels[0] },
      { months: [4, 5, 6], label: quarterLabels[1] },
      { months: [7, 8, 9], label: quarterLabels[2] },
      { months: [10, 11, 12], label: quarterLabels[3] },
    ];

    for (const qDef of quarterDefs) {
      const quarterMonths: MonthData[] = [];
      const quarterNum = qDef.months[0] <= 3 ? 1 : qDef.months[0] <= 6 ? 2 : qDef.months[0] <= 9 ? 3 : 4;
      const quarterUID = `${year}-Q${quarterNum}`;
      const hasQuarterlyNote = !!quarterlyNoteData.notes[quarterUID];
      const quarterlyTaskStats = quarterlyNoteData.taskStats[quarterUID] ?? null;

      for (const m of qDef.months) {
        const monthDate = window.moment([year, m - 1, 1]);
        const dateUID = monthDate.format("YYYY-MM");
        const hasNote = !!monthlyNoteData.notes[dateUID];
        const isPast = monthDate.endOf("month").isBefore(today, "day");

        let lunarLabel = "";
        let lunarText = "";
        if (pluginSettings.showLunarInfo) {
          const lunar = getLunarInfo(year, m, 1, pluginSettings.holidayOverrides);
          if (lunar) {
            lunarLabel = lunar.lunarMonthChinese;
            lunarText = lunar.ganZhiYear + lunar.zodiac;
          }
        }

        const dailyAggregate = dailyAggMap.get(dateUID) ?? { total: 0, completed: 0 };

        quarterMonths.push({
          month: m,
          label: `${m}月`,
          lunarLabel,
          lunarText,
          hasNote,
          taskStats: monthlyNoteData.taskStats[dateUID] ?? null,
          dailyAggregate,
          dateUID,
          isPast,
          refDate: monthDate,
        });
      }

      result.push({
        label: qDef.label,
        months: quarterMonths,
        quarterUID,
        hasQuarterlyNote,
        quarterlyTaskStats,
      });
    }

    quarters = result;
  }

  /** Check if the current platform is macOS */
  function isMacOS(): boolean {
    return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  }

  /** Hold Ctrl (Win/Linux) or Cmd (Mac) for modifier actions */
  function isModPressed(e: MouseEvent): boolean {
    return isMacOS() ? e.metaKey : e.ctrlKey;
  }

  function navigateToMonthView(month: number) {
    $viewMode = "month";
    $currentDate = window.moment([$currentDate.year(), month - 1, 1]);
  }

  async function handleMonthClick(e: MouseEvent, mData: MonthData) {
    const granSettings = plugin.settings.monthly;
    if (!granSettings.enabled) {
      // Fallback: navigate to month view
      navigateToMonthView(mData.month);
      return;
    }

    const useNewLeaf = isModPressed(e);
    const existing = monthlyNotes.get(mData.dateUID);
    if (existing) {
      plugin.app.workspace.getLeaf(useNewLeaf ? "split" : false).openFile(existing);
      return;
    }

    const notePath = getNotePath(mData.refDate, granSettings);
    const doCreate = async () => {
      const file = await createPeriodicNote(
        plugin.app, mData.refDate, "monthly", granSettings, plugin.settings.holidayOverrides
      );
      if (file) plugin.app.workspace.getLeaf(useNewLeaf ? "split" : false).openFile(file);
    };

    if (plugin.settings.shouldConfirmBeforeCreate) {
      new ConfirmCreateModal(plugin.app, notePath, "月记", doCreate).open();
    } else {
      doCreate();
    }
  }

  async function handleMonthContextMenu(e: MouseEvent, mData: MonthData) {
    const existing = monthlyNotes.get(mData.dateUID);
    if (!existing) return;

    e.preventDefault();
    showNoteContextMenu(e, plugin.app, existing, "monthly", mData.dateUID);
  }

  async function handleYearClick() {
    const granSettings = plugin.settings.yearly;
    if (!granSettings.enabled) return;

    const year = $currentDate.year();
    const refDate = window.moment([year, 0, 1]);
    const existing = yearlyNotes.get(yearUID);
    if (existing) {
      plugin.app.workspace.getLeaf(false).openFile(existing);
      return;
    }

    const notePath = getNotePath(refDate, granSettings);
    const doCreate = async () => {
      const file = await createPeriodicNote(
        plugin.app, refDate, "yearly", granSettings, plugin.settings.holidayOverrides
      );
      if (file) plugin.app.workspace.getLeaf(false).openFile(file);
    };

    new ConfirmCreateModal(plugin.app, notePath, "年记", doCreate).open();
  }

  async function handleQuarterClick(quarter: QuarterData) {
    const granSettings = plugin.settings.quarterly;
    if (!granSettings.enabled) return;

    const refDate = window.moment([$currentDate.year(), quarter.months[0].month - 1, 1]);
    const existing = quarterlyNotes.get(quarter.quarterUID);
    if (existing) {
      plugin.app.workspace.getLeaf(false).openFile(existing);
      return;
    }

    const notePath = getNotePath(refDate, granSettings);
    const doCreate = async () => {
      const file = await createPeriodicNote(
        plugin.app, refDate, "quarterly", granSettings, plugin.settings.holidayOverrides
      );
      if (file) plugin.app.workspace.getLeaf(false).openFile(file);
    };

    new ConfirmCreateModal(plugin.app, notePath, "季记", doCreate).open();
  }
</script>

<div class="mix-calendar-year-grid" bind:this={yearGridEl}>
  <!-- Yearly note entry -->
  {#if plugin.settings.yearly.enabled}
    <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
    <div
      class="mix-calendar-yearly-row"
      on:click={handleYearClick}
      role="button"
      tabindex="0"
    >
      <span class="yearly-label">{$i18n.yearFormat}</span>
      {#if plugin.settings.showTaskIndicators && yearlyStats && yearlyStats.total > 0}
        <span
          class="yearly-task-count"
          class:complete={yearlyStats.completed === yearlyStats.total}
        >
          {yearlyStats.completed}/{yearlyStats.total}
        </span>
      {:else if hasYearlyNote}
        <span class="mix-calendar-dot" style="display:inline-block;margin-left:4px;"></span>
      {/if}
    </div>
  {/if}

  {#each quarters as quarter}
    <div class="mix-calendar-quarter-row">
      <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
      <div
        class="mix-calendar-quarter-label"
        on:click={() => handleQuarterClick(quarter)}
        role="button"
        tabindex="0"
      >
        {quarter.label}
        {#if quarter.hasQuarterlyNote}
          <span class="mix-calendar-dot" style="display:inline-block;margin-left:4px;"></span>
        {/if}
      </div>
      <div class="mix-calendar-quarter-months">
        {#each quarter.months as monthData}
          <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
          <div
            class="mix-calendar-month-cell"
            class:is-past={monthData.isPast && plugin.settings.pastTimeTransparent}
            on:click={(e) => handleMonthClick(e, monthData)}
            on:dblclick={() => navigateToMonthView(monthData.month)}
            on:contextmenu={(e) => handleMonthContextMenu(e, monthData)}
            role="button"
            tabindex="0"
            title={plugin.settings.monthly.enabled
              ? "点击打开月记 | Ctrl+Click 新分栏 | 双击跳转月视图"
              : "点击跳转月视图"}
          >
            <span class="month-gregorian">{monthData.label}</span>
            {#if monthData.lunarLabel}
              <span class="month-lunar">{monthData.lunarLabel}</span>
            {/if}
            {#if monthData.lunarText}
              <span class="month-ganzhi">{monthData.lunarText}</span>
            {/if}

            <!-- Monthly note task indicator -->
            {#if plugin.settings.showTaskIndicators && monthData.taskStats && monthData.taskStats.total > 0}
              <div class="mix-calendar-task-dots">
                <span
                  class="mix-calendar-task-dot"
                  class:complete={monthData.taskStats.completed === monthData.taskStats.total}
                  class:incomplete={monthData.taskStats.completed < monthData.taskStats.total}
                ></span>
              </div>
            {:else if monthData.hasNote}
              <div class="mix-calendar-dots">
                <span class="mix-calendar-dot"></span>
              </div>
            {/if}

            <!-- Daily task aggregate for this month -->
            {#if plugin.settings.showTaskIndicators && monthData.dailyAggregate.total > 0}
              <span
                class="month-daily-task-count"
                class:complete={monthData.dailyAggregate.completed === monthData.dailyAggregate.total}
              >
                {monthData.dailyAggregate.completed}/{monthData.dailyAggregate.total}
              </span>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>
