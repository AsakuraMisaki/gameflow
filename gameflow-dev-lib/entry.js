
// var GameflowDev = { };            
(function (exports) { 'use strict';
  exports.__name__ = 'Gameflow';

  exports.global = typeof(window) != 'undefined' ? window : typeof(self) != 'undefined' ? self : 
  typeof(globalThis) != 'undefined' ? globalThis : typeof(global) != 'undefined' ? global : null;

  let Dev = { };
  exports.Dev = Dev;

  exports.DevRegister = function(name, any){
    Dev[name] = any;
  }

  

  // dev config
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

  let _ip = '192.168.31.195';
  const ip = function(force){
    if(isLocal(force)) return './';
    else return _ip;
  }

  const setIp = (__ip)=>{
    _ip = __ip;
  }

  const port = function(force){
    if(isLocal(force)) return '';
    else return 5173;
  }

  const path = function(force){
    if(isLocal(force)) return '';
    else return `http://${ip(force)}:${port(force)}/`;
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
  exports.setIp = setIp;
  exports.delayRequireJs = delayRequireJs;
  

 
  // [static] export as AMD module / Node module / browser or worker variable;
  if (typeof define === 'function' && define.amd) define(function() { return exports; });
  else if (typeof module !== 'undefined') {
      module.exports = exports;
      module.exports.default = exports;
  } else if (typeof self !== 'undefined')self[exports.__name__] = exports;
  else window[exports.__name__] = exports;
  // delete exports.__name__;
})({});

