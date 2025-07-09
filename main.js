const { app, BrowserWindow, ipcMain, dialog } = require('electron/main')
const fs = require('fs');
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

  // 处理文件导入对话框
  ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [{
        name: 'JSON Files',
        extensions: ['json']
      }]
    });

    if (result.canceled || !result.filePaths.length) {
      return { success: false, message: '未选择文件' };
    }

    const filePath = result.filePaths[0];
    try {
      // 读取选择的JSON文件
      const content = fs.readFileSync(filePath, 'utf8');
      const jsonData = JSON.parse(content);

      // 验证JSON结构
      if (!jsonData.songs || !Array.isArray(jsonData.songs)) {
        throw new Error('JSON文件格式不正确，缺少songs数组');
      }

      // 保存到本地离线数据文件
      const offlineDir = path.join(__dirname, 'Arcaea_Difficulty_Lookup', 'offline');
      const destPath = path.join(offlineDir, 'songs.json');

      // 确保目录存在
      if (!fs.existsSync(offlineDir)) {
        fs.mkdirSync(offlineDir, { recursive: true });
      }

      // 添加更新时间
      jsonData.last_updated = new Date().toISOString();

      // 写入文件
      fs.writeFileSync(destPath, JSON.stringify(jsonData, null, 2), 'utf8');

      return { success: true, message: '文件导入成功' };
    } catch (error) {
      console.error('文件处理错误:', error);
      return { success: false, message: `处理文件时出错: ${error.message}` };
    }
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