const { app, BrowserWindow, ipcMain, dialog } = require('electron/main')
const { autoUpdater } = require('electron-updater');
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

  // 添加检查更新的IPC处理
  ipcMain.handle('check-for-updates', async () => {
    const maxRetries = 3;
    const retryDelay = 2000; // 2秒重试间隔
    let retries = 0;

    return new Promise((resolve, reject) => {
      const attemptCheck = () => {
        const onUpdateAvailable = () => {
          cleanupListeners();
          resolve('发现新版本，正在下载...');
        };

        const onUpdateNotAvailable = () => {
          cleanupListeners();
          resolve('当前已是最新版本');
        };

        const onError = (error) => {
          cleanupListeners();
          if (retries < maxRetries && isNetworkError(error)) {
            retries++;
            setTimeout(attemptCheck, retryDelay);
          } else {
            reject(new Error(`更新检查失败: ${error.message}`));
          }
        };

        const cleanupListeners = () => {
          autoUpdater.removeListener('update-available', onUpdateAvailable);
          autoUpdater.removeListener('update-not-available', onUpdateNotAvailable);
          autoUpdater.removeListener('error', onError);
        };

        // 使用once确保监听器只触发一次
        autoUpdater.once('update-available', onUpdateAvailable);
        autoUpdater.once('update-not-available', onUpdateNotAvailable);
        autoUpdater.once('error', onError);

        autoUpdater.checkForUpdates();
      };

      // 判断是否为网络错误
      function isNetworkError(error) {
        const networkErrors = ['ERR_CONNECTION_RESET', 'ERR_TIMED_OUT', 'ERR_INTERNET_DISCONNECTED'];
        return networkErrors.some(code => error.message.includes(code));
      }

      attemptCheck();
    });
  })
}

// 配置自动更新
function setupAutoUpdater() {
  // 设置更新源 - 替换为你的GitHub信息
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'QTYXOVO',
    repo: 'Electron-ArcaeaToolkit',
    releaseType: 'release'
  });
  
  // 强制在开发模式下检查更新
  autoUpdater.forceDevUpdateConfig = true;
  
  // 检查更新
  autoUpdater.checkForUpdates();

  // 监听更新事件
  autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
      type: 'info',
      title: '更新可用',
      message: '发现新版本，正在下载...',
      buttons: ['确定']
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: '更新准备就绪',
      message: '更新已下载完成，是否立即重启应用？',
      buttons: ['是', '否']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on('error', (error) => {
    let errorMessage = `更新过程中出错: ${error.message}`;
    // 网络错误处理
    if (error.message.includes('ERR_CONNECTION_RESET')) {
      errorMessage = '网络连接重置，请检查您的网络连接或稍后重试。';
    } else if (error.message.includes('404')) {
      errorMessage = '未找到更新源，请确认应用配置是否正确。';
    }
    dialog.showMessageBox({
      type: 'error',
      title: '更新错误',
      message: errorMessage,
      buttons: ['确定']
    });
  });
}

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})