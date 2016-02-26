'use strict';

function LinkController (db) {
  this.database = db;
  this.model = db.Link;
}

LinkController.prototype = {
  list,
  read,
  goTo,
  create,
  update,
  destroy
};

module.exports = LinkController;

// [GET] /link
function list (request, reply) {
  const userId = request.auth.credentials.id;

  this.database.User
  .forge({id: userId})
  .fetch({withRelated: ['links']})
  .then((user) => reply(user.related('links').toJSON()))
  .catch((err) => reply.badImplementation(err.message));
}

// [GET] /link/{id}
function read (request, reply) {
  const userId = request.auth.credentials.id;
  const id = request.params.id;

  this.model
  .forge({id: id, user_id: userId})
  .fetch({require: true})
  .then((link) => reply(link.toJSON()))
  .catch(this.model.NotFoundError, () => reply.notFound('link not found'))
  .catch((err) => reply.badImplementation(err.message));
}

// [POST] /link
function create (request, reply) {
  const payload = request.payload;

  if (request.auth && request.auth.credentials) {
    payload['user_id'] = request.auth.credentials.id;
  }

  this.model
  .forge(payload)
  .save()
  .then((link) => reply(link.toJSON()).code(201))
  .catch((err) => reply.badImplementation(err.message));
}

// [GET] /{id}
function goTo (request, reply) {
  const id = request.params.id;

  this.database.knex('links')
  .where('shorted', '=', id)
  .increment('count', 1)
  .returning('*')
  .then((links) => reply.redirect(links[0].url))
  .catch((err) => reply.notFound(err.message));
}

// [PUT] /link/{id}
function update (request, reply) {
  const userId = request.auth.credentials.id;
  const id = request.params.id;
  const payload = request.payload;

  this.model
  .where({id: id, user_id: userId})
  .save(payload, {patch: true, require: true})
  .then((link) => reply(link.toJSON()))
  .catch(this.model.NoRowsUpdatedError, () => reply.notFound('Not found rows for this id'))
  .catch((err) => reply.badImplementation(err.message));
}

// [DELETE] /link/{id}
function destroy (request, reply) {
  const userId = request.auth.credentials.id;
  const id = request.params.id;

  this.model
  .where({id: id, user_id: userId})
  .destroy({require: true})
  .then(() => reply({}))
  .catch(this.model.NoRowsDeletedError, () => reply.notFound('link not found'))
  .catch((err) => reply.badImplementation(err.message));
}

