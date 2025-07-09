const { app, BrowserWindow, ipcMain } = require('electron/main')
const path = require('node:path')


const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('index.html')

  // 窗口控制事件监听
  ipcMain.on('window-minimize', () => {
    win.minimize()
  })

  ipcMain.on('window-close', () => {
    win.close()
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})