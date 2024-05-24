import * as RAPIER from '@dimforge/rapier2d';

import * as PIXI from 'pixijs';

async function init(){

    await RAPIER;

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
    const size = 2;
    let colorPalette = [0xf3d9b1, 0x98c1d9, 0x053c5e, 0x1f7a8c];
    scene.scale.x = scene.scale.y = 20;
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
    const drawHandle = function(translator, collider){
      let translation = translator.translation();
      let half = collider.halfExtents();
      let rotation = collider.rotation();
      let gfx = cs.get(this).drawer;
      Object.assign(gfx.scale, half);
      Object.assign(gfx.position, translation);
      gfx.rotation = rotation;
    }

    // [world]
    let gravity = { x: 0.0, y: 9.81 };
    let world = new RAPIER.World(gravity);

    // [body]
    // ground
    let groundColliderDesc = RAPIER.ColliderDesc.cuboid(10.0, 0.5).setTranslation(10.0, 30.0);
    let ground = world.createCollider(groundColliderDesc);
    cs.set(ground, {
      drawer: graphics.clone(),
      drawHandle: drawHandle.bind(ground, ground, ground)
    })
    
    // rigidBody collider
    let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(20.1, 0.0);
    let rigidBody = world.createRigidBody(rigidBodyDesc);
    let colliderDesc = RAPIER.ColliderDesc.cuboid(1.0, 1.0);
    let collider = world.createCollider(colliderDesc, rigidBody);
    // rigidBody.lockRotations(true, true);
    cs.set(collider, {
      drawer: graphics.clone(),
      drawHandle: drawHandle.bind(collider, rigidBody, collider)
    })
    

    
    
    
    
    
    // [loop]
    
    cs.forEach((set)=>{
      scene.addChild(set.drawer);
    })
    let tick = 0;
    let pause = false;
    let run = ()=>{
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
};


init();


