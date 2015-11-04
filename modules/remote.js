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

var db = require('db');
var bodec = require('bodec');
var codec = require('codec');
var pako = window.pako;

// Connect to a remote at url and return API object.
module.exports = function* (url) {

  var connection = new WebSocket(url, ['lit']);
  connection.binaryType = 'arraybuffer';

  // Wait for the connection before moving on.
  yield function (cb) {
    connection.onopen = function () {
      cb();
    };
    connection.onerror = function (error) {
      cb(new Error("Problem connecting to " + url + ":" + error));
    };
  };

  connection.onerror = function (error) {
    var err = new Error(error);
    if (waiting) {
      var cb = waiting;
      waiting = null;
      return cb(err);
    }
    throw err;
  };

  var queue = [];
  var waiting = null;
  // Log messages from the server
  connection.onmessage = function (evt) {
    var data;
    if (typeof evt.data === "string") {
      data = evt.data;
    }
    else {
      data = new Uint8Array(evt.data);
    }

    if (waiting) {
      var cb = waiting;
      waiting = null;
      return cb(null, data);
    }
    queue.push(data);
  };

  function* read() {
    if (queue.length) {
      return queue.shift();
    }
    if (waiting) {
      throw new Error("Only one read at a time allowed!");
    }
    return yield function (cb) {
      waiting = cb;
    };
  }

  function write(message) {
    if (typeof message === "string") {
      connection.send(message);
    }
    else {
      connection.send(message.buffer);
    }
  }

  return {
    read: read,
    write: write,
    fetch: fetch,
    publish: publish,
    connection: connection,
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
      write(message);
      wants.length = 0;
      for (i = 0; i < l; i++) {
        var raw = yield* read();
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
