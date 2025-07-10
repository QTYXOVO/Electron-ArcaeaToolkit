const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  versions: {
    chrome: () => process.versions.chrome,
    node: () => process.versions.node,
    electron: () => process.versions.electron
  },
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog')
});