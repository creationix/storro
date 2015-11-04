"use strict";

// Connect to a remote at url and return API object.
module.exports = function* (url) {

  return {
    fetch: fetch,
    publish: publish,
  };

  // Fetch a hash and all dependent hashes from remote at url.
  function fetch(hash) {
    throw "TODO: Implement fetch";
  }

  // Publish a hash and all dependent hashes to a remote at url.
  function publish(hash) {
    throw "TODO: Implement publish";
  }

};
