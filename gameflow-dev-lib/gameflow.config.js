(function (exports) { 'use strict';
  exports.__name__ = 'gameflowConfig';

  const load = function(){
    
  }

  exports.config = {
    path: './gameflow-dev-lib',
    module: {
      physical: './physical/index.js'
    }
  }
  

  // [static] export as AMD module / Node module / browser or worker variable;
  if (typeof define === 'function' && define.amd) define(function() { return exports; });
  else if (typeof module !== 'undefined') {
      module.exports = exports;
      module.exports.default = exports;
  } else if (typeof self !== 'undefined') self[exports.__name__] = exports;
  else window[exports.__name__] = exports;
  // delete exports.__name__;
})({});

