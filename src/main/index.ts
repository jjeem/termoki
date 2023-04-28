import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { IPty } from 'node-pty';
import initPtyProcess from '../pty/pty';
import icon from '../../resources/icon.png?asset';

const processes: IPty[] = [];

function createWindow() {
  console.log('✨✨✨ creating window ✨✨✨');
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 480,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return mainWindow;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  const createdWindow = createWindow();

  createdWindow.on('resize', () => {
    createdWindow.webContents.send('term:resize');
  });

  // const ptyProcess = pty.spawn(shell, [], {
  //   name: 'xterm-color',
  //   cols: 80,
  //   rows: 30,
  //   cwd: process.env.HOME
  //   // env: process.env
  // });

  // ptyProcess.onData((data) => {
  //   if (!data || !data.trim()) return;
  //   console.log('pty onData: ', data);
  //   createdWindow.webContents.send('response', data);
  // });

  // ptyProcess.write('ls\r');

  ipcMain.handle('term:data', async (event, data) => {
    // console.log(event);
    console.log('inside main term:data: ', data);
    // ptyProcess.write(data + '\r');
    processes[0]?.write(data + '\r');
    return 'done';
  });

  /*TODO: REMOVE term:init and replace it with term:resume 
          to avoid creating new pty on refresh
  */
  ipcMain.handle('term:init', async (event, data) => {
    // console.log('term:init ', event, data);
    const pty = initPtyProcess();
    // processes.push(pty);
    processes[0]?.kill();
    processes[0] = pty;
    pty.onData((data) => {
      if (!data || !data.trim()) return;
      // console.log('pty onData: ', data);
      createdWindow.webContents.send('term:response', data);
    });
    return 'done';
  });

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    // if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  processes.forEach((pty) => pty.kill());
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
