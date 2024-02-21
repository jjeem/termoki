import { clipboard, dialog, app as electronApp } from "electron";
import { detectAvailableShells } from "@jjeem/detect-shell";
import TermokiWindow from "./TermokiWindow";
import ShellProcess from "./pty/ShellProcess";
import { createIPCMainHandler } from "../lib/ipc";
import { Store } from "./Store";

const registerIPCMainhandlers = (app: App) => {
  // call the store here to make sure its handlers are registered
  const store = Store.getStore();

  createIPCMainHandler("shell:list", async () => await detectAvailableShells());

  createIPCMainHandler("os:platform", async () => process.platform);

  createIPCMainHandler("window:create", async () => {
    app.createTermokiWindow();
    return true;
  });

  createIPCMainHandler("pty:kill", async (_event, windowId, termId) => {
    const window = app.getWindowById(windowId);
    window?.disposeProcessWithId(termId);
    return true;
  });

  createIPCMainHandler("term:data", async (_event, windowId, termId, data) => {
    const window = app.getWindowById(windowId);
    window?.getProcessById(termId)?.shell.write(data);
  });

  createIPCMainHandler("pty:resize", async (_event, windowId, termId, data) => {
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
      const defaultShell = store.settings.get("shell");
      if (typeof defaultShell === "string" && !!defaultShell) {
        shellPath = defaultShell;
      } else {
        await detectAvailableShells().then((list) => {
          shellPath =
            list.find((shell) => /(git)/gi.test(shell.label))?.path ||
            list[0].path;
        });
      }
    }

    console.log("shell name or path: ", shellPath);
    if (!shellPath) {
      throw new Error("No shells found");
    }

    const args: string[] = [];
    const cwd = store.settings.get("shell.cwd");
    try {
      const shellProcess = new ShellProcess(
        termokiWindow.window,
        shellPath,
        args,
        { cwd },
      );
      termokiWindow.shellProcesses.push(shellProcess);

      return shellProcess.id;
    } catch (error) {
      dialog.showErrorBox(
        "Error",
        `failed to spawn pty with current config, falling back to default config. \nthe config: \n${JSON.stringify(
          {
            args,
            cwd,
          },
          null,
          2,
        )}`,
      );

      const shellProcess = new ShellProcess(termokiWindow.window, shellPath);
      termokiWindow.shellProcesses.push(shellProcess);

      return shellProcess.id;
    }
  });

  createIPCMainHandler("editor:copy", async (_event, text) => {
    clipboard.writeText(text);
  });
};

class App {
  termokiWindows: TermokiWindow[] = [];
  private static app: App | null = null;

  private constructor() {
    registerIPCMainhandlers(this);
  }

  static getApp() {
    if (App.app) {
      return App.app;
    }

    App.app = new App();
    return App.app;
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
