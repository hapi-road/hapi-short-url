'use strict';

// load deps

const path = require('path');
const glob = require('glob');
const knex = require('knex')(getDatabaseConfig());

const Bookshelf = require('bookshelf')(knex);

exports.DB = Bookshelf;

exports.register = (server, options, next) => {
  let db = {};

  // load Bookshelf plugins
  Bookshelf.plugin('visibility');
  Bookshelf.plugin('registry');

  db = getModels(db);
  db['Bookshelf'] = Bookshelf;
  db['knex'] = Bookshelf.knex;

  server.decorate('server', 'database', db);

  return next();
};

exports.register.attributes = {
  name: 'database',
  version: '1.0.0'
};

/**
 *
 * Get the database config object
 *
 */
function getDatabaseConfig () {
  return {
    client: process.env.DB_DIALECT || 'pg',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USERNAME || 'postgre',
      password: process.env.DB_PASSEWORD || 'r001',
      database: process.env.DB_NAME || 'test'
    }
  };
}

/**
 *
 * Get all models
 *
 */
function getModels (db) {
  const pattern = './src/**/model.js';
  glob.sync(pattern)
  .map((file) => {
    let root = path.join(__dirname, '..', '..', file);
    let entity = file.split('/').reverse()[1];
    entity = entity[0].toUpperCase() + entity.slice(1);

    db[entity] = require(root)(Bookshelf);
  });

  return db;
}

