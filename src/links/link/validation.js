'use strict';

// load deps
const Joi = require('joi');

const LinkValidator = {
  list,
  read,
  goTo,
  create,
  update,
  destroy
};

module.exports = LinkValidator;

function list () {
  return {};
}

function read () {
  return {
    params: {
      id: Joi
        .number()
        .integer()
        .min(1)
        .required()
    }
  };
}

function create () {
  return {
    payload: {
      url: Joi
        .string()
        .uri({
          scheme: [
            /https?/
          ]
        })
        .trim()
        .required()
    }
  };
}

function goTo () {
  return {
    params: {
      id: Joi
        .string()
        .min(7)
        .max(14)
        .trim()
        .required()
    }
  };
}

function update () {
  return {
    params: {
      id: Joi
        .number()
        .integer()
        .min(1)
        .required()
    },
    payload: {
      url: Joi
        .string()
        .uri({
          scheme: [
            /https?/
          ]
        })
        .trim()
        .required()
    }
  };
}

function destroy () {
  return {
    params: {
      id: Joi
        .number()
        .integer()
        .min(1)
        .required()
    }
  };
}

