var watchMan = require('../watchman')
  , fs = require('fs')
  , path = require('path')
  , util = require('util')

var testSource = path.normalize(__dirname + '/data')
  , testDir = path.normalize(__dirname + '/../tmp')

/**
 * Deletes a source recursively, used for set up.
 * @param {string} src
 */
function deleteFile(src) {
  if (!path.exists(src)) return
  var stat = fs.statSync(src)
  // if (stat === undefined) return
  if (stat.isDirectory()) {
    var files = fs.readdirSync(src)
    for (var i = 0, len = files.length; i < len; i++) {
      deleteFile(src + '/' + files[i])
    }
    fs.rmdirSync(src)
  } else {
    fs.unlinkSync(src)
  }
}
/**
 * Copies a source recursively, used for set up.
 * @param {string} src
 * @param {string} src
 */
function copyFile(src, dest) {
  stat = fs.statSync(src)
  if (stat.isDirectory()) {
    if (!path.existsSync(dest)) fs.mkdirSync(dest)
    var files = fs.readdirSync(src)
    for (var i = 0, len = files.length; i < len; i++) {
      copyFile(src + '/' + files[i], dest + '/' + files[i])
    }    
  } else {
    if (!path.existsSync(dest)) {
      util.pump(fs.createReadStream(src), fs.createWriteStream(dest))
    }
  }
}

describe('WatchMan', function() {
  /**
   * Initialise test area with files.
   */
  beforeEach(function() {
    deleteFile(testDir)
    copyFile(testSource, testDir)
  })

  it('can watch a file', function(done) {
    var file = testDir + '/file 1.js'
    var watcher = watchMan.watch(file)
    watcher.on('watch', function(src) {
      expect(src).toBe(file)
      done()
    })
  })

  it('can watch a directory', function(done) {
    var watcher = watchMan.watch(testDir, {recurse: false})
    watcher.on('watch', function(src) {
      expect(src).toBe(testDir)
      done()
    })
  })

  it('can watch a directory tree', function(done) {
    var fileCount = 8
      , watchedFiles = 0
    var watcher = watchMan.watch(testDir)
    watcher.on('watch', function(src) {
      watchedFiles++
      if (watchedFiles == fileCount) done()
    })    
  })

  it('can unwatch a file', function(done) {
    var file = testDir + '/file 1.js'
    var watcher = watchMan.watch(file)
    watcher.on('watch', function(src) {
      watcher.unwatch(file)
    })    
    watcher.on('unwatch', function(src) {
      expect(src).toBe(file)
      expect(watcher.watchers.length).toBe(0)
      done()
    })
  })

  it('can detect a change in a file when watching directly', function(done) {
    file = testDir + '/subdir 1/subdir file 1.js'    
    var watcher = watchMan.watch(file)
    watcher.on('modified', function(src) {
      expect(src).toBe(file)
      done()
    })
    fs.writeFile(file, 'blah blah new data blah')
  })

  it('can detect deletion of a file when watching directly', function(done) {
    file = testDir + '/subdir 1/subdir file 1.js'    
    var watcher = watchMan.watch(file)
    watcher.on('deleted', function(src) {
      expect(src).toBe(file)
      done()
    })
    fs.unlink(file)
  })

  it('can detect a new file when watching a directory', function(done) {
    var watchDir = testDir
      , newFile = testDir + '/new file.js'
    var watcher = watchMan.watch(watchDir)
    watcher.on('created', function(src) {
      expect(src).toBe(newFile)
      done()
    })
  })
})
