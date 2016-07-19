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
  }
}

describe('Cache package', () => {

    it('start client of cache', (done) => {
      Cache.start()
        .then(cache => {
          expect(cache.set).to.be.exists();
          expect(cache.get).to.be.exists();
          expect(cache.client).to.be.exists();
          expect(cache.start).to.be.exists();
          done();
        });
    });

    it('error when trying to init the client', (done) => {
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

    it('store a new value', (done) => {
      Cache.start()
        .then(cache => {
          let key = { id: 'ABC', segment: 'tests' };
          let value = 123;

          cache.set(key, value)
            .then(success => {
              expect(success).to.be.true();
              done();
            });
        });
    });

    it('error when trying to set a key', (done) => {
      const set = Catbox.Client.prototype.set;
      Catbox.Client.prototype.set = (key, value, ttl, callback) => {
          return callback(new Error('fail'));
      };

      Cache.start()
        .then(cache => {
          let key = { id: 'ABC', segment: 'tests' };
          let value = 123;

          cache.set(key, value)
            .catch(err => {
              expect(err).to.be.instanceof(Error);
              Catbox.Client.prototype.set = set;
              done();
            });
        });
    });

    it('store and get a key', (done) => {

      Cache.start()
        .then(cache => {
          let key = { id: 'ABC', segment: 'tests' };
          let value = 123;

          cache.set(key, value)
            .then(success => {
              expect(success).to.be.true();

              cache.get(key)
                .then(value => {
                  expect(value).to.equals(123);
                  done();
                });
            });
        });
    });

    it('get an invalid key', (done) => {
      const key = { id: 'ABD', segment: 'tests' }

      Cache.start()
        .then(cache => {
          cache.get(key)
            .catch(value => {
              expect(value).to.be.null();
              done();
            });
        });
    });

    it('error when trying to get a key', (done) => {
      const get = Catbox.Client.prototype.get;
      Catbox.Client.prototype.get = (key, callback) => {
          return callback(new Error('fail'), null);
      }

      Cache.start()
        .then(cache => {
          const key = { id: 'ABC', segment: 'tests' }

          cache.get(key)
            .catch((value) => {

              expect(value).to.be.instanceof(Error);
              Catbox.Client.prototype.get = get;
              done();
          });
        });
    });

    it('require module with default options', (done) => {
      const CacheDefault = require('../lib/index')();

      expect(CacheDefault.opts).to.equals(internals.defaultOptions);
      done();
    });
});

