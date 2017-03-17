var fs = require('fs')
  , util = require('util')
  , events = require('events')
  , path = require('path')

/**
 * Watch one or more files or directories for changes.
 *
 * Options:
 *   - watchFn: Specify a custom filesystem watch function (eg: `fs.watchFile`)
 *
 * @param {string|array} src The file or directory to watch.
 * @param {array} options
 * @return {Hound}
 */
exports.watch = function(src, options) {
  var watcher = new Hound(options)
  watcher.watch(src)
  return watcher
}

/**
 * The Hound class tracks watchers and changes and emits events.
 */
function Hound(options) {
  events.EventEmitter.call(this)
  this.options = options || {}
}
util.inherits(Hound, events.EventEmitter)
Hound.prototype.watchers = []

/**
 * Watch a file or directory tree for changes, and fire events when they happen.
 * Fires the following events:
 * 'create' (file, stats)
 * 'change' (file, stats)
 * 'delete' (file)
 * @param {string} src
 * @return {Hound}
 */
Hound.prototype.watch = function(src) {
  var self = this
  var stats = fs.statSync(src)
  var lastChange = null
  var watchFn = self.options.watchFn || fs.watch
  if (stats.isDirectory()) {
    var files = fs.readdirSync(src)
    for (var i = 0, len = files.length; i < len; i++) {
      self.watch(src + path.sep + files[i])
    }
  }
  self.watchers[src] = watchFn(src, function(event, filename) {
    if (fs.existsSync(src)) {
      stats = fs.statSync(src)
      if (stats.isFile()) {
        if (lastChange === null || stats.mtime.getTime() > lastChange)
          self.emit('change', src, stats)
        lastChange = stats.mtime.getTime()
      } else if (stats.isDirectory()) {
        // Check if the dir is new
        if (self.watchers[src] === undefined) {
          self.emit('create', src, stats)
        }
        // Check files to see if there are any new files
        var dirFiles = fs.readdirSync(src)
        for (var i = 0, len = dirFiles.length; i < len; i++) {
          var file = src + path.sep + dirFiles[i]
          if (self.watchers[file] === undefined) {
            self.watch(file)
            self.emit('create', file, fs.statSync(file))
          }
        }
      }
    } else {
      self.unwatch(src)
      self.emit('delete', src)
    }
  })
  self.emit('watch', src)    
}

/**
 * Unwatch a file or directory tree.
 * @param {string} src
 */
Hound.prototype.unwatch = function(src) {
  var self = this
  if (self.watchers[src] !== undefined) {
    self.watchers[src].close()
    delete self.watchers[src]
  }
  self.emit('unwatch', src)
}

/**
 * Unwatch all currently watched files and directories in this watcher.
 */
Hound.prototype.clear = function() {
  var self = this
  for (var file in this.watchers) {
    self.unwatch(file)
  }
}
