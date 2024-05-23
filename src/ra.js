import * as RAPIER from '@dimforge/rapier2d';

async function r(){

    await RAPIER;

    // Use the RAPIER module here.
    let gravity = { x: 0.0, y: 10 };
    let world = new RAPIER.World(gravity);

    let cs = [];
    // Create the ground
    let groundColliderDesc = RAPIER.ColliderDesc.cuboid(10.0, 0.1).setTranslation(0.0, 5.0);;
    let ground = world.createCollider(groundColliderDesc);
    // ground
    
    // Create a dynamic rigid-body.
    let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(0.0, 1.0);
    let rigidBody = world.createRigidBody(rigidBodyDesc);

    // Create a cuboid collider attached to the dynamic rigidBody.
    let colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5);
    let collider = world.createCollider(colliderDesc, rigidBody);
    const w = 1;
    const h = 1;
    collider.drawHandle = (ctx)=>{
      let v = rigidBody.translation();
      console.log(v);
      ctx.translate(v.x, v.y);
      let c = collider;
      ctx.rotate(c.rotation());
      ctx.fillStyle = 'blue';
      let s = c.halfExtents();
      ctx.fillRect(-s.x * w / 2, -s.y * h / 2, s.x * w, s.y * h);
    }
    ground.drawHandle = (ctx)=>{
      let c = ground;
      let v = c.translation();
      ctx.translate(v.x, v.y);
      ctx.rotate(ground.rotation());
      ctx.fillStyle = 'blue';
      let s = c.halfExtents();
      ctx.fillRect(-s.x * w / 2, -s.y * h / 2, s.x * w, s.y * h);
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


