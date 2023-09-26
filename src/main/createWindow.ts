import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  shell,
} from "electron";
import { join } from "path";
// @ts-ignore
import logo from "../../media/logo.png";

const defaultWindowOptions: BrowserWindowConstructorOptions = {
  icon: logo,
  width: 850,
  height: 550,
  frame: false,
  titleBarStyle: "hidden",
  titleBarOverlay: {
    color: "#011627",
    symbolColor: "#e8e5e5",
    height: 40,
  },
  webPreferences: {
    preload: join(__dirname, "./preload.js"),
  },
};

export default function createWindow(
  options?: BrowserWindowConstructorOptions,
) {
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
