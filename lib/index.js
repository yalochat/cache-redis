'use strict';

const Catbox = require('catbox');
const Redis = require('catbox-redis');
const Promise = require('bluebird');
const Bucker =  require('bucker');
const Hoek = require('hoek');

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
  }
};

internals.buildKey = (segment, key) => {

  return {
    id: key,
    segment
  }
}

internals.set = (segment, key, value) => {

  return new Promise((resolve, reject) => {
    this.logger.info(`Setting key ${key} in segment ${segment} with value ${JSON.stringify(value)}`)

    internals.client.set(internals.buildKey(segment, key), value, this.opts.ttl, (err) => {
      if (err) {
        return reject(err);
      }

      return resolve(true);
    });
  });
}

internals.get = (segment, key) => {
  return new Promise((resolve, reject) => {
    this.logger.info(`Get key ${key} in segment ${segment}`)

    internals.client.get(internals.buildKey(segment, key), (err, value) => {

      if (err) {
        return reject(err);
      } else if (! value) {
        return reject(value);
      }

      return resolve(value.item);
    })
  })
}

internals.delete = (segment, key) => {
  return new Promise((resolve, reject) => {

    this.logger.info(`Delete key ${key} in segment ${segment}`);

    internals.client.drop(internals.buildKey(segment, key), (err) => {
      if (err) {
        return reject(err);
      }

      return resolve(true);
    });
  });
};

internals.start = () => {
  return new Promise((resolve, reject) => {

    internals.client.start((err) => {
      this.logger.info('Starting cache instance');

      if (err) {
        return reject(err);
      }

      return resolve(this);
    });
  });
}

module.exports = (opts) => {

  opts = opts || {};

  // Apply default configuration
  this.opts = Hoek.applyToDefaults(internals.defaultOptions, opts);

  // Create instance of logger
  this.logger = Bucker.createLogger({console: this.opts.debug}, 'cache-redis');

  // Initialize client
  internals.client = new Catbox.Client(Redis, this.opts.redis);

  this.set = internals.set.bind(this);
  this.get = internals.get.bind(this);
  this.delete = internals.delete.bind(this);
  this.start = internals.start.bind(this);
  this.stop = internals.client.stop;
  this.isReady = internals.client.isReady;

  return this;
}
