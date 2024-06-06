import { default as Gameflow } from './entry.js';
Gameflow.global.Gameflow = Gameflow;

import * as Physical from './physical/index.js';
Gameflow.register('physical', Physical);

Physical.render();


// import * as Display from './displayobject/index.js';
// console.warn(Display);



