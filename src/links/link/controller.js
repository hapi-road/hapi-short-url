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
  const userId = request.auth.credentials.id;
  const payload = request.payload;

  if (userId) {
    payload['user_id'] = userId;
  }

  this.model
  .forge(payload)
  .save()
  .then((link) => reply(link).code(201))
  .catch((err) => reply.badImplementation(err.message));
}

// [GET] /{id}
function goTo (request, reply) {
  const id = request.params.id;

  this.model
  .forge({shorted: id})
  .fetch({require: true})
  .then((link) => reply().redirect(link.url))
  .catch(this.model.NotFoundError, () => reply.notFound('link not found'))
  .catch((err) => reply.badImplementation(err.message));
}

// [PUT] /link/{id}
function update (request, reply) {
  const userId = request.auth.credentials.id;
  const id = request.params.id;
  const payload = request.payload;

  // prevent shorted change
  delete payload['shorted'];

  this.model
  .forge({id: id, user_id: userId})
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
  .forge({id: id, user_id: userId}, {require: true})
  .destroy()
  .then(() => reply({}))
  .catch(this.model.NotFoundError, () => reply.notFound('link not found'))
  .catch((err) => reply.badImplementation(err.message));
}

