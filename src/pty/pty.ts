import { spawn, IPtyForkOptions, IWindowsPtyForkOptions, IPty } from 'node-pty';

const initPtyProcess: (
  shell?: string,
  args?: string | string[],
  options?: IPtyForkOptions | IWindowsPtyForkOptions
) => IPty = (
  shell = 'sh.exe',
  args = [],
  options = {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME
    // env: process.env
  }
) => {
  const ptyProcess = spawn(shell, args, options);

  return ptyProcess;
};

export default initPtyProcess;
