(function (exports) { 'use strict';
  exports.__name__ = 'promiseb';
  
  function newPromise(){
    let _ = { };
    let promise = new Promise((resolve, reject) => {
      _.resolve = resolve;
      _.reject = reject;
    });
    Object.assign(promise, _);
    return promise;
  }

  function loadImage(src){
    let promise = newPromise();
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // 如果需要处理跨域问题
    img.onload = () => promise.resolve(img);
    img.onerror = promise.reject;
    img.src = src;
    return promise;
  }

  exports.newPromise = newPromise;
  exports.loadImage = loadImage;
  


  // [static] export as AMD module / Node module / browser or worker variable;
  if (typeof define === 'function' && define.amd) define(function() { return exports; });
  else if (typeof module !== 'undefined') {
      module.exports = exports;
      module.exports.default = exports;
  } else if (typeof self !== 'undefined')self[exports.__name__] = exports;
  else window[exports.__name__] = exports;
  // delete exports.__name__;
})({});