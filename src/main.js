"use strict";
var db = require('db');
var run = require('run');
var modes = require('modes');

run(function* () {

  var hash = yield* db.saveAs("tree", [
    { name: "Welcome.txt",
      mode: modes.file,
      hash: yield* db.saveAs("blob", "Hello World\n") },
  ]);
  return yield* db.loadAs("tree", hash);
}, function (err, result) {
  if (err) { throw err; }
  else { console.log(result); }
});
