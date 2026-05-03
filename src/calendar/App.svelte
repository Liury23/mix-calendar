<script lang="ts">
  import type MixCalendarPlugin from "../main";
  import Header from "./Header.svelte";
  import MonthView from "./MonthView.svelte";
  import YearView from "./YearView.svelte";
  import { viewMode, settings } from "./stores";

  export let plugin: MixCalendarPlugin;

  $: showMonthView = $viewMode === "month";
  $: taskDotSize = $settings.taskDotSize ?? 9;
  $: linkDotSize = $settings.linkDotSize ?? 5;
</script>

<div
  class="mix-calendar-container"
  style="--mix-task-dot-size: {taskDotSize}px; --mix-link-dot-size: {linkDotSize}px"
>
  <Header />

  {#if showMonthView}
    <MonthView {plugin} />
  {:else}
    <YearView {plugin} />
  {/if}
</div>
