import type { Shell } from "src/ui";

declare global {
  interface Window {
    api: {
      invoke: (id: number, data: string | Uint8Array) => void;
      initPtyProcess: (shell?: string) => Promise<number>;
      getAvailableShells: () => Promise<Shell[]>;
      resizePty: (id: number, data: { cols: number; rows: number }) => void;
      killPty: (id: number) => Promise<boolean>;
      onResize: (callback: (event: Electron.IpcRendererEvent) => void) => void;
      onResponse: (
        id: number,
        // biome-ignore lint/suspicious/noExplicitAny: TODO
        callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void,
      ) => void;
      onPtyExit: (
        id: number,
        // biome-ignore lint/suspicious/noExplicitAny: TODO
        callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void,
      ) => void;
    };
  }
}
