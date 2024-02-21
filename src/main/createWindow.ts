import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  shell,
} from "electron";
import { join } from "path";
// @ts-ignore
import logo from "../../media/logo.png";

const HIDE_WINDOW_FRAME =
  process.platform === "darwin" || process.platform === "win32";

// TODO: make it configurable through settings
const defaultWindowOptions: BrowserWindowConstructorOptions = {
  icon: logo,
  width: 800,
  height: 500,
  frame: !HIDE_WINDOW_FRAME,
  titleBarStyle: HIDE_WINDOW_FRAME ? "hidden" : "default",
  titleBarOverlay: {
    color: "#01162700", // 0 opacity until it's configurable
    symbolColor: "#e8e5e5",
    height: 30,
  },
  webPreferences: {
    preload: join(__dirname, "./preload.js"),
  },
};

function createWindow(options?: BrowserWindowConstructorOptions) {
  const window = new BrowserWindow({
    ...defaultWindowOptions,
    ...options,
  });

  window.on("ready-to-show", () => {
    window.show();
  });

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);

    return {
      action: "deny",
    };
  });

  // Load the remote URL for development or the local html file for production.
  if (process.env.VITE_DEV_SERVER_URL) {
    window.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // Load your file
    window.loadFile("dist/index.html");
  }

  return window;
}

export default createWindow;
