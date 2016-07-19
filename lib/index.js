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

internals.set = (key, value) => {
  return new Promise((resolve, reject) => {
    this.logger.info(`Setting key ${JSON.stringify(key)} with value ${value}`)

    this.client.set(key, value, this.opts.ttl, (err) => {
      if (err) {
        return reject(err);
      }

      return resolve(true);
    });
  });
}

internals.get = (key, value) => {
  return new Promise((resolve, reject) => {
    this.logger.info(`Get key ${JSON.stringify(key)}`)

    this.client.get(key, (err, value) => {

      if (err) {
        return reject(err);
      } else if (! value) {
        return reject(value);
      }

      return resolve(value.item);
    })
  })
}

internals.start = () => {
  return new Promise((resolve, reject) => {

    this.client.start((err) => {
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
  this.client = new Catbox.Client(Redis, this.opts.redis);
  this.set = internals.set.bind(this);
  this.get = internals.get.bind(this);
  this.start = internals.start.bind(this);

  return this;
}
