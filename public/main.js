

import * as _PIXI from 'pixi.js';
// import * as Spine from './pixi-spine-3.8.js';

import * as Spine from 'pixi-spine';

import * as fix from './pixi7es5';


let PIXI = { };
Object.assign(PIXI, _PIXI);
PIXI.Spine = Spine;
PIXI.Renderer.registerPlugin = fix.registerPlugin;
PIXI.es5New = fix.es5New;

export default PIXI;