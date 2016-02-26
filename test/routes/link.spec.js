/* global truncate, describe, before, it, expect, db, server */
'use strict';

const Promise = require('bluebird');

describe('Routes /link', () => {
  let userOwner;
  let userOther;

  before((done) => {
    let users = [];
    truncate(db.Bookshelf.knex, 'users')
    .then(() => {
      const optOwner = {
        method: 'POST',
        url: '/user',
        payload: {
          name: 'Wade Wilson',
          username: 'deadpool',
          password: 'daddyPool',
          email: 'wade@wilson.xxx'
        }
      };

      const optOther = {
        method: 'POST',
        url: '/user',
        payload: {
          name: 'Bruce Wayne',
          username: 'batman',
          password: 'IAmBatman',
          email: 'me@batman.com'
        }
      };

      users = [server.injectThen(optOwner), server.injectThen(optOther)];
      Promise.all(users)
      .then((result) => {
        userOwner = result[0].result.token;
        userOther = result[1].result.token;
        done();
      });
    });
  });

  describe('GET /link', () => {
    before((done) => {
      truncate(db.Bookshelf.knex, 'links')
      .then(() => {
        let links = [];
        const options = {
          method: 'POST',
          url: '/link',
          headers: {'Authorization': 'Bearer ' + userOwner},
          payload: {}
        };

        for (let i = 0; i < 5; i++) {
          options.payload = {
            url: 'https://google.com'
          };

          links.push(server.injectThen(options));
        }
        return Promise.all(links);
      })
      .then(() => done());
    });

    describe('when user was not logged', () => {
      it('should return 401 status code', (done) => {
        const options = {
          method: 'GET',
          url: '/link'
        };

        server.injectThen(options)
        .then((response) => {
          expect(response).to.have.property('statusCode', 401);
        })
        .then(() => done());
      });
    });

    describe('when the user was logged', () => {
      it('should return 200 status code', (done) => {
        const options = {
          method: 'GET',
          url: '/link',
          headers: {'Authorization': 'Bearer ' + userOther}
        };

        server.injectThen(options)
        .then((response) => {
          expect(response).to.have.property('statusCode', 200);
        })
        .then(() => done());
      });

      it('should return an empty array when user not have any links', (done) => {
        const options = {
          method: 'GET',
          url: '/link',
          headers: {'Authorization': 'Bearer ' + userOther}
        };

        server.injectThen(options)
        .then((response) => {
          expect(response).to.have.property('result');
          expect(response.result).to.have.length.least(0);
        })
        .then(() => done());
      });

      it('should return a not empty array when user have links', (done) => {
        const options = {
          method: 'GET',
          url: '/link',
          headers: {'Authorization': 'Bearer ' + userOwner}
        };

        server.injectThen(options)
        .tap((response) => {
          expect(response).to.have.property('result');
          expect(response.result).to.have.length.least(5);
        })
        .get('result')
        .map((link) => {
          expect(link).to.have.property('id');
          expect(link).to.have.property('url', 'https://google.com');
          expect(link).to.have.property('count', 0);
          expect(link).to.have.property('shorted');
        })
        .then(() => done());
      });
    });
  });

  describe('GET /link/{id}', () => {
    let link;
    before((done) => {
      truncate(db.Bookshelf.knex, 'links')
      .then(() => {
        const options = {
          method: 'POST',
          url: '/link',
          headers: {'Authorization': 'Bearer ' + userOwner},
          payload: {
            url: 'https://google.com'
          }
        };

        server.injectThen(options)
        .get('result')
        .then((l) => {
          link = l;
          done();
        });
      });
    });

    describe('when user was not logged', () => {
      it('should return 401 status code', (done) => {
        const options = {
          method: 'GET',
          url: '/link/' + link.id
        };

        server.injectThen(options)
        .then((response) => {
          expect(response).to.have.property('statusCode', 401);
        })
        .then(() => done());
      });
    });

    describe('when the user was logged', () => {
      it('should return 400 status code when the id is not a number', (done) => {
        const options = {
          method: 'GET',
          url: '/link/abc',
          headers: {'Authorization': 'Bearer ' + userOther}
        };

        server.injectThen(options)
        .then((response) => {
          expect(response).to.have.property('statusCode', 400);
          expect(response).to.have.property('result');
          expect(response.result).to.have.property('statusCode', 400);
          expect(response.result).to.have.property('message', 'child "id" fails because ["id" must be a number]');
        })
        .then(() => done());
      });

      it('should return 404 status code when the id not exist', (done) => {
        const options = {
          method: 'GET',
          url: '/link/1000',
          headers: {'Authorization': 'Bearer ' + userOther}
        };

        server.injectThen(options)
        .then((response) => {
          expect(response).to.have.property('statusCode', 404);
        })
        .then(() => done());
      });

      it('should return 404 status code when user is not the owner of link', (done) => {
        const options = {
          method: 'GET',
          url: '/link/' + link.id,
          headers: {'Authorization': 'Bearer ' + userOther}
        };

        server.injectThen(options)
        .then((response) => {
          expect(response).to.have.property('statusCode', 404);
        })
        .then(() => done());
      });

      it('should return the link when user is owner of the link', (done) => {
        const options = {
          method: 'GET',
          url: '/link/' + link.id,
          headers: {'Authorization': 'Bearer ' + userOwner}
        };

        server.injectThen(options)
        .tap((response) => {
          expect(response).to.have.property('result');
        })
        .get('result')
        .then((link) => {
          expect(link).to.have.property('id');
          expect(link).to.have.property('url', 'https://google.com');
          expect(link).to.have.property('count', 0);
          expect(link).to.have.property('shorted');
        })
        .then(() => done());
      });
    });
  });

  describe('POST /link', () => {
    before((done) => {
      truncate(db.Bookshelf.knex, 'links')
      .then(() => done());
    });

    describe('when user was not logged', () => {
      it('should return 400 status code when url not using https protocol', (done) => {
        const options = {
          method: 'POST',
          url: '/link',
          payload: {
            url: 'mongodb://localhost:27017/short'
          }
        };

        server.injectThen(options)
        .then((response) => {
          expect(response).to.have.property('statusCode', 400);
          expect(response).to.have.property('result');
          expect(response.result).to.have.property('statusCode', 400);
          expect(response.result).to.have.property('message', 'child "url" fails because ["url" must be a valid uri with a scheme matching the https? pattern]');
        })
        .then(() => done());
      });
      it('should return 200 status code', (done) => {
        const options = {
          method: 'POST',
          url: '/link',
          payload: {
            url: 'https://google.com'
          }
        };

        server.injectThen(options)
        .tap((response) => {
          expect(response).to.have.property('result');
        })
        .get('result')
        .then((link) => {
          expect(link).to.have.property('id');
          expect(link).to.have.property('url', 'https://google.com');
          expect(link).to.have.property('shorted');
        })
        .then(() => done());
      });
    });

    describe('when the user was logged', () => {
      it('should return 400 status code when url not using https protocol', (done) => {
        const options = {
          method: 'POST',
          url: '/link',
          headers: {'Authorization': 'Bearer ' + userOther},
          payload: {
            url: 'mongodb://localhost:27017/short'
          }
        };

        server.injectThen(options)
        .then((response) => {
          expect(response).to.have.property('statusCode', 400);
          expect(response).to.have.property('result');
          expect(response.result).to.have.property('statusCode', 400);
          expect(response.result).to.have.property('message', 'child "url" fails because ["url" must be a valid uri with a scheme matching the https? pattern]');
        })
        .then(() => done());
      });
      it('should return 200 status code', (done) => {
        const options = {
          method: 'POST',
          url: '/link',
          headers: {'Authorization': 'Bearer ' + userOther},
          payload: {
            url: 'https://google.com'
          }
        };

        server.injectThen(options)
        .tap((response) => {
          expect(response).to.have.property('result');
        })
        .get('result')
        .then((link) => {
          expect(link).to.have.property('id');
          expect(link).to.have.property('url', 'https://google.com');
          expect(link).to.have.property('shorted');
        })
        .then(() => done());
      });
    });
  });

  describe('PUT /link/{id}', () => {
    let link;
    before((done) => {
      truncate(db.Bookshelf.knex, 'links')
      .then(() => {
        const options = {
          method: 'POST',
          url: '/link',
          headers: {'Authorization': 'Bearer ' + userOwner},
          payload: {
            url: 'https://google.com'
          }
        };

        server.injectThen(options)
        .get('result')
        .then((l) => {
          link = l;
          done();
        });
      });
    });

    describe('when user was not logged', () => {
      it('should return 401 status code', (done) => {
        const options = {
          method: 'PUT',
          url: '/link/' + link.id,
          payload: {
            url: 'http://google.com'
          }
        };

        server.injectThen(options)
        .then((response) => {
          expect(response).to.have.property('statusCode', 401);
        })
        .then(() => done());
      });
    });

    describe('when the user was logged', () => {
      it('should return 400 status code when url not using https protocol', (done) => {
        const options = {
          method: 'PUT',
          url: '/link/' + link.id,
          payload: {
            url: 'mongodb://localhost:27017/short'
          },
          headers: {'Authorization': 'Bearer ' + userOther}
        };

        server.injectThen(options)
        .then((response) => {
          expect(response).to.have.property('statusCode', 400);
          expect(response).to.have.property('result');
          expect(response.result).to.have.property('statusCode', 400);
          expect(response.result).to.have.property('message', 'child "url" fails because ["url" must be a valid uri with a scheme matching the https? pattern]');
        })
        .then(() => done());
      });

      it('should return 400 status code when the id is not a number', (done) => {
        const options = {
          method: 'GET',
          url: '/link/abc',
          headers: {'Authorization': 'Bearer ' + userOther}
        };

        server.injectThen(options)
        .then((response) => {
          expect(response).to.have.property('statusCode', 400);
          expect(response).to.have.property('result');
          expect(response.result).to.have.property('statusCode', 400);
          expect(response.result).to.have.property('message', 'child "id" fails because ["id" must be a number]');
        })
        .then(() => done());
      });

      it('should return 400 status code when shorted is send to update', (done) => {
        const options = {
          method: 'PUT',
          url: '/link/' + link.id,
          payload: {
            url: 'https://mail.google.com',
            shorted: 'aa'
          },
          headers: {'Authorization': 'Bearer ' + userOwner}
        };

        server.injectThen(options)
        .then((response) => {
          expect(response).to.have.property('statusCode', 400);
          expect(response).to.have.property('result');
          expect(response.result).to.have.property('statusCode', 400);
          expect(response.result).to.have.property('message', '"shorted" is not allowed');
        })
        .then(() => done());
      });

      it('should return 400 status code when count is send to update', (done) => {
        const options = {
          method: 'PUT',
          url: '/link/' + link.id,
          payload: {
            url: 'https://mail.google.com',
            count: 1000
          },
          headers: {'Authorization': 'Bearer ' + userOwner}
        };

        server.injectThen(options)
        .then((response) => {
          expect(response).to.have.property('statusCode', 400);
          expect(response).to.have.property('result');
          expect(response.result).to.have.property('statusCode', 400);
          expect(response.result).to.have.property('message', '"count" is not allowed');
        })
        .then(() => done());
      });

      it('should return 404 status code when the id not exist', (done) => {
        const options = {
          method: 'PUT',
          url: '/link/1000',
          payload: {
            url: 'https://mail.google.com'
          },
          headers: {'Authorization': 'Bearer ' + userOther}
        };

        server.injectThen(options)
        .then((response) => {
          expect(response).to.have.property('statusCode', 404);
        })
        .then(() => done());
      });

      it('should return 404 status code when user is not the owner of link', (done) => {
        const options = {
          method: 'PUT',
          url: '/link/' + link.id,
          payload: {
            url: 'https://mail.google.com'
          },
          headers: {'Authorization': 'Bearer ' + userOther}
        };

        server.injectThen(options)
        .then((response) => {
          expect(response).to.have.property('statusCode', 404);
        })
        .then(() => done());
      });

      it('should return the link when user is owner of the link', (done) => {
        const options = {
          method: 'PUT',
          url: '/link/' + link.id,
          payload: {
            url: 'https://mail.google.com'
          },
          headers: {'Authorization': 'Bearer ' + userOwner}
        };

        server.injectThen(options)
        .tap((response) => {
          expect(response).to.have.property('result');
        })
        .get('result')
        .then((link) => {
          expect(link).to.have.property('url', 'https://mail.google.com');
          expect(link).to.have.property('shorted');
        })
        .then(() => done());
      });
    });
  });

  describe('DELETE /link/{id}', () => {
    let link;
    before((done) => {
      truncate(db.Bookshelf.knex, 'links')
      .then(() => {
        const options = {
          method: 'POST',
          url: '/link',
          headers: {'Authorization': 'Bearer ' + userOwner},
          payload: {
            url: 'https://google.com'
          }
        };

        server.injectThen(options)
        .get('result')
        .then((l) => {
          link = l;
          done();
        });
      });
    });

    describe('when user was not logged', () => {
      it('should return 401 status code', (done) => {
        const options = {
          method: 'DELETE',
          url: '/link/' + link.id
        };

        server.injectThen(options)
        .then((response) => {
          expect(response).to.have.property('statusCode', 401);
        })
        .then(() => done());
      });
    });

    describe('when the user was logged', () => {
      it('should return 400 status code when the id is not a number', (done) => {
        const options = {
          method: 'DELETE',
          url: '/link/abc',
          headers: {'Authorization': 'Bearer ' + userOther}
        };

        server.injectThen(options)
        .then((response) => {
          expect(response).to.have.property('statusCode', 400);
          expect(response).to.have.property('result');
          expect(response.result).to.have.property('statusCode', 400);
          expect(response.result).to.have.property('message', 'child "id" fails because ["id" must be a number]');
        })
        .then(() => done());
      });

      it('should return 404 status code when the id not exist', (done) => {
        const options = {
          method: 'DELETE',
          url: '/link/1000',
          headers: {'Authorization': 'Bearer ' + userOther}
        };

        server.injectThen(options)
        .then((response) => {
          expect(response).to.have.property('statusCode', 404);
        })
        .then(() => done());
      });

      it('should return 404 status code when user is not the owner of link', (done) => {
        const options = {
          method: 'DELETE',
          url: '/link/' + link.id,
          headers: {'Authorization': 'Bearer ' + userOther}
        };

        server.injectThen(options)
        .then((response) => {
          expect(response).to.have.property('statusCode', 404);
        })
        .then(() => done());
      });

      it('should return an empty object when user is owner of the link', (done) => {
        const options = {
          method: 'DELETE',
          url: '/link/' + link.id,
          headers: {'Authorization': 'Bearer ' + userOwner}
        };

        server.injectThen(options)
        .then((response) => {
          expect(response).to.have.property('result');
          expect(response.result).to.be.empty;
        })
        .then(() => done());
      });
    });
  });

  describe('GET /{id}', () => {
    let link;
    before((done) => {
      truncate(db.Bookshelf.knex, 'links')
      .then(() => {
        const options = {
          method: 'POST',
          url: '/link',
          headers: {'Authorization': 'Bearer ' + userOwner},
          payload: {
            url: 'https://google.com'
          }
        };

        server.injectThen(options)
        .get('result')
        .then((l) => {
          link = l;
          done();
        });
      });
    });

    describe('when the shorted link is requested', () => {
      it('should return 400 status code when the shorted id is invalid', (done) => {
        const options = {
          method: 'GET',
          url: '/aaaa'
        };

        server.injectThen(options)
        .then((response) => {
          expect(response).to.have.property('statusCode', 400);
        })
        .then(() => done());
      });

      it('should return 404 status code when the shorted id not in database', (done) => {
        const options = {
          method: 'GET',
          url: '/aaaaaaa'
        };

        server.injectThen(options)
        .then((response) => {
          expect(response).to.have.property('statusCode', 404);
        })
        .then(() => done());
      });

      it('should return count equal than 0 before shorted url access', (done) => {
        const options = {
          method: 'GET',
          url: '/link/' + link.id,
          headers: {'Authorization': 'Bearer ' + userOwner}
        };

        server.injectThen(options)
        .tap((response) => {
          expect(response).to.have.property('result');
        })
        .get('result')
        .then((link) => {
          expect(link).to.have.property('id');
          expect(link).to.have.property('url', 'https://google.com');
          expect(link).to.have.property('count', 0);
          expect(link).to.have.property('shorted');
        })
        .then(() => done());
      });

      describe('test', () => {
        before((done) => {
          let access = [];

          const options = {
            method: 'GET',
            url: '/' + link.shorted
          };

          for (let i = 0; i < 10; i++) {
            access.push(server.injectThen(options));
          }

          return Promise.all(access)
          .then(() => done());
        });

        it('should return count least 10, after 10 access in shorted url', (done) => {
          const options = {
            method: 'GET',
            url: '/link/' + link.id,
            headers: {'Authorization': 'Bearer ' + userOwner}
          };

          server.injectThen(options)
          .tap((response) => {
            expect(response).to.have.property('result');
          })
          .get('result')
          .then((link) => {
            expect(link).to.have.property('id');
            expect(link).to.have.property('url', 'https://google.com');
            expect(link).to.have.property('count', 10);
            expect(link).to.have.property('shorted');
          })
          .then(() => done());
        });
      });
    });
  });
});
