import { ItemView, WorkspaceLeaf } from "obsidian";
import { get } from "svelte/store";
import { VIEW_TYPE_MIX_CALENDAR } from "../constants";
import type MixCalendarPlugin from "../main";
import { currentDate, viewMode } from "./stores";

export class CalendarView extends ItemView {
  plugin: MixCalendarPlugin;
  private appComponent: any = null;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: MixCalendarPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_MIX_CALENDAR;
  }

  getDisplayText(): string {
    return "Mix Calendar";
  }

  getIcon(): string {
    return "calendar-days";
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("mix-calendar-view-container");

    // Apply custom CSS classes from settings
    this.applyCustomCssClasses(container);

    // Make container focusable so keyboard events reach it
    container.tabIndex = 0;
    this.keydownHandler = (e: KeyboardEvent) => this.handleKeyDown(e);
    container.addEventListener("keydown", this.keydownHandler);

    // Dynamically import Svelte App component
    const { default: App } = await import("./App.svelte");
    this.appComponent = new App({
      target: container,
      props: {
        plugin: this.plugin,
      },
    });

    // Auto-focus the container so keyboard nav works immediately
    // (deferred so Svelte has finished rendering)
    requestAnimationFrame(() => container.focus());
  }

  async onClose(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    if (this.keydownHandler) {
      container.removeEventListener("keydown", this.keydownHandler);
      this.keydownHandler = null;
    }
    if (this.appComponent) {
      this.appComponent.$destroy();
      this.appComponent = null;
    }
  }

  // ── Custom CSS class injection ──────────────────────────────

  private applyCustomCssClasses(container: HTMLElement): void {
    const raw = this.plugin.settings.customCssClasses ?? "";
    const classes = raw.split(/\s+/).filter(Boolean);
    for (const cls of classes) {
      container.addClass(cls);
    }
  }

  // ── Keyboard navigation ─────────────────────────────────────
  // Left / Right → prev / next month (or year in year view)
  // t / T        → jump to today

  private handleKeyDown(e: KeyboardEvent): void {
    // Skip if the user is typing in an input element
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    const mode = get(viewMode);

    switch (e.key) {
      case "ArrowLeft":
        if (mode === "month") {
          currentDate.update((d) => d.clone().subtract(1, "month"));
        } else {
          currentDate.update((d) => d.clone().subtract(1, "year"));
        }
        e.preventDefault();
        break;

      case "ArrowRight":
        if (mode === "month") {
          currentDate.update((d) => d.clone().add(1, "month"));
        } else {
          currentDate.update((d) => d.clone().add(1, "year"));
        }
        e.preventDefault();
        break;

      case "ArrowUp":
        // In both modes, go back one period
        if (mode === "month") {
          currentDate.update((d) => d.clone().subtract(1, "month"));
        } else {
          currentDate.update((d) => d.clone().subtract(1, "year"));
        }
        e.preventDefault();
        break;

      case "ArrowDown":
        if (mode === "month") {
          currentDate.update((d) => d.clone().add(1, "month"));
        } else {
          currentDate.update((d) => d.clone().add(1, "year"));
        }
        e.preventDefault();
        break;

      case "t":
      case "T":
        currentDate.set(window.moment());
        e.preventDefault();
        break;

      default:
        break;
    }
  }
}
