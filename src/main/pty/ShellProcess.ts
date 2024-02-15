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
  /* 
		TODO: conpty causes electron to freeze when killing shell sometimes
		so "false" for now
	*/
  useConpty: false,
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
    this.shell = spawn(shell, args, options);

    this.subscribeToEvents();
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
