const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');
const chokidar = require('chokidar');
// const entry = require('./gameflow-dev-lib/entry');
const serveIndex = require('serve-index');

const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    for (const iface of interfaces[interfaceName]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '0.0.0.0';
}

// console.log('Local IP Address:', getLocalIP());
// entry.setIp(getLocalIP());

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const port = 5173;
const ip = '192.168.31.195';

// 提供静态文件服务
app.use(express.static(path.join(__dirname, '')));

// 使用 serve-index 列出 public 目录的内容
app.use('/', serveIndex(path.join(__dirname, ''), { icons: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '', 'index.html'));
});

server.listen(port, ip, () => {
  console.log(`Server is running at http://${ip}:${port}`);
});

// 监听 WebSocket 连接
wss.on('connection', (ws) => {
  console.log('Client connected');
});

// 通知所有客户端更新
function broadcastUpdate(filePath) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(`reload-${filePath}`);
    }
  });
}

// 监视 src 文件夹及其子文件夹内的特定文件类型
const watcher = chokidar.watch('gameflow-dev-lib/**/*.{js,ts,rs}', {
  ignored: /node_modules/,
  persistent: true,
  ignoreInitial: true,
});

watcher.on('change', (filePath) => {
  console.log(`${filePath} has been changed`);
  broadcastUpdate(filePath);
});
