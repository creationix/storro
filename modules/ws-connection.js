"use strict";

return function (url) {
  var connection;
  var waiting;
  var queue = [];

  return {
    read: read,
    write: write,
  };

  // Ensure a connection.
  function* connect() {
    if (connection) { throw new Error("Already connected!"); }
    connection = new WebSocket(url, ['lit']);
    connection.binaryType = 'arraybuffer';

    yield function (cb) {
      connection.onopen = function () { cb(); };
      connection.onerror = function () {
        cb(new Error("Problem connecting to " + url));
      };
    };
    delete connection.onerror;
    connection.onclose = onClose;
    connection.onmessage = onMessage;
  }

  function onClose() {
    connection = null;
    if (waiting) {
      var cb = waiting;
      waiting = null;
      return cb(new Error("Connection closed"));
    }
  }

  function onMessage(evt) {
    var data;
    if (typeof evt.data === "string") { data = evt.data; }
    else { data = new Uint8Array(evt.data); }
    if (waiting) {
      var cb = waiting;
      waiting = null;
      return cb(null, data);
    }
    queue.push(data);
  }

  function* read() {
    if (queue.length) { return queue.shift(); }
    if (waiting) { throw new Error("Only one read at a time"); }
    if (!connection) { yield* connect(); }
    return yield function (cb) { waiting = cb; };
  }

  function* write(message) {
    if (!connection) { yield* connect(); }
    connection.send(message);
  }
};
