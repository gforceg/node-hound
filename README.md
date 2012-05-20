watchman - directory tree watcher for node.js
=============================================

Cross platform directory tree watcher that works, even on Windows
-----------------------------------------------------------------

I've recently started some node.js projects, and have been very unhappy with the
results.  Many work well, but aren't cross platform.  watchman was written to
create a simple directory tree watcher, with lots of tests, that actually works.
Even on Windows.

watchman is designed to be very simple, fast and reliable.

Installation
------------

Install using npm:

```
npm install watchman
```

Usage
-----

```javascript
watchman = require('watchman')

// Create a directory tree watcher
watcher = watchman.watch('/tmp')

// Create a file watcher
watcher = watchman.watch('/tmp/file.txt')

// Add callbacks for file and directory events
watcher.on('create', function(file, stats) {
  console.log(file + ' was created')
})
watcher.on('change', function(file, stats) {
  console.log(file + ' was created')
})
watcher.on('delete', function(file) {
  console.log(file + ' was created')
})

// Unwatch specific files or directories
watcher.unwatch('/tmp/another_file')

// Unwatch all watched files and directories
watcher.clear()
```
