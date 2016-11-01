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
      models.Account,
      models.User
    ];

    deleteModels(testModels, done);

  });

  describe('GET /accounts - ADMIN ONLY', () => {

    const newAccount = {
      id: 1,
      account_name: 'CAT',
      billing_address: '1 Main Street',
      billing_city: 'main city',
      billing_state: 'main state'
    };

    const password = 'password';

    const newClientUser = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@doe.com',
      password: models.User.generateHash(password),
      role: 0,
      accountId: 1
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

    it('should return 403 forbidden response if not authenticated user', (done) => {

      chai.request(app)
        .get('/orders')
        .end((err, res) => {

          err.should.exist;
          res.should.have.status(403);
          res.body.success.should.be.false;
          assert.typeOf(res.body.message, 'string');
          res.body.message.should.contain('no user data found');

          done();

        });

    });

    it('should return 403 forbidden response if authenticated but not admin', (done) => {

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
              .get(`/orders/?userId=${userId}&userRole=${userRole}`)
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
            err.should.not.exist;
            throw err;
          });

      }

      createModels(modelsToCreate, cb);

    });

    it('should return accounts if admin', (done) => {

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
              .get(`/accounts/?userId=${userId}&userRole=${userRole}`)
              .end((err, res) => {
                if (err) {
                  err.should.not.exist;
                  throw err;
                }

                res.should.have.status(200);
                expect(res.body.accounts).to.be.a('array');
                expect(res.body.accounts.length).to.eql(1);
                expect(res.body.accounts[0].id).to.eql(newAccount.id);
                expect(res.body.accounts[0].account_name).to.eql(newAccount.account_name);
                expect(res.body.accounts[0].billing_address).to.eql(newAccount.billing_address);
                expect(res.body.accounts[0].billing_state).to.eql(newAccount.billing_state);

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

  describe('GET /accounts/{id} - Member or Admin Only', () => {

    const newAccount = {
      id: 1,
      account_name: 'CAT',
      billing_address: '1 Main Street',
      billing_city: 'main city',
      billing_state: 'main state'
    };

    const newAccount2 = {
      id: 2,
      account_name: 'John Deere',
      billing_address: '2 Main Street',
      billing_city: 'kinda-main city',
      billing_state: 'kinda-main state'
    };

    const password = 'password';

    const newClientUser = {
      id: 2,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@doe.com',
      password: models.User.generateHash(password),
      role: 0,
      AccountId: 1
    };

    const newIrrelevantClientUser = {
      id: 3,
      first_name: 'Bob',
      last_name: 'Builder',
      email: 'bob@bob.com',
      password: models.User.generateHash(password),
      role: 0,
      AccountId: 2
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

    it('should return 403 forbidden response if not authenticated user', (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }];

      const cb = () => {

        // trying to access newAccount as unauthenticated user
        chai.request(app)
          .get(`/accounts/${newAccount.id}`)
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

    it('should return 403 forbidden response if authenticated but not appropriate user and not admin',
      (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.Account,
        obj: newAccount2
      }, {
        model: models.User,
        obj: newIrrelevantClientUser
      }];

      const cb = () => {

        const loginForm = {
          email: newIrrelevantClientUser.email,
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

            // trying to access newIrrelevantClientUser as newClientUser
            chai.request(app)
              .get(`/accounts/${newAccount.id}/?userId=${userId}&userRole=${userRole}`)
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

    it('should return success if user is member of account',
      (done) => {

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

            // trying to access newAccount as newClientUser (member)
            chai.request(app)
              .get(`/accounts/${newAccount.id}/?userId=${userId}&userRole=${userRole}`)
              .end((err, res) => {
                if (err) {
                  err.should.not.exist;
                  done();
                }

                res.should.have.status(200);
                const a = res.body.account;
                expect(a.id).to.equal(newAccount.id);
                expect(a.account_name).to.equal(newAccount.account_name);
                expect(a.billing_address).to.equal(newAccount.billing_address);
                expect(a.billing_city).to.equal(newAccount.billing_city);
                expect(a.billing_state).to.equal(newAccount.billing_state);

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

    it('should return success if admin',
      (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.Account,
        obj: newAccount2
      }, {
        model: models.User,
        obj: newAdminUser
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


            // trying to access newAccount2 as newAdminUser (non-member but admin)
            chai.request(app)
              .get(`/accounts/${newAccount2.id}/?userId=${userId}&userRole=${userRole}`)
              .end((err, res) => {
                if (err) {
                  err.should.not.exist;
                  done();
                }

                res.should.have.status(200);
                const a = res.body.account;
                expect(a.id).to.equal(newAccount2.id);
                expect(a.account_name).to.equal(newAccount2.account_name);
                expect(a.billing_address).to.equal(newAccount2.billing_address);
                expect(a.billing_city).to.equal(newAccount2.billing_city);
                expect(a.billing_state).to.equal(newAccount2.billing_state);

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

  describe('POST /accounts - ADMIN ONLY', () => {

    const newAccount = {
      id: 1,
      account_name: 'CAT',
      billing_address: '1 Main Street',
      billing_city: 'main city',
      billing_state: 'main state'
    };

    const newAccount2 = {
      id: 2,
      account_name: 'John Deere',
      billing_address: '2 Main Street',
      billing_city: 'kinda-main city',
      billing_state: 'kinda-main state'
    };

    const password = 'password';

    const newClientUser = {
      id: 2,
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

    it('should return 403 forbidden response if not authenticated user', (done) => {

      chai.request(app)
        .post('/accounts')
        .send(newAccount)
        .end((err, res) => {

          err.should.exist;
          res.should.have.status(403);
          res.body.success.should.be.false;
          assert.typeOf(res.body.message, 'string');
          res.body.message.toLowerCase().should.contain('no user data found');
          
          done();
        });
      
    });

    it('should return 403 forbidden response if authenticated client user, but not admin',
      (done) => {

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
              .post(`/accounts/?userId=${userId}&userRole=${userRole}`)
              .send(newAccount2)
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
            console.log(err.stack);
            throw err;
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
              .post(`/accounts/?userId=${userId}&userRole=${userRole}`)
              .send(newAccount2)
              .end((err, res) => {
                if (err) {
                  err.should.not.exist;
                  done();
                }
                
                res.should.have.status(200);
                expect(res.body.success).to.be.true;

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

  describe('PUT /accounts/{id} - ADMIN ONLY', () => {

    const newAccount = {
      id: 1,
      account_name: 'CAT',
      billing_address: '1 Main Street',
      billing_city: 'main city',
      billing_state: 'main state'
    };

    const newAccount2 = {
      id: 2,
      account_name: 'John Deere',
      billing_address: '2 Main Street',
      billing_city: 'kinda-main city',
      billing_state: 'kinda-main state'
    };

    const password = 'password';

    const newClientUser = {
      id: 2,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@doe.com',
      password: models.User.generateHash(password),
      role: 0,
      AccountId: 1
    };

    const newIrrelevantClientUser = {
      id: 3,
      first_name: 'Bob',
      last_name: 'Builder',
      email: 'bob@bob.com',
      password: models.User.generateHash(password),
      role: 0,
      AccountId: 2
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

    const accountForm = {
      account_name: 'a new account_name',
      billing_address: 'a new billing_address',
      billing_city: 'a new billing_city',
      billing_state: 'a new billing_state'
    };

    it('should return 403 forbidden response if not authenticated user', (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }];

      const cb = () => {

        // trying to update newAccount as unauthenticated user
        chai.request(app)
          .put(`/accounts/${newAccount.id}`)
          .send(accountForm)
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

            // trying to update newOrder as newClientUser
            chai.request(app)
              .put(`/accounts/${newAccount.id}?userId=${userId}&userRole=${userRole}`)
              .send(accountForm)
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

            // trying to update newOrder as newAdminUser
            chai.request(app)
              .put(`/accounts/${newAccount.id}?userId=${userId}&userRole=${userRole}`)
              .send(accountForm)
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

  describe('DELETE /acounts/{id} - ADMIN ONLY', () => {

    const newAccount = {
      id: 1,
      account_name: 'CAT',
      billing_address: '1 Main Street',
      billing_city: 'main city',
      billing_state: 'main state'
    };

    const newAccount2 = {
      id: 2,
      account_name: 'John Deere',
      billing_address: '2 Main Street',
      billing_city: 'kinda-main city',
      billing_state: 'kinda-main state'
    };

    const password = 'password';

    const newClientUser = {
      id: 2,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@doe.com',
      password: models.User.generateHash(password),
      role: 0,
      AccountId: 2
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

    it('should return 403 forbidden response if not authenticated user', (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }];

      const cb = () => {

        // trying to delete newAccount as unauthenticated user
        chai.request(app)
          .delete(`/accounts/${newAccount.id}`)
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
        obj: newAccount2
      }, {
        model: models.User,
        obj: newClientUser
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

            // trying to delete newOrder as newIrrelevantUser
            chai.request(app)
              .delete(`/accounts/${newAccount2.id}/?userId=${userId}&userRole=${userRole}`)
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
        model: models.Account,
        obj: newAccount2
      }, {
        model: models.User,
        obj: newAdminUser
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

            // trying to delete newAccount as newClientUser
            chai.request(app)
              .delete(`/accounts/${newAccount.id}/?userId=${userId}&userRole=${userRole}`)
              .end((err, res) => {
                if (err) {
                  err.should.not.exist;
                  done();
                }

                res.should.have.status(200);
                res.body.success.should.be.true;

                // trying to delete newAccount2 as newClientUser
                chai.request(app)
                  .delete(`/accounts/${newAccount2.id}/?userId=${userId}&userRole=${userRole}`)
                  .end((err, res) => {
                    if (err) {
                      err.should.not.exist;
                      done();
                    }

                    res.should.have.status(200);
                    res.body.success.should.be.true;
                    
                    done();
                  });

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