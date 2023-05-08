import { ElectronAPI } from '@electron-toolkit/preload';

declare global {
  interface Window {
    electron: ElectronAPI;
    // api: unknown;
    api: {
      invoke: (uid: string | undefined, data: string | Uint8Array) => Promise;
      initPtyProcess: (uid: string | undefined) => Promise;
      resizePty: (data: { uid: stirng; cols: number; rows: number }) => void;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onResponse: (callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => void;
      onResize: (callback: (event: Electron.IpcRendererEvent) => void) => void;
    };
  }
}
