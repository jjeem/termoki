import { app as electronApp } from "electron";
import { detectAvailableShells } from "@jjeem/detect-shell";
import TermokiWindow from "./TermokiWindow";
import ShellProcess from "./pty/ShellProcess";
import { createIPCMainHandler } from "../shared/ipc";

const registerIPCMainhandlers = (app: App) => {
  createIPCMainHandler("shell:list", async () => await detectAvailableShells());

  createIPCMainHandler("os:platform", () => process.platform);

  createIPCMainHandler("window:create", async () => {
    app.createTermokiWindow();
    return true;
  });

  createIPCMainHandler("pty:kill", (_event, windowId, termId) => {
    const window = app.getWindowById(windowId);
    window?.disposeProcessWithId(termId);
    return true;
  });

  createIPCMainHandler("term:data", (_event, windowId, termId, data) => {
    const window = app.getWindowById(windowId);
    window?.getProcessById(termId)?.shell.write(data);
  });

  createIPCMainHandler("pty:resize", (_event, windowId, termId, data) => {
    const { cols, rows } = data;
    const window = app.getWindowById(windowId);
    window?.getProcessById(termId)?.shell.resize(cols, rows);
  });

  createIPCMainHandler("term:init", async (_event, windowId, shell) => {
    const termokiWindow = app.getWindowById(windowId);
    let shellPath = shell;

    if (!termokiWindow) {
      throw new Error("Cannot create terminal for none existing window");
    }

    if (!shellPath) {
      await detectAvailableShells().then((list) => {
        shellPath =
          list.find((shell) => /(git)/gi.test(shell.label))?.path ||
          list[0].path;
      });
    }

    console.log("shell name or path: ", shellPath);
    if (!shellPath) {
      throw new Error("No shells found");
    }

    const shellProcess = new ShellProcess(termokiWindow.window, shellPath);

    termokiWindow.shellProcesses.push(shellProcess);

    return shellProcess.id;
  });
};

class App {
  termokiWindows: TermokiWindow[] = [];

  constructor() {
    registerIPCMainhandlers(this);
  }

  createTermokiWindow() {
    const window = new TermokiWindow(this);
    this.termokiWindows.push(window);
  }

  getWindowById(id: number) {
    return this.termokiWindows.find((window) => window.id === id);
  }

  removeWindow(id: number) {
    this.termokiWindows = this.termokiWindows.filter(
      (window) => window.id !== id,
    );
    console.log("removed TermokiWindow with id: ", id);
    console.log("remaining windows: ", this.termokiWindows.length);
  }

  private shouldAppExit() {
    console.log("checking if app should exit");
    if (!this.termokiWindows.length) {
      if (process.platform !== "darwin") {
        electronApp.quit();
        console.log("app exiting");
      }
    }
  }
}

export default App;
