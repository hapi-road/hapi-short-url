/* global truncate, describe, before, beforeEach, it, expect, db, server */
'use strict';

const Promise = require('bluebird');

let jwt = require('jsonwebtoken');
const JWT = process.env.JWT || 'stubJWT';

describe('Routes /user', () => {
  describe('GET /user', () => {
    beforeEach((done) => {
      truncate(db.Bookshelf.knex, 'users')
      .then(() => {
        let reqs = [];
        const options = {
          method: 'POST',
          url: '/user',
          payload: {}
        };

        for (let i = 0; i < 5; i++) {
          options.payload = {
            name: 'User ' + i,
            password: '12345678',
            username: 'user_' + i,
            email: 'user_' + i + '@example.com'
          };

          reqs.push(server.injectThen(options));
        }

        Promise.all(reqs)
        .then(() => {
          done();
        });
      });
    });

    it('return 200 HTTP status code', (done) => {
      truncate(db.Bookshelf.knex, 'users')
      .then(() => {
        let options = {method: 'GET', url: '/user'};
        return server.injectThen(options);
      })
      .then((response) => {
        expect(response).to.have.property('statusCode', 200);
        done();
      });
    });

    it('return an empty array when users is empty', (done) => {
      truncate(db.Bookshelf.knex, 'users')
      .then(() => {
        let options = {method: 'GET', url: '/user'};
        return server.injectThen(options);
      })
      .then((response) => {
        expect(response).to.have.property('result');
        expect(response.result).to.have.length.least(0);
        done();
      });
    });

    it('return 5 users at a time', (done) => {
      const options = {method: 'GET', url: '/user'};
      server.injectThen(options)
        .get('result')
        .map((user) => {
          expect(user).to.have.property('name');
          expect(user).to.have.property('username');
          expect(user).to.have.property('email');
        })
        .then((payload) => {
          expect(payload).to.have.length.least(5);
        })
        .then(done);
    });
  });

  describe('GET /user/{id}', () => {
    let token;
    let userInfo;
    before((done) => {
      truncate(db.Bookshelf.knex, 'users')
      .then(() => {
        const options = {
          method: 'POST',
          url: '/user',
          payload: {
            name: 'Jack Bauer',
            username: 'jack_b',
            email: 'jbauer@24hours.com',
            password: '#24hoursRescuePresident'
          }
        };

        server.injectThen(options)
        .then((response) => {
          token = response.result.token;
          userInfo = jwt.verify(token, JWT);
          done();
        });
      });
    });

    describe('when user is not authenticated', () => {
      it('returns 401 HTTP status code', (done) => {
        const options = {method: 'GET', url: '/user/' + userInfo.id};
        server.injectThen(options)
        .then((response) => {
          expect(response).to.have.property('statusCode', 401);
          done();
        });
      });
    });

    describe('when user is authenticated', () => {
      it('returns 200 HTTP status code', (done) => {
        const options = {
          method: 'GET',
          url: '/user/' + userInfo.id,
          headers: {'Authorization': 'Bearer ' + token}
        };

        server.injectThen(options)
        .then((response) => {
          expect(response).to.have.property('statusCode', 200);
          done();
        });
      });

      it('returns 1 user at a time', (done) => {
        const options = {
          method: 'GET',
          url: '/user/' + userInfo.id,
          headers: {'Authorization': 'Bearer ' + token}
        };

        server.injectThen(options)
        .then((response) => {
          expect(response.result).to.have.property('name', 'Jack Bauer');
          expect(response.result).to.have.property('username', 'jack_b');
          expect(response.result).to.have.property('email', 'jbauer@24hours.com');
          done();
        });
      });

      it('return 400 HTTP status code when the specified id is invalid', (done) => {
        const options = {
          method: 'GET',
          url: '/user/aa',
          headers: {'Authorization': 'Bearer ' + token}
        };

        server.injectThen(options)
        .then((response) => {
          expect(response).to.have.property('statusCode', 400);
          expect(response).to.have.property('result');
          expect(response.result).to.have.property('statusCode', 400);
          expect(response.result).to.have.property('error', 'Bad Request');
          expect(response.result).to.have.property('message', 'child "id" fails because ["id" must be a number]');
          done();
        });
      });

      it('return 404 HTTP status code when the specified id is not found', (done) => {
        const options = {
          method: 'GET',
          url: '/user/12',
          headers: {'Authorization': 'Bearer ' + token}
        };

        server.injectThen(options)
        .then((response) => {
          expect(response).to.have.property('statusCode', 404);
          expect(response).to.have.property('result');
          expect(response.result).to.have.property('statusCode', 404);
          expect(response.result).to.have.property('error', 'Not Found');

          done();
        });
      });
    });
  });

  describe('POST /user', () => {
    beforeEach((done) => {
      truncate(db.Bookshelf.knex, 'users')
      .then(() => {
        done();
      });
    });

    it('returns 400 HTTP status code when no body is sended', (done) => {
      const options = {method: 'POST', url: '/user'};
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', '"value" must be an object');
        done();
      });
    });

    it('returns 400 HTTP status code  when no `name` is send', (done) => {
      const options = {method: 'POST', url: '/user', payload: {}};
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "name" fails because ["name" is required]');
        done();
      });
    });

    it('returns 400 HTTP status code  when `name` is empty', (done) => {
      const options = {method: 'POST', url: '/user', payload: {name: ''}};
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "name" fails because ["name" is not allowed to be empty]');
        done();
      });
    });

    it('returns 400 HTTP status code  when `name` isn\'t a string', (done) => {
      const options = {method: 'POST', url: '/user', payload: {name: 0}};
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "name" fails because ["name" must be a string]');
        done();
      });
    });

    it('return 400 HTTP status code when `name` haven\'t more than 30 chars', (done) => {
      const options = {method: 'POST', url: '/user', payload: {name: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}};
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "name" fails because ["name" length must be less than or equal to 30 characters long]');
        done();
      });
    });

    it('returns 400 HTTP status code  when no `username` is send', (done) => {
      const options = {method: 'POST', url: '/user', payload: {name: 'Marcos'}};
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "username" fails because ["username" is required]');
        done();
      });
    });

    it('returns 400 HTTP status code  when `username` is empty', (done) => {
      const options = {method: 'POST', url: '/user', payload: {name: 'Marcos', username: ''}};
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "username" fails because ["username" is not allowed to be empty]');
        done();
      });
    });

    it('returns 400 HTTP status code  when `username` isn\'t a string', (done) => {
      const options = {method: 'POST', url: '/user', payload: {name: 'Marcos', username: 0}};
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "username" fails because ["username" must be a string]');
        done();
      });
    });

    it('return 400 HTTP status code when `username` haven\'t more than 20 chars', (done) => {
      const options = {method: 'POST', url: '/user', payload: {name: 'Marcos', username: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}};
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "username" fails because ["username" length must be less than or equal to 20 characters long]');
        done();
      });
    });

    it('returns 400 HTTP status code  when no `email` is sent', (done) => {
      const options = {method: 'POST', url: '/user', payload: {name: 'Marcos', username: 'marc'}};
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "email" fails because ["email" is required]');
        done();
      });
    });

    it('returns 400 HTTP status code  when `email` is empty', (done) => {
      const options = {method: 'POST', url: '/user', payload: {name: 'Marcos', username: 'marc', email: ''}};
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "email" fails because ["email" is not allowed to be empty]');
        done();
      });
    });

    it('returns 400 HTTP status code  when `email` isn\'t a string ', (done) => {
      const options = {method: 'POST', url: '/user', payload: {name: 'Marcos', username: 'marc', email: 0}};
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "email" fails because ["email" must be a string]');
        done();
      });
    });

    it('returns 400 HTTP status code  when `email` is invalid email', (done) => {
      const options = {method: 'POST', url: '/user', payload: {name: 'Marcos', username: 'marc', email: 'notanemail'}};
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "email" fails because ["email" must be a valid email]');
        done();
      });
    });

    it('returns 400 HTTP status code  when no `password` is sent', (done) => {
      const options = {method: 'POST', url: '/user', payload: {name: 'Marcos', username: 'marc', email: 'marcos@thedon.com.br'}};
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "password" fails because ["password" is required]');
        done();
      });
    });

    it('returns 400 HTTP status code  when `password` is empty', (done) => {
      const options = {method: 'POST', url: '/user', payload: {name: 'Marcos', username: 'marc', email: 'marcos@thedon.com.br', password: ''}};
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "password" fails because ["password" is not allowed to be empty]');
        done();
      });
    });

    it('returns 400 HTTP status code  when `password` isn\'t a string ', (done) => {
      const options = {method: 'POST', url: '/user', payload: {name: 'Marcos', username: 'marc', email: 'marcos@thedon.com.br', password: 0}};
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "password" fails because ["password" must be a string]');
        done();
      });
    });

    it('return 400 HTTP status code when `password` haven\'t least than 6 chars', (done) => {
      const options = {method: 'POST', url: '/user', payload: {name: 'Marcos', username: 'marc', email: 'marcos@thedon.com.br', password: 'aaa'}};
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "password" fails because ["password" length must be at least 6 characters long]');
        done();
      });
    });

    it('return 400 HTTP status code when `password` haven\'t more than 50 chars', (done) => {
      const options = {method: 'POST', url: '/user', payload: {name: 'Marcos', username: 'marc', email: 'marcos@thedon.com.br', password: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}};
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "password" fails because ["password" length must be less than or equal to 50 characters long]');
        done();
      });
    });

    it('returns 201 HTTP status code when all data is correct', (done) => {
      const options = {method: 'POST', url: '/user', payload: {name: 'Jack B', username: 'jack_b', email: 'jack_b@24h.com', password: '123456'}};
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 201);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('token');
        done();
      });
    });
  });

  describe('PUT /user/{id}', () => {
    let userInfo;
    let token;
    before((done) => {
      truncate(db.Bookshelf.knex, 'users')
      .then(() => {
        const options = {
          method: 'POST',
          url: '/user',
          payload: {
            name: 'Jack Bauer',
            username: 'jack_b',
            email: 'jbauer@24hours.com',
            password: '#24hoursRescuePresident'
          }
        };

        server.injectThen(options)
        .then((response) => {
          token = response.result.token;
          userInfo = jwt.verify(token, JWT);
          done();
        });
      });
    });

    it('returns 400 HTTP status code  when `name` is empty', (done) => {
      const options = {
        method: 'PUT',
        url: '/user/' + userInfo.id,
        payload: {name: ''},
        headers: {'Authorization': 'Bearer ' + token}
      };
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "name" fails because ["name" is not allowed to be empty]');
        done();
      });
    });

    it('returns 400 HTTP status code  when `name` isn\'t a string', (done) => {
      const options = {
        method: 'PUT',
        url: '/user/' + userInfo.id,
        payload: {name: 0},
        headers: {'Authorization': 'Bearer ' + token}
      };
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "name" fails because ["name" must be a string]');
        done();
      });
    });

    it('return 400 HTTP status code when `name` haven\'t more than 30 chars', (done) => {
      const options = {
        method: 'PUT',
        url: '/user/' + userInfo.id,
        payload: {name: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'},
        headers: {'Authorization': 'Bearer ' + token}
      };
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "name" fails because ["name" length must be less than or equal to 30 characters long]');
        done();
      });
    });

    it('returns 400 HTTP status code  when `username` is empty', (done) => {
      const options = {
        method: 'PUT',
        url: '/user/' + userInfo.id,
        payload: {name: 'Marcos', username: ''},
        headers: {'Authorization': 'Bearer ' + token}
      };
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "username" fails because ["username" is not allowed to be empty]');
        done();
      });
    });

    it('returns 400 HTTP status code  when `username` isn\'t a string', (done) => {
      const options = {
        method: 'PUT',
        url: '/user/' + userInfo.id,
        payload: {name: 'Marcos', username: 0},
        headers: {'Authorization': 'Bearer ' + token}
      };
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "username" fails because ["username" must be a string]');
        done();
      });
    });

    it('return 400 HTTP status code when `username` haven\'t more than 20 chars', (done) => {
      const options = {
        method: 'PUT',
        url: '/user/' + userInfo.id,
        payload: {name: 'Marcos', username: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'},
        headers: {'Authorization': 'Bearer ' + token}
      };
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "username" fails because ["username" length must be less than or equal to 20 characters long]');
        done();
      });
    });

    it('returns 400 HTTP status code  when `email` is empty', (done) => {
      const options = {
        method: 'PUT',
        url: '/user/' + userInfo.id,
        payload: {name: 'Marcos', username: 'marc', email: ''},
        headers: {'Authorization': 'Bearer ' + token}
      };
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "email" fails because ["email" is not allowed to be empty]');
        done();
      });
    });

    it('returns 400 HTTP status code  when `email` isn\'t a string ', (done) => {
      const options = {
        method: 'PUT',
        url: '/user/' + userInfo.id,
        payload: {name: 'Marcos', username: 'marc', email: 0},
        headers: {'Authorization': 'Bearer ' + token}
      };
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "email" fails because ["email" must be a string]');
        done();
      });
    });

    it('returns 400 HTTP status code  when `email` is invalid email', (done) => {
      const options = {
        method: 'PUT',
        url: '/user/' + userInfo.id,
        payload: {name: 'Marcos', username: 'marc', email: 'notanemail'},
        headers: {'Authorization': 'Bearer ' + token}
      };
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "email" fails because ["email" must be a valid email]');
        done();
      });
    });

    it('returns 400 HTTP status code  when `password` is empty', (done) => {
      const options = {
        method: 'PUT',
        url: '/user/' + userInfo.id,
        payload: {name: 'Marcos', username: 'marc', email: 'marcos@thedon.com.br', password: ''},
        headers: {'Authorization': 'Bearer ' + token}
      };
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "password" fails because ["password" is not allowed to be empty]');
        done();
      });
    });

    it('returns 400 HTTP status code  when `password` isn\'t a string ', (done) => {
      const options = {
        method: 'PUT',
        url: '/user/' + userInfo.id,
        payload: {name: 'Marcos', username: 'marc', email: 'marcos@thedon.com.br', password: 0},
        headers: {'Authorization': 'Bearer ' + token}
      };
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "password" fails because ["password" must be a string]');
        done();
      });
    });

    it('return 400 HTTP status code when `password` haven\'t least than 6 chars', (done) => {
      const options = {
        method: 'PUT',
        url: '/user/' + userInfo.id,
        payload: {name: 'Marcos', username: 'marc', email: 'marcos@thedon.com.br', password: 'aaa'},
        headers: {'Authorization': 'Bearer ' + token}
      };
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "password" fails because ["password" length must be at least 6 characters long]');
        done();
      });
    });

    it('return 400 HTTP status code when `password` haven\'t more than 50 chars', (done) => {
      const options = {
        method: 'PUT',
        url: '/user/' + userInfo.id,
        payload: {name: 'Marcos', username: 'marc', email: 'marcos@thedon.com.br', password: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'},
        headers: {'Authorization': 'Bearer ' + token}
      };
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "password" fails because ["password" length must be less than or equal to 50 characters long]');
        done();
      });
    });

    it('returns 200 HTTP status code when all data is correct', (done) => {
      const options = {
        method: 'PUT',
        url: '/user/' + userInfo.id,
        payload: {name: 'Jack B R', username: 'jack_br', email: 'jack_br@24h.com', password: '123456vv'},
        headers: {'Authorization': 'Bearer ' + token}
      };
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 200);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('id');
        expect(response.result).to.have.property('name', 'Jack B R');
        expect(response.result).to.have.property('username', 'jack_br');
        expect(response.result).to.have.property('email', 'jack_br@24h.com');
        done();
      });
    });
  });

  describe('POST /user/login', () => {
    before((done) => {
      truncate(db.Bookshelf.knex, 'users')
      .then(() => {
        const options = {
          method: 'POST',
          url: '/user',
          payload: {
            name: 'Jack Bauer',
            username: 'jack_b',
            email: 'jbauer@24hours.com',
            password: '#24hoursRescuePresident'
          }
        };

        server.injectThen(options)
        .then((response) => {
          done();
        });
      });
    });

    it('returns 400 HTTP status code when no `email` is send', (done) => {
      const options = {
        method: 'POST',
        url: '/user/login',
        payload: {}
      };
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "email" fails because ["email" is required]');
        done();
      });
    });

    it('returns 400 HTTP status code when no `password` is send', (done) => {
      const options = {
        method: 'POST',
        url: '/user/login',
        payload: {email: 'jack@24h.com'}
      };
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "password" fails because ["password" is required]');
        done();
      });
    });

    it('returns 400 HTTP status code when `email` is invalid', (done) => {
      const options = {
        method: 'POST',
        url: '/user/login',
        payload: {email: 'jack'}
      };
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "email" fails because ["email" must be a valid email]');
        done();
      });
    });

    it('returns 401 HTTP status code when `email` isn`t in our base', (done) => {
      const options = {
        method: 'POST',
        url: '/user/login',
        payload: {email: 'jack_b@24h.com', password: 'd'}
      };
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 401);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 401);
        expect(response.result).to.have.property('error', 'Unauthorized');
        expect(response.result).to.have.property('message', 'Email or Password invalid');
        done();
      });
    });

    it('returns 401 HTTP status code when `password` is incorrect for this user', (done) => {
      const options = {
        method: 'POST',
        url: '/user/login',
        payload: {email: 'jbauer@24h.com', password: 'mmm'}
      };
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 401);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 401);
        expect(response.result).to.have.property('error', 'Unauthorized');
        expect(response.result).to.have.property('message', 'Email or Password invalid');
        done();
      });
    });

    it('returns 200 HTTP status code when success login', (done) => {
      const options = {
        method: 'POST',
        url: '/user/login',
        payload: {email: 'jbauer@24hours.com', password: '#24hoursRescuePresident'}
      };
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 200);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('token');
        done();
      });
    });
  });

  describe('DELETE /user/{id}', () => {
    let userInfo;
    let token;
    before((done) => {
      truncate(db.Bookshelf.knex, 'users')
      .then(() => {
        const options = {
          method: 'POST',
          url: '/user',
          payload: {
            name: 'Jack Bauer',
            username: 'jack_b',
            email: 'jbauer@24hours.com',
            password: '#24hoursRescuePresident'
          }
        };

        server.injectThen(options)
        .then((response) => {
          token = response.result.token;
          userInfo = jwt.verify(token, JWT);
          done();
        });
      });
    });

    it('returns 400 HTTP status code when no `id` is send', (done) => {
      const options = {
        method: 'DELETE',
        url: '/user',
        headers: {'Authorization': 'Bearer ' + token}
      };
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 400);
        expect(response).to.have.property('result');
        expect(response.result).to.have.property('statusCode', 400);
        expect(response.result).to.have.property('error', 'Bad Request');
        expect(response.result).to.have.property('message', 'child "id" fails because ["id" is required]');
        done();
      });
    });

    it('returns 200 HTTP status code when record is deleted', (done) => {
      const options = {
        method: 'DELETE',
        url: '/user/' + userInfo.id,
        headers: {'Authorization': 'Bearer ' + token}
      };
      server.injectThen(options)
      .then((response) => {
        expect(response).to.have.property('statusCode', 200);
        expect(response).to.have.property('result');
        expect(response.result).to.be.empty;
        done();
      });
    });
  });
});
