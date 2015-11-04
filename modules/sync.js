"use strict";
/*global -fetch*/


// Lit websocket protocol
//
// Text Frames:
//   ERROR - '\0' error
//   MESSAGE - COMMAND data
//     "match creationix/coro-net"
//
// Binary Frames:
//   WANTS - 0x00 len (20 bytes) * len
//   SEND - raw deflated data

var bodec = require('bodec');
var codec = require('codec');
var pako = window.pako;

return function (db, socket) {

  return {
    fetch: fetch,
    publish: publish,
  };

  // Fetch a hash and all dependent hashes from remote at url.
  function* fetch(hash) {
    var wants = [];
    yield* addHash(hash);

    var i, l;
    while ((l = wants.length)) {

      var message = bodec.create(l * 20 + 2);
      message[0] = 0;
      message[1] = l;
      for (i = 0; i < l; i++) {
        bodec.fromHex(wants[i], message, 2 + i * 20);
      }
      yield* socket.write(message);
      wants.length = 0;
      for (i = 0; i < l; i++) {
        var raw = yield* socket.read();
        raw = pako.inflate(raw);
        hash = yield* db.saveRaw(raw);
        yield* scan(raw);
      }
    }

    function* addHash(hash) {
      var raw = yield* db.loadRaw(hash);
      if (raw) {
        yield* scan(raw);
      }
      else {
        console.log("Fetching", hash);
        wants.push(hash);
      }
    }

    function* scan(raw) {
      var i, l;
      var obj = codec.deframe(raw, true);
      if (obj.type === "tag") {
        yield* addHash(obj.body.object);
      }
      else if (obj.type === "commit") {
        for (i = 0, l = obj.body.parents; i < l; i++) {
          yield* addHash(obj.body.parents[i]);
        }
      }
      else if (obj.type === "tree") {
        for (i = 0, l = obj.body.length; i < l; i++) {
          yield* addHash(obj.body[i].hash);
        }
      }
    }
  }

  // Publish a hash and all dependent hashes to a remote at url.
  function publish(hash) {
    throw "TODO: Implement publish";
  }

};
