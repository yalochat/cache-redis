const Catbox = require('catbox')
const Code = require('code')
const Lab = require('lab')
const Cache = require('../lib/index')

// Tests shorcuts
const lab = (exports.lab = Lab.script()); // eslint-disable-line
const { expect } = Code
const {
  describe, it, before, afterEach,
} = lab

const internals = {
  defaultOptions: {
    ttl: 2147483647,
    debug: false,
    redis: {
      host: '127.0.0.1',
      port: 6379,
      password: '',
      database: 'cache',
    },
  },
  testKey: {
    key: 'ABC',
    invalidKey: 'ABD',
    segment: 'tests',
    value: 123,
  },
}

describe('Cache package', () => {
  describe('initializing server', () => {
    afterEach(() => {
      Cache.stop()
    })

    it('should able to start client well', async () => {
      await Cache.start()

      expect(Cache.set).to.be.exists()
      expect(Cache.get).to.be.exists()
      expect(Cache.start).to.be.exists()
      expect(Cache.isReady()).to.equals(true)
    })

    it('should able to manage error when trying to init the client', async () => {
      const { start } = Catbox.Client.prototype
      Catbox.Client.prototype.start = async () => {
        throw new Error('Cannot start client well')
      }

      try {
        await Cache.start()
      } catch (err) {
        expect(err).to.be.instanceof(Error)
        expect(err.message).to.equals('Cannot start client well')
        Catbox.Client.prototype.start = start
      }
    })

    it('should able to validate connection to cache server', () => {
      try {
        Cache.validateConnection()
      } catch (err) {
        expect(err).to.be.an.error()
        expect(err.message).to.equals('Start a new connection is necessary')
      }
    })

    it('should able to throw an error if client is instanced but not ready', async () => {
      const { isReady } = Catbox.Client.prototype
      Catbox.Client.prototype.isReady = () => false

      try {
        await Cache.start()
        Cache.validateConnection()
      } catch (err) {
        expect(err).to.be.an.error()
        expect(err.message).to.equals('Client is not ready')
        Catbox.Client.prototype.isReady = isReady
      }
    })

    it('show able to throw an error if client is trying to start again', async () => {
      try {
        await Cache.start()
        await Cache.start()
      } catch (err) {
        expect(err).to.be.an.error()
        expect(err.message).to.equals('Client has been initialized')
      }
    })

    it('show able to verify if client is ready', async () => {
      await Cache.start()

      const isReady = Cache.isReady()

      expect(isReady).to.be.a.boolean()
      expect(isReady).to.equals(true)
    })

    it('show able to verify if client is not ready', () => {
      const isReady = Cache.isReady()

      expect(isReady).to.be.a.boolean()
      expect(isReady).to.equals(false)
    })
  })

  describe('call functions', () => {
    before(async () => {
      await Cache.start({ debug: true })
    })

    it('should able to store a new value', async () => {
      const success = await Cache.set(
        internals.testKey.segment,
        internals.testKey.key,
        internals.testKey.value,
      )
      expect(success).to.be.true()
    })

    it('should able to throw a new error when trying to set a key', async () => {
      const { set } = Catbox.Client.prototype
      Catbox.Client.prototype.set = async () => {
        throw new Error('fail')
      }

      try {
        await Cache.set(
          internals.testKey.segment,
          internals.testKey.key,
          internals.testKey.value,
        )
      } catch (err) {
        expect(err).to.be.instanceof(Error)
        Catbox.Client.prototype.set = set
      }
    })

    it('should able to store and get a key', async () => {
      const success = await Cache.set(
        internals.testKey.segment,
        internals.testKey.key,
        internals.testKey.value,
      )
      expect(success).to.be.true()

      const value = await Cache.get(
        internals.testKey.segment,
        internals.testKey.key,
      )
      expect(value).to.equals(123)
    })

    it('should able to manage error when trying to get an invalid key', async () => {
      const value = await Cache.get(
        internals.testKey.segment,
        internals.testKey.invalidKey,
      )
      expect(value).to.be.null()
    })

    it('should able to manage if an exception occurred when trying to get a key', async () => {
      const { get } = Catbox.Client.prototype
      Catbox.Client.prototype.get = async () => {
        throw new Error('fail')
      }

      try {
        await Cache.get(internals.testKey.segment, internals.testKey.key)
      } catch (err) {
        expect(err).to.be.instanceof(Error)
        Catbox.Client.prototype.get = get
      }
    })

    it('should able to delete a key', async () => {
      const saved = await Cache.set(
        internals.testKey.segment,
        internals.testKey.key,
        internals.testKey.value,
      )
      expect(saved).to.be.true()

      const deleted = await Cache.delete(
        internals.testKey.segment,
        internals.testKey.key,
      )
      expect(deleted).to.be.true()
    })

    it('should able to manage if an exception ocurred when trying to delete a key', async () => {
      const { drop } = Catbox.Client.prototype
      Catbox.Client.prototype.drop = async () => {
        throw new Error('fail')
      }

      try {
        await Cache.delete(internals.testKey.segment, internals.testKey.key)
      } catch (err) {
        expect(err).to.be.instanceof(Error)
        Catbox.Client.prototype.drop = drop
      }
    })
  })
})
