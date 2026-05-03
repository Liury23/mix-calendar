<script lang="ts">
  import type { Moment } from "moment";
  import type MixCalendarPlugin from "../main";
  import type { TaskStats } from "../types";
  import { createPeriodicNote, getNotePath } from "../notes/creator";
  import { ConfirmCreateModal } from "../ui/ConfirmModal";
  import { weeklyNotes } from "./stores";
  import { get } from "svelte/store";

  export let weekNum: number | null;
  export let weekUID: string = "";
  export let weekDate: Moment | null = null;
  export let hasWeeklyNote: boolean = false;
  export let weeklyTaskStats: TaskStats | null = null;
  export let plugin: MixCalendarPlugin;

  /** Check if the current platform is macOS */
  function isMacOS(): boolean {
    return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  }

  /** Hold Ctrl (Win/Linux) or Cmd (Mac) for modifier actions */
  function isModPressed(e: MouseEvent): boolean {
    return isMacOS() ? e.metaKey : e.ctrlKey;
  }

  /** Hover preview: hold Ctrl/Cmd and hover to preview the weekly note. */
  function handlePointerOver(e: MouseEvent) {
    if (!isModPressed(e)) return;
    if (!weekDate) return;
    const note = get(weeklyNotes).notes[weekUID];
    (plugin.app.workspace as any).trigger(
      "link-hover",
      {},
      e.currentTarget,
      `W${weekNum}`,
      note?.path
    );
  }

  $: stats = weeklyTaskStats;
  $: showCount = plugin.settings.showTaskIndicators
    && stats !== null
    && stats.total > 0;

  $: isComplete = showCount && stats !== null
    && stats.completed === stats.total;

  $: tooltip = showCount && stats !== null
    ? `${stats.completed}/${stats.total} 任务完成`
    : hasWeeklyNote
      ? "有周记（点击打开）"
      : weekNum !== null
        ? `W${weekNum}（点击创建周记）`
        : "";

  async function handleClick(e: MouseEvent) {
    if (weekNum === null || !weekDate) return;

    const granSettings = plugin.settings.weekly;
    if (!granSettings.enabled) return;

    const useNewLeaf = isModPressed(e);

    // Check if weekly note already exists
    const existing = get(weeklyNotes).notes[weekUID];
    if (existing) {
      plugin.app.workspace.getLeaf(useNewLeaf ? "split" : false).openFile(existing);
      return;
    }

    const notePath = getNotePath(weekDate, granSettings);

    const doCreate = async () => {
      const file = await createPeriodicNote(
        plugin.app,
        weekDate,
        "weekly",
        granSettings,
        plugin.settings.holidayOverrides
      );
      if (file) {
        plugin.app.workspace.getLeaf(useNewLeaf ? "split" : false).openFile(file);
      }
    };

    if (plugin.settings.shouldConfirmBeforeCreate) {
      new ConfirmCreateModal(plugin.app, notePath, "周记", doCreate).open();
    } else {
      doCreate();
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div
  class="mix-calendar-weeknum"
  class:has-note={hasWeeklyNote}
  on:click={handleClick}
  on:pointerover={handlePointerOver}
  role="button"
  tabindex="0"
  title={tooltip}
>
  {#if weekNum !== null}
    <span class="weeknum-label">W{weekNum}</span>
  {/if}

  {#if showCount}
    <span
      class="weeknum-task-count"
      class:complete={isComplete}
      class:incomplete={!isComplete}
    >
      {stats ? stats.completed : 0}/{stats ? stats.total : 0}
    </span>
  {:else if hasWeeklyNote}
    <span class="mix-calendar-dot weeknum-dot"></span>
  {/if}
</div>
