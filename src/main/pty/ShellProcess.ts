import { BrowserWindow } from "electron";
import {
  spawn,
  type IPty,
  type IPtyForkOptions,
  type IWindowsPtyForkOptions,
} from "node-pty";
import { invokeIPCRendererHandler } from "../../lib/ipc";

type PtySpwanOptions = IPtyForkOptions | IWindowsPtyForkOptions;

const defaultOptions: PtySpwanOptions = {
  name: "xterm-256color",
  cols: 80,
  rows: 30,
  env: process.env,
  // HOME path not necessarily exists on windows in prodcution
  cwd: process.env.HOME || `${process.env.HOMEDRIVE}${process.env.HOMEPATH}`,
};

class ShellProcess {
  static idPointer = 1;
  id = ShellProcess.idPointer++;
  shell: IPty;
  private readonly window: BrowserWindow;
  private disposers: (() => void)[] = [];

  constructor(
    window: BrowserWindow,
    shell: string,
    args: string | string[] = [],
    options: PtySpwanOptions = defaultOptions,
  ) {
    this.window = window;
    try {
      this.shell = spawn(shell, args, {
        ...defaultOptions,
        ...options,
      });

      this.subscribeToEvents();
    } catch (error) {
      console.error("failed to spawn a pty");
      throw error;
    }
  }

  private subscribeToEvents() {
    const { dispose: dataListenerDispose } = this.shell.onData((data) => {
      invokeIPCRendererHandler(`term:response:${this.id}`, this.window, data);
    });

    const { dispose: exitListenerDispose } = this.shell.onExit((e) => {
      invokeIPCRendererHandler(`term:exit:${this.id}`, this.window, e);
    });

    this.disposers.push(dataListenerDispose, exitListenerDispose);
  }

  dispose() {
    this.disposers.forEach((dispose) => dispose());
    this.shell.kill();
  }
}

export default ShellProcess;
