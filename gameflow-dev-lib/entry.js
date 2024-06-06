const global = typeof (window) != 'undefined' ? window : typeof (self) != 'undefined' ? self :
typeof (globalThis) != 'undefined' ? globalThis : typeof (global) != 'undefined' ? global : null;

let Dev = {};
const register = function (name, any) {
  exports[name] = any;
}

// dev config
const isLocal = function (force) {
  if (force) return;
  if (typeof (document) == 'undefined') return;
  let tag = document.getElementsByTagName('script');
  let a = Array.from(tag);
  let length = a.length;
  for (let i = 0; i < length; i++) {
    let script = a[i];
    let src = script.getAttribute('src');
    if (/gameflow-dev-lib\/index/i.test(src)) {
      if (/^http/i.test(src)) return;
    }
  }
  return true;
}

let _ip = '192.168.31.195';
const ip = function (force) {
  if (isLocal(force)) return './';
  else return _ip;
}

const setIp = (__ip) => {
  _ip = __ip;
}

const port = function (force) {
  if (isLocal(force)) return '';
  else return 5173;
}

const path = function (force) {
  if (isLocal(force)) return '';
  else return `http://${ip(force)}:${port(force)}/`;
}

let _config = {};
const config = function () {
  return _config;
}

let exports = { };
Object.assign(exports, {Dev, register, ip, port, path, setIp, config, global});

export default exports;