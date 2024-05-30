(function (exports) { 'use strict';
  exports.__name__ = 'gameflowEntry';

  let api;
  let canvas, ctx, width, height, canvascolor;
  let pause, step, control, frame = 20, __frame = 20;
  let debug;
  const pixelsPerMeter = 32; 
  const cameraOffsetMetres = { x: 0, y: 0 };
  
  exports.__INIT__ = (path)=>{
    api = new Worker(path + './api.js');
  }

  const resetTestbed = (_control=true, w=800, h=600, fill=0)=>{
    debug = document.createElement('p');
    debug.style.cssText = 'background:greenyellow;right: 50%; top: 0px; color:black;position:absolute;';
    let div = document.createElement('div');
    div.style.cssText = `left: 0px; top: 0px;z-index:999;position:absolute;`;
    canvas = document.getElementById("demo-canvas");
    if(!canvas){
      canvas = document.createElement('canvas');
      canvas.style.cssText = "left: 0px; top: 0px;opacity:0.6;";
    }
    ctx = canvas.getContext('2d');
    ctx.fillStyle = '#e3edcd';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(pixelsPerMeter, pixelsPerMeter);
    const { x, y } = cameraOffsetMetres;
    ctx.translate(x, y);
    ctx.lineWidth /= pixelsPerMeter;
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';
    control = _control;
    div.appendChild(canvas);
    resize(w, h, div);
    div.appendChild(debug);
    if(control) setcontrol();
    document.body.appendChild(div);
    return {canvas, ctx};
  }

  const setFrame = (f)=>{
    __frame = f;
  }

  const setcontrol = (w, h)=>{
    const div = document.createElement('div');
    div.style.cssText = 'opacity:1; font-size:16px; opacity:0.6; width:100%;position:absolute;top:0px;';
    const step = document.createElement('button');
    step.innerText = 'S';
    const play = document.createElement('button');
    play.innerText = 'P';
    div.appendChild(step);
    div.appendChild(play);
    step.addEventListener('click', controlStep);
    play.addEventListener('click', controlPlay);
    let parent = debug.parentElement;
    div.appendChild(debug);
    parent.appendChild(div);
  }

  const controlStep = ()=>{
    api.postMessage({
      type: 'control',
      data: { step:1 }
    })
  }

  const controlPlay = ()=>{
    pause = !pause;
    api.postMessage({
      type: 'control',
      data: { pause }
    })
  }

  const resize = (w, h, parentElement=canvas.parentElement)=>{
    canvas.width = w;
    canvas.height = h;
    parentElement.style.width = canvas.style.width = width = w + 'px';
    parentElement.style.height = canvas.style.height = height = h + 'px';
  }

  const setCtxColor = (rgbStr)=>{
    ctx.fillStyle = `rgba(${rgbStr},0.5)`;
    ctx.strokeStyle = `rgb(${rgbStr})`;
  }


  const drawPolygon = (vertices, fill) => {
    ctx.fillStyle = '#e30000';
    ctx.strokeStyle = '#e30000';
    ctx.beginPath();
    let first = true;
    for (const vertex of vertices) {
      if (first) {
        ctx.moveTo(vertex.x, vertex.y);
        first = false;
      } else {
        ctx.lineTo(vertex.x, vertex.y);
      }
    }
    ctx.closePath();
    // if (fill) {
    //   ctx.fill();
    // }
    ctx.stroke();
  };

  const drawCircle = (center, radius, axis, fill) => {
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI, false);
    if (fill) {
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    ctx.stroke();
    
    // if (fill) {
    //   //render axis marker
    //   const vertex = copyVec2(center);
    //   const scale = scaledVec2(axis, radius);
    //   vertex.op_add(scale);
    //   ctx.beginPath();
    //   ctx.moveTo(center.get_x(), center.get_y());
    //   ctx.lineTo(vertex.get_x(), vertex.get_y());
    //   ctx.stroke();
    //   destroy(vertex);
    //   destroy(scale);
    // }
  };

  const drawSegment = (vert1, vert2) => {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(vert1.x, vert1.y);
    ctx.lineTo(vert2.x, vert2.y);
    ctx.stroke();
  };

  const drawPoint = (vertex, sizeMetres) => {
    const sizePixels = sizeMetres/pixelsPerMeter;
    ctx.fillRect(
      vertex.get_x()-sizePixels/2,
      vertex.get_y()-sizePixels/2,
      sizePixels,
      sizePixels
      );
  };

  const drawTransform = (transform) => {
    const pos = transform.get_p();
    const rot = transform.get_q();
    
    ctx.save();
    ctx.translate(pos.get_x(), pos.get_y());
    ctx.scale(0.5, 0.5);
    ctx.rotate(rot.GetAngle());
    ctx.lineWidth *= 2;
    ctx.restore();
  }

  let now0 = performance.now();
  const showPerformance = ()=>{
    let now = performance.now();
    debug.innerText = `${performance.memory.usedJSHeapSize/1024/1024}M \n ${now - now0}ms`;
    now0 = now;
  }

  let stack = [];
  const _render = ()=>{
    showPerformance();
    // requestAnimationFrame(_render);
    // if(--frame) return;
    // frame = __frame;
    main();
  }

  const main = ()=>{
    if(!stack.length) return;
    ctx.fillStyle = '#e3edcd';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    stack.forEach((d)=>{
      if(d.shape == 'circle'){
        drawCircle(d.center, d.radius, undefined, true);
      }
      else if(d.shape == 'seg'){
        drawSegment(d.vert1, d.vert2);
      }
      else if(d.shape == 'poly'){
        drawPolygon(d.verts, true);
      }
    })
  } 

  const onmessage = (msg)=>{
    if(msg.data.shape){
      stack = msg.data.shape;
    }
  }

  const render = function(){
    // resetTestbed(...arguments);
    // api.addEventListener('message', onmessage);
    // setInterval(()=>{
    //   _render();
    // }, 3000)
    // requestAnimationFrame(_render);
  }
  
  exports.render = render;
  exports.resize = resize;
  exports.setFrame = setFrame;
  setFrame(1);



// terrain();

// function newPromise(){
//   let _ = { };
//   let promise = new Promise((resolve, reject) => {
//     _.resolve = resolve;
//     _.reject = reject;
//   });
//   Object.assign(promise, _);
//   return promise;
// }

// function loadImage(src){
//   let promise = newPromise();
//   const img = new Image();
//   img.crossOrigin = 'Anonymous'; // 如果需要处理跨域问题
//   img.onload = () => promise.resolve(img);
//   img.onerror = promise.reject;
//   img.src = src;
//   return promise;
// }

// console.log(marchingSquares);
// async function terrain(){
  

//   // 获取canvas元素和上下文
//   const canvas = document.getElementById('terrainCanvas');
//   const ctx = canvas.getContext('2d');

//   let img = await loadImage('./src/t1.png');
//   console.log(img);

//   let s = 0.4;
//   let drawWidth = img.width * s;
//   let drawHeight = img.height * s;

//   let safe = 20;
//   let safePadding = Math.floor(safe/5);

//   canvas.width = drawWidth + safe; //safe marchingsquare
//   canvas.height = drawHeight + safe;
//   ctx.drawImage(img, 0, 0, img.width, img.height, safePadding, safePadding, drawWidth, drawHeight);

//   // 设置canvas的宽高
//   const width = canvas.width;
//   const height = canvas.height;

  

//   let startDraw = (ev)=>{
//     if(!start) return;
//     // const starter = {x, y} = ev;
//     // console.log(starter);
//     ctx.fillStyle = 'black';
//     ctx.beginPath();
//     let r = Math.random() * 15 + 15;
//     ctx.arc(ev.x, ev.y, r, 0, 2 * Math.PI);
//     ctx.fill();
//   }

//   let start = false;
//   canvas.addEventListener('pointerdown', ()=>{
//     start = true;
//   });
//   canvas.addEventListener('pointermove', startDraw);
//   window.addEventListener('pointerup', ()=>{
//     start = false;
//     drawContours();
//   });

//   // 绘制一些随机形状（可以根据需要修改）
//   function drawShapes() {
//       ctx.fillStyle = 'black';
//       // ctx.fillRect(0, 0, canvas.width, canvas.height);
//       ctx.restore();
//       ctx.fillStyle = 'white';
      
//       // ctx.beginPath();
//       // ctx.arc(300, 300, 50, 0, 2 * Math.PI);
//       // ctx.fill();
//   }
//   drawShapes();
  
//   // 将Canvas图像数据转换为二进制网格
//   function getGridFromCanvas(ctx, width, height, groupFilters = []) {
//       let imageData;
//       if(ctx instanceof ImageData){
//         imageData = ctx;
//       }
//       else{
//         imageData = ctx.getImageData(0, 0, width, height);
//       }
      
//       const data = imageData.data;
//       let maps = new Map();
//       groupFilters.forEach((f)=>{
//         maps.set(f, []);
//       })
//       for (let y = 0; y < height; y++) {
//           maps.forEach((grid, f)=>{
//             grid.push(new Array(width).fill(0));
//           })
//           let row = new Array(width).fill(0);
//           row.forEach((v, i)=>{
//             const index = (y * width + i) * 4;
//             const r = data[index];
//             const g = data[index + 1];
//             const b = data[index + 2];
//             const a = data[index + 3];
//             maps.forEach((grid, f)=>{
//               let rows = grid[grid.length - 1];
//               if(i == 0 || i == width-1 || y == 0 || y == height-1){ // 忽略边界
//                 rows[i] = 0;
//                 return;
//               }
//               let newI = f(r, g, b, a) ? 1 : 0;
//               rows[i] = newI;
//             })
//           })
//       }
//       return maps;
//   }
  
//   let contours = [];
//   let length = 0;
//   let index = 0;
//   let contoursCopy = [];
//   let speed = 5;
//   let handle = function(){
//     if(!contours.length && contoursCopy.length){
//       api.postMessage({forwardPoly:contoursCopy});
//       contoursCopy = [];
//       requestAnimationFrame(handle);
//       return;
//     }
//     if(!contours.length) return requestAnimationFrame(handle);
//     const a = contours.splice(0, speed);
//     a.forEach((p)=>{
//       const {x, y} = p;
//       ctx.fillStyle = 'green';
//       ctx.beginPath();
//       ctx.arc(x, y, 2, 0, Math.PI * 2);
//       ctx.fill();
//       ctx.restore();
//     })
//     requestAnimationFrame(handle);
//   }
//   requestAnimationFrame(handle);
//   // requestAnimationFrame()

//   // 提取轮廓并绘制到Canvas上
//   function drawContours() {
//       let red = (r, g, b, a)=>{
//         if(r > 128 && a){
//           // console.log(true);
//           return true;
//         }
//         return ;
//       }
//       let green = (r, g, b, a)=>{
//         return g > 128 && a;
//       }
//       let blue = (r, g, b, a)=>{
//         return b > 128 && a;
//       }
//       const maps = getGridFromCanvas(ctx, width, height, [ red, green, blue ]);

//       console.log(maps.get(red));
//       const _contours = marchingSquares.isoLines(maps.get(red), 1);
//       const _contours1 = marchingSquares.isoLines(maps.get(green), 1);
//       const _contours2 = marchingSquares.isoLines(maps.get(blue), 1);

//       _contours.splice(0, 1);
//       _contours1.splice(0, 1);
//       _contours2.splice(0, 1); //忽略边界

//       // const sobel1 = sobel.toImageData(ctx, width, height);
//       // const grid1 = getGridFromCanvas(sobel1, width, height);
//       // console.log(grid1);

//       // console.log(grid);
//       console.log(_contours1);
//       let ccc = [];
//       _contours.forEach((v)=>{
//         let nv = v.map((_)=>{
//           return { x:_[0], y:_[1] }
//         })
//         // ccc.push(nv);
//         ccc.push(simplify(nv, 2, true))
//       })
      
//       ctx.fillStyle = 'red';
//       ctx.lineWidth = 8;

//       console.log(ccc);
//       // console.log(contours);
//       contours = ccc[0];
//       console.log(contours);
//       contoursCopy = Array.from(contours);
//   }

//   // window.drawContours = drawContours;

//   // 绘制形状并提取和绘制轮廓
//   // drawShapes();
//   drawContours();

// }


  // [static] export as AMD module / Node module / browser or worker variable;
  if (typeof define === 'function' && define.amd) define(function() { return exports; });
  else if (typeof module !== 'undefined') {
      module.exports = exports;
      module.exports.default = exports;
  } else if (typeof self !== 'undefined')self[exports.__name__] = exports;
  else window[exports.__name__] = exports;
  // delete exports.__name__;
})({});