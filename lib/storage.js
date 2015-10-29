define("storage", function () {
  "use strict";

  if (!window.indexedDB) {
    alert("Your browser doesn't support a stable version of IndexedDB.");
  }

  var db;

  var clients = null;
  startup();

  return {
    read: read,
    write: write,
  };

  // read(key) -> data
  function* read(hash) {
    yield* wait();
    var request = db
      .transaction(["objects"], "readonly")
      .objectStore("objects")
      .get(hash);
    return yield function (cb) {
      request.onerror = function () {
        return cb("Error writing to database");
      };
      request.onsuccess = function (evt) {
        var blob = evt.target.result;
        if (!blob) { return cb(); }
        var reader = new FileReader();
        reader.addEventListener("loadend", function() {
          var data = new Uint8Array(reader.result);
          cb(null, data);
        });
        reader.readAsArrayBuffer(blob);
      };
    };
  }

  // write(key, data)
  function* write(key, data) {
    yield* wait();
    var blob = new Blob([data], {type: 'application/octet-binary'});
    var request = db
      .transaction(["objects"], "readwrite")
      .objectStore("objects")
      .put(blob, key);
    return yield function (cb) {
      request.onerror = function () {
        return cb("Error writing to database");
      };
      request.onsuccess = function () {
        return cb();
      };
    };
  }

  function lock() {
    if (clients) {
      throw new Error("Database already locked");
    }
    clients = [];
  }

  function unlock() {
    if (!clients) {
      throw new Error("Database is not locked");
    }
    var list = clients;
    clients = null;
    for (var i = 0, l = list.length; i < l; i++) {
      if (clients) { break; }
      list[i]();
    }
  }

  function* wait() {
    if (!clients) { return; }
    yield function (cb) { clients.push(cb); };
  }

  function startup() {
    lock();
    var request = window.indexedDB.open("objects", 2);
    request.onerror = function(event) {
      throw new Error("Failed to open indexedDB. Error code: " +
                      event.target.errorCode);
    };
    request.onsuccess = function(event) {
      console.log("IndexedDB objects database opened successfully.");
      db = event.target.result;
      unlock();
    };
    request.onupgradeneeded = function(event) {
      console.log("IndexedDB Upgraded");
      db = event.target.result;
      db.createObjectStore("objects", {});
    };
  }
});
