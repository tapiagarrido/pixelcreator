import { contextBridge } from 'electron';

// El renderer no necesita APIs de Node/Electron por ahora.
const api = {};

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('api', api);
} else {
  window.api = api;
}
