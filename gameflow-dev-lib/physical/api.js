importScripts('./Box2D_v2.3.1_min.js');
importScripts('../other/globalCache.js');
importScripts('../support/earcut.js');
importScripts('../support/decomp.js');
importScripts('../support/poly-partition.js');
importScripts('../support/comlink.js');

console.warn(polyPartition);

async function wasmInit() {
  // console.log(Box2D);
  let wasm = await Box2D();
  Box2D = wasm;
  console.log(Box2D);
  init1(wasm, 1);
}
wasmInit();

const init1 = () => {
  let pause, frame = 20, __frame = 20;

  

  onmessage = (m) => {
    const data = m.data;
    if (data.frame){
      __frame = data.frame;
    }
    else if (data.pause) {
      pause = data.pause;
    }
    else if (data.forwardPoly) {
      createPolyBody(data.forwardPoly);
    }
  }

  const { b2Vec2, b2BodyDef, b2World, b2FixtureDef, b2_dynamicBody, JSDraw, b2Draw, wrapPointer, b2Color, destroy } = Box2D;

  const gravity = new b2Vec2(0.0, 0.0);
  const world = new b2World(gravity);
  const draw = new JSDraw();
  draw.SetFlags(b2Draw.e_shapeBit);

  draw.DrawSegment = function (vert1, vert2, color) {
    var vert1V = Box2D.wrapPointer(vert1, Box2D.b2Vec2);
    var vert2V = Box2D.wrapPointer(vert2, Box2D.b2Vec2);
    stack.push({
      type: 'ctx',
      vert1: { x: vert1V.get_x(), y: vert1V.get_y() },
      vert2: { x: vert2V.get_x(), y: vert2V.get_y() },
      color, shape: 'seg',
    })
  };

  draw.DrawCircle = function (center, radius, axis, fill) {
    var centerV = Box2D.wrapPointer(center, Box2D.b2Vec2);
    var axisV = Box2D.wrapPointer(axis, Box2D.b2Vec2);
    stack.push({
      type: 'ctx', center: { x: centerV.get_x(), y: centerV.get_y() }, radius, fill, shape: 'circle',
    })
  }

  draw.DrawPolygon = function (vertices, vertexCount, fill) {
    let verts = [];
    for (tmpI = 0; tmpI < vertexCount; tmpI++) {
      var vert = Box2D.wrapPointer(vertices + (tmpI * 8), Box2D.b2Vec2);
      verts.push({ x: vert.get_x(), y: vert.get_y() })
    }
    stack.push({
      type: 'ctx', verts, shape: 'poly'
    })
  }
  draw.DrawSolidPolygon = draw.DrawPolygon;
  world.SetDebugDraw(draw);

  function bodyContexter(){ this.init(...arguments) };
  bodyContexter.prototype.constructor = bodyContexter;
  bodyContexter.prototype.init = function(body, bd){
    this.body = body;
    this.bd = bd;
  }
  bodyContexter.prototype.setTransform = function(x, y, rotate=0){
    const v = new b2Vec2(x, y);
    this.body.setTransform(v, rotate);
    destroy(v);
  }
  bodyContexter.prototype.getBody = function(){
    return this.body;
  }
  bodyContexter.prototype.destroy = function(){
    destroy(this.body);
    destroy(this.bd);
  }

  const createPolyBody = (verts, dynamic=true, scale=1) => {
    const bd = new b2BodyDef();
    dynamic ? bd.set_type(b2_dynamicBody) : null;
    let body = world.CreateBody(bd);
    const convexPolygons = cut(verts);
    buildTrisFixtures(convexPolygons, body, scale);
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

  function anyPolygonLite(array) {
    let verts1 = [];
    let start = array[0];
    array.forEach((v) => {
      verts1.push(v.x - start.x, (v.y - start.y));
    })
    verts1.push(verts1[0], verts1[1]);
    return verts1;
  }
  function earcutTris(verts1) {
    let triangles = earcut(verts1);
    let verts = [];
    const edges = getEdges(triangles);
    const adjacency = buildAdjacency(edges);
    const mergedPolygons = mergeTriangles(adjacency);
    console.warn(mergedPolygons);
    console.warn(`poly number ${verts.length}`);
    return verts;
  }


  function createPolygonShape(vertices, scale = 1) {
    var shape = new Box2D.b2PolygonShape();
    var buffer = Box2D._malloc(vertices.length * 8);
    var offset = 0;
    for (var i = 0; i < vertices.length; i++) {
      // console.log(vertices);
      Box2D.HEAPF32[buffer + offset >> 2] = vertices[i].x * scale;
      Box2D.HEAPF32[buffer + (offset + 4) >> 2] = vertices[i].y * scale;
      offset += 8;
    }
    var ptr_wrapped = Box2D.wrapPointer(buffer, Box2D.b2Vec2);
    shape.Set(ptr_wrapped, vertices.length);
    return shape;
  }
  function createChainShape(vertices, scale = 1, closedLoop = true) {
    var shape = new Box2D.b2ChainShape();
    var buffer = Box2D._malloc(vertices.length * 8);
    var offset = 0;
    for (var i = 0; i < vertices.length; i++) {
      Box2D.HEAPF32[buffer + offset >> 2] = vertices[i].x * scale;
      Box2D.HEAPF32[buffer + (offset + 4) >> 2] = vertices[i].y * scale;
      offset += 8;
    }
    var ptr_wrapped = Box2D.wrapPointer(buffer, Box2D.b2Vec2);
    if (closedLoop)
      shape.CreateLoop(ptr_wrapped, vertices.length);
    else
      shape.CreateChain(ptr_wrapped, vertices.length);
    return shape;
  }
  function buildTrisFixtures(verts, body, scale = 1, fixture = b2FixtureDef) {
    console.warn('tri count ' + verts.length)
    verts.forEach((vs, i) => {
      const fixtureDef = new fixture();
      var shape = createPolygonShape(vs, scale);
      const polygonShape = shape;
      fixtureDef.set_shape(polygonShape);
      fixtureDef.set_density(1);
      body.CreateFixture(fixtureDef);
      Box2D.destroy(fixtureDef);
      Box2D.destroy(polygonShape);
    })
  }

  /**
   * @deprecated
   * @param {any} verts
   * @param {any} body
   * @param {any} scale=1
   * @param {any} fixture=b2FixtureDef
   * @returns {any}
   */
  function buildChainFixtures(verts, body, scale = 1, fixture = b2FixtureDef) {
    if (!Array.isArray(verts[0])) verts = [verts];
    verts.forEach((vs) => {
      const fixtureDef = new fixture();
      var shape = createChainShape(vs, scale);
      const polygonShape = shape;
      fixtureDef.set_shape(polygonShape);
      fixtureDef.set_density(1);
      body.CreateFixture(fixtureDef);
      Box2D.destroy(fixtureDef);
      Box2D.destroy(polygonShape);
    })
  }


  let stack = [];
  const _run = ()=>{
    // requestAnimationFrame(_run);
    // if(--frame) return;
    // frame = __frame;
    main();
  }

  console.log(world.Step)
  const main = ()=>{
    world.Step(1 / 30, 2, 2);
    world.DrawDebugData();
    // console.log(body.GetPosition().y);
    world.ClearForces();
    postMessage({ shape: stack });
    stack = [];
  } 

  const run = ()=>{
    // [Dangerous] high frequency is [NOT ALLOWED] in some nodejs application 
    setInterval(()=>{
      _run();
    }, 1000 / 60);
    // requestAnimationFrame(_run);
  }

  run();

  // Interface for main thread
  let id = 0;
  const _createColliderGroup = function(name){
    _Interface.group.set(name, new Map());
  }
  const _createCircleBody = function(radius, groupname){
    
  }
  const _createPolyBody = function(verts, dynamic=true, scale=1, groupname, data={ }){
    let body = createPolyBody(verts, dynamic, scale);
    if(!body) return;
    body.id = (id++);
    console.warn(body);
    if(groupname){
      _setBodyGroup(groupname, body, data);
    }
    _Interface.group.set(body.id, { body, data });
    return body.id;
  }
  const _setBodyGroup = function(groupname, body, data={ }){
    let group = _Interface.group.get(groupname);
    if(!group) return;
    group.set(body.id, { body, data });
  }
  const _position = function(id){
    let data = _Interface.group.get(id);
    if(!data || !data.body) return;
    let p = body.GetPosition();
    const result = { x:p.x, y:p.y };
    return result;
  }
  const _force = function(id, x, y){
    let data = _Interface.group.get(id);
    if(!data || !data.body) return;
    let v = new b2Vec2(x, y);
    body.ApplyForceToCenter(v);
    destroy(v);
  }
  const printInterface = function(warn = true){
    warn ? console.warn(_Interface) : console.log(_Interface);
  }
  const _Interface = {
    group: new Map(),
    flags: new Map(),
    printInterface,
    context:{
      _createColliderGroup,
      _createPolyBody,
      _setBodyGroup,
    },
    body:{
      _position,
      _force,
    }
  }
  
  

  Comlink.expose(_Interface);
  
  // let scale = 0.5;
  // const bd = new b2BodyDef();
  // // bd.set_type(b2_dynamicBody);
  
  // const body = world.CreateBody(bd);
  
  // buildTrisFixtures(globalCache['testtri'], body, scale);
  // // buildChainFixtures(globalCache['./img/mapCollider/boss1.svg'][0], body, 0.02);
  // let temp1 = new b2Vec2(0, 0);
  // body.SetTransform(temp1, 0);
  // console.log(body);
  
  
}

