import * as RAPIER from '@dimforge/rapier2d';

import * as PIXI from 'pixijs';

import * as PolyGen from '../src/polygen';

import * as Box2D from '../node_modules/box2d-wasm/dist/es/Box2D.js';

// Box2D().then(a=>{

// })
async function init(){
    await Box2D;
    await RAPIER;

    window.Box2D = Box2D;
    window.RAPIER = RAPIER;
    Box2D.default().then((a)=>{
      console.log(a);
    })
    // [init]
    let renderer = new PIXI.Renderer({
      backgroundColor: 0x292929,
      antialias: true,
      // resolution: pixelRatio,
      width: window.innerWidth,
      height: window.innerHeight,
    });
    let scene = new PIXI.Container();
    let cs = new Map(); //colliders set
    window.cs = cs;
    window.scene = scene;
    document.body.appendChild(renderer.view);
    // renderer.view.style.display = 'none';
    const size = 2;
    let colorPalette = [0xf3d9b1, 0x98c1d9, 0x053c5e, 0x1f7a8c];
    
    let graphics = new PIXI.Graphics();
    graphics.beginFill(colorPalette[0]);
    graphics.drawRect(-size/2, -size/2, size, size); // rotation center

    // [base render]
    let r = ()=>{
      renderer.render(scene);
      requestAnimationFrame(r);
    }
    requestAnimationFrame(r);

     // [draw]
    const draw = ()=> {
      cs.forEach(c => {
          c.drawHandle();
      })
    }
    const drawHandle = function(translator, collider, update){
      let translation = translator.translation();
      let half = collider.halfExtents();
      let rotation = collider.rotation();
      let gfx = cs.get(this).drawer;
      if(half){
        gfx.scale.x = half.x;
        gfx.scale.y = half.y;
      }
      
      // Object.assign(gfx.scale, half);
      Object.assign(gfx.position, translation);
      gfx.rotation = rotation;
      update ? update() : null;
    }

    // [world]
    let gravity = { x: 0.0, y: 9 };
    let world = new RAPIER.World(gravity);

    let eventQueue = new RAPIER.EventQueue(true);
    
    eventQueue.drainCollisionEvents((handle1, handle2, started) =>{
      console.log(e);
    })
    eventQueue.drainContactForceEvents(e=>{
      console.log(e);
    })

    let gy = 20.0;

    // [body]
    // ground
    let groundColliderDesc = RAPIER.ColliderDesc.cuboid(10.0, 0.5).setTranslation(10.0, gy);
    let ground = world.createCollider(groundColliderDesc);
    cs.set(ground, {
      drawer: graphics.clone(),
      drawHandle: drawHandle.bind(ground, ground, ground)
    })
    
    // rigidBody collider
    let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(10.0, gy/2);
    let rigidBody = world.createRigidBody(rigidBodyDesc);
    // rigidBody.setDominanceGroup(10);
    let colliderDesc = RAPIER.ColliderDesc.cuboid(1.0, 1.0).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
    let collider = world.createCollider(colliderDesc, rigidBody);
    window.b0 = rigidBody;
    // collider.setDensity(Infinity);
    // collider.setMass(Infinity);
    // collider.setFriction(Infinity);
    rigidBody.lockRotations(true, true);
    cs.set(collider, {
      drawer: graphics.clone(),
      drawHandle: drawHandle.bind(collider, rigidBody, collider, ()=>{
        // rigidBody.addForce(new RAPIER.Vector2(5, 0))
      })
    })

    collider.setSolverGroups(0x000D0004)
    collider.setCollisionGroups(0x000D0004);


    
    // convex
    let pointsCache = [[{"x":633.125,"y":1672.29},{"x":626.875,"y":1543.12},{"x":572.708,"y":1491.04},{"x":516.458,"y":1436.87},{"x":487.291,"y":1401.45},{"x":481.041,"y":1005.62},{"x":503.958,"y":976.451},{"x":549.791,"y":963.951},{"x":578.958,"y":1007.7},{"x":722.708,"y":1007.7},{"x":739.375,"y":961.868},{"x":914.375,"y":955.618},{"x":912.291,"y":853.535},{"x":856.041,"y":811.868},{"x":818.541,"y":766.035},{"x":628.958,"y":766.035},{"x":591.458,"y":807.701},{"x":572.708,"y":830.618},{"x":535.208,"y":855.618},{"x":493.541,"y":832.701},{"x":497.708,"y":547.285},{"x":535.208,"y":526.451},{"x":560.208,"y":480.618},{"x":953.958,"y":484.785},{"x":958.125,"y":1674.37}],[{"x":958.125,"y":380.618},{"x":433.125,"y":386.868},{"x":420.625,"y":424.368},{"x":343.541,"y":428.535},{"x":331.041,"y":503.535},{"x":293.541,"y":520.201},{"x":287.291,"y":909.785},{"x":324.791,"y":938.951},{"x":293.541,"y":959.785},{"x":287.291,"y":1424.37},{"x":324.791,"y":1459.79},{"x":331.041,"y":1488.95},{"x":374.791,"y":1511.87},{"x":397.708,"y":1547.29},{"x":424.791,"y":1574.37},{"x":428.958,"y":1676.45},{"x":18.541,"y":1672.29},{"x":3.958,"y":1.451},{"x":956.041,"y":3.535}],[{"x":441.625,"y":683.743},{"x":470.625,"y":686.743},{"x":469.125,"y":709.743},{"x":458.125,"y":717.243},{"x":440.125,"y":708.743}],[{"x":731.125,"y":872.743},{"x":756.625,"y":871.743},{"x":759.125,"y":895.243},{"x":744.125,"y":906.743},{"x":724.125,"y":896.743}],[{"x":444.625,"y":1345.24},{"x":467.625,"y":1347.74},{"x":471.125,"y":1375.24},{"x":453.625,"y":1388.74},{"x":435.625,"y":1373.24}],[{"x":298.208,"y":926.035},{"x":324.458,"y":918.785},{"x":327.208,"y":947.785},{"x":311.958,"y":956.785},{"x":293.708,"y":947.035}]]
    let points = [];
    pointsCache[1].forEach((p)=>{
      points.push(p.x*0.01, p.y*0.01);
    })
    console.warn(points);
    // points.push(pointsCache[1][0].x*0.1, pointsCache[1][0].y*0.1);
    // let vertices = [];
    // pointsCache[1].forEach((p)=>{
    //   vertices.push(p.x*0.1, p.y*0.1);
    // })
    
    // points = [
    //   3.899283349204671,
    //   1.3825852578795756,
    //   2.488977542388059,
    //   1.7655147263108029,
    //   2.4183666641219608,
    //   3.351483046167795,
    //   2.854095359656347,
    //   3.3082394100696795,
    //   3.2748602950485135,
    //   3.4080161303066143,
    //   2.3549001988611713,
    //   3.280140993484953,
    //   0.9634116882417012,
    //   1.9105040576019359,
    //   0.4261468259651036,
    //   0.3808298507909882,
    //   1.2255369328350587,
    //   2.044645069536585,
    //   2.2221660145854614,
    //   3.8063657231158503
    // ]
    let bodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(10, 0);
    let body = world.createRigidBody(bodyDesc);
    // body.setDominanceGroup(30);
    window.b1 = body;
    // body.enableCcd(true);
    // body.sleep();
    let colliderDesc1 = RAPIER.ColliderDesc.polyline(new Float32Array(points));
    let convexCollider = world.createCollider(colliderDesc1, body);
    convexCollider.setMass(10);
    convexCollider.setSolverGroups(0x000D0004)
    convexCollider.setCollisionGroups(0x000D0004);
    
    // let body_applyImpulse = body.applyImpulse;
    // body.applyImpulse = function(){
    //   body_applyImpulse.call(this, ...arguments);
    //   console.log(...arguments);
    // }
    let vertices = Array.from(convexCollider.vertices());
    console.warn(vertices);
    let convexgfx = new PIXI.Graphics();
    convexgfx.lineWidth = 2;
    convexgfx.beginFill(0xffffff, 1.0);
    convexgfx.strokeStyle = 0xffffff;
    convexgfx.moveTo(vertices[0], vertices[1]);
    for (let i = 2; i < vertices.length; i += 2) {
      convexgfx.lineTo(vertices[i], vertices[i + 1]);
    }
    convexgfx.lineTo(vertices[0], vertices[1]);
    cs.set(convexCollider, {
      drawer: convexgfx,
      drawHandle: drawHandle.bind(convexCollider, body, convexCollider, ()=>{
        // console.log(body.translation());
      })
    })
    
    
    // [loop]
    let bodyContainer = new PIXI.Container();
    bodyContainer.scale.x = bodyContainer.scale.y = 20;
    scene.addChild(bodyContainer)
    cs.forEach((set)=>{
      bodyContainer.addChild(set.drawer);
    })
    let tick = 0;
    let pause = false;
    let run = ()=>{
      // world.step();
      world.step();
      draw();
      requestAnimationFrame(gameLoop);
    }
    let gameLoop = ()=> {
      if(pause){
        requestAnimationFrame(gameLoop);
        return;
      }
      let now = performance.now();
      if(now - tick < 16){
        requestAnimationFrame(gameLoop);
        return;
      }
      tick = now;
      // rigidBody.addForce(new RAPIER.Vector2(1.0, 0.0));
      run();
    };

    let stepButton = document.getElementById('step');
    stepButton.addEventListener('click', ()=>{
      pause = true;
      run();
    });

    let playButton = document.getElementById('play');
    playButton.addEventListener('click', ()=>{
      pause = !pause;
    });

    run();
    requestAnimationFrame(gameLoop);

    polygenTest();
};

function polygenTest(){
  let canvas = document.createElement('canvas');
  let ctx = canvas.getContext('2d');
  let img = document.getElementById('terrianTest');
  ctx.drawImage(img, 0, 0, img.width, img.height);
  let data = ctx.getImageData(0, 0, img.width, img.height);
  let verts = PolyGen.extractVertices(data);
  console.log(verts);

  let vertices = [];
  verts.forEach((p)=>{
    vertices.push(p.x, p.y);
  })
  // let vertices = Array.from(convexCollider.vertices());
  

  let pointsCache = [[{"x":633.125,"y":1672.29},{"x":626.875,"y":1543.12},{"x":572.708,"y":1491.04},{"x":516.458,"y":1436.87},{"x":487.291,"y":1401.45},{"x":481.041,"y":1005.62},{"x":503.958,"y":976.451},{"x":549.791,"y":963.951},{"x":578.958,"y":1007.7},{"x":722.708,"y":1007.7},{"x":739.375,"y":961.868},{"x":914.375,"y":955.618},{"x":912.291,"y":853.535},{"x":856.041,"y":811.868},{"x":818.541,"y":766.035},{"x":628.958,"y":766.035},{"x":591.458,"y":807.701},{"x":572.708,"y":830.618},{"x":535.208,"y":855.618},{"x":493.541,"y":832.701},{"x":497.708,"y":547.285},{"x":535.208,"y":526.451},{"x":560.208,"y":480.618},{"x":953.958,"y":484.785},{"x":958.125,"y":1674.37}],[{"x":958.125,"y":380.618},{"x":433.125,"y":386.868},{"x":420.625,"y":424.368},{"x":343.541,"y":428.535},{"x":331.041,"y":503.535},{"x":293.541,"y":520.201},{"x":287.291,"y":909.785},{"x":324.791,"y":938.951},{"x":293.541,"y":959.785},{"x":287.291,"y":1424.37},{"x":324.791,"y":1459.79},{"x":331.041,"y":1488.95},{"x":374.791,"y":1511.87},{"x":397.708,"y":1547.29},{"x":424.791,"y":1574.37},{"x":428.958,"y":1676.45},{"x":18.541,"y":1672.29},{"x":3.958,"y":1.451},{"x":956.041,"y":3.535}],[{"x":441.625,"y":683.743},{"x":470.625,"y":686.743},{"x":469.125,"y":709.743},{"x":458.125,"y":717.243},{"x":440.125,"y":708.743}],[{"x":731.125,"y":872.743},{"x":756.625,"y":871.743},{"x":759.125,"y":895.243},{"x":744.125,"y":906.743},{"x":724.125,"y":896.743}],[{"x":444.625,"y":1345.24},{"x":467.625,"y":1347.74},{"x":471.125,"y":1375.24},{"x":453.625,"y":1388.74},{"x":435.625,"y":1373.24}],[{"x":298.208,"y":926.035},{"x":324.458,"y":918.785},{"x":327.208,"y":947.785},{"x":311.958,"y":956.785},{"x":293.708,"y":947.035}]]
  // let points = [];

  let gfx = ()=>{
    let vertices = [];
    pointsCache[1].forEach((p)=>{
      vertices.push(p.x*0.1, p.y*0.1);
    })
    let convexgfx = new PIXI.Graphics();
    convexgfx.lineWidth = 2;
    convexgfx.beginFill(0xffffff, 1.0);
    convexgfx.strokeStyle = 0xffffff;
    convexgfx.moveTo(vertices[0], vertices[1]);
    for (let i = 2; i < vertices.length; i += 2) {
      convexgfx.lineTo(vertices[i], vertices[i + 1]);
    }
    convexgfx.lineTo(vertices[0], vertices[1]);
  }

  gfx();
  
  let c = document.createElement('canvas');
  c.width = 1920;
  c.height = 1080;
  c.style.zIndex = -1;
  c.style.position = 'absolute';
  c.style.top = '0px';
  c.style.left = '0px';
  document.body.appendChild(c);
  let cctx = c.getContext('2d');
  cctx.lineWidth = 2;
  cctx.fillStyle = 'green'
  cctx.fillRect(0,0, c.width, c.height);
  let loop = (pointsCache)=>{
    cctx.save();
    vertices = [];
    pointsCache.forEach((p)=>{
      vertices.push(p.x, p.y);
    })
    cctx.beginPath();
    cctx.strokeStyle = "#ffffff";
    cctx.moveTo(vertices[0], vertices[1]);
    for (let i = 2; i < vertices.length; i += 2) {
      if(isNaN(vertices[i])){
        console.error()
      }
      
      cctx.lineTo(vertices[i], vertices[i + 1]);
    }
    cctx.lineTo(vertices[0], vertices[1]);
    cctx.stroke();
  }
  pointsCache.forEach(loop);

  let sprite = new PIXI.Sprite(PIXI.Texture.from(c));
  // window.scene.addChild(sprite);
  // sprite.scale.x = sprite.scale.y = 0.1;

  
  // ctx.lineTo(200, 20);

  
}


init();


