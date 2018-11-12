const Catbox = require('catbox')
const Redis = require('catbox-redis')
const Promise = require('bluebird')
const Bucker = require('bucker')
const Hoek = require('hoek')

const defaultOptions = {
  ttl: 2147483647,
  debug: false,
  redis: {
    host: '127.0.0.1',
    port: 6379,
    password: '',
    partition: 'yalo-redis-cache',
  },
}

const buildKey = (segment, key) => ({ id: key, segment })

class Cache {
  constructor() {
    this.client = null
  }

  validateConnection() {
    if (!this.client) {
      throw new Error('Start a new connection is necessary')
    }

    if (!this.client.isReady()) {
      throw new Error('Client is not ready')
    }

    return true
  }

  async start(options = {}) {
    if (this.client && this.client.isReady()) {
      return Promise.reject(new Error('Client has been initialized'))
    }

    this.options = Hoek.applyToDefaults(defaultOptions, options)
    this.logger = Bucker.createLogger({
      console: this.options.debug,
      name: 'cache-redis',
    })
    this.client = new Catbox.Client(Redis, this.options.redis)

    try {
      this.logger.info('Starting cache instance')
      await this.client.start()
      return true
    } catch (err) {
      return Promise.reject(err)
    }
  }

  stop() {
    if (this.client) {
      this.client.stop()
      this.client = null
    }
  }

  async set(segment, key, value) {
    try {
      this.validateConnection()
      const id = buildKey(segment, key)
      await this.client.set(id, value, this.options.ttl)

      return true
    } catch (err) {
      return Promise.reject(err)
    }
  }

  async get(segment, key) {
    try {
      this.validateConnection()
      this.logger.info(`Get key ${key} in segment ${segment}`)

      const id = buildKey(segment, key)
      const value = await this.client.get(id)

      if (value) {
        return value.item
      }

      return null
    } catch (err) {
      return Promise.reject(err)
    }
  }

  async delete(segment, key) {
    try {
      this.validateConnection()
      this.logger.info(`Delete key ${key} in segment ${segment}`)

      const id = buildKey(segment, key)

      await this.client.drop(id)
      return true
    } catch (err) {
      return Promise.reject(err)
    }
  }

  isReady() {
    if (!this.client) {
      return false
    }

    return this.client.isReady()
  }
}

module.exports = new Cache()
