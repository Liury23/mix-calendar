import { App, Menu, TFile } from "obsidian";
import type { Granularity } from "../types";

/**
 * Show a right-click context menu for a periodic note in the calendar view.
 * Provides "Delete Note" and "Reveal in File Explorer" options.
 */
export function showNoteContextMenu(
  event: MouseEvent,
  app: App,
  file: TFile | null,
  granularity: Granularity,
  dateLabel: string
): void {
  if (!file) return;

  const menu = new Menu();

  menu.addItem((item) => {
    item
      .setTitle(`打开${getGranLabel(granularity)}`)
      .setIcon("file-text")
      .onClick(() => {
        app.workspace.getLeaf(false).openFile(file);
      });
  });

  menu.addItem((item) => {
    item
      .setTitle("在文件浏览器中显示")
      .setIcon("folder")
      .onClick(() => {
        // Reveal in file explorer
        const fileExplorer =
          (app as any).internalPlugins?.getPluginById?.("file-explorer");
        if (fileExplorer?.revealInFolder) {
          fileExplorer.revealInFolder(file);
        }
      });
  });

  menu.addSeparator();

  menu.addItem((item) => {
    item
      .setTitle("删除笔记")
      .setIcon("trash")
      .onClick(async () => {
        await app.vault.trash(file, true);
      });
  });

  menu.showAtMouseEvent(event);
}

function getGranLabel(g: Granularity): string {
  const map: Record<string, string> = {
    daily: "日记",
    weekly: "周记",
    monthly: "月记",
    quarterly: "季记",
    yearly: "年记",
  };
  return map[g] || "笔记";
}
