(function (root, factory) {
  if (typeof define === 'function' && define.amd) define([], factory); // AMD. Register as an anonymous module.
  else if (typeof module === 'object' && module.exports) module.exports = factory(); // Node. CommonJS-like environments that support module.exports, like Node.
  else factory(root.gameflowConfig = { }); // Browser globals (root is window)
}(typeof self !== 'undefined' ? self : this, function (exports = { }) {

  // just set [distAsServer] to false to use in offline project
  const distAsServer = true;
  const port = 5173;
  // used for local server standalone project
  // like rpgmaker project, other nodejs project
  const ip = distAsServer ? '192.168.31.195' : './';
  const server = distAsServer ? `http://${ip}:${port}/` : `./`;
  const main = 'gameflow-dev-lib/';


  const dist = {
    lib: function(name, sub = 'support'){
      if(/!\.js$/i.test(name)) name += '.js';
      return server+main+sub+'/'+name;
    }
  }

  exports.dist = dist;
  

  return exports; // Export the public API of the module
}));