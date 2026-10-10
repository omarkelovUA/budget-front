// jsdom has no modal dialogs: opening just sets [open], and closing fires 'close'
// as a later task, like a browser does.
export function stubDialogs() {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    if (!this.open) return;
    this.open = false;
    setTimeout(() => this.dispatchEvent(new Event('close')));
  };
}

// Esc: the browser closes the dialog itself.
export function pressEscape(dialog: HTMLDialogElement): Promise<void> {
  dialog.close();
  return new Promise((resolve) => setTimeout(resolve));
}
