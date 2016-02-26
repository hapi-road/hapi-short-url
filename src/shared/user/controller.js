'use strict';

const jwt = require('jsonwebtoken');

function UserController (db) {
  this.database = db;
  this.model = db.User;
}

UserController.prototype = {
  list,
  read,
  create,
  logIn,
  update,
  destroy
};

module.exports = UserController;

// [GET] /user
function list (request, reply) {
  this.model
  .forge()
  .fetchAll()
  .then((users) => reply(users.toJSON()))
  .catch((err) => reply.badImplementation(err.message));
}

// [GET] /user/{id}
function read (request, reply) {
  const id = request.params.id;

  this.model
  .forge({id: id})
  .fetch({require: true})
  .then((user) => reply(user.toJSON()))
  .catch(this.model.NotFoundError, () => reply.notFound('User not found'))
  .catch((err) => reply.badImplementation(err.message));
}

// [POST] /user
function create (request, reply) {
  const payload = request.payload;

  this.model
  .forge(payload)
  .save()
  .then((user) => {
    const token = getToken(user.id);

    reply({
      token: token
    }).code(201);
  })
  .catch((err) => reply.badImplementation(err.message));
}

// [POST] /user/login
function logIn (request, reply) {
  const credentials = request.payload;

  this.model
  .login(credentials.email, credentials.password)
  .then((user) => {
    const token = getToken(user.id);

    reply({
      token: token
    });
  })
  .catch(this.model.NotFoundError, () => reply.unauthorized('Email or Password invalid'))
  .catch((err) => reply.unauthorized(err.message));
}

// [PUT] /user
function update (request, reply) {
  const id = request.params.id;
  const payload = request.payload;

  this.model
  .forge({id: id})
  .save(payload, {patch: true, require: true})
  .then((user) => reply(user.toJSON()))
  .catch(this.model.NoRowsUpdatedError, () => reply.notFound('Not found rows for this id'))
  .catch((err) => reply.badImplementation(err.message));
}

// [DELETE] /user
function destroy (request, reply) {
  const id = request.params.id;

  this.model
  .forge({id: id}, {require: true})
  .destroy()
  .then(() => reply({}))
  .catch(this.model.NotFoundError, () => reply.notFound('User not found'))
  .catch((err) => reply.badImplementation(err.message));
}

function getToken (id) {
  const secretKey = process.env.JWT || 'stubJWT';

  return jwt.sign({
    id: id
  }, secretKey, {expiresIn: '18h'});
}
