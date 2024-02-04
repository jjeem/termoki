import {
  ipcMain,
  ipcRenderer,
  type BrowserWindow,
  type IpcMainInvokeEvent,
  type IpcRendererEvent,
} from "electron";

type Shell = {
  label: string;
  path: string;
};

type ResizeData = {
  cols: number;
  rows: number;
};

type ExitEvent = {
  exitCode: number;
  signal?: number | undefined;
};

export type RendererToMainIpcChannels = {
  "window:create": () => Promise<boolean>;
  "term:init": (windowId: number, shell?: string) => Promise<number>;
  "term:data": (windowId: number, termId: number, data: string) => void;
  "pty:kill": (windowId: number, termId: number) => boolean;
  "pty:resize": (windowId: number, termId: number, data: ResizeData) => void;
  "shell:list": () => Promise<Shell[]>;
  "os:platform": () => string;
};

export const createIPCMainHandler = <T extends keyof RendererToMainIpcChannels>(
  channel: T,
  callback: (
    _event: IpcMainInvokeEvent,
    ...args: Parameters<RendererToMainIpcChannels[T]>
  ) => ReturnType<RendererToMainIpcChannels[T]>,
) => {
  // @ts-ignore
  ipcMain.handle(channel, callback);
};

export const inovkeIPCMainHandler = <T extends keyof RendererToMainIpcChannels>(
  channel: T,
) => {
  return (...args: Parameters<RendererToMainIpcChannels[T]>) =>
    ipcRenderer.invoke(channel, ...args) as ReturnType<
      RendererToMainIpcChannels[T]
    >;
};

/* 
  TODO: implment data flow control to avoid these dynamic channels and simplify usage.
        maybe this is not needed and it can work fine with one channel. hmm?
*/
export type MainToRendererIpcChannels = {
  "term:resize": [];
} & {
  [key in `term:response:${number}`]: [string];
} & {
  [key in `term:exit:${number}`]: [ExitEvent];
};

export const createIPCRendererHandler = <
  T extends keyof MainToRendererIpcChannels,
>(
  channel: T,
) => {
  return (
    callback: (
      _event: IpcRendererEvent,
      ...args: MainToRendererIpcChannels[T]
    ) => void,
    // @ts-ignore
  ) => ipcRenderer.on(channel, callback);
};

export const invokeIPCRendererHandler = <
  T extends keyof MainToRendererIpcChannels,
>(
  channel: T,
  window: BrowserWindow,
  ...args: MainToRendererIpcChannels[T]
) => {
  window.webContents.send(channel, ...args);
};
