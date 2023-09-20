import { BrowserWindow, app, shell } from "electron";
import { detectAvailableShells } from "detect-shell";
import { join } from "path";
import ShellProcess from "./pty/ShellProcess";
import { createIPCMainHandler } from "./ipc";

/**
 * handle windows.squirrel events
 * ref:[https://www.electronforge.io/import-existing-project#adding-squirrel.windows-boilerplate]
 *     [https://github.com/electron-archive/grunt-electron-installer#handling-squirrel-events]
 */
if (require("electron-squirrel-startup")) {
  app.quit();
}

let processes: ShellProcess[] = [];
const INITIAL_WINDOW_WIDTH = 800;
const INITIAL_WINDOW_HEIGHT = 600;
const TITLE_BAR_CONTROLS_OVERLAY_COLOR = "#011627";
const TITLE_BAR_CONTROLS_SYMBOL_COLOR = "#e8e5e5";
const TITLE_BAR_HEIGHT = 40;

function createWindow() {
  console.log("✨✨✨ creating window ✨✨✨");

  const mainWindow = new BrowserWindow({
    width: INITIAL_WINDOW_WIDTH,
    height: INITIAL_WINDOW_HEIGHT,
    frame: false,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: TITLE_BAR_CONTROLS_OVERLAY_COLOR,
      symbolColor: TITLE_BAR_CONTROLS_SYMBOL_COLOR,
      height: TITLE_BAR_HEIGHT,
    },
    webPreferences: {
      preload: join(__dirname, "./preload.js"),
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return {
      action: "deny",
    };
  });

  // Load the remote URL for development or the local html file for production.
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // Load your file
    mainWindow.loadFile("dist/index.html");
  }

  return mainWindow;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  app.setAppUserModelId("com.termoki");

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on("browser-window-created", (_, window) => {
    // 	TODO:
  });

  const window = createWindow();

  window.on("resized", () => {
    window.webContents.send("term:resize");
  });

  registerIPCMainhandlers(window);

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  processes.forEach((p) => {
    p.dispose();
  });

  if (process.platform !== "darwin") {
    app.quit();
  }
});

const registerIPCMainhandlers = (window: BrowserWindow) => {
  createIPCMainHandler("shell:list", async () => await detectAvailableShells());

  createIPCMainHandler("pty:resize", (_event, id, data) => {
    const { cols, rows } = data;
    getProcessById(id)?.shell.resize(cols, rows);
  });

  createIPCMainHandler("pty:kill", (_event, id) => {
    disposeProcessWithId(id);
    return true;
  });

  createIPCMainHandler("term:data", (_event, id, data) => {
    getProcessById(id)?.shell.write(data);
  });

  createIPCMainHandler("term:init", async (_event, shell) => {
    let shellPath = shell;
    if (!shellPath) {
      await detectAvailableShells().then((list) => {
        shellPath = list[0].path;
      });
    }

    console.log("shell name or path: ", shellPath);
    if (!shellPath) {
      throw new Error("No shell found, 'shellPath' value is undefined");
    }

    const shellProcess = new ShellProcess(window, shellPath);

    processes.push(shellProcess);

    return shellProcess.id;
  });
};

const getProcessById = (id: number) => processes.find((p) => p.id === id);

const disposeProcessWithId = (id: number) => {
  const ptyProcess = getProcessById(id);
  if (ptyProcess) {
    try {
      ptyProcess.dispose();
    } catch (err) {
      console.log(err);
    }
  }
  processes = processes.filter((p) => p.id !== id);
};
