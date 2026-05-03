<script lang="ts">
  import type { Moment } from "moment";
  import type { TFile } from "obsidian";
  import type MixCalendarPlugin from "../main";
  import DayCell from "./DayCell.svelte";
  import WeekNumCell from "./WeekNumCell.svelte";
  import { currentDate, weekStartDay, viewMode, showWeekNumbers, dailyNotes, weeklyNotes, settings, i18n, selectedDateUID } from "./stores";
  import { getLunarInfo } from "../lunar/converter";
  import type { DayCellData, WeekRowData, TaskStats, IMixCalendarSettings } from "../types";

  export let plugin: MixCalendarPlugin;

  let weeks: WeekRowData[] = [];
  let dowLabels: { label: string; isWeekend: boolean }[] = [];

  $: buildMonthGrid($currentDate, $weekStartDay, $viewMode, $showWeekNumbers, $dailyNotes, $weeklyNotes, $settings, $selectedDateUID);
  $: buildDowLabels($weekStartDay, $showWeekNumbers);

  $: dowWeekDays = $i18n.weekDays;

  function buildDowLabels(wsd: number, showWN: boolean) {
    const labels: { label: string; isWeekend: boolean }[] = [];
    const days = $i18n.weekDays;
    for (let i = 0; i < 7; i++) {
      const dowIndex = (wsd + i) % 7;
      labels.push({
        label: days[dowIndex],
        isWeekend: dowIndex === 0 || dowIndex === 6,
      });
    }
    dowLabels = labels;
  }

  function buildMonthGrid(
    date: Moment,
    wsd: number,
    mode: string,
    showWN: boolean,
    dailyNoteData: { notes: Record<string, TFile>; taskStats: Record<string, TaskStats>; linkCounts: Record<string, number> },
    weeklyNoteData: { notes: Record<string, TFile>; taskStats: Record<string, TaskStats> },
    pluginSettings: IMixCalendarSettings,
    selUID: string | null
  ) {
    if (!date) return;

    const year = date.year();
    const month = date.month(); // 0-based
    const today = window.moment().startOf("day");

    // First day of the month
    const firstOfMonth = window.moment([year, month, 1]);

    // Calculate the start of the grid: first day of the week containing the 1st
    let gridStart = firstOfMonth.clone().day(wsd);
    if (gridStart.isAfter(firstOfMonth)) {
      gridStart.subtract(7, "days");
    }

    const result: WeekRowData[] = [];

    // 6 weeks to cover all cases
    for (let w = 0; w < 6; w++) {
      const weekStart = gridStart.clone().add(w, "weeks");
      const days: DayCellData[] = [];

      for (let d = 0; d < 7; d++) {
        const day = weekStart.clone().add(d, "days");
        const isCurrentMonth = day.month() === month && day.year() === year;
        const isToday = day.isSame(today, "day");
        const isWeekend = day.isoWeekday() >= 6;
        const dateUID = day.format("YYYY-MM-DD");

        // Compute lunar info when enabled
        let lunar = null;
        if (pluginSettings.showLunarInfo) {
          lunar = getLunarInfo(day.year(), day.month() + 1, day.date(), pluginSettings.holidayOverrides);
        }

        days.push({
          date: day,
          dayNumber: day.date(),
          isCurrentMonth,
          isToday,
          isSelected: dateUID === selUID,
          isWeekend,
          isPast: day.isBefore(today, "day"),
          lunar,
          hasNote: !!dailyNoteData.notes[dateUID],
          taskStats: dailyNoteData.taskStats[dateUID] ?? null,
          linkCount: dailyNoteData.linkCounts[dateUID] ?? 0,
          dateUID,
        });
      }

      // Get the Thursday of this week for ISO week numbering
      const thursday = weekStart.clone().isoWeekday(4);
      const weekNum = thursday.isoWeek();

      // Generate weekly note UID matching the indexer format
      const weekUID = thursday.format("GGGG-[W]WW");

      // Check for weekly note in index
      const hasWeeklyNote = !!weeklyNoteData.notes[weekUID];

      result.push({
        weekNum,
        hasWeeklyNote,
        weeklyTaskStats: weeklyNoteData.taskStats[weekUID] ?? null,
        weekUID,
        weekDate: thursday,
        days,
      });
    }

    weeks = result;
  }
</script>

<!-- Day of Week Header -->
<div
  class="mix-calendar-dow-header"
  class:no-weeknum={!$showWeekNumbers}
>
  {#if $showWeekNumbers}
    <div class="mix-calendar-dow-cell"></div>
  {/if}
  {#each dowLabels as dowLabel, i}
    <div class="mix-calendar-dow-cell" class:weekend={dowLabel.isWeekend}>
      {dowLabel.label}
    </div>
  {/each}
</div>

<!-- Month Grid -->
<div class="mix-calendar-month-grid">
  {#each weeks as week}
    <div
      class="mix-calendar-week-row"
      class:no-weeknum={!$showWeekNumbers}
    >
      {#if $showWeekNumbers}
        <WeekNumCell
          weekNum={week.weekNum}
          weekUID={week.weekUID}
          weekDate={week.weekDate}
          hasWeeklyNote={week.hasWeeklyNote}
          weeklyTaskStats={week.weeklyTaskStats}
          {plugin}
        />
      {/if}
      {#each week.days as dayData}
        <DayCell
          data={dayData}
          {plugin}
        />
      {/each}
    </div>
  {/each}
</div>
