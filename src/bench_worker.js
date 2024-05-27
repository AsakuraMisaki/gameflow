importScripts('./lib/umd/Box2D.js');
importScripts('./lib/globalCache.js');

async function wasmInit(){
  let wasm = await fetch('./lib/umd/Box2D.wasm');

  const bytes = await wasm.arrayBuffer();

  const context = await Box2D();

  const instance = await WebAssembly.instantiate(bytes, context.im);

  context.complie(instance);

  let box2D = context.box2D;
  console.log(box2D);
  init(box2D, 500);
}
wasmInit();

let pause = false;
onmessage = (m)=>{
  const data = m.data;
  if(data.pause == 1){
    pause = !pause;
  }
}

function init (box2D, boxCount){
  const {
    b2_dynamicBody,
    b2BodyDef,
    b2CircleShape,
    b2Color,
    b2Draw: { e_shapeBit },
    b2EdgeShape,
    b2Transform,
    b2Vec2,
    b2PolygonShape,
    b2World,
    JSDraw,
    wrapPointer,
    destroy
  } = box2D;

  let stack = [];
  

  const gravity = new b2Vec2(0, 10);
  const world = new b2World(gravity);

  const bd_ground = new b2BodyDef();
  const ground = world.CreateBody(bd_ground);

  // ramp which boxes fall onto initially
  {
    const shape = new b2EdgeShape();
    shape.SetTwoSided(new b2Vec2(3, 4), new b2Vec2(6, 7));
    // ground.CreateFixture(shape, 0);
  }
  // floor which boxes rest on
  {
    const shape = new b2EdgeShape();
    shape.SetTwoSided(new b2Vec2(0, 28), new b2Vec2(64, 28));
    ground.CreateFixture(shape, 0);
  }
  // floor which boxes rest on
  {
    const shape = new b2EdgeShape();
    shape.SetTwoSided(new b2Vec2(0, 0), new b2Vec2(0, 28));
    ground.CreateFixture(shape, 0);
  }
  // floor which boxes rest on
  {
    const shape = new b2EdgeShape();
    shape.SetTwoSided(new b2Vec2(60, 0), new b2Vec2(60, 28));
    ground.CreateFixture(shape, 0);
  }

  const sideLengthMetres = 1;
  const square = new b2PolygonShape();
  square.SetAsBox(sideLengthMetres/2, sideLengthMetres/2);
  const circle = new b2CircleShape();
  circle.set_m_radius(sideLengthMetres/2);

  const ZERO = new b2Vec2(0, 0);
  const temp = new b2Vec2(0, 0);
  /**
   * @param {Box2D.b2Body} body
   * @param {number} index
   * @returns {void}
   */
  const initPosition = (body, index) => {
    temp.Set(4 + sideLengthMetres*(Math.random()-0.5), -sideLengthMetres*index);
    body.SetTransform(temp, 0);
    body.SetLinearVelocity(ZERO);
    body.SetAwake(1);
    body.SetEnabled(1);
  }

  // make falling boxes
  // const boxCount = 5000;
  for (let i = 0; i < boxCount; i++) {
    const bd = new b2BodyDef();
    bd.set_type(b2_dynamicBody);
    bd.set_position(ZERO);
    const body = world.CreateBody(bd);
    body.CreateFixture(i % 2 ? square : circle, 1);
    initPosition(body, i);
  }

  /**
   * to replace original C++ operator =
   * @param {Box2D.b2Vec2} vec
   * @returns {Box2D.b2Vec2}
   */
  const copyVec2 = vec =>
    new b2Vec2(vec.get_x(), vec.get_y());

  /**
   * to replace original C++ operator *= (float) 
   * @param {Box2D.b2Vec2} vec
   * @param {number} scale
   * @returns {Box2D.b2Vec2}
   */
  const scaledVec2 = (vec, scale) =>
    new b2Vec2(scale * vec.get_x(), scale * vec.get_y());

  /**
   * @param {Box2D.b2Color} color
   * @returns {string}
   */
  const getRgbStr = (color) => {
    const red = (color.get_r() * 255)|0;
    const green = (color.get_g() * 255)|0;
    const blue = (color.get_b() * 255)|0;
    return `${red},${green},${blue}`;
  };

  /** {@link Box2D.b2Vec2} is a struct of `float x, y` */
  const sizeOfB2Vec = Float32Array.BYTES_PER_ELEMENT * 2;

  /**
   * @param {number} array_p pointer to {@link Box2D.b2Vec2}
   * @param {number} numElements length of array
   * @param {number} sizeOfElement size of an instance of the array element
   * @param {typeof Box2D.b2Vec2} ctor constructor for the array element
   * @return {Box2D.b2Vec2[]}
   */
  const reifyArray = (array_p, numElements, sizeOfElement, ctor) =>
    Array(numElements)
      .fill(undefined)
      .map((_, index) =>
        wrapPointer(array_p + index * sizeOfElement, ctor)
      );

  const debugDraw = Object.assign(new JSDraw(), {
    /**
     * @param {number} vert1_p pointer to {@link Box2D.b2Vec2}
     * @param {number} vert2_p pointer to {@link Box2D.b2Vec2}
     * @param {number} color_p pointer to {@link Box2D.b2Color}
     * @returns {void}
     */
    DrawSegment(vert1_p, vert2_p, color_p) {
      const color = wrapPointer(color_p, b2Color);
      // setCtxColor(getRgbStr(color));
      const vert1 = wrapPointer(vert1_p, b2Vec2);
      const vert2 = wrapPointer(vert2_p, b2Vec2);
      stack.push({
        type:'ctx', vert1:{x:vert1.get_x(), y:vert1.get_y()}, vert2:{x:vert2.get_x(), y:vert2.get_y()}, shape:'seg'
      })
      // self.postMessage()
      // drawSegment(vert1, vert2);
      // destroy(color);
      // destroy(vert1);
      // destroy(vert2);
    },
    /**
     * @param {number} vertices_p pointer to Array<{@link Box2D.b2Vec2}>
     * @param {number} vertexCount
     * @param {number} color_p pointer to {@link Box2D.b2Color}
     * @returns {void}
     */
    DrawPolygon(vertices_p, vertexCount, color_p) {
      const color = wrapPointer(color_p, b2Color);
      // setCtxColor(getRgbStr(color));
      const vertices = reifyArray(vertices_p, vertexCount, sizeOfB2Vec, b2Vec2);
      let verts = vertices.map((v)=>{
        return {x:v.get_x(), y:v.get_y()}
      })
      stack.push({
        type:'ctx', verts, shape:'poly'
      })
      // drawPolygon(vertices, vertexCount, false);
      // destroy(vertices);
      // destroy(color);
    },
    /**
     * @param {number} vertices_p pointer to Array<{@link Box2D.b2Vec2}>
     * @param {number} vertexCount
     * @param {number} color_p pointer to {@link Box2D.b2Color}
     * @returns {void}
     */
    DrawSolidPolygon(vertices_p, vertexCount, color_p) {
      const color = wrapPointer(color_p, b2Color);
      // setCtxColor(getRgbStr(color));
      const vertices = reifyArray(vertices_p, vertexCount, sizeOfB2Vec, b2Vec2);
      let verts = vertices.map((v)=>{
        return {x:v.get_x(), y:v.get_y()}
      })
      stack.push({
        type:'ctx', verts, shape:'poly'
      })
      // drawPolygon(vertices, vertexCount, true);
      // destroy(vertices);
      // destroy(color);
    },
    /**
     * @param {number} center_p pointer to {@link Box2D.b2Vec2}
     * @param {number} radius
     * @param {number} color_p pointer to {@link Box2D.b2Color}
     * @returns {void}
     */
    DrawCircle(center_p, radius, color_p) {
      const color = wrapPointer(color_p, b2Color);
      // setCtxColor(getRgbStr(color));
      const center = wrapPointer(center_p, b2Vec2);
      const dummyAxis = new b2Vec2(0,0);
      let x = center.get_x();
      let y = center.get_y();
      // stack.push({
      //   type:'ctx', center:{x, y}, radius, shape:'circle'
      // })
      // drawCircle(center, radius, dummyAxis, false);
      // destroy(center);
      // destroy(color);
      destroy(dummyAxis);
    },
    /**
     * @param {number} center_p pointer to {@link Box2D.b2Vec2}
     * @param {number} radius
     * @param {number} axis_p pointer to {@link Box2D.b2Vec2}
     * @param {number} color_p pointer to {@link Box2D.b2Color}
     * @returns {void}
     */
    DrawSolidCircle(center_p, radius, axis_p, color_p) {
      const color = wrapPointer(color_p, b2Color);
      // setCtxColor(getRgbStr(color));
      const center = wrapPointer(center_p, b2Vec2);
      const axis = wrapPointer(axis_p, b2Vec2);
      // drawCircle(center, radius, axis, true);
      let x = center.get_x();
      let y = center.get_y();
      stack.push({
        type:'ctx', center:{x, y}, radius, shape:'circle'
      })
      // self.postMessage()
      // destroy(center);
      // destroy(color);
      // destroy(axis);
    },
    /**
     * @param {number} transform_p pointer to {@link Box2D.b2Transform}
     * @returns {void}
     */
    DrawTransform(transform_p) {
      const transform = wrapPointer(transform_p, b2Transform);
      drawTransform(transform);
      // destroy(transform);
    },
    /**
     * @param {number} vertex_p pointer to {@link Box2D.b2Vec2}
     * @param {number} sizeMetres
     * @param {number} pointer to {@link Box2D.b2Color}
     * @returns {void}
     */
    DrawPoint(vertex_p, sizeMetres, color_p) {
      const color = wrapPointer(color_p, b2Color);
      // setCtxColor(getRgbStr(color));
      const vertex = wrapPointer(vertex_p, b2Vec2);
      // drawPoint(vertex, sizeMetres);
      // destroy(color);
      // destroy(vertex);
    }
  });
  debugDraw.SetFlags(e_shapeBit);
  world.SetDebugDraw(debugDraw);

  // calculate no more than a 60th of a second during one world.Step() call
  const maxTimeStepMs = 1/60*1000;
  /** @param {number} deltaMs */
  const step = (deltaMs) => {
    const clampedDeltaMs = Math.min(deltaMs, maxTimeStepMs);
    world.Step(clampedDeltaMs/1000, 3, 2);
  };

  
  
  let prevMs = performance.now();

  setInterval(()=>{
    if(pause) return;
    // console.log('?');
    const nowMs = performance.now();
    const deltaMs = nowMs-prevMs;
    step(deltaMs);
    world.DebugDraw();
    prevMs = nowMs;
    postMessage({shape:stack});
    // postMessage({performance:{delta: deltaMs, memory:performance.memory.usedJSHeapSize/1024/1024}});
    stack = [];
  }, 60/1000)
  /** @type {?number} */
  let handle;
  // let fps = 60 / 1000;
  // (function loop(prevMs) {
  //   const nowMs = performance.now();
  //   handle = requestAnimationFrame(loop.bind(null, nowMs));
  //   if(pause) return;
  //   const deltaMs = nowMs-prevMs;
  //   step(deltaMs);
  //   world.DebugDraw();
  // })(performance.now());
}



// let matter2d = function(boxCount, _r = false) {
//     var Engine = Matter.Engine,
//         Render = Matter.Render,
//         Runner = Matter.Runner,
//         Composites = Matter.Composites,
//         MouseConstraint = Matter.MouseConstraint,
//         Mouse = Matter.Mouse,
//         Composite = Matter.Composite,
//         Bodies = Matter.Bodies;
//         Body = Matter.Body;

//     // create engine
//     var engine = Engine.create({
//       gravity: {x:0, y:1}
//     })
//     var world = engine.world;

//     // create renderer
//     var render = Render.create({
//         element: document.body,
//         engine: engine,
//         canvas: document.getElementById('demo-canvas'),
//         options: {
//             width: 1920,
//             height: 1080,
//             // showAngleIndicator: true
//         }
//     });


//     _r ? Render.run(render) : null;

//     // create runner
//     var runner = Runner.create();
//     Runner.run(runner, engine);

//     // add bodies
//     // var stack = Composites.pyramid(100, 605 - 25 - 16 * 20, 15, 10, 0, 0, function(x, y) {
//     //     return Bodies.rectangle(x, y, 40, 40);
//     // });
    
    


//     const sideLengthMetres = 32;
//     const square = Bodies.rectangle(0,0,sideLengthMetres/2, sideLengthMetres/2);
//     const circle = Bodies.circle(0,0,sideLengthMetres/2);

//     const initPosition = (body, index) => {
//         let temp = {x: 4 + sideLengthMetres*(Math.random()-0.5) + 100, y: -sideLengthMetres*index}
//         Body.setPosition(body, temp);
//     }

//     Composite.add(world, [
//       Bodies.rectangle(0, 900/2, 20, 900, { isStatic: true }),
//       Bodies.rectangle(1920/2, 900, 1920, 20, { isStatic: true }),
//       Bodies.rectangle(1920, 900/2, 20, 900, { isStatic: true }),
//     ]);

//     // make falling boxes
//     // const boxCount = 5000;
//     for (let i = 0; i < boxCount; i++) {
//         const bd = i % 2 ? 
//         Bodies.rectangle(0,0,sideLengthMetres, sideLengthMetres) : 
//         Bodies.circle(0,0,sideLengthMetres/2);
//         initPosition(bd, i);
//         Composite.add(world, bd);
//     }

// };

// let kinetics2d = function(boxCount) {
//   const { System, Circle, Entity, Colors, Movement, Vector } = window.Kinetics;
//   /** @ts-ignore */
//   const cellSize = window.cellSize = 2 ** 6;
//   function calculateApothem(width, height, centerX, centerY) {
//       const halfWidth = width / 2;
//       const halfHeight = height / 2;
//       const diagonal = Math.sqrt(halfWidth ** 2 + halfHeight ** 2);
//       const radius = Math.max(diagonal, Math.abs(centerX), Math.abs(centerY));
//       return radius;
//   }
//   ;
// const canvas = document.getElementById("demo-canvas");

// function invertColor(hex) {
//     if (hex.indexOf('#') === 0)
//         hex = hex.slice(1);
//     if (hex.length === 3)
//         hex = `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
//     if (hex.length !== 6)
//         return "#000000";
//     var r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16), g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16), b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
//     return `#${r.padStart(2, "0")}${g.padStart(2, "0")}${b.padStart(2, "0")}`;
// }
// const width = 1920;
// const height = 900;
// const centerX = width / 2;
// const centerY = height / 2;
// const sysRad = calculateApothem(width, height, centerX, centerY);
// console.log(sysRad);
// /** @ts-ignore */
// const system = window.system = new System({
//     tickRate: 60,
//     friction: 0.1,
//     gravity: 1,
//     collisionInfo: {
//         cellSize: Math.log2(cellSize),
//     },
//     camera: {
//         zoom: 1,
//     },
//     dimensions: new Vector(width, height),
//     //     sides: 4,
//     //     radius: 1_000,
//     //     rotation: Math.PI / 4,
//     //     config: {
//     //         render: { 
//     //             strokeColor: Colors.Red,
//     //             // fillColor: Colors.Red,
//     //             strokeWidth: 5,
//     //             hooks: {
//     //                 postRender: function(entity: Entity, context: CanvasRenderingContext2D) {
//     //                     const { bounds: { min }, center, velocity, hitbox } = entity;
//     //                     if (showHitbox.checked) {
//     //                         context.strokeStyle = Colors.Blue;
//     //                         context.lineWidth = 10;
//     //                         context.strokeRect(min.x, -min.y, hitbox.x, -hitbox.y);
//     //                     }
//     //                     if (showVectors.checked) {
//     //                         context.strokeStyle = invertColor(entity.rendering.fillColor || "#FF0000");
//     //                         context.lineWidth = 1;
//     //                         context.beginPath();
//     //                         context.moveTo(center.x, -center.y);
//     //                         context.lineTo(center.x + (velocity.x) * 10, -center.y - (velocity.y) * 10);
//     //                         context.stroke();
//     //                     }
//     //                     context.beginPath();
//     //                     context.arc(entity.center.x, entity.center.y, 5, 0, 2 * Math.PI);
//     //                     context.fillStyle = Colors.Blue;
//     //                     context.fill();
//     //                 }
//     //             }
//     //         },
//     //         thickness: 100,
//     //         elasticity: 1
//     //         // static: true
//     //     }
//     // },
//     // useRAF: true,
//     render: {
//         canvas,
//         background: "rgb(5, 28, 31)",
//         gridColor: "#FFFFFF",
//         gridWidth: 1,
//         // gridSize: cellSize,
//         hooks: {
//             preRender: function (context) {
//                 const halfWidth = system.width / 2;
//                 const halfHeight = system.height / 2;

//                 const topLeft = {x: -halfWidth, y: -halfHeight};

//                 context.strokeStyle = Colors.Peach;
//                 context.strokeRect(topLeft.x, topLeft.y, system.width, system.height);
//             },
//             postRender: function (context) {
//                 var _a;
//                 // fps.innerText = system.renderer.framerate.fps.toFixed(2);
//                 // momentum.innerText = system.momentum.toFixed(2);
//                 // kineticEnergy.innerText = system.kineticEnergy.toFixed(2);
//                 // worldUpdateRate.innerText = `${(1000 / (system.performance.worldUpdateRate || 1E-4)).toFixed(1)} hZ (${system.performance.worldUpdateRate.toFixed(2)} ms)`;
//                 // memoryUsage.innerText = `${system.performance.memoryUsage.toFixed(2)} MB`;
//                 /** @ts-ignore */
//                 // const keys = window.keys;
//                 // const entity = system.entities[0];
//                 // if (keys.size) {
//                 //     (_a = entity === null || entity === void 0 ? void 0 : entity.move) === null || _a === void 0 ? void 0 : _a.call(entity, ...keys);
//                 // }
//                 // (0, 0) is centerX, centerY
//                 // const width = width / 2;
//                 // const height = height / 2;
//             },
//         },
//     },
// });
// system.on("entityCreate", (entity) => {
//     console.log("A new entity has been created.", entity.id);
// });
// system.on("entityDelete", (entity) => {
//     console.log("An entity has been deleted.", entity.id);
// });
// function generatePolygon(sides, radius, rotation, centerX = 0, centerY = 0) {
//     const angleStep = (Math.PI * 2) / sides;
//     const vertices = [];
//     for (let i = 0; i < sides; i++) {
//         const startAngle = angleStep * i + rotation;
//         const x = centerX + radius * Math.cos(startAngle);
//         const y = centerY + radius * Math.sin(startAngle);
//         vertices.push(new Vector(x, y));
//     }
//     return vertices;
// }
// ;
// /** @ts-ignore */
// const arrowVertices = '40 0 40 20 100 20 100 80 40 80 40 100 0 50'
//     .split(' ')
//     .map((v, i, a) => i % 2 ? new Vector(+a[i - 1], +v) : null)
//     .filter(v => v);
// /** @ts-ignore */
// const chevron = '100 0 75 50 100 100 25 100 0 50 25 0'
//     .split(' ')
//     .map((v, i, a) => i % 2 ? new Vector(+a[i - 1], +v) : null)
//     .filter(v => v);
// /** @ts-ignore */
// const star = '50 0 63 38 100 38 69 59 82 100 50 75 18 100 31 59 0 38 37 38'
//     .split(' ')
//     .map((v, i, a) => i % 2 ? new Vector(+a[i - 1], +v) : null)
//     .filter(v => v);
// console.log(star);
// /** @ts-ignore */
// const heart = '50 0 100 0 100 50 50 100 0 50 0 0'
//     .split(' ')
//     .map((v, i, a) => i % 2 ? new Vector(+a[i - 1], +v) : null)
//     .filter(v => v);
// const opts = {
//     mass: 10,
//     speed: 1,
//     elasticity: 1,
//     angularSpeed: 1,
//     render: {
//         strokeColor: Colors.Red,
//         // fillColor: Colors.Red,
//         strokeWidth: 1,
//         // glowIntensity: 10000,
//         hooks: {
//             postRender: function (entity, context) {
//                 const { bounds: { min }, position: center, velocity, hitbox } = entity;
//                 // if (showHitbox.checked) {
//                 //     context.strokeStyle = Colors.Red;
//                 //     context.lineWidth = 1;
//                 //     context.strokeRect(min.x, -min.y, hitbox.x, -hitbox.y);
//                 // }
//                 // if (showVectors.checked) {
//                 //     context.strokeStyle = invertColor(entity.rendering.fillColor || "#FF0000");
//                 //     context.lineWidth = 1;
//                 //     context.beginPath();
//                 //     context.moveTo(center.x, -center.y);
//                 //     context.lineTo(center.x + (velocity.x) * 10, -center.y - (velocity.y) * 10);
//                 //     context.stroke();
//                 // }
//             }
//         }
//     },
// };


// const car = new Entity({
//     form: {
//         components: [
//             {
//                 form: {
//                     vertices: [
//                         new Vector(0, 0),
//                         new Vector(0, 200),
//                         new Vector(200, 200),
//                         new Vector(200, 0),
//                     ],
//                 },
//                 speed: 10,
//                 elasticity: 1,
//                 angularSpeed: 1,
//                 mass: 1,
//                 render: {
//                     strokeColor: Colors.Red,
//                 }
//             },
//             {
//                 form: {
//                     vertices: [new Vector(50, -20)]
//                 },
//                 radius: 20,
//                 speed: 10,
//                 elasticity: 1,
//                 angularSpeed: 1,
//                 mass: 1,
//                 render: {
//                     strokeColor: Colors.Green,
//                 }
//             },
//             {
//                 form: {
//                     vertices: [new Vector(150, -20)]
//                 },
//                 radius: 20,
//                 speed: 10,
//                 elasticity: 1,
//                 angularSpeed: 1,
//                 mass: 1,
//                 render: {
//                     strokeColor: Colors.Green,
//                 }
//             }
//         ]
//     },
//     ...opts,
// }, system);
// // system.addEntity(car);



// const sideLengthMetres = 32;

// const initPosition = (index) => {
//     let temp = {x: 4 + sideLengthMetres*(Math.random()-0.5) - 1920/2 + 300, y: -sideLengthMetres*index};
//     return temp;
// }

// let ba = new Entity(Object.assign({ form:{sides:4, radius:1080/2, offset:new Vector(-1920/2, 0), rotation:0}, static:true}, opts), system);

// let bb = new Entity(Object.assign({ form:{sides:4, radius:10, offset:new Vector(20, 0), rotation:Math.PI/4}, static:true}, opts), system);

// let bc = new Entity(Object.assign({ form:{sides:4, radius:10, offset:new Vector(0, 100), rotation:Math.PI/4}, static:true}, opts), system);
// // system.addEntity(ba); 
// // system.addEntity(bb); 
// // system.addEntity(bc); 

// // make falling boxes
// // const boxCount = 5000;
// for (let i = 0; i < boxCount; i++) {
//   let _pos = initPosition(i);
//   let position = new Vector(_pos.x, _pos.y);
//   let nopts = Object.assign({  }, opts);
//   let rect = new Entity(Object.assign({ form:{sides:4, radius:sideLengthMetres/2, offset:position, rotation:Math.PI/4 } }, nopts), system);
//   let circle = new Entity(Object.assign({ form:{sides:16, radius:sideLengthMetres/2, offset:position } }, nopts), system);
//   let bd = i % 2 ? rect : circle;
//   // bd.position.x = 0;
//   // bd.position.y = -300;
//   system.addEntity(bd); 
// }

// // for (let i = 0; i < 0; i++) {
// //     const ent2 = new Circle(Object.assign({ form:{radius: 50, sides:16} }, opts), system);
// //     // system.addEntity(ent2);
// // }
// // for (let i = 0; i < 2; i++) {
// //     const isCircle = Math.random() >= 1;
// //     /** random x & y coordinates which can be negative (given system.radius) */
// //     let x = i === 0 ? 0 : Math.random() * ((sysRad - 2000) * 2) - (sysRad - 2000);
// //     const y = i === 0 ? 0 : Math.random() * ((sysRad - 2000) * 2) - (sysRad - 2000);
// //     // if (x == 0) x = -100;
// //     // if (x > 0) x = -x - 100;
// //     const sides = i == 0 ? 3 : 4
// //     // const sides = 4;
// //     const radius = 50;
// //     const color = [
// //         "#F177DD",
// //         "#FC7677",
// //         "#F14E54",
// //         "#FFE869",
// //         "#FCC376",
// //         "#FFA500",
// //         "#00E16E",
// //         "#43FF91",
// //         "#8AFF69",
// //         "#00B2E1",
// //         "#768DFC",
// //         "#C0C0C0",
// //     ];
// //     const entColor = color[Math.floor(Math.random() * color.length)] || Colors.Red;
// //     if (isCircle) {
// //         const ent = new Circle({
// //             form: { vertices: [new Vector(x < 0 ? x : -x, y)], },
// //             radius,
// //             mass: 10,
// //             speed: 1,
// //             elasticity: 1,
// //             angularSpeed: 0.01,
// //             render: {
// //                 strokeColor: entColor,
// //                 strokeWidth: 1,
// //                 // glowIntensity: 10000,
// //                 hooks: {
// //                     postRender: function (entity, context) {
// //                         const { bounds: { min }, position: center, velocity, hitbox } = entity;
// //                         // if (showHitbox.checked) {
// //                         //     context.strokeStyle = Colors.Red;
// //                         //     context.lineWidth = 1;
// //                         //     context.strokeRect(min.x, -min.y, hitbox.x, -hitbox.y);
// //                         // }
// //                         // if (showVectors.checked) {
// //                         //     context.strokeStyle = invertColor(entity.rendering.fillColor || "#FF0000");
// //                         //     context.lineWidth = 1;
// //                         //     context.beginPath();
// //                         //     context.moveTo(center.x, -center.y);
// //                         //     context.lineTo(center.x + (velocity.x) * 10, -center.y - (velocity.y) * 10);
// //                         //     context.stroke();
// //                         // }
// //                     }
// //                 }
// //             },
// //         }, system);
// //         system.addEntity(ent);
// //     }
// //     else {
// //         const ent = new Entity({
// //             form: {
// //                 sides,
// //                 radius,
// //                 offset: { x, y }
// //                 // vertices: generatePolygon(sides, radius, 0, x, y),   
// //             },
// //             // vertices: generatePolygon(sides, radius, 0, x, y),
// //             mass: 10,
// //             speed: 1,
// //             elasticity: 1,
// //             angularSpeed: 0.01,
// //             render: {
// //                 // fillColor: entColor,
// //                 strokeColor: entColor,
// //                 strokeWidth: 1,
// //                 // glowIntensity: 10000,
// //                 hooks: {
// //                     postRender: function (entity, context) {
// //                         const { bounds: { min }, position: center, velocity, hitbox } = entity;
// //                         // if (showHitbox.checked) {
// //                         //     context.strokeStyle = Colors.Red;
// //                         //     context.lineWidth = 1;
// //                         //     context.strokeRect(min.x, -min.y, hitbox.x, -hitbox.y);
// //                         // }
// //                         // if (showVectors.checked) {
// //                         //     context.strokeStyle = invertColor(entity.rendering.fillColor || "#FF0000");
// //                         //     context.lineWidth = 1;
// //                         //     context.beginPath();
// //                         //     context.moveTo(center.x, -center.y);
// //                         //     context.lineTo(center.x + (velocity.x) * 10, -center.y - (velocity.y) * 10);
// //                         //     context.stroke();
// //                         // }
// //                     }
// //                 },
// //             },
// //         }, system);
// //         system.addEntity(ent);
// //     }
// // }
// // ;


// }

// window.onload = function(){
//   box2d(1000);
//   // matter2d(1000, true);
//   // kinetics2d(1000);
  

//   showPerformance();
// }
