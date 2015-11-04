"use strict";
var db = require('db');
var run = require('run');
var makeRemote = require('remote');
var codec = require('codec');
var bodec = codec.bodec;

var url = "wss://lit.luvit.io/";
var remote;

function* loadPackage(name) {
  remote.write("match " + name);
  var line = yield* remote.read();
  var match = line.match(/^reply ([^ ]+) ([^ ]+)$/);
  var version = match[1];
  var hash = match[2];
  // Syncing down any missing data for release.
  yield* remote.fetch(hash);

  // Walk the git tree manually to pull out a lua file as a string.
  var tag = yield* db.loadAs("tag", hash);
  var json = tag.message.match(/^[^\n]+/)[0];
  return {
    version: version,
    hash: hash,
    tag: tag,
    meta: JSON.parse(json),
  };
}

run(function* () {

  // Sync down some packages
  remote = yield* makeRemote(url);
  var packages = [
    "creationix/websocket-codec",
    "luvit/luvit",
    "luvit/lit",
  ];
  for (var i = 0, l = packages.length; i < l; i++) {
    var name = packages[i];
    console.log(name, yield* loadPackage(name));
  }


  // console.log(codec);
  // var tree = codec.toMap(yield* db.loadAs("tree", tag.object));
  // console.log(tree);
  // tree = codec.toMap(yield* db.loadAs("tree", tree.libs.hash));
  // console.log(tree);
  // var lua = bodec.toUnicode(yield* db.loadAs("blob", tree["codec.lua"].hash));
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
