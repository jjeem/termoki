import { IpcRendererEvent } from "electron";
import { vi } from "vitest";

let idIndex = 1;

export const apiMock: Window["api"] = {
  getAvailableShells: vi.fn(async () => [{ label: "sh", path: "sh.exe" }]),
  platform: vi.fn(async () => "win32"),
  initPtyProcess: vi.fn(async () => idIndex++),
  invoke: vi.fn((id: number, data: string | Uint8Array) =>
    console.log("api.invoke: ", data),
  ),
  resizePty: vi.fn((id: number, data: { cols: number; rows: number }) => data),
  killPty: vi.fn(async (id: number) => true),
  onResize: vi.fn((callback: (e: IpcRendererEvent) => void) => null),
  onResponse: vi.fn(
    (
      id: number,
      // biome-ignore lint/suspicious/noExplicitAny: TODO
      callback: (...args: any[]) => void,
    ) => callback(undefined, "Hello World"),
  ),
  onPtyExit: vi.fn(
    (
      id: number,
      // biome-ignore lint/suspicious/noExplicitAny: TODO
      callback: (...args: any[]) => void,
    ) => callback(true),
  ),
};
