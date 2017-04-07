'use strict'

const Catbox = require('catbox')
const Code = require('code')
const Lab = require('lab')
const Cache = require('../lib/index')

// Tests shorcuts
const lab = exports.lab = Lab.script()
const { expect } = Code
const { describe, it, before, afterEach } = lab

const internals = {
  defaultOptions: {
    ttl: 2147483647,
    debug: false,
    redis: {
      host: '127.0.0.1',
      port: 6379,
      password: '',
      database: 'cache'
    }
  },
  testKey: {
    key: 'ABC',
    invalidKey: 'ABD',
    segment: 'tests',
    value: 123
  }
}

describe('Cache package, focus', () => {
  describe('initializing server', () => {
    afterEach((done) => {
      Cache.stop()
      done()
    })

    it('should able to start client well', (done) => {
      Cache.start().then(() => {
        expect(Cache.set).to.be.exists()
        expect(Cache.get).to.be.exists()
        expect(Cache.start).to.be.exists()
        expect(Cache.isReady()).to.equals(true)
        done()
      })
    })

    it('should able to manage error when trying to init the client', done => {
      const start = Catbox.Client.prototype.start
      Catbox.Client.prototype.start = (callback) => {
        callback(new Error('Cannot start client well'))
      }

      Cache.start().catch((error) => {
        expect(error).to.be.instanceof(Error)
        expect(error.message).to.equals('Cannot start client well')
        Catbox.Client.prototype.start = start
        done()
      })
    })

    it('should able to validate connection to cache server', (done) => {
      try {
        Cache.validateConnection()
      } catch (e) {
        expect(e).to.be.an.error()
        done()
      }
    })

    it('should able to throw an error if client is instanced but not ready', (done) => {
      const isReady = Catbox.Client.prototype.isReady
      Catbox.Client.prototype.isReady = () => {
        return false
      }

      Cache.start()
        .then(() => Cache.validateConnection())
        .catch((error) => {
          expect(error).to.be.an.error()
          expect(error.message).to.equals('Client is not ready')
          Catbox.Client.prototype.isReady = isReady
          done()
        })
    })

    it('show able to throw an error if client is trying to start again', (done) => {
      Cache.start()
        .then(() => Cache.start())
        .catch((error) => {
          expect(error).to.be.an.error()
          expect(error.message).to.equals('Client has been initialized')
          done()
        })
    })

    it('show able to verify if client is ready', (done) => {
      Cache.start().then(() => {
        const isReady = Cache.isReady()

        expect(isReady).to.be.a.boolean()
        expect(isReady).to.equals(true)
        done()
      })
    })

    it('show able to verify if client is not ready', (done) => {
      const isReady = Cache.isReady()

      expect(isReady).to.be.a.boolean()
      expect(isReady).to.equals(false)
      done()
    })
  })

  describe('call functions', () => {
    before((done) => {
      Cache.start({ debug: true }).then(() => {
        done()
      })
    })

    it('should able to store a new value', done => {
      Cache.set(internals.testKey.segment, internals.testKey.key, internals.testKey.value)
        .then(success => {
          expect(success).to.be.true()
          done()
        })
    })

    it('should able to throw a new error when trying to set a key', done => {
      const set = Catbox.Client.prototype.set
      Catbox.Client.prototype.set = (key, value, ttl, callback) => {
        return callback(new Error('fail'))
      }

      Cache.set(internals.testKey.segment, internals.testKey.key, internals.testKey.value)
        .catch(err => {
          expect(err).to.be.instanceof(Error)
          Catbox.Client.prototype.set = set
          done()
        })
    })

    it('should able to store and get a key', done => {
      Cache.set(internals.testKey.segment, internals.testKey.key, internals.testKey.value)
        .then(success => {
          expect(success).to.be.true()

          return Cache.get(internals.testKey.segment, internals.testKey.key)
        })
        .then(value => {
          expect(value).to.equals(123)
          done()
        })
    })

    it('should able to manage error when trying to get an invalid key', done => {
      Cache.get(internals.testKey.segment, internals.testKey.invalidKey)
        .catch(value => {
          expect(value).to.be.null()
          done()
        })
    })

    it('should able to manage if an exception occurred when trying to get a key', done => {
      const get = Catbox.Client.prototype.get
      Catbox.Client.prototype.get = (key, callback) => {
        return callback(new Error('fail'), null)
      }

      Cache.get(internals.testKey.segment, internals.testKey.key)
        .catch(error => {
          expect(error).to.be.instanceof(Error)
          Catbox.Client.prototype.get = get
          done()
        })
    })

    it('should able to delete a key', done => {
      Cache.set(internals.testKey.segment, internals.testKey.key, internals.testKey.value)
        .then(success => {
          expect(success).to.be.true()

          return Cache.delete(internals.testKey.segment, internals.testKey.key)
        })
        .then(success => {
          expect(success).to.be.true()

          done()
        })
    })

    it('should able to manage if an exception ocurred when trying to delete a key', done => {
      const drop = Catbox.Client.prototype.drop
      Catbox.Client.prototype.drop = (key, callback) => {
        return callback(new Error('fail'), null)
      }

      Cache.delete(internals.testKey.segment, internals.testKey.key)
        .catch(error => {
          expect(error).to.be.instanceof(Error)
          Catbox.Client.prototype.drop = drop
          done()
        })
    })
  })
})

