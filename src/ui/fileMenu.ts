import { App, Menu, TFile } from "obsidian";
import type { Granularity } from "../types";

/** Minimal shape of the internal file-explorer plugin used for "reveal in explorer". */
interface FileExplorerPlugin {
  revealInFolder?: (file: TFile) => void;
}

/**
 * Show a right-click context menu for a periodic note in the calendar view.
 * Provides "Delete Note" and "Reveal in File Explorer" options.
 */
export function showNoteContextMenu(
  event: MouseEvent,
  app: App,
  file: TFile | null,
  granularity: Granularity
): void {
  if (!file) return;

  const menu = new Menu();

  menu.addItem((item) => {
    item
      .setTitle(`打开${getGranLabel(granularity)}`)
      .setIcon("file-text")
      .onClick(async () => {
        try {
          await app.workspace.getLeaf(false).openFile(file);
        } catch (err) {
          console.warn("[Mix Calendar] Failed to open note:", err);
        }
      });
  });

  menu.addItem((item) => {
    item
      .setTitle("在文件浏览器中显示")
      .setIcon("folder")
      .onClick(() => {
        // Reveal in file explorer
        const internalPlugins = (app as unknown as {
          internalPlugins?: { getPluginById?: (id: string) => FileExplorerPlugin | null };
        }).internalPlugins;
        const fileExplorer = internalPlugins?.getPluginById?.("file-explorer");
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
        try {
          await app.fileManager.trashFile(file);
        } catch (err) {
          console.warn("[Mix Calendar] Failed to delete note:", err);
        }
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
