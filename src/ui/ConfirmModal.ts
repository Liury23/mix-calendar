import { App, Modal, Setting } from "obsidian";

export class ConfirmCreateModal extends Modal {
  private notePath: string;
  private noteType: string;
  private onConfirm: () => unknown;

  constructor(
    app: App,
    notePath: string,
    noteType: string,
    onConfirm: () => unknown
  ) {
    super(app);
    this.notePath = notePath;
    this.noteType = noteType;
    this.onConfirm = onConfirm;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.addClass("mix-calendar-confirm-modal");

    new Setting(contentEl).setName("创建笔记").setHeading();
    contentEl.createEl("p", {
      text: `确认创建${this.noteType}：`,
    });
    contentEl.createDiv({
      cls: "path-preview",
      text: this.notePath,
    });

    const buttonRow = contentEl.createDiv({ cls: "button-row" });

    const cancelBtn = buttonRow.createEl("button", { text: "取消" });
    cancelBtn.onclick = () => this.close();

    const confirmBtn = buttonRow.createEl("button", {
      text: "创建",
      cls: "mod-cta",
    });
    confirmBtn.onclick = () => {
      void Promise.resolve(this.onConfirm()).catch((err: unknown) => {
        console.warn("[Mix Calendar] Note creation failed:", err);
      });
      this.close();
    };
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
