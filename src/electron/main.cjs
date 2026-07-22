const { app, BrowserWindow, protocol, ipcMain, Menu, dialog, Tray } = require('electron')
const path = require('path')
const url = require('url')

let mainWindow
let tray = null

app.setName('创意工作室')

const template = [
  {
    label: '文件',
    submenu: [
      {
        label: '关闭窗口',
        accelerator: 'Ctrl+W',
        click: () => {
          if (mainWindow) {
            mainWindow.close()
          }
        }
      },
      {
        label: '退出应用',
        accelerator: 'Ctrl+Q',
        click: () => {
          app.quit()
        }
      }
    ]
  },
  {
    label: '编辑',
    submenu: [
      {
        label: '撤销',
        accelerator: 'Ctrl+Z',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.undo()
          }
        }
      },
      {
        label: '重做',
        accelerator: 'Ctrl+Shift+Z',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.redo()
          }
        }
      },
      { type: 'separator' },
      {
        label: '剪切',
        accelerator: 'Ctrl+X',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.cut()
          }
        }
      },
      {
        label: '复制',
        accelerator: 'Ctrl+C',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.copy()
          }
        }
      },
      {
        label: '粘贴',
        accelerator: 'Ctrl+V',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.paste()
          }
        }
      },
      {
        label: '全选',
        accelerator: 'Ctrl+A',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.selectAll()
          }
        }
      }
    ]
  },
  {
    label: '视图',
    submenu: [
      {
        label: '刷新',
        accelerator: 'Ctrl+R',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.reload()
          }
        }
      },
      {
        label: '强制刷新',
        accelerator: 'Ctrl+Shift+R',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.reloadIgnoringCache()
          }
        }
      },
      { type: 'separator' },
      {
        label: '开发者工具',
        accelerator: 'F12',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.toggleDevTools()
          }
        }
      },
      { type: 'separator' },
      {
        label: '重置缩放',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.setZoomLevel(0)
          }
        }
      },
      {
        label: '放大',
        accelerator: 'Ctrl+Plus',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.zoomIn()
          }
        }
      },
      {
        label: '缩小',
        accelerator: 'Ctrl+-',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.zoomOut()
          }
        }
      },
      { type: 'separator' },
      {
        label: '全屏',
        accelerator: 'F11',
        click: () => {
          if (mainWindow) {
            mainWindow.setFullScreen(!mainWindow.isFullScreen())
          }
        }
      }
    ]
  },
  {
    label: '窗口',
    submenu: [
      {
        label: '最小化',
        accelerator: 'Ctrl+M',
        click: () => {
          if (mainWindow) {
            mainWindow.minimize()
          }
        }
      },
      {
        label: '最大化',
        click: () => {
          if (mainWindow) {
            if (mainWindow.isMaximized()) {
              mainWindow.unmaximize()
            } else {
              mainWindow.maximize()
            }
          }
        }
      },
      {
        label: '关闭',
        accelerator: 'Ctrl+W',
        click: () => {
          if (mainWindow) {
            mainWindow.close()
          }
        }
      }
    ]
  },
  {
    label: '帮助',
    submenu: [
      {
        label: '关于创意工作室',
        click: async () => {
          const { dialog } = require('electron')
          await dialog.showMessageBox({
            title: '关于创意工作室',
            message: '创意工作室 v1.0.0',
            detail: '一款强大的AI图像和视频生成工具',
            icon: path.join(__dirname, '../images/star.ico')
          })
        }
      },
      {
        label: '检查更新',
        click: async () => {
          const { dialog } = require('electron')
          await dialog.showMessageBox({
            title: '检查更新',
            message: '创意工作室',
            detail: '当前版本: 1.0.0\n已是最新版本',
            icon: path.join(__dirname, '../images/star.ico')
          })
        }
      }
    ]
  }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0a0a0f',
      symbolColor: '#ffffff',
      height: 32
    },
    backgroundColor: '#0a0a0f',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    title: '创意工作室',
    icon: path.join(__dirname, '../images/star.ico')
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, '../../build/index.html'),
      protocol: 'file:',
      slashes: true
    }))
  }

  // Electron 专属样式：顶部留白 + 可拖拽区域 + 按钮避让
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.insertCSS(`
      html, body {box-sizing: border-box; }
      .app-header {
        padding-right: 160px !important;
        -webkit-app-region: drag;
      }
      .app-header .header-nav,
      .app-header .nav-btn,
      .app-header .logo-icon,
      .app-header .logo-text {
        -webkit-app-region: no-drag;
      }
    `)
  })

  // 关闭时询问：最小化到托盘还是直接退出
  mainWindow.on('close', async (e) => {
    if (app.isQuitting) return
    e.preventDefault()
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      title: '创意工作室',
      icon: path.join(__dirname, '../images/star.ico'),
      message: '确定要关闭创意工作室吗？',
      buttons: ['最小化到托盘', '直接关闭', '取消'],
      defaultId: 0,
      cancelId: 2,
      noLink: true
    })
    if (result.response === 0) {
      // 最小化到托盘
      mainWindow.hide()
      if (!tray) createTray()
    } else if (result.response === 1) {
      // 直接关闭
      app.isQuitting = true
      mainWindow.destroy()
    }
    // 取消则什么都不做
  })

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

// 创建系统托盘
function createTray() {
  const iconPath = path.join(__dirname, '../images/star.ico')
  tray = new Tray(iconPath)
  tray.setToolTip('创意工作室')
  const contextMenu = Menu.buildFromTemplate([
    { label: '显示主窗口', click: () => { mainWindow.show(); mainWindow.focus() } },
    { type: 'separator' },
    { label: '退出', click: () => { app.isQuitting = true; app.quit() } }
  ])
  tray.setContextMenu(contextMenu)
  tray.on('double-click', () => { mainWindow.show(); mainWindow.focus() })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})
