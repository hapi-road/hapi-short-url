'use strict';

const shortId = require('shortid');

module.exports = (Bookshelf) => {
  const Links = Bookshelf.Model.extend({
    tableName: 'links',
    constructor: function () {
      Bookshelf.Model.apply(this, arguments);
      this.on('saving', shortLink);
    },
    userId: function () {
      return this.belongsTo('User');
    }
  });

  return Bookshelf.model('Link', Links);
};

function shortLink (model) {
  model.set('shorted', shortId.generate());
}

