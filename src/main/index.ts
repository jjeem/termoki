import { BrowserWindow, app as electronApp } from "electron";
import App from "./App";

/**
 * handle windows.squirrel events
 * ref:[https://www.electronforge.io/import-existing-project#adding-squirrel.windows-boilerplate]
 *     [https://github.com/electron-archive/grunt-electron-installer#handling-squirrel-events]
 */
if (require("electron-squirrel-startup")) {
  electronApp.quit();
}

const app = new App();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electronApp.whenReady().then(() => {
  electronApp.setAppUserModelId("com.termoki");

  app.createTermokiWindow();
  // app.createTermokiWindow();

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  electronApp.on("browser-window-created", (_, window) => {
    // 	TODO:
  });

  // TODO: move or remove (or maybe keep?)
  electronApp.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      app.createTermokiWindow();
    }
  });
});
