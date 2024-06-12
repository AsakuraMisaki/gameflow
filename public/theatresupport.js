import {getProject, types} from '@theatre/core';
import studio  from '@theatre/studio';
// We can now access Theatre.core and Theatre.studio from here
console.warn(studio);

const test = document.createElement('canvas');
test.style.margin = 'auto';
test.style.margin = 'auto';
let testp = document.createElement('p');
testp.innerText = 'TEST';
testp.style.fontSize = '30px';
testp.style.color = '#ffffff';
testp.style.position = 'absolute';
testp.style.margin = 0;
testp.style.padding = 0;
document.body.appendChild(testp);
// test.appendChild(testp);

window.thstate = { };
// 初始化 Theatre.js Studio
studio.initialize();

// 初始化 Theatre.js 项目
const project = getProject('Game Animation Project', window.thstate);

// 创建一个剧本（Sheet）
const sheet = project.sheet('Animation Sheet');

// 定义属性对象
const object = sheet.object('GameObject', {
  x: types.number(0, { range: [0, 100] }),
  y: types.number(0, { range: [0, 100] }),
  opacity: types.number(1, { range: [0, 1] }),
});

// 监听属性变化并输出到控制台
object.onValuesChange((values) => {
  testp.style.left = values.x + 150 + 'px';
  testp.style.top = values.y + 'px';
  testp.style.opacity = values.opacity;
  console.log(`x: ${values.x}, y: ${values.y}, opacity: ${values.opacity}`);
});

    