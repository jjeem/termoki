import { contextBridge, ipcRenderer } from "electron";

// Custom APIs for renderer
const api: typeof window.api = {
  invoke: (uid, data) => ipcRenderer.invoke("term:data", uid, data),
  initPtyProcess: (shell) => ipcRenderer.invoke("term:init", shell),
  getAvailableShells: () => ipcRenderer.invoke("shell:list"),
  resizePty: (id, data) => ipcRenderer.invoke("pty:resize", id, data),
  killPty: (id) => ipcRenderer.invoke("pty:kill", id),
  onResize: (callback) => ipcRenderer.on("term:resize", callback),
  onResponse: (id, callback) => ipcRenderer.on(`term:response:${id}`, callback),
  onPtyExit: (id, callback) => ipcRenderer.on(`term:exit:${id}`, callback),
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.api = api;
}
