(function () {
  "use strict";
  var defs = {};
  var modules = {};
  window.define = function (name, def) {
    defs[name] = def;
  };
  window.require = function (name) {
    var mod = modules[name];
    if (mod) { return mod.exports; }
    var def = defs[name];
    if (!def) { throw new Error("No such module: " + name); }
    mod = modules[name] = { name: name, exports: {} };
    var ret = def(mod, mod.exports);
    if (ret) { mod.exports = ret; }
    return mod.exports;
  };
})();
