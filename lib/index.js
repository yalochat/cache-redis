'use strict'

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
    partition: 'yalo-redis-cache'
  }
}

const buildKey = (segment, key) => ({ id: key, segment })
const Cache = (function () {
  function Cache () {
    this.client = null
  }

  Cache.prototype.validateConnection = function () {
    if (!this.client) {
      throw new Error('Start a new connection is necessary')
    }

    if (!this.client.isReady()) {
      throw new Error('Client is not ready')
    }
  }

  Cache.prototype.start = function (options) {
    options = options || {}

    if (this.client && this.client.isReady()) {
      return Promise.reject(new Error('Client has been initialized'))
    }

    this.options = Hoek.applyToDefaults(defaultOptions, options)
    this.logger = Bucker.createLogger({ console: this.options.debug, name: 'cache-redis' })
    this.client = new Catbox.Client(Redis, this.options.redis)

    return new Promise((resolve, reject) => {
      this.client.start((err) => {
        this.logger.info('Starting cache instance')

        if (err) {
          reject(err)
        } else {
          resolve(true)
        }
      })
    })
  }

  Cache.prototype.stop = function () {
    if (this.client) {
      this.client.stop()
      this.client = null
    }
  }

  Cache.prototype.set = function (segment, key, value) {
    this.validateConnection()

    return new Promise((resolve, reject) => {
      this.logger.info(`Setting key ${key} in segment ${segment} with value ${JSON.stringify(value)}`)

      this.client.set(buildKey(segment, key), value, this.options.ttl, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve(true)
        }
      })
    })
  }

  Cache.prototype.get = function (segment, key) {
    this.validateConnection()

    return new Promise((resolve, reject) => {
      this.logger.info(`Get key ${key} in segment ${segment}`)

      this.client.get(buildKey(segment, key), (err, value) => {
        if (err) {
          return reject(err)
        } else if (!value) {
          return reject(value)
        }

        return resolve(value.item)
      })
    })
  }

  Cache.prototype.delete = function (segment, key) {
    this.validateConnection()

    return new Promise((resolve, reject) => {
      this.logger.info(`Delete key ${key} in segment ${segment}`)

      this.client.drop(buildKey(segment, key), (err) => {
        if (err) {
          return reject(err)
        }

        return resolve(true)
      })
    })
  }

  Cache.prototype.isReady = function () {
    if (!this.client) {
      return false
    }

    return this.client.isReady()
  }

  return Cache
}())

module.exports = new Cache()
