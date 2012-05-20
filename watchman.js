var fs = require('fs')
  , util = require('util')
  , events = require('events')
  , path = require('path')

/**
 * Watch one or more files or directories for changes.
 * @param {string|array} src The file or directory to watch.
 * @param {bool} options[recursive] (true) Whether to recurse directories
 * @return {WatchMan}
 */
exports.watch = function(src, options) {
  watcher = new WatchMan()
  watcher.watch(src, options)
  return watcher
}

/**
 * The WatchMan class tracks watchers and changes and emits events.
 */
function WatchMan() {
  events.EventEmitter.call(this)
}
util.inherits(WatchMan, events.EventEmitter)

WatchMan.prototype.watchers = []

WatchMan.prototype.watch = function(src, options) {
  var self = this
  if (options === undefined) options = {}
  if (options.recurse === undefined) options.recurse = true
  stats = fs.statSync(src)
  if (stats.isDirectory()) {
    if (options.recurse) {
      var files = fs.readdirSync(src)
      for (var i = 0, len = files.length; i < len; i++) {
        self.watch(src + '/' + files[i], options)
      }
    }
  }
  self.watchers[src] = fs.watch(src, function(event, filename) {
    if (path.existsSync(src)) {
      stats = fs.statSync(src)
      if (stats.isFile()) {
        self.emit('change', src, stats)
      } else if (stats.isDirectory()) {
        // Check if the dir is new
        if (self.watchers[src] === undefined) {
          self.emit('create', src, stats)
        }
        // Check files to see if there are any new files
        var dirFiles = fs.readdirSync(src)
        for (var i = 0, len = dirFiles.length; i < len; i++) {
          var file = src + '/' + dirFiles[i]
          if (self.watchers[file] === undefined) {
            self.watch(file, options)
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

WatchMan.prototype.unwatch = function(src, options) {
  var self = this
  if (options === undefined) options = {}
  if (options.recurse === undefined) options.recurse = true
  if (self.watchers[src] !== undefined) {
    self.watchers[src].close()
    delete self.watchers[src]
  }
  self.emit('unwatch', src)
}

WatchMan.prototype.clear = function() {
  var self = this
  for (var file in this.watchers) {
    self.unwatch(file)
  }
}
