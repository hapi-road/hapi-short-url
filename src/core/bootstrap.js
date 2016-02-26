'use strict';

const Promise = require('bluebird');

const fs = Promise.promisifyAll(require('fs'));
const path = require('path');

const Server = require('./server');

module.exports = {start};

function start () {
  return registerDatabase()
  .then(registerCorePlugins())
  .then(registerModules)
  .then(startServer)
  .catch(catchError);
}

function startServer () {
  if (process.env.NODE_ENV === 'test') {
    return Server;
  }

  Server.start(logStart);

  function logStart (err) {
    if (err) {
      throw err;
    }

    Server.log('info', 'Server running at: ' + Server.info.uri);
  }
}

function registerDatabase () {
  return registerToServer(require('./database'));
}

function registerCorePlugins () {
  return fs.readdirAsync(__dirname)
    .filter(filterCoreFiles)
    .map(getCoreFiles)
    .then(registerToServer);
}

function registerModules () {
  return fs.readdirAsync(path.join(__dirname, '..'))
    .filter(filterCoreDirectories)
    .map(getModules)
    .then(registerToServer);
}

function catchError (err) {
  Server.log('error', '==> App Error ' + err);
  process.exit(1);
}

function registerToServer (plugins) {
  return new Promise((resolve, reject) => {
    Server.register(plugins, (err) => {
      if (err) {
        return reject(err);
      }

      return resolve();
    });
  });
}

function getCoreFiles (file) {
  return {
    register: require(path.join(__dirname, file))
  };
}

function getModules (dir) {
  return {
    register: require(path.join(__dirname, '..', dir))
  };
}

function filterCoreFiles (fileName) {
  try {
    let stat = fs.statSync(path.join(__dirname, fileName));

    if (stat.isFile() && fileName.match(/^[^.]/) && ['server.js', 'bootstrap.js', 'database.js'].indexOf(fileName) === -1) {
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
}

function filterCoreDirectories (dirName) {
  try {
    let stat = fs.statSync(path.join(__dirname, '..', dirName));
    if (stat.isDirectory() && dirName.match(/^[^.]/) && ['core'].indexOf(dirName) === -1) {
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
}
