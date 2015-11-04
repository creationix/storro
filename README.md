# Interfaces

This library tries to be easy to use, but you need to provide it some interfaces
for your platform.

## Storage Interface

You need to implement the storage interface so that storro can store and query
it's git object graph.

These are js-git style async functions.  That means they are ES6 generator
functions that yield continuables.  You will be called with `yield*` and must
not return till you're done.  If you need to wait on some I/O, yield a function
that takes a node-style callback.

```js
function* slowAdd(a, b) {
  var result = a + b;
  // Delay to make it slow
  yield function(cb) {
    setTimeout(result, cb);
  }
  return result;
}
```

### storage.read(key) -> data

Given a string key, you need to return the binary data.

### storage.write(key, data)

Given a string key and binary data, store it for later retrieval.

## Socket Interface

You need to implement a socket interface for connecting to remotes.  This needs
to have it's own message framing so that messages don't get re-chuncked.

These are also js-git style async functions.

### socket.read() -> data

Wait for a message and return the binary data.

### socket.write(data)

Send binary data.
