/*jshint strict:false*/

// In own file since we need non-strict mode for octal literals.
return {
  tree:   040000,
  blob:   0100644,
  file:   0100644,
  exec:   0100755,
  sym:    0120000,
  commit: 0160000,
  isBlob: function (mode) {
    return mode & 0140000 === 0100000;
  },
  isFile: function (mode) {
    return mode & 0160000 === 0100000;
  },
  toType: function (mode) {
    return mode === 0160000 ? "commit"
         : mode === 040000 ? "tree"
         : mode & 0140000 === 0100000 ? "blob" :
           "unknown";
  },
};
