<script lang="ts">
  import type { DayCellData } from "../types";
  import type MixCalendarPlugin from "../main";
  import { createPeriodicNote, getNotePath } from "../notes/creator";
  import { ConfirmCreateModal } from "../ui/ConfirmModal";
  import { get } from "svelte/store";
  import { dailyNotes, selectedDateUID } from "./stores";

  export let data: DayCellData;
  export let plugin: MixCalendarPlugin;

  let cellClasses = "";

  $: {
    const classes: string[] = ["mix-calendar-day"];
    if (!data.isCurrentMonth) classes.push("other-month");
    if (data.isToday) classes.push("today");
    if (data.isSelected) classes.push("selected");
    if (data.isWeekend) classes.push("weekend");
    if (data.isPast && plugin.settings.pastTimeTransparent) classes.push("is-past");
    cellClasses = classes.join(" ");
  }

  /** Check if the current platform is macOS */
  function isMacOS(): boolean {
    return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  }

  /** Hold Ctrl (Win/Linux) or Cmd (Mac) to trigger hover preview */
  function isModPressed(e: MouseEvent): boolean {
    return isMacOS() ? e.metaKey : e.ctrlKey;
  }

  $: stats = data.taskStats;
  $: showTaskDot = plugin.settings.showTaskIndicators
    && stats !== null
    && stats.total > 0;

  $: isTaskComplete = showTaskDot && stats !== null
    && stats.completed === stats.total;

  /** Number of incomplete tasks for the badge text */
  $: incompleteCount = (stats && stats.total > stats.completed)
    ? stats.total - stats.completed
    : 0;

  $: taskTooltip = showTaskDot && stats !== null
    ? `${stats.completed}/${stats.total} 任务完成`
    : "";

  $: linkCountVal = data.linkCount ?? 0;
  $: showLinkDots = plugin.settings.showLinkCount && linkCountVal > 0;

  $: linkTooltip = showLinkDots
    ? `${linkCountVal} 个反向链接`
    : "";

  /** Max dots to render before showing a "+N" */
  $: maxLinkDots = Math.min(linkCountVal, 5);
  $: linkOverflow = linkCountVal > 5 ? linkCountVal - 5 : 0;

  /** Hover preview: hold Ctrl/Cmd and hover to preview the daily note (Calendar parity). */
  function handlePointerOver(e: MouseEvent) {
    if (!isModPressed(e)) return;
    const note = get(dailyNotes).notes[data.dateUID];
    const notePath = note?.path;
    // Trigger Obsidian's built-in hover-link preview popup
    (plugin.app.workspace as any).trigger(
      "link-hover",
      {},
      e.currentTarget,
      data.date.format(plugin.settings.daily.format),
      notePath
    );
  }

  async function handleClick(e: MouseEvent) {
    // Mark this date as selected for visual feedback
    selectedDateUID.set(data.dateUID);

    const granSettings = plugin.settings.daily;
    const dateUID = data.dateUID;

    // Ctrl/Cmd + Click → open in new split
    const useNewLeaf = isModPressed(e);

    // Check if note already exists (via store index)
    const existing = get(dailyNotes).notes[dateUID];
    if (existing) {
      plugin.app.workspace.getLeaf(useNewLeaf ? "split" : false).openFile(existing);
      return;
    }

    // Need to create the note
    const notePath = getNotePath(data.date, granSettings);

    const doCreate = async () => {
      const file = await createPeriodicNote(
        plugin.app,
        data.date,
        "daily",
        granSettings,
        plugin.settings.holidayOverrides
      );
      if (file) {
        plugin.app.workspace.getLeaf(useNewLeaf ? "split" : false).openFile(file);
      }
    };

    if (plugin.settings.shouldConfirmBeforeCreate) {
      new ConfirmCreateModal(plugin.app, notePath, "日记", doCreate).open();
    } else {
      doCreate();
    }
  }

  function handleContextMenu(e: MouseEvent) {
    const existing = dailyNotes.get(data.dateUID);
    if (existing) {
      e.preventDefault();
      import("../ui/fileMenu").then(({ showNoteContextMenu }) => {
        showNoteContextMenu(e, plugin.app, existing, "daily", data.dateUID);
      });
    }
  }

  /**
   * Click the task dot → open the note and jump to the first incomplete task.
   */
  async function handleDotClick(e: MouseEvent) {
    e.stopPropagation();

    const file = dailyNotes.get(data.dateUID);
    if (!file) return;

    // Open the file
    const leaf = plugin.app.workspace.getLeaf(false);
    await leaf.openFile(file);

    // Jump to first incomplete checkbox
    const view = leaf.view as any;
    if (view?.editor) {
      const content = await plugin.app.vault.cachedRead(file);
      const lines = content.split("\n");
      const lineIndex = lines.findIndex((l: string) => /- \[ \]\s*\S/.test(l));
      if (lineIndex >= 0) {
        view.editor.setCursor({ line: lineIndex, ch: 0 });
        view.editor.scrollIntoView(
          { from: { line: lineIndex, ch: 0 }, to: { line: lineIndex, ch: 0 } },
          true
        );
      }
    }
  }

  /** Build array for link dot iteration */
  function range(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div
  class={cellClasses}
  on:click={handleClick}
  on:contextmenu={handleContextMenu}
  on:pointerover={handlePointerOver}
  role="button"
  tabindex="0"
  title={data.hasNote
    ? "点击打开日记 | Ctrl+Click 新分栏 | Ctrl+Hover 预览"
    : "点击创建日记 | Ctrl+Click 新分栏"}
>
  <span class="day-number">{data.dayNumber}</span>

  <!-- Lunar text -->
  {#if data.lunar}
    <span class="lunar-text {data.lunar.displayType}">
      {data.lunar.displayText}
    </span>
  {/if}

  <!-- Holiday badge (respects toggle) -->
  {#if plugin.settings.showHolidayBadges}
    {#if data.lunar?.isHoliday}
      <span class="holiday-badge holiday">休</span>
    {:else if data.lunar?.isWorkday}
      <span class="holiday-badge workday">班</span>
    {/if}
  {/if}

  <!-- Task completion indicator -->
  {#if showTaskDot}
    <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
    <div
      class="mix-calendar-task-dots"
      title={taskTooltip}
      on:click={handleDotClick}
      role="button"
      tabindex="0"
    >
      {#if isTaskComplete}
        <!-- All tasks done: green filled dot + "✓" -->
        <span class="mix-calendar-task-dot complete"></span>
        <span class="task-complete-badge">✓</span>
      {:else}
        <!-- Tasks pending: hollow orange dot + "N" count -->
        <span class="mix-calendar-task-dot incomplete"></span>
        <span class="task-incomplete-badge">{incompleteCount}</span>
      {/if}
    </div>
  {:else if data.hasNote}
    <div class="mix-calendar-dots">
      <span class="mix-calendar-dot" title="有日记（点击打开）"></span>
    </div>
  {/if}

  <!-- Link count: render up to 5 small dots, then +N overflow -->
  {#if showLinkDots}
    <div class="mix-calendar-link-dots" title={linkTooltip}>
      {#each range(maxLinkDots) as _}
        <span class="mix-calendar-link-dot"></span>
      {/each}
      {#if linkOverflow > 0}
        <span class="mix-calendar-link-overflow">+{linkOverflow}</span>
      {/if}
    </div>
  {/if}
</div>
