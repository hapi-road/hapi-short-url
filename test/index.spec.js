'use strict';
// load deps
const lab = exports.lab = require('lab').script();
const Api = require('../src/core/bootstrap');
global.expect = require('chai').expect;

// prepare environment
global. it = lab.it;
global.describe = lab.describe;
global.before = lab.before;
global.beforeEach = lab.beforeEach;

global.truncate = function (knex, table) {
  return knex.raw('truncate table ' + table + ' cascade');
};

lab.before((done) => {
  Api.start()
  .catch((err) => {
    console.log(err);
    throw err;
  })
  .then((server) => {
    server.register(require('inject-then'), (err) => {
      if (err) {
        throw err;
      }

      global.server = server;
      global.db = server.database;
      return done();
    });
  });
});
