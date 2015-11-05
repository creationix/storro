"use strict";
var db = require('db')(require('idb-storage'));
var run = require('run');
// Run a local `lit serve` as a caching proxy to speed up tests and reduce
// load on the real server.
var socket = require('ws-connection')("ws://localhost:4822/");
var remote = require('sync')(db, socket);
var codec = require('codec');
var bodec = require('bodec');
var CodeMirror = window.CodeMirror;

run(function* () {

  console.log("Getting latest lit release.");
  yield* socket.write("match luvit/lit");
  var line = yield* socket.read();
  var match = line.match(/^reply ([^ ]+) ([^ ]+)$/);
  var version = match[1];
  var hash = match[2];
  // Syncing down any missing data.
  yield* remote.fetch(hash);

  // Walk the git tree manually to pull out a lua file as a string.
  var tag = yield* db.loadAs("tag", hash);
  var meta = JSON.parse(tag.message.match(/^[^\n]+/)[0]);
  console.log({
    tag: tag,
    meta: meta,
    version: version,
    hash: hash});

  // Loading the snapshot for the release
  // This will include full dependencies
  yield* remote.fetch(meta.snapshot);

  var tree = codec.toMap(yield* db.loadAs("tree", meta.snapshot));
  console.log(tree);
  tree = codec.toMap(yield* db.loadAs("tree", tree.deps.hash));
  console.log(tree);
  var lua = bodec.toUnicode(
    yield* db.loadAs("blob", tree["websocket-codec.lua"].hash)
  );
  var cm = CodeMirror(document.body, {
    value: lua,
    mode:  "lua"
  });

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
