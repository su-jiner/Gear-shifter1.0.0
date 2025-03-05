const { contextBridge, ipcRenderer } = require('electron');

// 定义公开的 API
contextBridge.exposeInMainWorld('electronAPI', {
    closeApp: () => ipcRenderer.send('close-app'),
    closeUpdateWindow: () => ipcRenderer.send('close-update-window'),
    startDownload: (url) => ipcRenderer.send('start-download', url),
    disableInteraction: (disable) => ipcRenderer.send('disable-interaction', disable),
    setJwtToken: (token) => ipcRenderer.send('set-jwt-token', token), // 新增 setJwtToken 方法
    loadSettings: () => ipcRenderer.invoke('get-settings'), // 新增 loadSettings 方法
});

contextBridge.exposeInMainWorld('electron', {
    send: (channel, data) => {
        // 白名单通道
        let validChannels = ['download-and-unzip', 'disable-interaction', 'set-jwt-token']; // 添加 'set-jwt-token'
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        // 白名单通道
        let validChannels = ['download-and-unzip-reply', 'disable-ui'];
        if (validChannels.includes(channel)) {
            // 订阅 IPC 事件
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    }
});