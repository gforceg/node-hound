var fs = require('fs')
var util = require('util')
var events = require('events')

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
  fs.stat(src, function(err, stats) {
    if (err) throw(err)
    if (stats.isFile()) {
    } else if (stats.isDirectory()) {
      if (options.recurse) {
        fs.readdir(src, function(err, files) {
          if (err) throw err
          for (var i = 0, len = files.length; i < len; i++) {
            self.watch(src + '/' + files[i], options)
          }
        });
      }
    }
    self.emit('watch', src)    
  })
}

WatchMan.prototype.unwatch = function(src, options) {
  var self = this
  if (options === undefined) options = {}
  if (options.recurse === undefined) options.recurse = true
  self.emit('unwatch', src)
}

WatchMan.prototype.clear = function() {
  var self = this
  for (var file in this.watchers) {
    self.unwatch(file)
  }
}
