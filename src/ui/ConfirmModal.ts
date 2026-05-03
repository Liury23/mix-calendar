import { App, Modal } from "obsidian";

export class ConfirmCreateModal extends Modal {
  private notePath: string;
  private noteType: string;
  private onConfirm: () => void;

  constructor(
    app: App,
    notePath: string,
    noteType: string,
    onConfirm: () => void
  ) {
    super(app);
    this.notePath = notePath;
    this.noteType = noteType;
    this.onConfirm = onConfirm;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.addClass("mix-calendar-confirm-modal");

    contentEl.createEl("h3", { text: "创建笔记" });
    contentEl.createEl("p", {
      text: `确认创建${this.noteType}：`,
    });
    contentEl.createEl("div", {
      cls: "path-preview",
      text: this.notePath,
    });

    const buttonRow = contentEl.createEl("div", { cls: "button-row" });

    const cancelBtn = buttonRow.createEl("button", { text: "取消" });
    cancelBtn.onclick = () => this.close();

    const confirmBtn = buttonRow.createEl("button", {
      text: "创建",
      cls: "mod-cta",
    });
    confirmBtn.onclick = () => {
      this.onConfirm();
      this.close();
    };
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
