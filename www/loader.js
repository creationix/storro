(function () {
  "use strict";
  var modules = {};
  function req(path) {
    var mod = modules[path];
    if (mod) { return mod.exports; }
    mod = modules[path] = { path: path, exports: {} };
    var def = window[path];
    if (!def) { throw new Error("No such module: " + path); }
    var ret = window[path](mod, mod.exports, req);
    if (ret) { mod.exports = ret; }
    return mod.exports;
  }
  req("src/main.js");
})();
