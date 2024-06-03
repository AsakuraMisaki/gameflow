(function (exports) {
  'use strict';
  exports.__name__ = 'gameflowIndex';

  const path = Gameflow.path();

  requirejs.config({
    baseUrl: path + './gameflow-dev-lib',
    paths: {
      config: './gameflow.config',
      comlink: './support/comlink',
      support: './support',
      animation: './animation',
      physical: './physical',
      queryobj: './queryobj',
    }
  });
  const requirePolyFill = function (path) {
    let initArgs = Array.from(arguments).slice(1, arguments.length);
    let resolve;
    let promise = new Promise((r) => {
      resolve = r;
    })
    requirejs([path], (m) => {
      let initCallback = m.__INIT__;
      initCallback ? initCallback(...initArgs) : null;
      resolve(m);
    })
    return promise;
  }
  Gameflow.require = requirePolyFill;
  Gameflow.abspath = path;

  async function init() {

    if (typeof (Comlink) == 'undefined') {
      Gameflow.global.Comlink = await Gameflow.require('comlink');
    }
    if (typeof (require) == 'undefined') {
      Gameflow.global.require = Gameflow.require;
    }

    let config = await Gameflow.require('config');
    console.log(config);

    let physical = await Gameflow.require('physical/index', path + './gameflow-dev-lib/physical/', path);
    console.warn(physical.worker);
    // [test]
    let verts = [
      { x: 9.876 + 20, y: 1.234 + 20 },
      { x: 7.654 + 20, y: 6.789 + 20 },
      { x: 3.210 + 20, y: 9.876 + 20 },
      { x: -1.234 + 20, y: 9.543 + 20 },
      { x: -5.432 + 20, y: 8.765 + 20 },
      { x: -9.876 + 20, y: 6.543 + 20 },
      { x: -8.765 + 20, y: 2.345 + 20 },
      { x: -6.543 + 20, y: -1.234 + 20 }
    ]
    Gameflow.DevRegister('physical', physical);
    physical.render();
    // physical.terrain(0.2);

    console.log('requirejs work');
  };
  
  init();



  // [static] export as AMD module / Node module / browser or worker variable;
  if (typeof define === 'function' && define.amd) define(function () { return exports; });
  else if (typeof module !== 'undefined') {
    module.exports = exports;
    module.exports.default = exports;
  } else if (typeof self !== 'undefined') self[exports.__name__] = exports;
  else window[exports.__name__] = exports;
  // delete exports.__name__;
})({});



