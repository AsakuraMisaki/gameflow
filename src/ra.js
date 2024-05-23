import * as RAPIER from '@dimforge/rapier2d';

async function r(){

    await RAPIER;

    // Use the RAPIER module here.
    let gravity = { x: 0.0, y: 10 };
    let world = new RAPIER.World(gravity);

    let cs = [];
    // Create the ground
    let groundColliderDesc = RAPIER.ColliderDesc.cuboid(10.0, 0.5).setTranslation(0.0, 1.5)

    let ground = world.createCollider(groundColliderDesc);
    // ground
    
    // Create a dynamic rigid-body.
    let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(0.0, 1.0);
    let rigidBody = world.createRigidBody(rigidBodyDesc);
    rigidBody.addForce(new RAPIER.Vector2(30.5, 0.0));
    rigidBody.lockRotations(true, false);
    // Create a cuboid collider attached to the dynamic rigidBody.
    let colliderDesc = RAPIER.ColliderDesc.cuboid(1.0, 1.0);
    let collider = world.createCollider(colliderDesc, rigidBody);
    let scale = 10;
    const size = 2 * scale;
    // const h = 2 * scale;
    collider.drawHandle = (ctx)=>{
      let v = rigidBody.translation();
      
      let c = collider;
      let s = c.halfExtents();
      let h = s.y * size;
      ctx.translate(v.x * size, v.y * size);
      ctx.rotate(c.rotation());
      console.log(c.rotation());
      ctx.fillStyle = 'blue';
      ctx.fillRect(v.x, v.y, s.x * size, h);
    }
    ground.drawHandle = (ctx)=>{
      let c = ground;
      let v = c.translation();
      let s = c.halfExtents();
      let h = s.y * size;
      ctx.translate(v.x * size, v.y * size);
      ctx.rotate(ground.rotation());
      ctx.fillStyle = 'blue';
      ctx.fillRect(v.x, v.y, s.x * size, h);
    }
    // Game loop. Replace by your own game loop system.
    cs.push(ground, collider);
    let canvas = document.getElementById('graph');
    let ctx = canvas.getContext('2d');
    
    let gameLoop = () => {
      // Ste the simulation forward.  
      world.step();

      // Get and print the rigid-body's position.
      // let position = rigidBody.translation();
      // console.log("Rigid-body position: ", position.x, position.y);

      draw(ctx, canvas, cs);

      setTimeout(gameLoop, 16);
    };

    

    gameLoop();
};

function draw(ctx, canvas, cs) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const w = 100;
  const h = 100;
  cs.forEach(c => {
      ctx.save();
      c.drawHandle(ctx);
      // ConvexPolygon

      ctx.restore();
  });
}

r();


