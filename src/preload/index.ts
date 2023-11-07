import { contextBridge, ipcRenderer } from "electron";

ipcRenderer.once("id", (_event, id: number) => {
  registerAPI(id);
  console.log("registered API with windowID: ", id);
});

const registerAPI = (windowId: number) => {
  // Custom APIs for renderer
  const api: typeof window.api = {
    getAvailableShells: () => ipcRenderer.invoke("shell:list"),
    platform: () => ipcRenderer.invoke("os:platform"),
    invoke: (termId, data) =>
      ipcRenderer.invoke("term:data", windowId, termId, data),
    initPtyProcess: (shell) => ipcRenderer.invoke("term:init", windowId, shell),
    resizePty: (termId, data) =>
      ipcRenderer.invoke("pty:resize", windowId, termId, data),
    killPty: (termId) => ipcRenderer.invoke("pty:kill", windowId, termId),
    onResize: (callback) => ipcRenderer.on("term:resize", callback),
    onResponse: (id, callback) =>
      ipcRenderer.on(`term:response:${id}`, callback),
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
};
