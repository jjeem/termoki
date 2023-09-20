import { BrowserWindow } from "electron";
import { IPty, IPtyForkOptions, IWindowsPtyForkOptions, spawn } from "node-pty";

const defaultOptions = {
  name: "xterm-color",
  cols: 80,
  rows: 30,
  env: process.env,
  cwd: process.env.HOME,
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
  private disposals: (() => void)[] = [];

  constructor(
    window: BrowserWindow,
    shell: string,
    args: string | string[] = [],
    options: IPtyForkOptions | IWindowsPtyForkOptions = defaultOptions,
  ) {
    this.window = window;
    this.shell = spawn(shell, args, options);
    this.subscribeToEvents();
  }

  subscribeToEvents() {
    const { dispose: dataListenerDispose } = this.shell.onData((data) => {
      this.window.webContents.send(`term:response:${this.id}`, data);
    });

    const { dispose: exitListenerDispose } = this.shell.onExit((e) => {
      this.window.webContents.send(`term:exit:${this.id}`, e);
    });

    this.disposals.push(dataListenerDispose, exitListenerDispose);
  }

  dispose() {
    this.disposals.forEach((dispose) => dispose());
    this.shell.kill();
  }
}

export default ShellProcess;
