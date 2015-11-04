"use strict";

var storage = require('storage');
var codec = require('codec');
var sha1 = require('sha1');

module.exports = {
  loadRaw: storage.read,
  loadAny: loadAny,
  loadAs: loadAs,
  saveRaw: saveRaw,
  saveAs: saveAs,
};

function* loadAny(hash) {
  return deframe(yield* storage.read(hash), true);
}

// loadAs(type, hash) -> decoded object
function* loadAs(type, hash) {
  var data = yield* loadAny(hash);
  if (data.type !== type) { throw new TypeError("Type mismatch"); }
  return data.body;
}

function* saveRaw(data) {
  var hash = sha1(data);
  yield* storage.write(hash, data);
  return hash;
}

// saveAs(type, obj) -> hash
function* saveAs(type, obj) {
  return yield* saveRaw(codec.frame(type, obj));
}
