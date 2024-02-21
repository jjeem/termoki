import { IpcRendererEvent } from "electron";
import { vi } from "vitest";
import { Settings } from "../../main/Store/settings";
import defaultSettings from "../../defaults/settings.json";

let idIndex = 1;

export const apiMock: Window["api"] = {
  getAvailableShells: vi.fn(async () => [{ label: "sh", path: "sh.exe" }]),
  platform: vi.fn(async () => "win32"),
  initPtyProcess: vi.fn(async () => idIndex++),
  invoke: vi.fn(
    async (windowId: number, id: number, data: string | Uint8Array) =>
      console.log("api.invoke: ", data),
  ),
  resizePty: vi.fn(
    async (
      windowId: number,
      id: number,
      data: { cols: number; rows: number },
    ) => {},
  ),
  killPty: vi.fn(async (id: number) => true),
  getSettings: vi.fn(async () => defaultSettings),
  getSettingsByKey: vi.fn(
    async <T extends keyof Settings>(key: T) => defaultSettings[key],
  ),
  openSettings: vi.fn(async () => ""),
  resetSettings: vi.fn(),

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
  onSettingsChange: vi.fn(),
};
