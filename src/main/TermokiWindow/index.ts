import { BrowserWindow } from "electron";
import createWindow from "../createWindow";
import ShellProcess from "../pty/ShellProcess";
import App from "../App";

class TermokiWindow {
  static idPointer = 1;
  id = TermokiWindow.idPointer++;
  app: App;
  window: BrowserWindow;
  shellProcesses: ShellProcess[] = [];

  constructor(app: App) {
    this.app = app;
    this.window = createWindow();
    this.window.webContents.postMessage("id", this.id);
    this.registerHandlers();
  }

  private resize() {
    this.window.webContents.send("term:resize");
  }

  private registerHandlers() {
    this.window.on("resized", this.resize.bind(this));

    this.window.on("maximize", this.resize.bind(this));

    this.window.on("unmaximize", this.resize.bind(this));

    this.window.on("close", () => {
      this.dispose();
    });
  }

  private dispose() {
    console.log("disposing TermokiWindow: ", this.id);
    this.shellProcesses.forEach((shell) => shell.dispose());
    this.app.removeWindow(this.id);
  }

  getProcessById(id: number) {
    return this.shellProcesses.find((process) => process.id === id);
  }

  disposeProcessWithId(id: number) {
    const ptyProcess = this.getProcessById(id);

    try {
      ptyProcess?.dispose();
    } catch (error) {
      console.error(error);
    }

    this.shellProcesses = this.shellProcesses.filter(
      (process) => process.id !== id,
    );
  }
}

export default TermokiWindow;
