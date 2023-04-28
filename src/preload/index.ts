import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// Custom APIs for renderer
const api = {
  invoke: (data: string) => ipcRenderer.invoke('term:data', data),
  initPtyProcess: (data: string) => ipcRenderer.invoke('term:init', data),
  resizePty: (data) => ipcRenderer.invoke('pty:resize', data),
  onResize: (callback) => ipcRenderer.on('term:resize', callback),
  onResponse: (callback) => ipcRenderer.on('term:response', callback)
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
