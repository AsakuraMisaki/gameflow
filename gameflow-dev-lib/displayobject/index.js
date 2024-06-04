(function (exports) { 'use strict';
  exports.__name__ = 'displayobject';

  let yoga;
  exports.__INIT__ = (_yoga)=>{
    yoga = _yoga;
  }

  const init = async function(){
    let yoga = await Gameflow.require('../support/yoga-layout/src/index.ts');
  }




  // [static] export as AMD module / Node module / browser or worker variable;
  if (typeof define === 'function' && define.amd) define(function() { return exports; });
  else if (typeof module !== 'undefined') {
      module.exports = exports;
      module.exports.default = exports;
  } else if (typeof self !== 'undefined')self[exports.__name__] = exports;
  else window[exports.__name__] = exports;
  // delete exports.__name__;
})({});