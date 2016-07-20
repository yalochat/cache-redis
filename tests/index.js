'use strict';

const Catbox = require('catbox');
const Code = require('code');
const Lab = require('lab');
const Cache = require('../lib/index')({debug: true});

// Tests shorcuts
const lab = exports.lab = Lab.script()
const describe = lab.describe
const expect = Code.expect
const it = lab.test

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

describe('Cache package', () => {

    it('start client of cache', done => {
      Cache.start()
        .then(cache => {
          expect(cache.set).to.be.exists();
          expect(cache.get).to.be.exists();
          expect(cache.start).to.be.exists();
          done();
        });
    });

    it('error when trying to init the client', done => {
      const start = Catbox.Client.prototype.start;
      Catbox.Client.prototype.start = (callback) => {
        callback(new Error());
      };

      Cache.start()
        .catch((error) => {
          expect(error).to.be.instanceof(Error);
          Catbox.Client.prototype.start = start;
          done();
        });
    });

    it('store a new value', done => {
      Cache.start()
        .then(cache => {
          cache.set(internals.testKey.segment, internals.testKey.key, internals.testKey.value)
            .then(success => {
              expect(success).to.be.true();
              done();
            });
        });
    });

    it('error when trying to set a key', done => {
      const set = Catbox.Client.prototype.set;
      Catbox.Client.prototype.set = (key, value, ttl, callback) => {
          return callback(new Error('fail'));
      };

      Cache.start()
        .then(cache => {

          cache.set(internals.testKey.segment, internals.testKey.key, internals.testKey.value)
            .catch(err => {
              expect(err).to.be.instanceof(Error);
              Catbox.Client.prototype.set = set;
              done();
            });
        });
    });

    it('store and get a key', done => {

      Cache.start()
        .then(cache => {

          cache.set(internals.testKey.segment, internals.testKey.key, internals.testKey.value)
            .then(success => {
              expect(success).to.be.true();

              return cache.get(internals.testKey.segment, internals.testKey.key)
            })
            .then(value => {
              expect(value).to.equals(123);
              done();
            });
        });
    });

    it('get an invalid key', done => {
      Cache.start()
        .then(cache => {
          cache.get(internals.testKey.segment, internals.testKey.invalidKey)
            .catch(value => {
              expect(value).to.be.null();
              done();
            });
        });
    });

    it('error when trying to get a key', done => {
      const get = Catbox.Client.prototype.get;
      Catbox.Client.prototype.get = (key, callback) => {
          return callback(new Error('fail'), null);
      }

      Cache.start()
        .then(cache => {
          cache.get(internals.testKey.segment, internals.testKey.key)
            .catch(error => {

              expect(error).to.be.instanceof(Error);
              Catbox.Client.prototype.get = get;
              done();
          });
        });
    });

    it('delete a key', done => {
      Cache.start()
        .then(cache => {
          cache.set(internals.testKey.segment, internals.testKey.key, internals.testKey.value)
            .then(success => {
              expect(success).to.be.true();

              return cache.delete(internals.testKey.segment, internals.testKey.key)
            })
            .then(success => {
              expect(success).to.be.true();

              done();
            });
        });
    });

    it('error when trying to delete a key', done => {
      const drop = Catbox.Client.prototype.drop;
      Catbox.Client.prototype.drop = (key, callback) => {
          return callback(new Error('fail'), null);
      }

      Cache.start()
        .then(cache => {
          cache.delete(internals.testKey.segment, internals.testKey.key)
            .catch(error => {

              expect(error).to.be.instanceof(Error);
              Catbox.Client.prototype.drop = drop;
              done();
            })
        })
    });

    it('require module with default options', done => {
      const CacheDefault = require('../lib/index')();

      expect(CacheDefault.opts).to.equals(internals.defaultOptions);
      done();
    });
});

