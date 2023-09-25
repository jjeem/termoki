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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electronApp.whenReady().then(() => {
  let termokiApp = new App();
  electronApp.setAppUserModelId("com.termoki");

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  electronApp.on("browser-window-created", (_, window) => {
    // 	TODO:
  });

  termokiApp.window.on("resized", () => {
    termokiApp.window.webContents.send("term:resize");
  });

  electronApp.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      termokiApp = new App();
    }
  });

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  electronApp.on("window-all-closed", () => {
    termokiApp.shellProcess.forEach((p) => {
      p.dispose();
    });

    if (process.platform !== "darwin") {
      electronApp.quit();
    }
  });
});
