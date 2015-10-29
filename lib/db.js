define("db", function () {
  "use strict";

  var storage = require('storage');
  var codec = require('codec');
  var sha1 = require('sha1');
  var frame = codec.frame;
  var deframe = codec.deframe;
  var bodec = require('bodec');

  return {
    loadRaw: storage.read,
    loadAny: loadAny,
    loadAs: loadAs,
    saveRaw: saveRaw,
    saveAs: saveAs,
    getHash: getHash,
    getToken: getToken,
    setHash: setHash,
    setToken: setToken,
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
    return yield* saveRaw(frame(type, obj));
  }

  function* getRaw(email) {
    var data = yield* storage.read(email);
    if (data) { return data; }
    // Generate a random token
    data = bodec.create(40);
    window.crypto.getRandomValues(data);
    // initialize with empty tree.
    var hash = yield* saveAs("tree", []);
    bodec.fromHex(hash, data, 20);
    yield* storage.write(email, data);
    return data;
  }

  function* getToken(email) {
    var data = yield* getRaw(email);
    return bodec.toHex(data, 0, 20);
  }

  function* getHash(email) {
    var data = yield* getRaw(email);
    return bodec.toHex(data, 20, 40);
  }

  function* setHash(email, hash) {
    var data = yield* storage.read(email);
    if (data) { throw new Error("No such user: " + email); }
    bodec.fromHex(hash, data, 20);
    yield* storage.write(email, data);
  }

  function* setToken(email, token) {
    var data = yield* storage.read(email);
    if (data) { throw new Error("No such user: " + email); }
    bodec.fromHex(token, data, 0);
    yield* storage.write(email, data);
  }

});
