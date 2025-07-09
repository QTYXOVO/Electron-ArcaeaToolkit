const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  versions: {
    chrome: () => process.versions.chrome,
    node: () => process.versions.node,
    electron: () => process.versions.electron
  }
});