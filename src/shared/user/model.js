'use strict';

const Promise = require('bluebird');

const bcrypt = Promise.promisifyAll(require('bcryptjs'));

module.exports = (Bookshelf) => {
  const Users = Bookshelf.Model.extend({
    tableName: 'users',
    hidden: ['password'],
    constructor: function () {
      Bookshelf.Model.apply(this, arguments);
      this.on('saving', encryptPassword);
    },
    links: function () {
      return this.hasMany('Link');
    }
  }, {
    login: Promise.method(function (email, password) {
      if (!email || !password) {
        throw new Error('Email and password are both required');
      }

      return new this({email: email.toLowerCase().trim()})
      .fetch({require: true})
      .tap((user) => {
        return bcrypt.compareAsync(password, user.get('password'))
        .then((res) => {
          if (!res) {
            throw new Error('Invalid password');
          }
          return user;
        });
      });
    })
  });

  return Bookshelf.model('User', Users);
};

function encryptPassword (model, attr) {
  return new Promise((resolve, reject) => {
    if (!model.isNew() && !model.hasChanged('password')) {
      return resolve();
    }
    bcrypt.hash(model.get('password'), 10, (err, hash) => {
      if (err) {
        return reject(err);
      }

      if (attr.password) {
        attr.password = hash;
      } else {
        model.set('password', hash);
      }

      resolve(hash); // data is created only after this occurs
    });
  });
}
