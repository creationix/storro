"use strict";

var storage = require('storage');
var codec = require('codec');
var sha1 = require('sha1');
var pako = window.pako;

module.exports = {
  loadRaw: loadRaw,
  loadAny: loadAny,
  loadAs: loadAs,
  saveRaw: saveRaw,
  saveAs: saveAs,
};

function* loadRaw(hash) {
  var raw = yield* storage.read(hash);
  return raw && pako.inflate(raw);
}

function* loadAny(hash) {
  return codec.deframe(yield* loadRaw(hash), true);
}

// loadAs(type, hash) -> decoded object
function* loadAs(type, hash) {
  var data = yield* loadAny(hash);
  if (data.type !== type) { throw new TypeError("Type mismatch"); }
  return data.body;
}

function* saveRaw(data) {
  var hash = sha1(data);
  yield* storage.write(hash, pako.deflate(data));
  return hash;
}

// saveAs(type, obj) -> hash
function* saveAs(type, obj) {
  return yield* saveRaw(codec.frame(type, obj));
}
