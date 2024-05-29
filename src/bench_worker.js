importScripts('./lib/umd/Box2D_v2.3.1_min.js');
importScripts('./lib/globalCache.js');
importScripts('./lib/earcut.js');
// importScripts('./lib/umd/embox2d-helpers.js');

console.log(globalCache);

async function wasmInit(){
  let wasm = await Box2D();
  Box2D = wasm;
  init1(wasm, 1);
}
wasmInit();


// async function wasmInit(){
//   let wasm = await fetch('./lib/umd/Box2D.wasm');

//   const bytes = await wasm.arrayBuffer();

//   const context = await Box2D();

//   const instance = await WebAssembly.instantiate(bytes, context.im);

//   context.complie(instance);

//   let box2D = context.box2D;
//   console.log(box2D);
//   init(box2D, 1);
// }
// wasmInit();



let log = { };




function init1() {
    let pause = false;
    onmessage = (m)=>{
      const data = m.data;
      if(data.pause == 1){
        pause = !pause;
      }
      else if(data.forwardPoly){
        forwardPoly(data.forwardPoly);  
      }
    }

    const {b2Vec2, b2BodyDef, b2World, b2FixtureDef, b2_dynamicBody, JSDraw, b2Draw, wrapPointer, b2Color} = Box2D;

    const gravity = new b2Vec2(0.0, 5.0);
    const world = new b2World(gravity);
    const draw = new JSDraw();
      draw.SetFlags(b2Draw.e_shapeBit);

      draw.DrawSegment = function (vert1, vert2, color) {
        var vert1V = Box2D.wrapPointer(vert1, Box2D.b2Vec2);
        var vert2V = Box2D.wrapPointer(vert2, Box2D.b2Vec2);                    
        // context.beginPath();
        // context.moveTo(vert1V.get_x(),vert1V.get_y());
        // context.lineTo(vert2V.get_x(),vert2V.get_y());
        // context.stroke();
        // ctx.strokeStyle = `rgb(${color.r * 255},${color.g * 255},${color.b * 255})`;
        // ctx.beginPath();
        // ctx.moveTo(vert1.get_x() * 10 + 400, -vert1.get_y() * 10 + 300);
        // ctx.lineTo(vert2.get_x() * 10 + 400, -vert2.get_y() * 10 + 300);
        // ctx.stroke();
        stack.push({
          type:'ctx', 
          vert1:{x:vert1V.get_x(), y:vert1V.get_y()}, 
          vert2:{x:vert2V.get_x(), y:vert2V.get_y()}, 
          color, shape:'seg', 
        })
      };
      // let verts = vertices.map((v)=>{
      //   return { x:v.get_x(), y:v.get_y() }
      // })

      draw.DrawCircle = function (center, radius, axis, fill) {                    
        var centerV = Box2D.wrapPointer(center, Box2D.b2Vec2);
        var axisV = Box2D.wrapPointer(axis, Box2D.b2Vec2);
        
        stack.push({
          type:'ctx', center:{x:centerV.get_x(), y:centerV.get_y()}, radius, fill, shape:'circle', 
        })

        // context.beginPath();
        // context.arc(centerV.get_x(),centerV.get_y(), radius, 0, 2 * Math.PI, false);
        // if (fill)
        //     context.fill();
        // context.stroke();
        
        // if (fill) {
        //     //render axis marker
        //     var vert2V = copyVec2(centerV);
        //     vert2V.op_add( scaledVec2(axisV, radius) );
        //     context.beginPath();
        //     context.moveTo(centerV.get_x(),centerV.get_y());
        //     context.lineTo(vert2V.get_x(),vert2V.get_y());
        //     context.stroke();
        // }
      }
      
      draw.DrawPolygon = function (vertices, vertexCount, fill) {
        let verts = [];
        for(tmpI=0;tmpI<vertexCount;tmpI++) {
            var vert = Box2D.wrapPointer(vertices+(tmpI*8), Box2D.b2Vec2);
            verts.push({ x:vert.get_x(), y:vert.get_y() })
            // if ( tmpI == 0 )
            //     context.moveTo(vert.get_x(),vert.get_y());
            // else
            //     context.lineTo(vert.get_x(),vert.get_y());
        }
        stack.push({
          type:'ctx', verts, shape:'poly'
        })
        // context.closePath();
        // if (fill)
        //     context.fill();
        // context.stroke();
    }

      draw.DrawSolidPolygon = draw.DrawPolygon;

      world.SetDebugDraw(draw);
    

      forwardPoly = (_forwardPoly)=>{
        // const {b2Vec2, b2BodyDef, b2World, b2FixtureDef, b2_dynamicBody, JSDraw, b2Draw, wrapPointer, b2Color} = Box2D;
        let verts1 = [];
        verts1.push(anyPolygonLite(_forwardPoly));
        let verts = [];
        let scale = 0.02;
        verts1.forEach((vs) => {
            let tris = earcutTris(vs);
            verts = verts.concat(tris);
        })
        console.log(verts);
        const bd = new b2BodyDef();
        // bd.set_type(b2_dynamicBody);
        const body = world.CreateBody(bd);

        const temp = _forwardPoly.map((v)=>{
          return new b2Vec2(v.x, v.y);
        })
        // console.log(temp);
        buildTrisFixtures(verts, body, scale);
        // buildChainFixtures(_forwardPoly, body, scale);
        let temp1 = new b2Vec2(25, 20);
        body.SetTransform(temp1, 0);
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
        let indexs = earcut(verts1);
        let verts = [];
        // earcut vertices index translation
        indexs.forEach((v, i) => {
            if (i % 3) 
                return;
            const index1 = indexs[i];
            const index2 = indexs[i + 1];
            const index3 = indexs[i + 2];

            const x1 = verts1[index1 * 2];
            const y1 = verts1[index1 * 2 + 1];
            const x2 = verts1[index2 * 2];
            const y2 = verts1[index2 * 2 + 1];
            const x3 = verts1[index3 * 2];
            const y3 = verts1[index3 * 2 + 1];

            verts.push([{x:x1, y:y1}, {x:x2, y:y2}, {x:x3, y:y3}]);
            // verts.push([
            //     new b2Vec2(x1, y1),
            //     new b2Vec2(x2, y2),
            //     new b2Vec2(x3, y3)
            // ]);
        })
        console.warn(`tri number ${verts.length}`);
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
    function createChainShape(vertices, scale=1, closedLoop=true) {
      var shape = new Box2D.b2ChainShape();            
      var buffer = Box2D._malloc(vertices.length * 8);
      var offset = 0;
      for (var i=0;i<vertices.length;i++) {
          Box2D.HEAPF32[buffer + offset >> 2] = vertices[i].x * scale;
          Box2D.HEAPF32[buffer + (offset + 4) >> 2] = vertices[i].y * scale;
          offset += 8;
      }            
      var ptr_wrapped = Box2D.wrapPointer(buffer, Box2D.b2Vec2);
      if ( closedLoop )
          shape.CreateLoop(ptr_wrapped, vertices.length);
      else
          shape.CreateChain(ptr_wrapped, vertices.length);
      return shape;
    }
    function buildTrisFixtures(verts, body, scale = 1, fixture = b2FixtureDef) {
        console.warn('tri count ' + verts.length)
        verts.forEach((vs) => {
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
      if(!Array.isArray(verts[0])) verts = [verts];
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
    // let verts1 = [];
    // globalCache['./img/mapCollider/5.svg'].forEach((v) => {
    //     verts1.push(anyPolygonLite(v));
    // })
    // let verts = [];
    
    // verts1.forEach((vs) => {
    //     let tris = earcutTris(vs);
    //     verts = verts.concat(tris);
    // })
    // buildTrisFixtures(verts, body, scale);
    let scale = 0.02;
    const bd = new b2BodyDef();
    // bd.set_type(b2_dynamicBody);
    const body = world.CreateBody(bd);
    // buildTrisFixtures(globalCache['testtri'], body, scale);
    // buildChainFixtures(globalCache['./img/mapCollider/boss1.svg'][0], body, 0.02);
    let temp1 = new b2Vec2(15, 15);
    body.SetTransform(temp1, 0);
    // console.log(body);
    let stack = [];
    let handle = setInterval(()=>{
      world.Step(1 / 60, 6, 2);
      world.DrawDebugData();
      // console.log(body.GetPosition().y);
      world.ClearForces();
      postMessage({ shape:stack });
      stack = [];
    }, 16)
}

