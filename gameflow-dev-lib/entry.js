const __GLOBAL__ = typeof(window) != 'undefined' ? window : typeof(self) != 'undefined' ? self : 
typeof(globalThis) != 'undefined' ? globalThis : typeof(global) != 'undefined' ? global : null;
            
(function (exports) { 'use strict';
  exports.__name__ = 'gameflowEntry';

  // local with no ip, no port
  // document.gameflowlocaling = '^';

  const isLocal = function(force){
    if(force) return;
    if(typeof(document) == 'undefined') return;
    let tag = document.getElementsByTagName('script');
    let a = Array.from(tag);
    let length = a.length;
    for(let i=0; i<length; i++){
      let script = a[i];
      let src = script.getAttribute('src');
      if(/gameflow-dev-lib\/entry/i.test(src)){
        if(/^http/i.test(src)) return;
      }
    }
    return true;
  }

  const ip = function(force){
    if(isLocal(force)) return './';
    else return '192.168.31.195';
  }

  const port = function(force){
    if(isLocal(force)) return '';
    else return 5173;
  }

  const path = function(force){
    if(isLocal(force)) return '';
    else return `http://${ip(force)}:${port(force)}/`;
  }

  const requirePolyFill = function(requirejs){
    __GLOBAL__.__require__ = function(path){
        let initArgs = Array.from(arguments).slice(1, arguments.length);
        let resolve;
        let promise = new Promise((r)=>{
            resolve = r;
        })
        requirejs([path], (m)=>{
            resolve(m);
            let initCallback = m.__INIT__;
            initCallback ? initCallback(...initArgs) : null;
        })
        return promise; 
    }
  }

  function delayRequireJs(){
    let script = document.createElement('script');
    script.src = `${path()}./gameflow-dev-lib/require.js`;
    script.setAttribute('data-main', `${path()}./gameflow-dev-lib/index.js`);
    document.body.appendChild(script);
  }
  if(typeof(window) != 'undefined' && window.onload != 'undefined'){
    window.onload = delayRequireJs;
  }

  exports.ip = ip;
  exports.port = port;
  exports.path = path;
  exports.delayRequireJs = delayRequireJs;
  exports.requirePolyFill = requirePolyFill;

 
  // [static] export as AMD module / Node module / browser or worker variable;
  if (typeof define === 'function' && define.amd) define(function() { return exports; });
  else if (typeof module !== 'undefined') {
      module.exports = exports;
      module.exports.default = exports;
  } else if (typeof self !== 'undefined')self[exports.__name__] = exports;
  else window[exports.__name__] = exports;
  // delete exports.__name__;
})({});

