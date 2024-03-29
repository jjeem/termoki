import { app, dialog, shell } from "electron";
import {
  readFileSync,
  existsSync,
  writeFile,
  watch as fs_watch,
} from "node:fs";
import App from "../App";
import { createIPCMainHandler, invokeIPCRendererHandler } from "../../lib/ipc";
import defaultSettings from "../../defaults/settings.json";
import { isDevEnvironment } from "../../lib/isDev";

export type Settings = typeof defaultSettings;

// in development, the root dir of the project is returned so we put it inside the _ignored folder
const SETTINGS_FILE_PATH = isDevEnvironment()
  ? `${app.getAppPath()}/_ignored/settings.json`
  : `${app.getAppPath()}/settings.json`;

export type SettingsRendererChannels = {
  settings(): Promise<Settings>;
  "settings:record"<T extends keyof Settings>(key: T): Promise<Settings[T]>;
  "settings:reset": () => Promise<void>;
  "openfile:settings": () => Promise<string>; // returns error string if exists
};

export type SettingsMainChannels = {
  "settings:updated": [Settings];
};

class SettingsStore {
  settings: Settings;

  constructor() {
    this.settings = this.readFromDataFile();

    createIPCMainHandler("settings", async () => this.get());
    createIPCMainHandler("settings:record", async (_, key) => this.get(key));
    createIPCMainHandler("settings:reset", async () => {
      const res = await dialog.showMessageBox({
        type: "warning",
        message:
          "You are about to replace your current settings with the defaults.\nYou cannot undo this action, are you sure?",
        buttons: ["cancel", "yes"],
        defaultId: 0,
      });
      if (res.response === 1) {
        this.resetSettings();
      }
    });
    createIPCMainHandler("openfile:settings", async () =>
      shell.openPath(SETTINGS_FILE_PATH),
    );

    this.watch();
  }

  private readFromDataFile() {
    try {
      if (existsSync(SETTINGS_FILE_PATH)) {
        const res = readFileSync(SETTINGS_FILE_PATH, {
          encoding: "utf-8",
        });
        const settings: Partial<Settings> = JSON.parse(res);

        return { ...defaultSettings, ...settings };
      }

      this.writeToSettingsFile(defaultSettings);

      return defaultSettings;
    } catch (error) {
      console.error(error);
      return defaultSettings;
    }
  }

  private watch() {
    fs_watch(SETTINGS_FILE_PATH, () => {
      console.log("settings file changed, emitting updates now...");
      this.settings = this.readFromDataFile();
      this.emitUpdate(this.settings);
    });
  }

  private writeToSettingsFile(value: Settings, callback?: () => void) {
    this.settings = value;
    try {
      writeFile(
        SETTINGS_FILE_PATH,
        JSON.stringify(value, null, 2),
        "utf-8",
        (error) => {
          if (error) {
            throw error;
          }

          callback?.();
        },
      );
    } catch (error) {
      console.error("Error during updating settings file, ", error);
    }
  }

  private emitUpdate(updatedSettings: Settings) {
    try {
      App.getApp().termokiWindows.forEach((termokiWin) => {
        invokeIPCRendererHandler(
          "settings:updated",
          termokiWin.window,
          updatedSettings,
        );
      });
    } catch (error) {
      console.error("Error during emitting updated settings, ", error);
    }
  }

  resetSettings() {
    this.writeToSettingsFile(defaultSettings, () =>
      this.emitUpdate(defaultSettings),
    );
  }

  get(): Settings;
  get<T extends keyof Settings>(key: T): Settings[T];
  get(key?: keyof Settings) {
    if (key) {
      return this.settings[key];
    }

    return this.settings;
  }

  set<T extends keyof Settings>(changed: { key: T; value: Settings[T] }[]) {
    // TODO: save to file and emit update action after implementing reactive state
    const updatedRecords: Partial<Settings> = {};
    for (const record of changed) {
      updatedRecords[record.key] = record.value;

      console.table({
        ...this.settings,
        ...updatedRecords,
      });
    }
  }
}

export default SettingsStore;
