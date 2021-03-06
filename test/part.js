const chai = require('chai');
const should = chai.should();
const assert = chai.assert;
const expect = chai.expect;
const models = require('../models');
const app = require('../app');
const deleteModels = require('./helper').deleteModels;
const createModels = require('./helper').createModels;
const normalizeStringToInteger = require('../controllers/helpers/normalizeStringToInteger');

describe('Accounts', () => {
  beforeEach((done) => {

    const testModels = [
      models.Order_Status,
      models.Order_Detail,
      models.Part,
      models.Order,
      models.User,
      models.Account
    ];

    deleteModels(testModels, done);

  });

  describe('GET /parts', () => {

    const newAccount = {
      id: 1,
      account_name: 'CAT',
      billing_address: '1 Main Street',
      billing_city: 'main city',
      billing_state: 'main state'
    };

    const password = 'password';

    const newClientUser = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@doe.com',
      password: models.User.generateHash(password),
      role: 0,
      AccountId: 1
    };

    const newPart = {
      id: 1,
      number: 'FX-22-LS-3',
      description: 'foobar',
      cost: 19.99,
      image_url: 'image url'
    };

    it('should return 403 forbidden if not authenticated user', (done) => {

      const modelsToCreate = [{
        model: models.Part,
        obj: newPart
      }];

      const cb = () => {

        chai.request(app)
        .get('/parts')
        .end((err, res) => {
          
          err.should.exist;
          res.should.have.status(403);
          res.body.success.should.be.false;
          assert.typeOf(res.body.message, 'string');
          res.body.message.should.contain('no user data found');

          done();
        });

      }

      createModels(modelsToCreate, cb);

    });

    it('should return parts data if authenticated user', (done) => {
      
      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.User,
        obj: newClientUser
      }, {
        model: models.Part,
        obj: newPart
      }];

      const cb = () => {

        const loginForm = {
          email: newClientUser.email,
          password: password
        };

        // chai agent is required for accessing cookies
        const agent = chai.request.agent(app);
        agent
          .post('/users/login')
          .send(loginForm)
          .then((res) => {
            
            res.should.have.status(200);
            // parse userId cookie value from chai response object
            const userId = res.header['set-cookie'][1].split('=')[1].split(';')[0]
                .replace(new RegExp('%22','g'), '');
            // parse userRole cookie value from chai response object
            const userRole = res.header['set-cookie'][0].split('=')[1].split(';')[0]
                .replace(new RegExp('%22','g'), '');

            chai.request(app)
              .get(`/parts/?userId=${userId}&userRole=${userRole}`)
              .end((err, res) => {
                if (err) {
                  err.should.not.exist;
                  done();
                }

                res.should.have.status(200);
                expect(res.body.parts).to.be.a('array');
                expect(res.body.parts.length).to.equal(1);
                const p = res.body.parts[0];
                expect(p.id).to.equal(newPart.id);
                expect(p.number).to.equal(newPart.number);
                expect(p.description).to.equal(newPart.description);
                expect(p.cost).to.equal(newPart.cost);
                expect(p.image_url).to.equal(newPart.image_url);

                done();
              });
          })
          .catch((err) => {
            err.should.not.exist;
            throw err;
          });

      }

      createModels(modelsToCreate, cb);

    });

  });

  describe('GET /parts/{id}', () => {

    const newAccount = {
      id: 1,
      account_name: 'CAT',
      billing_address: '1 Main Street',
      billing_city: 'main city',
      billing_state: 'main state'
    };

    const password = 'password';

    const newClientUser = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@doe.com',
      password: models.User.generateHash(password),
      role: 0,
      AccountId: 1
    };

    const newPart = {
      id: 1,
      number: 'FX-22-LS-3',
      description: 'foobar',
      cost: 19.99,
      image_url: 'image url'
    };

    it('should return 403 forbidden if not authenticated user', (done) => {

      const modelsToCreate = [{
        model: models.Part,
        obj: newPart
      }];

      const cb = () => {

        chai.request(app)
        .get(`/parts/${newPart.id}`)
        .end((err, res) => {
          
          err.should.exist;
          res.should.have.status(403);
          res.body.success.should.be.false;
          assert.typeOf(res.body.message, 'string');
          res.body.message.should.contain('no user data found');

          done();
        });

      }

      createModels(modelsToCreate, cb);

    });

    it('should return parts data if authenticated user', (done) => {
      
      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.User,
        obj: newClientUser
      }, {
        model: models.Part,
        obj: newPart
      }];

      const cb = () => {

        const loginForm = {
          email: newClientUser.email,
          password: password
        };

        // chai agent is required for accessing cookies
        const agent = chai.request.agent(app);
        agent
          .post('/users/login')
          .send(loginForm)
          .then((res) => {
            
            res.should.have.status(200);
            // parse userId cookie value from chai response object
            const userId = res.header['set-cookie'][1].split('=')[1].split(';')[0]
                .replace(new RegExp('%22','g'), '');
            // parse userRole cookie value from chai response object
            const userRole = res.header['set-cookie'][0].split('=')[1].split(';')[0]
                .replace(new RegExp('%22','g'), '');

            chai.request(app)
              .get(`/parts/${newPart.id}/?userId=${userId}&userRole=${userRole}`)
              .end((err, res) => {
                if (err) {
                  err.should.not.exist;
                  done();
                }

                res.should.have.status(200);
                const p = res.body.part;
                expect(p.id).to.equal(newPart.id);
                expect(p.number).to.equal(newPart.number);
                expect(p.description).to.equal(newPart.description);
                expect(p.cost).to.equal(newPart.cost);
                expect(p.image_url).to.equal(newPart.image_url);

                done();
              });
          })
          .catch((err) => {
            err.should.not.exist;
            throw err;
          });

      }

      createModels(modelsToCreate, cb);

    });

  });

  describe('POST /parts + form - ADMIN ONLY', () => {

    const newAccount = {
      id: 1,
      account_name: 'CAT',
      billing_address: '1 Main Street',
      billing_city: 'main city',
      billing_state: 'main state'
    };

    const password = 'password';

    const newClientUser = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@doe.com',
      password: models.User.generateHash(password),
      role: 0,
      AccountId: 1
    };

    const newAdminUser = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'jd@fake.com',
      password: models.User.generateHash(password),
      role: 1,
      accountId: 1
    };

    const newPart = {
      id: 1,
      number: 'FX-22-LS-3',
      description: 'foobar',
      cost: 19.99,
      image_url: 'image url'
    };

    it('should return 403 forbidden response if not authenticated user', (done) => {

      chai.request(app)
        .post('/parts')
        .send(newPart)
        .end((err, res) => {

          err.should.exist;
          res.should.have.status(403);
          res.body.success.should.be.false;
          assert.typeOf(res.body.message, 'string');
          res.body.message.toLowerCase().should.contain('no user data found');
          
          done();
        });
      
    });

    it('should return 403 forbidden if authenticated user but not admin', (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.User,
        obj: newClientUser
      }];

      const cb = () => {

        const loginForm = {
          email: newClientUser.email,
          password
        };

        const agent = chai.request.agent(app);
        agent
          .post('/users/login')
          .send(loginForm)
          .then((res) => {
            res.should.have.status(200);
            // parse userId cookie value from chai response object
            const userId = res.header['set-cookie'][1].split('=')[1].split(';')[0]
                .replace(new RegExp('%22','g'), '');
            // parse userRole cookie value from chai response object
            const userRole = res.header['set-cookie'][0].split('=')[1].split(';')[0]
                .replace(new RegExp('%22','g'), '');

            chai.request(app)
              .post(`/parts/?userId=${userId}&userRole=${userRole}`)
              .send(newPart)
              .end((err, res) => {

                err.should.exist;
                res.should.have.status(403);
                res.body.success.should.be.false;
                assert.typeOf(res.body.message, 'string');
                res.body.message.should.contain('permission denied');

                done();
              });

          })
          .catch((err) => {
            console.log(`err.message = ${err.message}`)
            err.should.not.exist;
            done();
          });
      }

      createModels(modelsToCreate, cb);
      
    });

    it('should return success if authenticated admin user', (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.User,
        obj: newAdminUser
      }];

      const cb = () => {

        const loginForm = {
          email: newAdminUser.email,
          password
        };

        const agent = chai.request.agent(app);
        agent
          .post('/users/login')
          .send(loginForm)
          .then((res) => {
            res.should.have.status(200);
            // parse userId cookie value from chai response object
            const userId = res.header['set-cookie'][1].split('=')[1].split(';')[0]
                .replace(new RegExp('%22','g'), '');
            // parse userRole cookie value from chai response object
            const userRole = res.header['set-cookie'][0].split('=')[1].split(';')[0]
                .replace(new RegExp('%22','g'), '');

            chai.request(app)
              .post(`/parts/?userId=${userId}&userRole=${userRole}`)
              .send(newPart)
              .end((err, res) => {
                if (err) {
                  err.should.not.exist;
                  done();
                }

                res.should.have.status(200);
                res.body.success.should.be.true;

                done();
              });

          })
          .catch((err) => {
            console.log(err.stack);
            throw err;
          });
      }

      createModels(modelsToCreate, cb);
      
    });

  });

  describe('PUT /parts/{id} - ADMIN ONLY', () => {

    const newAccount = {
      id: 1,
      account_name: 'CAT',
      billing_address: '1 Main Street',
      billing_city: 'main city',
      billing_state: 'main state'
    };

    const password = 'password';

    const newClientUser = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@doe.com',
      password: models.User.generateHash(password),
      role: 0,
      AccountId: 1
    };

    const newAdminUser = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'jd@fake.com',
      password: models.User.generateHash(password),
      role: 1,
      AccountId: 1
    };

    const newPart = {
      id: 1,
      number: 'FX-22-LS-3',
      description: 'foobar',
      cost: 19.99,
      image_url: 'image url'
    };

    const partForm = {
      number: 'new-part-number',
      description: 'blahblahblah',
      cost: 18.99,
      image_url: 'new-image-url'
    };

    it('should return 403 forbidden response if not authenticated user', (done) => {

      const modelsToCreate = [{
        model: models.Part,
        obj: newPart
      }];

      const cb = () => {

        // trying to update newAccount as unauthenticated user
        chai.request(app)
          .put(`/parts/${newPart.id}`)
          .send(partForm)
          .end((err, res) => {

            res.should.have.status(403);
            res.body.success.should.be.false;
            assert.typeOf(res.body.message, 'string');
            res.body.message.should.contain('no user data found');

            done();

          });

      }

      createModels(modelsToCreate, cb);

    });

    it('should return 403 forbidden response if authenticated but not admin',
      (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.User,
        obj: newClientUser
      }, {
        model: models.Part,
        obj: newPart
      }];

      const cb = () => {

        const loginForm = {
          email: newClientUser.email,
          password: password
        };

        // chai agent is required for accessing cookies
        const agent = chai.request.agent(app);
        agent
          .post('/users/login')
          .send(loginForm)
          .then((res) => {
            
            res.should.have.status(200);
            // parse userId cookie value from chai response object
            const userId = res.header['set-cookie'][1].split('=')[1].split(';')[0]
                .replace(new RegExp('%22','g'), '');
            // parse userRole cookie value from chai response object
            const userRole = res.header['set-cookie'][0].split('=')[1].split(';')[0]
                .replace(new RegExp('%22','g'), '');

            // trying to update newPart as newClientUser
            chai.request(app)
              .put(`/parts/${newPart.id}?userId=${userId}&userRole=${userRole}`)
              .send(partForm)
              .end((err, res) => {
                
                err.should.exist;
                res.should.have.status(403);
                res.body.success.should.be.false;
                assert.typeOf(res.body.message, 'string');
                res.body.message.toLowerCase().should.contain('permission denied');

                done();
              });
          })
          .catch((err) => {
            console.log(err.message);
            err.should.not.exist;
          });

      }

      createModels(modelsToCreate, cb);

    });

    it('should return success if admin',
      (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.User,
        obj: newAdminUser
      }, {
        model: models.Part,
        obj: newPart
      }];

      const cb = () => {

        const loginForm = {
          email: newAdminUser.email,
          password: password
        };

        // chai agent is required for accessing cookies
        const agent = chai.request.agent(app);
        agent
          .post('/users/login')
          .send(loginForm)
          .then((res) => {
            
            res.should.have.status(200);
            // parse userId cookie value from chai response object
            const userId = res.header['set-cookie'][1].split('=')[1].split(';')[0]
                .replace(new RegExp('%22','g'), '');
            // parse userRole cookie value from chai response object
            const userRole = res.header['set-cookie'][0].split('=')[1].split(';')[0]
                .replace(new RegExp('%22','g'), '');

            // trying to update newPart as newAdminUser
            chai.request(app)
              .put(`/parts/${newPart.id}?userId=${userId}&userRole=${userRole}`)
              .send(partForm)
              .end((err, res) => {
                if (err) {
                  console.log(err.mesaage)
                  console.log(err)
                  err.should.not.exist;
                  done();
                }
                
                res.should.have.status(200);
                expect(res.body.success).to.be.true;

                done();
              });
          })
          .catch((err) => {
            console.log(err.message);
            err.should.not.exist;
          });

      }

      createModels(modelsToCreate, cb);

    });

  });

  describe('DELETE /parts/{id} - ADMIN ONLY', () => {

    const newAccount = {
      id: 1,
      account_name: 'CAT',
      billing_address: '1 Main Street',
      billing_city: 'main city',
      billing_state: 'main state'
    };

    const password = 'password';

    const newClientUser = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@doe.com',
      password: models.User.generateHash(password),
      role: 0,
      AccountId: 1
    };

    const newAdminUser = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'jd@fake.com',
      password: models.User.generateHash(password),
      role: 1,
      AccountId: 1
    };

    const newPart = {
      id: 1,
      number: 'FX-22-LS-3',
      description: 'foobar',
      cost: 19.99,
      image_url: 'image url'
    };

    it('should return 403 forbidden response if not authenticated user', (done) => {

      const modelsToCreate = [{
        model: models.Part,
        obj: newPart
      }];

      const cb = () => {

        // trying to delete newPart as unauthenticated user
        chai.request(app)
          .delete(`/parts/${newPart.id}`)
          .end((err, res) => {

            err.should.exist;
            res.should.have.status(403);
            res.body.success.should.be.false;
            assert.typeOf(res.body.message, 'string');
            res.body.message.should.contain('no user data found');

            done();

          });

      }

      createModels(modelsToCreate, cb);

    });

    it('should return 403 forbidden response if authenticated but not admin',
      (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.User,
        obj: newClientUser
      }, {
        model: models.Part,
        obj: newPart
      }];

      const cb = () => {

        const loginForm = {
          email: newClientUser.email,
          password: password
        };

        // chai agent is required for accessing cookies
        const agent = chai.request.agent(app);
        agent
          .post('/users/login')
          .send(loginForm)
          .then((res) => {
            
            res.should.have.status(200);
            // parse userId cookie value from chai response object
            const userId = res.header['set-cookie'][1].split('=')[1].split(';')[0]
                .replace(new RegExp('%22','g'), '');
            // parse userRole cookie value from chai response object
            const userRole = res.header['set-cookie'][0].split('=')[1].split(';')[0]
                .replace(new RegExp('%22','g'), '');

            // trying to delete newPart as newClientUser
            chai.request(app)
              .delete(`/parts/${newPart.id}/?userId=${userId}&userRole=${userRole}`)
              .end((err, res) => {
                
                err.should.exist;
                res.should.have.status(403);
                res.body.success.should.be.false;
                assert.typeOf(res.body.message, 'string');
                res.body.message.toLowerCase().should.contain('permission denied');

                done();
              });
          })
          .catch((err) => {
            console.log(err.message);
            err.should.not.exist;
          });

      }

      createModels(modelsToCreate, cb);

    });

    it('should return success if admin', (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.User,
        obj: newAdminUser
      }, {
        model: models.Part,
        obj: newPart
      }];

      const cb = () => {

        const loginForm = {
          email: newAdminUser.email,
          password: password
        };

        // chai agent is required for accessing cookies
        const agent = chai.request.agent(app);
        agent
          .post('/users/login')
          .send(loginForm)
          .then((res) => {
            
            res.should.have.status(200);
            // parse userId cookie value from chai response object
            const userId = res.header['set-cookie'][1].split('=')[1].split(';')[0]
                .replace(new RegExp('%22','g'), '');
            // parse userRole cookie value from chai response object
            const userRole = res.header['set-cookie'][0].split('=')[1].split(';')[0]
                .replace(new RegExp('%22','g'), '');

            // trying to delete newPart as newAdminUser
            chai.request(app)
              .delete(`/parts/${newPart.id}/?userId=${userId}&userRole=${userRole}`)
              .end((err, res) => {
                if (err) {
                  err.should.not.exist;
                  done();
                }

                res.should.have.status(200);
                res.body.success.should.be.true;

                done();
              });
          })
          .catch((err) => {
            err.should.not.exist;
            throw err;
          });

      }

      createModels(modelsToCreate, cb);

    });

  });

});