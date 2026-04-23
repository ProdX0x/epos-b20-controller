const { app, BrowserWindow, Tray, Notification, nativeImage, Menu } = require('electron');
const HID = require('node-hid');

let win, tray, hidDevice;
let currentVolume = 50;
let isConnected = false;
let currentState = { gain: 0, mute: false, pattern: 1 };

const patternIcons = { 1: '🎙', 2: '🎵', 3: '↔', 4: '⭕' };

function updateTrayMenu() {
  const gainPct = Math.round((currentState.gain / 24) * 100);
  const patternIcon = patternIcons[currentState.pattern] || '🎙';
  const muteIcon = currentState.mute ? '🔴' : '🟢';
  const trayTitle = isConnected
    ? muteIcon + ' B20 | ' + gainPct + '% | ' + patternIcon
    : '⚠️ B20';
  tray.setTitle(trayTitle);

  const statusLabel = isConnected
    ? (currentState.mute ? '🔴 Micro muté' : '🟢 Micro actif')
    : '⚠️ B20 déconnecté';

  const contextMenu = Menu.buildFromTemplate([
    { label: 'B20 Control v1.0.0', enabled: false },
    { type: 'separator' },
    { label: statusLabel, enabled: false },
    { type: 'separator' },
    { label: 'Ouvrir', click: () => { win.show(); win.focus(); } },
    { type: 'separator' },
    { label: 'Quitter', click: () => { app.exit(0); } }
  ]);

  tray.setContextMenu(contextMenu);
}

function createTray() {
  tray = new Tray(nativeImage.createEmpty());
  updateTrayMenu();
  tray.on('click', () => { win.isVisible() ? win.hide() : (win.show(), win.focus()); });
}

function createWindow() {
  win = new BrowserWindow({
    width: 480, height: 780,
    titleBarStyle: 'hiddenInset',
    webPreferences: { nodeIntegration: true, contextIsolation: false, webSecurity: false }
  });
  win.loadFile('index.html');
  win.on('close', (e) => { e.preventDefault(); win.hide(); });
}

function connectB20() {
  const devices = HID.devices().filter(d => d.vendorId === 5013 && d.usagePage === 12);
  if (!devices.length) { setTimeout(connectB20, 3000); return; }

  try {
    hidDevice = new HID.HID(devices[0].path);
    isConnected = true;
    updateTrayMenu();

    if (win) win.webContents.send('b20-connected', {
      serial: devices[0].serialNumber || 'A003420211605453'
    });

    new Notification({ title: 'B20 Control', body: 'EPOS B20 connecté', silent: true }).show();

    hidDevice.on('data', (data) => {
      let event = null;

      if (data[0] === 128 && data[1] === 1 && data[3] === 255) {
        currentState.gain = data[2];
        const pct = Math.round((data[2] / 24) * 100);
        event = { type: 'gain', value: data[2], pct };
        updateTrayMenu();
      }
      else if (data[0] === 128 && data[1] === 2 && data[2] === 1 && data[3] === 255) {
        currentState.mute = true;
        updateTrayMenu();
        new Notification({ title: 'B20 Control', body: 'Micro muté', silent: true }).show();
        event = { type: 'mute', value: true };
      }
      else if (data[0] === 128 && data[1] === 2 && data[2] === 0 && data[3] === 255) {
        currentState.mute = false;
        updateTrayMenu();
        new Notification({ title: 'B20 Control', body: 'Micro actif', silent: true }).show();
        event = { type: 'mute', value: false };
      }
      else if (data[0] === 3 && data[1] === 2) {
        currentVolume = Math.min(100, currentVolume + 4);
        event = { type: 'volume', value: currentVolume };
      }
      else if (data[0] === 3 && data[1] === 1) {
        currentVolume = Math.max(0, currentVolume - 4);
        event = { type: 'volume', value: currentVolume };
      }
      else if (data[0] === 128 && data[1] === 3 && data[3] === 255) {
        const patterns = { 1: 'Cardioid', 2: 'Stereo', 3: 'Bidirectionnel', 4: 'Omnidirectionnel' };
        currentState.pattern = data[2];
        updateTrayMenu();
        event = { type: 'pattern', value: data[2], label: patterns[data[2]] || '?' };
      }

      if (event && win) win.webContents.send('b20-event', event);
    });

    hidDevice.on('error', () => {
      isConnected = false;
      updateTrayMenu();
      new Notification({ title: 'B20 Control', body: 'EPOS B20 déconnecté', silent: false }).show();
      if (win) win.webContents.send('b20-disconnected');
      setTimeout(connectB20, 3000);
    });

  } catch(e) {
    setTimeout(connectB20, 3000);
  }
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  setTimeout(connectB20, 1000);
  app.dock.hide();
});

app.on('will-quit', () => { if (hidDevice) hidDevice.close(); });
app.on('window-all-closed', (e) => { e.preventDefault(); });
