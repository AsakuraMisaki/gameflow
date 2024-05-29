const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// 提供项目根目录的静态文件服务
app.use(express.static(path.join(__dirname)));

app.listen(port, '192.168.31.195', () => {
  console.log(`Server is running at http://localhost:${port}`);
});
