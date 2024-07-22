import { contextBridge, ipcRenderer } from 'electron';

const api = {
  applyFilter: (imagePath, filters) => {

    return new Promise((resolve, reject) => {
      ipcRenderer.send('apply-filter', imagePath, filters);
      ipcRenderer.once('filter-applied', (event, outputImagePath) => {
        resolve(outputImagePath);
      });
      ipcRenderer.once('filter-error', (event, error) => {
        reject(error);
      });
    });
  },
};

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('api', api);
} else {
  window.api = api;
}
