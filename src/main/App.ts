import { BrowserWindow } from "electron";
import createWindow from "./createWindow";
import ShellProcess from "./pty/ShellProcess";
import { createIPCMainHandler } from "./ipc";
import { detectAvailableShells } from "detect-shell";

const registerIPCMainhandlers = (app: App) => {
  createIPCMainHandler("shell:list", async () => await detectAvailableShells());

  createIPCMainHandler("pty:resize", (_event, id, data) => {
    const { cols, rows } = data;
    app.getProcessById(id)?.shell.resize(cols, rows);
  });

  createIPCMainHandler("pty:kill", (_event, id) => {
    app.disposeProcessWithId(id);
    return true;
  });

  createIPCMainHandler("term:data", (_event, id, data) => {
    app.getProcessById(id)?.shell.write(data);
  });

  createIPCMainHandler("term:init", async (_event, shell) => {
    let shellPath = shell;
    if (!shellPath) {
      await detectAvailableShells().then((list) => {
        shellPath = list[0].path;
      });
    }

    console.log("shell name or path: ", shellPath);
    if (!shellPath) {
      throw new Error("No shell found, 'shellPath' value is undefined");
    }

    const shellProcess = new ShellProcess(app.window, shellPath);

    app.shellProcess.push(shellProcess);

    return shellProcess.id;
  });
};

export default class App {
  window: BrowserWindow;
  shellProcess: ShellProcess[] = [];
  constructor() {
    this.window = createWindow();
    registerIPCMainhandlers(this);
  }

  getProcessById = (id: number) => this.shellProcess.find((p) => p.id === id);

  disposeProcessWithId = (id: number) => {
    const ptyProcess = this.getProcessById(id);
    if (ptyProcess) {
      try {
        ptyProcess.dispose();
      } catch (err) {
        console.log(err);
      }
    }
    this.shellProcess = this.shellProcess.filter((p) => p.id !== id);
  };
}
