// AI辅助生成：DeepSeek V4 flash ,2026-4-27
const { app, BrowserWindow } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let backendProcess = null
let mainWindow = null

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  function startBackend() {
    const appPath = app.getAppPath()
    const backendPath = path.join(appPath, 'backend.js')
    console.log('启动后端服务:', backendPath)
    
    const nodePath = process.execPath
    console.log('使用 Node.js 路径:', nodePath)
    
    backendProcess = spawn(nodePath, [backendPath], {
      cwd: appPath,
      stdio: 'pipe',
      env: {
        ...process.env,
        NODE_PATH: path.join(appPath, 'node_modules')
      }
    })
    
    backendProcess.stdout.on('data', (data) => {
      console.log(`后端输出: ${data}`)
    })
    
    backendProcess.stderr.on('data', (data) => {
      console.error(`后端错误: ${data}`)
    })
    
    backendProcess.on('close', (code) => {
      console.log(`后端服务退出，代码: ${code}`)
    })
  }

  function waitForBackend(port, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const net = require('net')
      const startTime = Date.now()

      const tryConnect = () => {
        const client = net.createConnection({ host: '127.0.0.1', port }, () => {
          client.end()
          resolve()
        })

        client.on('error', (err) => {
          client.destroy()
          if (Date.now() - startTime >= timeout) {
            reject(new Error(`等待后端端口 ${port} 启动超时: ${err.message}`))
          } else {
            setTimeout(tryConnect, 200)
          }
        })
      }

      tryConnect()
    })
  }

  function createWindow() {
    if (mainWindow) {
      return mainWindow
    }

    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false
      },
      title: '智灌管家'
    })

    if (process.env.NODE_ENV === 'development') {
      mainWindow.loadURL('http://localhost:5173')
      mainWindow.webContents.openDevTools()
    } else {
      const indexPath = path.join(app.getAppPath(), 'dist', 'index.html')
      mainWindow.loadFile(indexPath)
    }

    mainWindow.on('closed', () => {
      mainWindow = null
      app.quit()
    })

    return mainWindow
  }

  app.whenReady().then(() => {
    startBackend()

    waitForBackend(3000, 15000)
      .then(() => {
        createWindow()
      })
      .catch((error) => {
        console.error('后端启动失败:', error)
        const { dialog } = require('electron')
        dialog.showErrorBox('后端启动失败', error.message)
        app.quit()
      })

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })

  app.on('window-all-closed', () => {
    if (backendProcess) {
      backendProcess.kill()
      backendProcess = null
    }
    
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}
