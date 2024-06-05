import * as Box2D from './Box2D.js';
import * as globalCache from '../other/globalCache.js';
import * as earcut from '../support/earcut.js';
import * as polyPartition from '../support/poly-partition.js';
import * as Comlink from '../support/comlink.mjs';

console.warn(Box2D);

async function wasmInit(){
  let wasm = await fetch('./Box2D.wasm');

  const bytes = await wasm.arrayBuffer();

  const context = await Box2D.Box2D();

  const instance = await WebAssembly.instantiate(bytes, context.im);

  context.complie(instance);

  let box2D = context.box2D;
  console.log(box2D);
  init1(box2D, 500);
}
wasmInit();

// async function wasmInit() {
//   // console.log(Box2D);
//   let wasm = await Box2D();
//   Box2D = wasm;
//   console.log(Box2D);
//   init1(wasm, 1);
// }
// wasmInit();

const PIXELS_PER_METER = 100;

const init1 = (box2D) => {
  let pause;

  let stack = [], concat = {}, contactcache={};

  const { b2CircleShape, b2Contact, b2Filter, JSContactListener, HEAPF32, _malloc, b2PolygonShape, b2Vec2, b2BodyDef, b2World, b2FixtureDef, b2_dynamicBody, JSDraw, b2Draw, wrapPointer, b2Color, destroy } = box2D;

  const gravity = new b2Vec2(0.0, 0.0);
  const world = new b2World(gravity);
  const draw = new JSDraw();
  draw.SetFlags(b2Draw.e_shapeBit);

  draw.DrawSegment = function (vert1, vert2, color) {
    var vert1V = wrapPointer(vert1, b2Vec2);
    var vert2V = wrapPointer(vert2, b2Vec2);
    stack.push({
      type: 'ctx',
      vert1: { x: vert1V.get_x(), y: vert1V.get_y() },
      vert2: { x: vert2V.get_x(), y: vert2V.get_y() },
      color, shape: 'seg',
    })
  };

  draw.DrawSolidCircle = draw.DrawCircle = function (center, radius, axis, fill) {
    var centerV = wrapPointer(center, b2Vec2);
    var axisV = wrapPointer(axis, b2Vec2);
    stack.push({
      type: 'ctx', center: { x: centerV.get_x(), y: centerV.get_y() }, radius, fill, shape: 'circle',
    })
  }

  draw.DrawPolygon = function (vertices, vertexCount, fill) {
    let verts = [];
    for (let tmpI = 0; tmpI < vertexCount; tmpI++) {
      var vert = wrapPointer(vertices + (tmpI * 8), b2Vec2);
      verts.push({ x: vert.get_x(), y: vert.get_y() })
    }
    stack.push({
      type: 'ctx', verts, shape: 'poly'
    })
  }
  draw.DrawSolidPolygon = draw.DrawPolygon;
  world.SetDebugDraw(draw);

  const createPolyBody = (verts, options={}) => {
    const bd = new b2BodyDef();
    options.dynamic ? bd.set_type(b2_dynamicBody) : null;
    let body = world.CreateBody(bd);
    const convexPolygons = cut(verts);
    buildTrisFixtures(convexPolygons, body, options);
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
    body.SetLinearDamping(options.linerDamping || 10);
    body.SetFixedRotation(options.fixedRotation || false);
    body.CreateFixture(fixtureDef);
    destroy(bd);
    destroy(fixtureDef);
    destroy(shape);
    _Interface.group.set(++id, body);
    body.id = id;
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
    _Interface.group.set(++id, body);
    body.id = id;
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
    destroy(p);
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
    destroy(temp);
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
    destroy(temp);
  }
  const _setposition = function(id, x, y){
    let body = _Interface.group.get(id);
    if(!body) return;
    let temp = new b2Vec2(x / PIXELS_PER_METER, y / PIXELS_PER_METER);
    body.SetTransform(temp, 0);
    destroy(temp);
    return true;
  }
  const _destory = function(id){
    let body = _Interface.group.get(id);
    world.DestroyBody(body);
    destroy(body);
    _Interface.group.delete(id);
    return id;
  }
  let contact = { };
  const _getContact = function(id, cache = false){
    let c = cache ? contactcache : contact;
    if(!id){
      return c;
    }
    return c[id];
  }
  const _addContactL = function(id){
    contact[id] = contact[id] || { };
  }
  const _removeContactL = function(id){
    delete contact[id];
  }
  const _createContactListener = ()=>{
    const listener = new JSContactListener();
    listener.BeginContact = function(c) {
      const contact1 = wrapPointer(c, b2Contact);
      console.log(contact1);
      const b1 = contact1.GetFixtureA().GetBody();
      const b2 = contact1.GetFixtureB().GetBody();
      if(contact1[b1.id] == undefined && contact1[b2.id] == undefined) return;
      contact[b1.id][b2.id] = true;
      contact[b2.id][b1.id] = true;
    };
    listener.EndContact = function(c) {
      // let contact = wrapPointer(c, b2Contact);
      // console.log(contact);
      // var fixtureA = contact.GetFixtureA().GetBody();
      // var fixtureB = contact.GetFixtureB().GetBody();
      // console.log(fixtureA, fixtureB, '1');
    };
    listener.PreSolve = function(contact) {
      
    };
    listener.PostSolve = function(contact) {

    };
    world.SetContactListener(listener);
    destroy(listener);
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
      _syncfront
    }
  }
  
  

  onmessage = (m) => {
    const data = m.data;
    if(data.update && !pause){
      world.Step(1 / 60, 3, 2);
      world.DebugDraw();
      world.ClearForces();
      lastInfoPost();
      postMessage({ shape: stack, allBodies, contact });
      stack = [];
      // contactcache = Object.assign({ }, concat);
      // concat = { };
      // console.log(contactcache);
    }
    else if (data.frame){
      __frame = data.frame;
    }
    else if (data.pause) {
      pause = data.pause;
    }
  }
  let allBodies = { };
  const lastInfoPost = ()=>{
    allBodies = { };
    _Interface.group.forEach((body, i)=>{
      const pos =  body.GetPosition();
      const {x, y} = pos;
      destroy(pos);
      let rotation = body.GetAngle();
      allBodies[i] = { position:{x, y}, rotation };
    })
  }
  // _createContactListener();
  

  Comlink.expose(_Interface);
  
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

