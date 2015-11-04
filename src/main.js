"use strict";
var db = require('db')(require('idb-storage'));
var run = require('run');
var socket = require('ws-connection')("wss://lit.luvit.io/");
var remote = require('sync')(db, socket);

function* loadPackage(remote, name) {
  yield* socket.write("match " + name);
  var line = yield* socket.read();
  var match = line.match(/^reply ([^ ]+) ([^ ]+)$/);
  var version = match[1];
  var hash = match[2];
  // Syncing down any missing data for release.
  yield* remote.fetch(hash);

  // Walk the git tree manually to pull out a lua file as a string.
  var tag = yield* db.loadAs("tag", hash);
  var meta = JSON.parse(tag.message.match(/^[^\n]+/)[0]);
  if (meta.snapshot) {
    yield* remote.fetch(meta.snapshot);
  }

  return {
    version: version,
    hash: hash,
    tag: tag,
    meta: meta,
  };
}

run(function* () {

  // Sync down some packages
  var packages = [
    "creationix/websocket-codec",
    "luvit/luvit",
    "luvit/lit",
  ];
  while (packages.length) {
    var name = packages.shift();
    console.log("Syncing", name);
    var data = yield* loadPackage(remote, name);
    console.log(name, data);
    if (data.meta.dependencies) {
      for (var i = 0, l = data.meta.dependencies.length; i < l; i++) {
        packages.push(data.meta.dependencies[i].replace("@", " "));
      }
    }
  }
  remote.connection.close();

  // console.log(codec);
  // var tree = codec.toMap(yield* db.loadAs("tree", tag.object));
  // console.log(tree);
  // tree = codec.toMap(yield* db.loadAs("tree", tree.libs.hash));
  // console.log(tree);
  // var lua = bodec.toUnicode(
  //   yield* db.loadAs("blob", tree["codec.lua"].hash)
  // );
  // console.log(lua);

  // var hash = yield* db.saveAs("tree", [
  //   { name: "Welcome.txt",
  //     mode: modes.file,
  //     hash: yield* db.saveAs("blob", "Hello World\n") },
  // ]);
  // return yield* db.loadAs("tree", hash);
}, function (err, result) {
  if (err) { throw err; }
  else { console.log(result); }
});
