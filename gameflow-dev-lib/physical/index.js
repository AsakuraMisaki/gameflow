// import * as Comlink from '../support/comlink.mjs';
import { default as Gameflow } from '../entry.js';
import * as Box2D from './Box2D_v2.3.1_min.js';
import * as globalCache from '../other/globalCache.js';
import * as earcut from '../support/earcut.js';
import * as polyPartition from '../support/poly-partition.js';
// import * as API from './api.js';

console.warn(Gameflow.path());

const PIXELS_PER_METER = 100;

let canvas, ctx, width, height, canvascolor;
let pause, step, control, frame = 20, __frame = 20;
let debug;
const pixelsPerMeter = 100;
const cameraOffsetMetres = { x: 0, y: 0 };
let DrawOffset = { x:0, y:0 };

// const api = new Worker(Gameflow.path() + './gameflow-dev-lib/physical/api.js', { type:'module' });
// const worker = Comlink.wrap(api);


// async function wasmInit(){
//   let wasm = await fetch(Gameflow.path() + './gameflow-dev-lib/physical/' + './Box2D.wasm');

//   const bytes = await wasm.arrayBuffer();

//   const context = await Box2D.Box2D();

//   const instance = await WebAssembly.instantiate(bytes, context.im);

//   context.complie(instance);

//   let box2D = context.box2D;
//   console.log(box2D);
//   init1(box2D, 500);
// }


async function wasmInit() {
  // console.log(Box2D);
  let wasm = await Box2D.Box2D();
  // Box2D = wasm;
  // console.log(Box2D);
  init1(wasm, 1);
}
// wasmInit();

// let _1 = { };


// const checkWorkerInterface = async function () {
//   await worker.printInterface();
// }
// Object.defineProperties(_1, {
//   i: {
//     get: checkWorkerInterface
//   }
// })
// export { worker, _1 };

let _Interface1 = { };

const resetTestbed = (_control = true, w = window.innerWidth, h = window.innerHeight, fill = 0) => {
  debug = document.createElement('p');
  debug.style.cssText = 'background:greenyellow;right: 50%; top: 0px; color:black;position:absolute;';
  let div = document.createElement('div');
  div.style.cssText = `opacity:0.6;left: 0px; top: 0px;z-index:999; position:absolute;`;
  // div.style.width = window.innerWidth + 'px';
  // div.style.height = window.innerHeight + 'px';
  canvas = document.getElementById("demo-canvas");
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.style.cssText = "left: 0px; top: 0px;opacity:0.6;";
  }
  ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e3edcd';

  // ctx.scale(pixelsPerMeter, pixelsPerMeter);
  // canvas.style.transform = 'scale(5,5)';
  ctx.save();
  const { x, y } = cameraOffsetMetres;
  ctx.translate(x, y);
  // ctx.lineWidth /= pixelsPerMeter;
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  control = _control;
  div.appendChild(canvas);
  resize(w, h, div);
  div.appendChild(debug);
  if (control) setcontrol();
  document.body.appendChild(div);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return { canvas, ctx };
}

const setFrame = (f) => {
  __frame = f;
}

const setcontrol = (w, h) => {
  const div = document.createElement('div');
  div.style.cssText = 'opacity:1; font-size:16px; width:100%;position:absolute;top:0px;';
  const step = document.createElement('button');
  step.innerText = 'S';
  const play = document.createElement('button');
  play.innerText = 'P';
  div.appendChild(step);
  div.appendChild(play);
  // step.addEventListener('click', controlStep);
  // play.addEventListener('click', controlPlay);
  let parent = debug.parentElement;
  div.appendChild(debug);
  parent.appendChild(div);
}

// const controlStep = () => {
//   api.postMessage({
//     type: 'control',
//     data: { step: 1 }
//   })
// }

// const controlPlay = () => {
//   pause = !pause;
//   api.postMessage({
//     type: 'control',
//     data: { pause }
//   })
// }

const resize = (w, h, parentElement = canvas.parentElement) => {
  canvas.width = w;
  canvas.height = h;
  parentElement.style.width = canvas.style.width = width = w + 'px';
  parentElement.style.height = canvas.style.height = height = h + 'px';
}

const setCtxColor = (rgbStr) => {
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
      ctx.moveTo((vertex.x + DrawOffset.x) * PIXELS_PER_METER, (vertex.y + DrawOffset.y) * PIXELS_PER_METER);
      first = false;
    } else {
      ctx.lineTo((vertex.x + DrawOffset.x) * PIXELS_PER_METER, (vertex.y + DrawOffset.y) * PIXELS_PER_METER);
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
  ctx.arc(center.x * PIXELS_PER_METER + DrawOffset.x, center.y * PIXELS_PER_METER + DrawOffset.y, radius * PIXELS_PER_METER, 0, 2 * Math.PI, false);
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
  const sizePixels = sizeMetres / pixelsPerMeter;
  ctx.fillRect(
    vertex.get_x() - sizePixels / 2,
    vertex.get_y() - sizePixels / 2,
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
const showPerformance = () => {
  let now = performance.now();
  debug.innerText = `${performance.memory.usedJSHeapSize / 1024 / 1024}M \n ${now - now0}ms`;
  now0 = now;
}


const _render = () => {
  showPerformance();
  
  requestAnimationFrame(_render);
  // api.postMessage({ update: true });
  // if(--frame) return;
  // frame = __frame;
  // main();
}

const main = () => {
  if (!stack.length) return;
  ctx.fillStyle = '#e3edcd';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  stack.forEach((d) => {
    if (d.shape == 'circle') {
      drawCircle(d.center, d.radius, undefined, true);
    }
    else if (d.shape == 'seg') {
      drawSegment(d.vert1, d.vert2);
    }
    else if (d.shape == 'poly') {
      drawPolygon(d.verts, true);
    }
  })

}
// let stack = [];

// onmessage = (msg) => {
//   if (msg.data.shape) {
//     stack = msg.data.shape;
//   }
//   allBodies =  msg.data.allBodies || allBodies;
//   contact = msg.data.contact  || contact;
// }

const render = function () {
  resetTestbed(...arguments);
  // api.addEventListener('message', onmessage);
  requestAnimationFrame(_render);
}


let allBodies = { };
let contact = { };

wasmInit();
const init1 = (box2D) => {
  let pause;

  let stack = [], concat = {}, contactcache={};

  const { getPointer, NULL, LeakMitigator, b2CircleShape, b2Contact, b2Filter, JSContactListener, HEAPF32, _malloc, b2PolygonShape, b2Vec2, b2BodyDef, b2World, b2FixtureDef, b2_dynamicBody, JSDraw, b2Draw, wrapPointer, b2Color, destroy } = box2D;

  
  
  const gravity = new b2Vec2(0.0, 0.0);
  const world = new b2World(gravity);
  const draw = new JSDraw();
  draw.SetFlags(b2Draw.e_shapeBit);

  draw.DrawSegment = function (vert1, vert2, color) {
    var vert1V = wrapPointer(vert1, b2Vec2);
    var vert2V = wrapPointer(vert2, b2Vec2);
    
    // stack.push({
    //   type: 'ctx',
    //   vert1: { x: vert1V.get_x(), y: vert1V.get_y() },
    //   vert2: { x: vert2V.get_x(), y: vert2V.get_y() },
    //   color, shape: 'seg',
    // })
  };

  draw.DrawSolidCircle = draw.DrawCircle = function (center, radius, axis, fill) {
    var centerV = wrapPointer(center, b2Vec2);
    var axisV = wrapPointer(axis, b2Vec2);
    drawCircle({ x: centerV.get_x(), y: centerV.get_y() }, radius, undefined, true);
    // stack.push({
    //   type: 'ctx', center: { x: centerV.get_x(), y: centerV.get_y() }, radius, fill, shape: 'circle',
    // })
  }

  draw.DrawPolygon = function (vertices, vertexCount, fill) {
    let verts = [];
    for (let tmpI = 0; tmpI < vertexCount; tmpI++) {
      var vert = wrapPointer(vertices + (tmpI * 8), b2Vec2);
      verts.push({ x: vert.get_x(), y: vert.get_y() })
    }
    drawPolygon(verts, true);
    // stack.push({
    //   type: 'ctx', verts, shape: 'poly'
    // })
  }
  draw.DrawSolidPolygon = draw.DrawPolygon;
  world.SetDebugDraw(draw);

  const createPolyBody = (verts, options={}) => {
    const bd = new b2BodyDef();
    options.dynamic ? bd.set_type(b2_dynamicBody) : null;
    let body = world.CreateBody(bd);
    const convexPolygons = cut(verts);
    buildTrisFixtures(convexPolygons, body, options);
    destroy(bd);
    // destroy(convexPolygons);
    return body;
  }

  function cut(verts){
    let convexPolygons = polyPartition.convexPartition(verts, true);
    
    let newConvexPolygons = [];
    convexPolygons = convexPolygons.forEach((vs)=>{
      if(vs.length <= 8){
        newConvexPolygons.push(vs);
        return;
      }
      else{
        console.warn(vs);
        let cs = polyPartition.triangulate(vs, true);
        newConvexPolygons = newConvexPolygons.concat(cs);
      }
    })

    console.warn(newConvexPolygons);
    return newConvexPolygons;
  }

  

  function createPolygonShape(vertices, scale = 1) {
    var shape = new b2PolygonShape();
    var buffer = _malloc(vertices.length * 8);
    var offset = 0;
    for (var i = 0; i < vertices.length; i++) {
      // console.log(vertices);
      HEAPF32[buffer + offset >> 2] = vertices[i].x * scale / PIXELS_PER_METER;
      HEAPF32[buffer + (offset + 4) >> 2] = vertices[i].y * scale / PIXELS_PER_METER;
      offset += 8;
    }
    var ptr_wrapped = wrapPointer(buffer, b2Vec2);
    shape.Set(ptr_wrapped, vertices.length);
    return shape;
  }
  function createChainShape(vertices, scale = 1, closedLoop = true) {
    var shape = new b2ChainShape();
    var buffer = _malloc(vertices.length * 8);
    var offset = 0;
    for (var i = 0; i < vertices.length; i++) {
      HEAPF32[buffer + offset >> 2] = vertices[i].x * scale;
      HEAPF32[buffer + (offset + 4) >> 2] = vertices[i].y * scale;
      offset += 8;
    }
    var ptr_wrapped = wrapPointer(buffer, b2Vec2);
    if (closedLoop)
      shape.CreateLoop(ptr_wrapped, vertices.length);
    else
      shape.CreateChain(ptr_wrapped, vertices.length);
    return shape;
  }
  function buildTrisFixtures(verts, body, options={ }, fixture = b2FixtureDef) {
    console.warn('tri count ' + verts.length);
    verts.forEach((vs, i) => {
      const filter = new b2Filter();
      console.warn(options);
      filter.set_categoryBits(options.category || 1);
      filter.set_maskBits(options.mask || (1 | 1));
      const fixtureDef = new fixture();
      var shape = createPolygonShape(vs);
      const polygonShape = shape;
      fixtureDef.set_friction(1);
      fixtureDef.set_density(1);
      fixtureDef.set_shape(polygonShape);
      options.sensor ? fixtureDef.set_isSensor(true) : null;
      fixtureDef.set_filter(filter);
      body.SetLinearDamping(options.linerDamping || 10);
      body.SetFixedRotation(options.fixedRotation || false);
      body.CreateFixture(fixtureDef);
      destroy(fixtureDef);
      destroy(polygonShape);
      destroy(filter);
    })
  }

  // Interface for main thread
  let id = 0;
  const _createColliderGroup = function(name){
    _Interface.group.set(name, new Map());
  }
  const _createCircleBody = function(radius, options={ }, fixture=b2FixtureDef){
    const filter = new b2Filter();
    // console.warn(options);
    filter.set_categoryBits(options.category || 1);
    filter.set_maskBits(options.mask || (1 | 1));
    const fixtureDef = new fixture();
    const shape = new b2CircleShape();
    shape.set_m_radius(radius / PIXELS_PER_METER);
    fixtureDef.set_friction(1);
    fixtureDef.set_density(1);
    fixtureDef.set_shape(shape);
    options.sensor ? fixtureDef.set_isSensor(true) : null;
    fixtureDef.set_filter(filter);
    const bd = new b2BodyDef();
    options.dynamic ? bd.set_type(b2_dynamicBody) : null;
    let body = world.CreateBody(bd);
    body.SetLinearDamping(options.ld || 10);
    body.SetFixedRotation(options.fixedRotation || false);
    body.CreateFixture(fixtureDef);
    destroy(bd);
    destroy(fixtureDef);
    destroy(shape);
    destroy(filter);
    _Interface.group.set(++id, body);
    if(!body){
      console.warn(id, ' no body ? ');
    }
    body.id = id;
    options.sensor ? body.SetSleepingAllowed(false) : null;
    return id;
  }
  const _createRectBody = function(w, h, options={ }, fixture=b2FixtureDef){
    const filter = new b2Filter();
    // console.warn(options);
    filter.set_categoryBits(options.category || 1);
    filter.set_maskBits(options.mask || (1 | 1));
    const fixtureDef = new fixture();
    const shape = new b2PolygonShape();
    shape.SetAsBox(w / PIXELS_PER_METER, h / PIXELS_PER_METER);
    fixtureDef.set_friction(1);
    fixtureDef.set_density(1);
    fixtureDef.set_shape(shape);
    options.sensor ? fixtureDef.set_isSensor(true) : null;
    fixtureDef.set_filter(filter);
    const bd = new b2BodyDef();
    options.dynamic ? bd.set_type(b2_dynamicBody) : null;
    let body = world.CreateBody(bd);
    body.SetLinearDamping(options.linerDamping || 10);
    body.SetFixedRotation(options.fixedRotation || false);
    body.CreateFixture(fixtureDef);
    destroy(bd);
    destroy(fixtureDef);
    destroy(shape);
    destroy(filter);
    _Interface.group.set(++id, body);
    body.id = id;
    options.sensor ? body.SetSleepingAllowed(false) : null;
    return id;
  }
  const _createPolyBody = function(verts, options = { }){
    let body = createPolyBody(verts, options);
    if(!body) return;
    // if(options.groupname){
    //   _setBodyGroup(options.groupname, body);
    // }
    _Interface.group.set(++id, body);
    
    body.id = id;
    return id;
  }
  const _setBodyGroup = function(groupname, body){
    let group = _Interface.group.get(groupname);
    if(!group) return;
    group.set(body.id, body);
  }
  const _position = function(id){
    let body = _Interface.group.get(id);
    if(!body) return;
    let p = body.GetPosition();
    const result = { x:p.x, y:p.y };
    // destroy(p);
    return result;
  }
  const _force = function(id, x, y){
    let body = _Interface.group.get(id);
    if(!body) return;
    let v = new b2Vec2(x, y);
    // console.log(v.x);
    body.ApplyForceToCenter(v, true); // 强制唤醒物体
    destroy(v);
  }
  const _beh = async function(id, cb){
    // let data = _Interface.group.get(id);
    // if(!data || !data.body) return;
    // console.log(box2D);
    // cb(data.body, box2D);
  }
  const _synclite = async function(id, id1, ox=0, oy=0, rotate=false){
    let b1 = _Interface.group.get(id);
    let b2 = _Interface.group.get(id1);
    if(!b1 || !b2) return;
    let a = b1.GetAngle();
    const temp = b2.GetPosition();
    const temp1 = new b2Vec2(temp.x + ox, temp.y + oy);
    if(rotate){
      a = b2.GetAngle();
    }
    b1.SetTransform(temp1, a);
    // destroy(temp);
    destroy(temp1);
    return true;
  }
  const _syncfront = async function(id, id1, radian=0, ox=0, oy=0, rotate=false){
    let b1 = _Interface.group.get(id);
    let b2 = _Interface.group.get(id1);
    if(!b1 || !b2) return;
    let a = b1.GetAngle();
    const temp = b2.GetPosition();
    if(rotate){
      a = b2.GetAngle();
    }
    b1.SetTransform(temp, a);
    // destroy(temp);
  }
  const _setposition = function(id, x, y){
    let body = _Interface.group.get(id);
    if(!body) return;
    let temp = new b2Vec2(x / PIXELS_PER_METER, y / PIXELS_PER_METER);
    body.SetTransform(temp, 0);
    destroy(temp);
    return true;
  }
  const _setangle = async function(id, rotation){
    let body = _Interface.group.get(id);
    if(!body) return;
    let temp = body.GetPosition();
    body.SetTransform(temp, rotation);
    // destroy(temp);
    return true;
  }
  const _destory = function(id){
    let body = _Interface.group.get(id);
    if(!body) return;
    _Interface.gc.set(body, true);
    _removeContactL(id);
    _Interface.group.delete(id);
    return id;
  }
  // let contact = { };
  const _getContact = function(id, cache = false){
    let c = contact;
    if(!id){
      return c;
    }
    return c[id];
  }
  const _addContactL = function(id){
    let body = _Interface.group.get(id);
    if(!body) return;
    body.SetSleepingAllowed(false);
    contact[id] = contact[id] || { };
  }
  const _removeContactL = function(id){
    delete contact[id];
  }
  const _createContactListener = ()=>{
    const listener = new JSContactListener();
    
    listener.BeginContact = function(c) {
      const contact1 = wrapPointer(c, b2Contact);
      const b1 = contact1.GetFixtureA().GetBody();
      const b2 = contact1.GetFixtureB().GetBody();
      let a = contact[b1.id];
      let b = contact[b2.id];
      if(!a && !b) return;
      a ? a[b2.id] = true : null;
      b ? b[b1.id] = true : null;
    };
    listener.EndContact = function(c) {
      const contact1 = wrapPointer(c, b2Contact);
      const b1 = contact1.GetFixtureA().GetBody();
      const b2 = contact1.GetFixtureB().GetBody();
      let a = contact[b1.id];
      let b = contact[b2.id];
      if(!a && !b) return;
      a ? delete a[b2.id] : null;
      b ? delete b[b1.id] : null;
    };
    listener.PreSolve = function(c) {
      
    };
    listener.PostSolve = function(c) {
      
    };
    world.SetContactListener(listener);
    // destroy(listener);
  }
  const printInterface = function(warn = true){
    warn ? console.warn(_Interface) : console.log(_Interface);
  }
  const printBodies = function(){
    console.warn(_Interface.group);
  }
  const _Interface = {
    group: new Map(),
    flags: new Map(),
    gc: new Map(),
    printInterface,
    printBodies,
    context:{
      _createColliderGroup,
      _createPolyBody,
      _createRectBody,
      _createCircleBody,
      _setBodyGroup,
      _createContactListener,
      _getContact,
    },
    body:{
      _position,
      _force,
      _beh,
      _setposition,
      _destory,
      _addContactL,
      _removeContactL,
      _synclite,
      _syncfront,
      _setangle
    }
  }
  _createContactListener();
  Object.assign(_Interface1, _Interface);

  function handle(){
    requestAnimationFrame(handle);
    world.Step(1/60, 3, 2);
    ctx.fillStyle = '#e3edcd';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    world.DrawDebugData();
    lastInfoPost();
  }
  requestAnimationFrame(handle);
  // onmessage = (m) => {
  //   const data = m.data;
  //   if(data.update && !pause){
  //     _Interface.gc.forEach((_, body, map)=>{
  //       world.DestroyBody(body);
  //       freeFromCache(body);
  //     })
  //     _Interface.gc = new Map();
      
  //     // for (
  //     //   let body = recordLeak(world.GetBodyList());
  //     //   getPointer(body) !== getPointer(NULL);
  //     //   body = recordLeak(body.GetNext())
  //     //   ) {
  //     //     // if(_Interface.gc.get(body)){
  //     //     //   world.DestroyBody(body);
  //     //     //   _Interface.gc.delete(body);
  //     //     // }
  //     //   if(!body.id) continue;
  //     //   const pos = body.GetPosition();
  //     //   const {x, y} = pos;
  //     //   let rotation = body.GetAngle();
  //     //   allBodies[body.id] = { position:{x, y}, rotation };
  //     //   // destroy(pos);
  //     // }
  //     world.DebugDraw();
  //     world.ClearForces();
  //     // lastInfoPost();
  //     postMessage({ shape: stack, allBodies, contact });
  //     stack = [];
  //     // freeLeaked();
  //     // contactcache = Object.assign({ }, concat);
  //     // concat = { };
  //     // console.log(contactcache);
  //   }
  //   else if (data.frame){
  //     __frame = data.frame;
  //   }
  //   else if (data.pause) {
  //     pause = data.pause;
  //   }
  // }
  // let allBodies = { };
  const lastInfoPost = ()=>{
    allBodies = { };
    _Interface.group.forEach((body, i)=>{
      const pos = body.GetPosition();
      const {x, y} = pos;
      // destroy(pos);
      let rotation = body.GetAngle();
      allBodies[i] = { position:{x, y}, rotation };
    })
  }
  // _createContactListener();
  
  world.SetAllowSleeping(false);
  // Comlink.expose(_Interface);
  
  // let scale = 0.5;
  // const bd = new b2BodyDef();
  // bd.set_type(b2_dynamicBody);
  // let body = world.CreateBody(bd);
  // buildTrisFixtures(globalCache['testtri'], body, scale);
  // // buildChainFixtures(globalCache['./img/mapCollider/boss1.svg'][0], body, 0.02);
  // let temp1 = new b2Vec2(0, 0);
  // body.SetTransform(temp1, 0);
  
  // console.log(body);
}




async function terrain(s = 0.4) {
  let promiseb = await Gameflow.require('support/promiseb');
  let img = await promiseb.loadImage(path + './gameflow-dev-lib/temp/t1.png');

  console.log(img);

  let drawWidth = img.width * s;
  let drawHeight = img.height * s;

  let safe = 20;
  let safePadding = Math.floor(safe / 5);

  resize(drawWidth + safe, drawHeight + safe);
  ctx.drawImage(img, 0, 0, img.width, img.height, safePadding, safePadding, drawWidth, drawHeight);

  let marchingSquares = await Gameflow.require('support/marchingSquares');
  let trans = await Gameflow.require('support/translation', marchingSquares, '?');
  let squares = trans.getMarchingSquares(ctx, canvas.width, canvas.height);
  let simplify = await Gameflow.require('support/simplify');

  let ccc = [];
  console.log(squares);
  squares.forEach((v) => {
    let nv = v.contours[0].map((_) => {
      return { x: _[0], y: _[1] }
    })
    // ccc.push(nv);
    ccc.push(simplify(nv, 2, true))
  })

  // ctx.fillStyle = 'green';
  // ctx.lineWidth = 8;

  console.log(ccc);
  // console.log(contours);
  contours = ccc[0];
  console.log(contours);
  contoursCopy = Array.from(contours);

  requestAnimationFrame(terrainhandle);
}

let contours = [];
let contoursCopy = [];
let speed = 5;
let terrainhandle = function () {
  if (!contours.length && contoursCopy.length) {
    console.log(contoursCopy);
    worker.context._createPolyBody(contoursCopy);
    contoursCopy = [];
    requestAnimationFrame(terrainhandle);
    return;
  }
  if (!contours.length) return requestAnimationFrame(terrainhandle);
  const a = contours.splice(0, speed);
  a.forEach((p) => {
    const { x, y } = p;
    ctx.fillStyle = 'green';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  })
  requestAnimationFrame(terrainhandle);
}

setFrame(1);

export { render, resize, setFrame, terrain, allBodies, contact, DrawOffset, _Interface1 };
