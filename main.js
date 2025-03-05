const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const axios = require('axios').default; // 使用 axios HTTP 客户端库
const fs = require('fs');
const os = require('os');
const AdmZip = require('adm-zip');
const Registry = require('winreg'); // 使用 winreg 库来操作 Windows 注册表

let updateWindow = null; // 用于存储更新提示窗口
let mainWindow;
let store;

// 动态导入 electron-store
async function initStore() {
    store = await import('electron-store');
    store = new store.default(); // 创建一个新的 store 实例
}

// 读取 settings.json 文件
function loadSettings() {
    const settingsPath = path.join(__dirname, 'settings.json');
    try {
        const data = fs.readFileSync(settingsPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取 settings.json 文件时出错:', error);
        return {}; // 返回空对象以防错误
    }
}

const settings = loadSettings();
const SERVER_IP = settings.serverIp || "127.0.0.1"; // 默认值为 127.0.0.1
const WORKING_PORT = settings.workingPort || "3000"; // 默认值为 3000

// 检查更新的函数
async function checkForUpdates() {
    try {
        const response = await axios.get(`http://${SERVER_IP}:3111/api/version/m6sys44wrk424`); // 替换为你的API URL
        const data = response.data;

        const currentVersion = app.getVersion(); // 获取当前应用版本号
        if (data.version !== currentVersion) {
            showUpdateNotification(data);
        }
    } catch (error) {
        console.error('检查更新时发生错误:', error);
    }
}

function showUpdateNotification(data) {
    if (updateWindow) {
        return;
    }

    updateWindow = new BrowserWindow({
        width: 500,
        height: 400,
        frame: false, // 移除边框
        transparent: true, // 使背景透明
        resizable: false,
        modal: true, // 确保窗口是模态的
        parent: mainWindow, // 将其设置为主窗口的子窗口
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // 添加预加载脚本
            nodeIntegration: false,
            contextIsolation: true, // 确保启用上下文隔离
        },
    });

    const queryParams = encodeURIComponent(JSON.stringify(data));
    const url = `file://${path.join(__dirname, 'public', 'update-notification.html')}?${queryParams}`;
    updateWindow.loadURL(url).catch((error) => {
        console.error('加载更新通知页面时发生错误:', error);
    });

    updateWindow.on('closed', () => {
        updateWindow = null;
    });
}

async function startDownload(downloadUrl) {
    // 不再使用 electron-dl 下载，改为使用外部浏览器下载
    console.log(`即将从以下链接下载更新文件: ${downloadUrl}`);
    shell.openExternal(downloadUrl); // 使用默认浏览器打开下载链接

    // 提示用户下载已经开始，并要求关闭应用
    if (updateWindow) {
        updateWindow.webContents.send('download-progress', 100); // 假设外部下载总是100%
        updateWindow.webContents.send('install-prompt', '请关闭应用程序以完成更新安装。');
    }

    // 禁用主窗口的交互功能
    if (mainWindow) {
        mainWindow.webContents.send('disable-interaction', 'true');
    }
}

async function createWindow() {
    await initStore(); // 确保 store 已初始化

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 700,
        autoHideMenuBar: true,
        titleBarStyle: 'hidden', // 隐藏标题栏
        devTools: false, // 禁用开发者工具
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // 确保路径正确
            nodeIntegration: false, // 确保禁用Node.js集成以提高安全性
            contextIsolation: true  // 启用上下文隔离
        }
    });

    // 构建绝对路径
    const filePath = path.join(__dirname, 'public', 'setting', 'login.html');
    console.log('正在加载文件:', filePath); // 输出文件路径

    // 加载文件
    mainWindow.loadFile(filePath).then(() => {
        console.log('文件加载成功。');
        checkForUpdates(); // 在窗口加载完成后进行更新检查
    }).catch((error) => {
        console.error('加载文件时发生错误:', error);
    });
}

app.on('ready', async () => {
    await createWindow();
});

// 监听来自渲染进程的消息并禁用主窗口交互
ipcMain.on('disable-interaction', (_event, disable) => {
    if (mainWindow) {
        if (disable === 'true') {
            mainWindow.webContents.send('disable-ui', 'true');
        } else {
            mainWindow.webContents.send('disable-ui', 'false');
        }
    }
});

// 监听来自渲染进程的消息并关闭应用
ipcMain.on('close-app', () => {
    if (mainWindow) {
        mainWindow.close();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 处理来自更新通知窗口的消息并开始下载
ipcMain.on('start-download', async (_event, downloadUrl) => {
    await startDownload(downloadUrl);
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// 获取 Documents 目录的路径
function getDocumentsPath(callback) {
    const regKey = new Registry({
        hive: Registry.HKCU, // 当前用户
        key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders'
    });

    regKey.get('Personal', function (err, item) {
        if (err) {
            console.error('无法读取注册表项:', err);
            callback(path.join(os.homedir(), 'Documents')); // 使用默认路径作为备选
        } else {
            const documentsPath = item.value.replace(/%USERPROFILE%/g, os.homedir());
            callback(documentsPath);
        }
    });
}

// 设置 JWT Token 到 store
ipcMain.on('set-jwt-token', (event, jwtToken) => {
    store.set('jwtToken', jwtToken);
    console.log('JWT Token 已设置:', jwtToken);
});

// 下载和解压逻辑
ipcMain.on('download-and-unzip', async (event, args) => {
    const { serverIp, workingPort, operatorId } = args;

    getDocumentsPath((documentsPath) => {
        const savePath = path.join(documentsPath, 'Euro Truck Simulator 2', 'profiles');
        const zipFilePath = path.join(savePath, 'file.zip');

        try {
            // 确保目录存在
            if (!fs.existsSync(savePath)) {
                fs.mkdirSync(savePath, { recursive: true });
            }
            console.log('文件将保存到:', savePath);

            // 下载文件
            const jwtToken = store.get('jwtToken'); // 从 store 中获取 JWT Token
            if (!jwtToken) {
                throw new Error('JWT Token not found in store.');
            }

            console.log('Using JWT Token:', jwtToken); // 添加日志

            axios({
                method: 'get',
                url: `http://${serverIp}:${workingPort}/file/download?operator=${encodeURIComponent(operatorId)}`,
                responseType: 'arraybuffer',
                headers: {
                    'Authorization': `Bearer ${jwtToken}`
                }
            }).then(response => {
                // 保存文件
                fs.writeFileSync(zipFilePath, response.data);
                console.log('文件已保存到:', zipFilePath);

                // 解压文件
                const zip = new AdmZip(zipFilePath);
                zip.extractAllTo(savePath, true);
                console.log('文件已解压到:', savePath);

                event.reply('download-and-unzip-reply', { success: true, message: '文件已成功下载并解压' });
            }).catch(error => {
                if (error.response && error.response.status === 401) {
                    console.error('JWT Token is invalid or expired.');
                    event.reply('download-and-unzip-reply', { success: false, message: 'JWT Token 已失效，请重新登录。' });
                    // 提示用户重新登录或其他处理逻辑
                } else {
                    console.error('文件下载或解压时发生错误:', error.response ? error.response.data : error.message); // 添加详细错误信息
                    event.reply('download-and-unzip-reply', { success: false, message: `文件下载或解压失败: ${error.message}` });
                }
            });
        } catch (error) {
            console.error('创建目录时发生错误:', error.message);
            event.reply('download-and-unzip-reply', { success: false, message: `创建目录失败: ${error.message}` });
        }
    });
});

// 关闭更新窗口的处理
ipcMain.on('close-update-window', () => {
    if (updateWindow) {
        updateWindow.close();
    }
});

// get-settings IPC 处理器
ipcMain.handle('get-settings', async () => {
    return loadSettings();
});