(function (exports) {
  'use strict';
  exports.__name__ = 'translation';

  let marchingSquares;
  exports.__INIT__ = (_marchingSquares)=>{
    marchingSquares = _marchingSquares;
  }

  // 将Canvas图像数据转换为二进制网格
  function getGridFromCanvas(ctx, width, height, groupFilters = []) {
    let imageData;
    if (ctx instanceof ImageData) {
      imageData = ctx;
    }
    else {
      imageData = ctx.getImageData(0, 0, width, height);
    }

    const data = imageData.data;
    let maps = new Map();
    groupFilters.forEach((f) => {
      maps.set(f, []);
    })
    for (let y = 0; y < height; y++) {
      maps.forEach((grid, f) => {
        grid.push(new Array(width).fill(0));
      })
      let row = new Array(width).fill(0);
      row.forEach((v, i) => {
        const index = (y * width + i) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];
        maps.forEach((grid, f) => {
          let rows = grid[grid.length - 1];
          if (i == 0 || i == width - 1 || y == 0 || y == height - 1) { // 忽略边界
            rows[i] = 0;
            return;
          }
          let newI = f(r, g, b, a) ? 1 : 0;
          rows[i] = newI;
        })
      })
    }
    return maps;
  }

  // 提取轮廓并绘制到Canvas上
  function getMarchingSquares(ctx, width, height) {
      let red = (r, g, b, a)=>{
        if(r > 128 && a){
          // console.log(true);
          return true;
        }
        return ;
      }
      let green = (r, g, b, a)=>{
        return g > 128 && a;
      }
      let blue = (r, g, b, a)=>{
        return b > 128 && a;
      }
      const maps = getGridFromCanvas(ctx, width, height, [ red, green, blue ]);

      let newMaps = new Map();
      maps.forEach((grid, f)=>{
        const contours = marchingSquares.isoLines(maps.get(red), 1);
        contours.splice(0, 1);
        newMaps.set(f, { contours, grid });
      })

      return newMaps;
  }

  exports.getMarchingSquares = getMarchingSquares;
  exports.getGridFromCanvas = getGridFromCanvas;


  // [static] export as AMD module / Node module / browser or worker variable;
  if (typeof define === 'function' && define.amd) define(function () { return exports; });
  else if (typeof module !== 'undefined') {
    module.exports = exports;
    module.exports.default = exports;
  } else if (typeof self !== 'undefined') self[exports.__name__] = exports;
  else window[exports.__name__] = exports;
  // delete exports.__name__;
})({});