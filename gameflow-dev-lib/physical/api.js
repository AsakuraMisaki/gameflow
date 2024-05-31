importScripts('./Box2D_v2.3.1_min.js');
importScripts('../other/globalCache.js');
importScripts('../support/earcut.js');
importScripts('../support/decomp.js');
importScripts('../support/poly-partition.js');

console.warn(polyPartition);
// importScripts('../require.js');
// importScripts('./lib/umd/embox2d-helpers.js');

// console.warn(globalCache);

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
      forwardPoly(data.forwardPoly);
    }
  }

  const { b2Vec2, b2BodyDef, b2World, b2FixtureDef, b2_dynamicBody, JSDraw, b2Draw, wrapPointer, b2Color } = Box2D;

  const gravity = new b2Vec2(0.0, 9.81);
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

  const forwardPoly = (_forwardPoly) => {
    let verts1 = [];
    const polyverts = _forwardPoly.map((v)=>{
      return [v.x, v.y];
    })
    // decomp.makeCCW(polyverts);
    // console.warn(polyverts);
    let convexPolygons = polyPartition.convexPartition(_forwardPoly, true);
    
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
    // verts1.push(anyPolygonLite(_forwardPoly));
    // let verts = [];
    let scale = 1;
    // verts1.forEach((vs) => {
    //   let tris = earcutTris(vs);
    //   verts = verts.concat(tris);
    // })
    // console.log(verts);
    const bd = new b2BodyDef();
    bd.set_type(b2_dynamicBody);
    const body = world.CreateBody(bd);
    // const fixtureDef = new b2FixtureDef();
    // const temp = convexPolygons.forEach((v) => {
    //   let shape = createPolygonShape(v);
    // })
    
    // var shape = createChainShape(vs, scale);
    // const polygonShape = shape;
    // fixtureDef.set_shape(polygonShape);
    // fixtureDef.set_density(1);
    // body.CreateFixture(fixtureDef);
    // Box2D.destroy(fixtureDef);
    // Box2D.destroy(polygonShape);
    // // console.log(temp);
    buildTrisFixtures(newConvexPolygons, body, scale);
    // // buildChainFixtures(_forwardPoly, body, scale);
    // let temp1 = new b2Vec2(25, 20);
    // body.SetTransform(temp1, 0);
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
    // earcut vertices index translation
    // indexs.forEach((v, i) => {
    //   if (i % 3) return;

    //   const index1 = indexs[i];
    //   const index2 = indexs[i + 1];
    //   const index3 = indexs[i + 2];

    //   const x1 = verts1[index1 * 2];
    //   const y1 = verts1[index1 * 2 + 1];
    //   const x2 = verts1[index2 * 2];
    //   const y2 = verts1[index2 * 2 + 1];
    //   const x3 = verts1[index3 * 2];
    //   const y3 = verts1[index3 * 2 + 1];

    //   verts.push([{ x: x1, y: y1 }, { x: x2, y: y2 }, { x: x3, y: y3 }]);
    // })
    console.warn(`tri number ${verts.length}`);
    return verts;
  }
  // const earcut = require('earcut');

  // 示例多边形（无孔）
  // const vertices = [0, 0, 10, 0, 10, 10, 0, 10];

  // // 使用 Earcut 进行三角剖分
  // const triangles = earcut(vertices);

  

  

  

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

  const main = ()=>{
    world.Step(1 / 60, 6, 2);
    world.DrawDebugData();
    // console.log(body.GetPosition().y);
    world.ClearForces();
    postMessage({ shape: stack });
    stack = [];
  } 

  const run = ()=>{
    setInterval(()=>{
      _run();
    }, 100/1000)
    // requestAnimationFrame(_run);
  }

  run();
  
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

