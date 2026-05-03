<script lang="ts">
  import { currentDate, viewMode, settings, i18n, uiLocale } from "./stores";
  import { getGanZhiYearLabel } from "../lunar/converter";

  let internalDate = $currentDate ? $currentDate.clone() : window.moment();

  $: {
    if ($currentDate) {
      internalDate = $currentDate.clone();
    }
  }

  $: titleText = $viewMode === "month"
    ? internalDate.format($i18n.monthFormat)
    : internalDate.format($i18n.yearFormat);

  $: ganZhiLabel = $settings.showLunarInfo
    ? getGanZhiYearLabel(internalDate.year(), internalDate.month() + 1, 1)
    : "";

  $: isZh = $uiLocale === "zh";

  $: prevTitle = $viewMode === "month"
    ? (isZh ? "上一个月" : "Previous Month")
    : (isZh ? "上一年" : "Previous Year");

  $: nextTitle = $viewMode === "month"
    ? (isZh ? "下一个月" : "Next Month")
    : (isZh ? "下一年" : "Next Year");

  $: todayTitle = isZh ? "回到今天" : "Go to Today";

  function goPrev() {
    if ($viewMode === "month") {
      $currentDate = $currentDate.clone().subtract(1, "month");
    } else {
      $currentDate = $currentDate.clone().subtract(1, "year");
    }
  }

  function goNext() {
    if ($viewMode === "month") {
      $currentDate = $currentDate.clone().add(1, "month");
    } else {
      $currentDate = $currentDate.clone().add(1, "year");
    }
  }

  function goToday() {
    $currentDate = window.moment();
  }

  function setViewMode(mode: "month" | "year") {
    $viewMode = mode;
  }
</script>

<div class="mix-calendar-header">
  <div class="mix-calendar-nav">
    <button class="mix-calendar-nav-btn" on:click={goPrev} title={prevTitle} aria-label="Previous">
      ◀
    </button>
  </div>

  <div class="mix-calendar-center">
    <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
    <span class="mix-calendar-title" on:click={goToday} role="button" tabindex="0">
      {titleText}
    </span>

    <button class="mix-calendar-today-btn" on:click={goToday} title={todayTitle}>
      {$i18n.today}
    </button>
  </div>

  <div class="mix-calendar-nav">
    <div class="mix-calendar-view-toggle">
      <button
        class="mix-calendar-view-btn"
        class:active={$viewMode === "month"}
        on:click={() => setViewMode("month")}
      >
        {$i18n.monthLabel}
      </button>
      <button
        class="mix-calendar-view-btn"
        class:active={$viewMode === "year"}
        on:click={() => setViewMode("year")}
      >
        {$i18n.yearLabel}
      </button>
    </div>

    <button class="mix-calendar-nav-btn" on:click={goNext} title={nextTitle} aria-label="Next">
      ▶
    </button>
  </div>
</div>

{#if ganZhiLabel}
<div class="mix-calendar-chinese-label">
  {ganZhiLabel}
</div>
{/if}
