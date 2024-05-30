const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const entry = require('./gameflow-dev-lib/entry');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const port = entry.port(true);
const ip = entry.ip(true);

// 提供静态文件服务
app.use(express.static(path.join(__dirname, '')));

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
