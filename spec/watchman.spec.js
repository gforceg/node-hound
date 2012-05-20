var watchMan = require('../watchman')
  , fs = require('fs')
  , path = require('path')
  , util = require('util')

var testSource = path.normalize(__dirname + '/data')
  , testDir = path.normalize(__dirname + '/../tmp')
  , testFileCount = 8

/**
 * Deletes a source recursively, used for set up.
 * @param {string} src
 */
function deleteFile(src) {
  if (!path.existsSync(src)) return
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

  /**
   * Remove any watchers.
   */
  afterEach(function() {
    if (watcher !== undefined) {
      watcher.clear()
      delete watcher
    }
  })

  it('can watch a file', function() {
    var file = testDir + '/file 1.js'
    watcher = watchMan.watch(file)
    expect(watcher.watchers[file]).toBeDefined()
  })

  it('can watch a directory', function() {
    watcher = watchMan.watch(testDir, {recurse: false})
    expect(watcher.watchers[testDir]).toBeDefined()
  })

  it('can watch a directory tree', function() {
    watcher = watchMan.watch(testDir)
    var watcherCount = 0
    for (var i in watcher.watchers) {
      watcherCount++
    }
    expect(watcherCount).toBe(testFileCount)
  })

  it('can unwatch a file', function(done) {
    var file = testDir + '/file 1.js'
    watcher = watchMan.watch(file)
    watcher.on('unwatch', function(src) {
      expect(src).toBe(file)
      expect(watcher.watchers.length).toBe(0)
      done()
    })
    watcher.unwatch(file)
  })

  it('can detect a change in a file when watching directly', function(done) {
    var file = testDir + '/subdir 1/subdir file 1.js'  
    var watchCount = 0
    watcher = watchMan.watch(file)
    watcher.on('change', function(src) {
      expect(src).toBe(file)
      done()
    })
    fs.writeFile(file, 'blah blah new data blah')      
  })

  it('can detect deletion of a file when watching directly', function(done) {
    var file = testDir + '/subdir 1/subdir file 1.js'    
    watcher = watchMan.watch(file)
    watcher.on('delete', function(src) {
      expect(src).toBe(file)
      expect(watcher.watchers[src]).toBeUndefined()
      done()
    })
    fs.unlink(file)
  })

  it('can detect a new file in a dir', function(done) {
    var newFile = testDir + '/new file.js'
    watcher = watchMan.watch(testDir)
    watcher.on('create', function(src) {
      expect(src).toBe(newFile)
      done()
    })
    fs.writeFile(newFile, 'blah blah blah')
  })

  it('can detect a deleted file in a dir', function(done) {
    var file = testDir + '/subdir 1/subdir file 1.js'
    watcher = watchMan.watch(testDir)
    watcher.on('delete', function(src) {
      expect(src).toBe(file)
      expect(watcher.watchers[src]).toBeUndefined()
      done()
    })
    fs.unlink(file)
  })

  it('can detect a new file in a new dir', function(done) {
    var dir = testDir + '/new dir'
      , file = dir + '/new dir file.js'
    watcher = watchMan.watch(testDir)
    watcher.once('create', function(src) {
      expect(src).toBe(dir)
      watcher.once('create', function(src) {
        expect(src).toBe(file)
        done()
      })
      fs.writeFile(file, 'bofbajojsa')
    })
    fs.mkdirSync(dir)
  })
})
