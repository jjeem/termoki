import { contextBridge, ipcRenderer } from "electron";
import { inovkeIPCMainHandler, createIPCRendererHandler } from "../shared/ipc";

ipcRenderer.once("id", (_event, id: number) => {
  registerAPI(id);
  console.log("registered API with windowID: ", id);
});

export const registerAPI = (windowId: number) => {
  // Custom APIs for renderer
  const api = {
    getAvailableShells: inovkeIPCMainHandler("shell:list"),
    platform: inovkeIPCMainHandler("os:platform"),
    invoke: inovkeIPCMainHandler("term:data"),
    initPtyProcess: inovkeIPCMainHandler("term:init"),
    resizePty: inovkeIPCMainHandler("pty:resize"),
    killPty: inovkeIPCMainHandler("pty:kill"),

    onResize: createIPCRendererHandler("term:resize"),
    onResponse: (
      id: number,
      callback: Parameters<
        ReturnType<
          typeof createIPCRendererHandler<`term:response:${typeof id}`>
        >
      >[0],
    ) => createIPCRendererHandler(`term:response:${id}`)(callback),

    onPtyExit: (
      id: number,
      callback: Parameters<
        ReturnType<typeof createIPCRendererHandler<`term:exit:${typeof id}`>>
      >[0],
    ) => createIPCRendererHandler(`term:exit:${id}`)(callback),
  };

  // Use `contextBridge` APIs to expose Electron APIs to
  // renderer only if context isolation is enabled, otherwise
  // just add to the DOM global.
  if (process.contextIsolated) {
    try {
      contextBridge.exposeInMainWorld("api", api);
      contextBridge.exposeInMainWorld("id", windowId);
    } catch (error) {
      console.error(error);
    }
  } else {
    window.api = api;
    window.id = windowId;
  }

  return api;
};
