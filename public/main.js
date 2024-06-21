import 'pixi-spine' // Do this once at the very start of your code. This registers the loader!

import * as PIXI from 'pixijs';
import {Spine} from 'pixi-spine';

const app = new PIXI.Application();
document.body.appendChild(app.view);

PIXI.Assets.load("spine-data-1/HERO.json").then((resource) => {
	const animation = new Spine(resource.spineData);
    app.stage.addChild(animation);

    // add the animation to the scene and render...
    app.stage.addChild(animation);
    
    if (animation.state.hasAnimation('run')) {
        // run forever, little boy!
        animation.state.setAnimation(0, 'run', true);
        // dont run too fast
        animation.state.timeScale = 0.1;
        // update yourself
        animation.autoUpdate = true;
    }
});