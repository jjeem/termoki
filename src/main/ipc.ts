import { type IpcMainInvokeEvent, ipcMain } from "electron";

type Shell = {
  label: string;
  path: string;
};

type ResizeData = {
  cols: number;
  rows: number;
};

type RendererToMainIpcChannels = {
  "term:init": (_event: IpcMainInvokeEvent, shell?: string) => Promise<number>;
  "term:data": (_event: IpcMainInvokeEvent, id: number, data: string) => void;
  "pty:kill": (_event: IpcMainInvokeEvent, id: number) => boolean;
  "pty:resize": (
    _event: IpcMainInvokeEvent,
    id: number,
    data: ResizeData,
  ) => void;
  "shell:list": () => Promise<Shell[]>;
};

type MainToRendererIpcChannels<id extends number> =
  | "term:resize"
  | `term:response:${id}`
  | `term:exit:${id}`;

export const createIPCMainHandler = <T extends keyof RendererToMainIpcChannels>(
  channel: T,
  callback: RendererToMainIpcChannels[T],
) => {
  ipcMain.handle(channel, callback);
};
