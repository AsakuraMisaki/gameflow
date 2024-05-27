
let api = new Worker('./src/bench_worker.js');
// Box2D().then((b)=>{
//   console.log(b);
// })
// const Box2DFactory = Box2D;
// api.postMessage(Box2DFactory());
// Box2D().then((b)=>{
//   // api.postMessage(b);
//   console.log(b);
//   // _box2d(b, boxCount)
// }).catch(e=>{
//   console.error(e);
// });


// api.addEventListener('error', (error)=>{
//   console.error(error);
// });

// api.addEventListener('messageerror', (msg)=>{
//   console.error(msg);
// });




let r = function(){
  

  const canvas = document.getElementById("demo-canvas");
  const ctx = canvas.getContext('2d');

  const setCtxColor = (rgbStr) => {
    ctx.fillStyle = `rgba(${rgbStr},0.5)`;
    ctx.strokeStyle = `rgb(${rgbStr})`;
  };

  /**
   * @param {Box2D.b2Vec2[]} vertices
   * @param {boolean} fill
   * @returns {void}
   */
  const drawPolygon = (vertices, fill) => {
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
    if (fill) {
      ctx.fill();
    }
    ctx.stroke();
  };


  /**
   * @param {Box2D.b2Vec2} center
   * @param {number} radius
   * @param {Box2D.b2Vec2} axis
   * @param {boolean} fill
   * @returns {void}
   */
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

  /**
   * @param {Box2D.b2Vec2} vert1
   * @param {Box2D.b2Vec2} vert2
   * @returns {void}
   */
  const drawSegment = (vert1, vert2) => {
    ctx.beginPath();
    ctx.moveTo(vert1.x, vert1.y);
    ctx.lineTo(vert2.x, vert2.y);
    ctx.fillStyle = '#ffffff';
    ctx.stroke();
  };

  /**
   * @param {Box2D.b2Vec2} vertex
   * @param {number} sizeMetres
   * @returns {void}
   */
  const drawPoint = (vertex, sizeMetres) => {
    const sizePixels = sizeMetres/pixelsPerMeter;
    ctx.fillRect(
      vertex.get_x()-sizePixels/2,
      vertex.get_y()-sizePixels/2,
      sizePixels,
      sizePixels
      );
  };

  /**
   * @param {Box2D.b2Transform} transform
   * @param {number} sizeMetres
   * @returns {void}
   */
  const drawTransform = transform => {
    const pos = transform.get_p();
    const rot = transform.get_q();
    
    ctx.save();
    ctx.translate(pos.get_x(), pos.get_y());
    ctx.scale(0.5, 0.5);
    ctx.rotate(rot.GetAngle());
    ctx.lineWidth *= 2;
    ctx.restore();
  }
  const pixelsPerMeter = 32;
  const cameraOffsetMetres = {
    x: 0,
    y: 0
  };
  const drawCanvas = () => {
    ctx.fillStyle = 'rgb(99,99,99)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(pixelsPerMeter, pixelsPerMeter);
    const { x, y } = cameraOffsetMetres;
    ctx.translate(x, y);
    ctx.lineWidth /= pixelsPerMeter;
    
    ctx.fillStyle = 'rgb(255,255,0)';

    ctx.restore();
  };

  let stack = [];
  // (function draw(){
  //   requestAnimationFrame(draw);
  //   stack.pop();
  // })();

  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(pixelsPerMeter, pixelsPerMeter);
  const { x, y } = cameraOffsetMetres;
  ctx.translate(x, y);
  ctx.lineWidth /= pixelsPerMeter;
  setInterval(()=>{
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if(!cacheStack.length) return;
    let stack = cacheStack;
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
  }, 16)
  
  

  let cacheStack = [];
  api.addEventListener('message', (msg)=>{
    // return;
    if(msg.data.shape){
      cacheStack = msg.data.shape;
    }
    return;
  });

  showPerformance();
  document.getElementById('step').addEventListener('click', ()=>{
    api.postMessage({pause:1});
  });
}

let showPerformance = function(){
  let infoer = document.getElementById('debug');
  // setInterval(()=>{
  //   infoer.innerText = `${performance.memory.usedJSHeapSize/1024/1024}M`;
  // }, 1000);
  let now0 = performance.now();

  (function cal(){
    let now = performance.now();
    infoer.innerText = `${performance.memory.usedJSHeapSize/1024/1024}M \n ${now - now0}ms`;
    now0 = now;
    requestAnimationFrame(cal);
  })();
  
  
}

window.onload = r;