const chai = require('chai');
const should = chai.should();
const assert = chai.assert;
const expect = chai.expect;
const models = require('../models');
const app = require('../app');
const deleteModels = require('./helper').deleteModels;
const createModels = require('./helper').createModels;
const regularExpressions = require('../controllers/helpers/regularExpressions');
const normalizeStringToInteger = require('../controllers/helpers/normalizeStringToInteger');

describe('Users', () => {
  beforeEach((done) => {

    const testModels = [
      models.User,
      models.Account
    ];

    deleteModels(testModels, done);

  });
    
  describe('POST /users + form', () => {

    const newAccount = {
      id: 1,
      account_name: 'CAT',
      billing_address: '1 Main Street',
      billing_city: 'main city',
      billing_state: 'main state'
    };

    const newUser = {
      first_name: 'Lebron',
      last_name: 'James',
      email: 'lj@cavs.com',
      password: 'password',
      role: 1,
      accountId: 1
    };

    it('should return success if user successfully created', (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }];

      const cb = () => {
        chai.request(app)
          .post('/users')
          .send(newUser)
          .end((err, res) => {
            if (err) {
              console.log(err.stack);
              throw err;
            }

            res.should.have.status(200);
            res.body.success.should.be.true;
            done();

          });
      }

      createModels(modelsToCreate, cb);

    });

    it('should return failed if attempt to create user with existing email', (done) => {

      const firstUser = {
        first_name: 'Lebron',
        last_name: 'James',
        email: 'lj@cavs.com',
        password: 'password',
        role: 1,
        accountId: 1
      };

      const secondUser = {
        first_name: 'John',
        last_name: 'Smith',
        email: 'lj@cavs.com',
        password: 'password',
        role: 1,
        accountId: 1
      };

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }];

      const cb = () => {
        chai.request(app)
          .post('/users')
          .send(firstUser)
          .end((err, res) => {
            
            if (err) {
              console.log(err.stack);
              throw err;
            }

            res.should.have.status(200);
            res.body.success.should.be.true;

            chai.request(app)
              .post('/users')
              .send(secondUser)
              .end((err, res) => {

                err.should.exist;
                res.should.have.status(403);
                res.body.success.should.be.false;
                assert.typeOf(res.body.message, 'string');
                res.body.message.should.contain('error');
                done();

              });
          });
      }

      createModels(modelsToCreate, cb);

    });

    // for now we're treating all fields as "required" fields
    it('should return failed if attempt to create user without a required field', (done) => {

      const userWithoutFirstName = {
        last_name: 'James',
        email: 'lj@cavs.com',
        password: 'password',
        role: 1,
        accountId: 1
      };

      const userWithoutLastName = {
        first_name: 'Lebron',
        email: 'lj@cavs.com',
        password: 'password',
        role: 1,
        accountId: 1
      };

      const userWithoutEmail = {
        first_name: 'Lebron',
        last_name: 'James',
        password: 'password',
        role: 1,
        accountId: 1
      };

      const userWithoutPassword = {
        first_name: 'Lebron',
        last_name: 'James',
        email: 'lj@cavs.com',
        role: 1,
        accountId: 1
      };

      const userWithoutRole = {
        first_name: 'Lebron',
        last_name: 'James',
        email: 'lj@cavs.com',
        password: 'password',
        accountId: 1
      };

      const userWithoutAccountId = {
        first_name: 'Lebron',
        last_name: 'James',
        email: 'lj@cavs.com',
        password: 'password',
        role: 1
      };

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }];

      const cb = () => {

        chai.request(app)
          .post('/users')
          .send(userWithoutFirstName)
          .end((err, res) => {
            
            err.should.exist;
            res.should.have.status(403);
            assert.typeOf(res.body.message, 'string');
            res.body.message.should.contain('error');
            res.body.message.should.contain('first_name');
            
          });

        chai.request(app)
          .post('/users')
          .send(userWithoutLastName)
          .end((err, res) => {
            
            err.should.exist;
            res.should.have.status(403);
            assert.typeOf(res.body.message, 'string');
            res.body.message.should.contain('error');
            res.body.message.should.contain('last_name');
            
          });

        chai.request(app)
          .post('/users')
          .send(userWithoutEmail)
          .end((err, res) => {
            
            err.should.exist;
            res.should.have.status(403);
            assert.typeOf(res.body.message, 'string');
            res.body.message.should.contain('error');
            res.body.message.should.contain('email');
            
          });

        chai.request(app)
          .post('/users')
          .send(userWithoutPassword)
          .end((err, res) => {
            
            err.should.exist;
            res.should.have.status(403);
            assert.typeOf(res.body.message, 'string');
            res.body.message.should.contain('error');
            res.body.message.should.contain('password');
            
          });

        chai.request(app)
          .post('/users')
          .send(userWithoutRole)
          .end((err, res) => {
            
            err.should.exist;
            res.should.have.status(403);
            assert.typeOf(res.body.message, 'string');
            res.body.message.should.contain('error');
            res.body.message.should.contain('role');

          });

        chai.request(app)
          .post('/users')
          .send(userWithoutAccountId)
          .end((err, res) => {
            
            err.should.exist;
            res.should.have.status(403);
            assert.typeOf(res.body.message, 'string');
            res.body.message.should.contain('error');
            res.body.message.should.contain('accountId');
            
            done();

          });

      }

      createModels(modelsToCreate, cb);

    });

  });

  describe('POST /users/login + form', () => {

    const newAccount = {
      id: 1,
      account_name: 'CAT',
      billing_address: '1 Main Street',
      billing_city: 'main city',
      billing_state: 'main state'
    };

    const newUser = {
      first_name: 'Lebron',
      last_name: 'James',
      email: 'lj@cavs.com',
      password: 'password',
      role: 1,
      accountId: 1
    };

    it('should return success if login successfully', (done) => {

      const password = 'password';

      const newUser = {
        first_name: 'Lebron',
        last_name: 'James',
        email: 'lj@cavs.com',
        password: models.User.generateHash(password),
        role: 1,
        accountId: 1
      };

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.User,
        obj: newUser
      }];

      const cb = () => {
      
        const loginForm = {
          email: newUser.email,
          password
        };

        chai.request.agent(app)
          .post('/users/login')
          .send(loginForm)
          .end((err, res) => {
            if (err) {
              console.log(err.stack);
              throw err;
            }

            res.should.have.status(200);
            res.body.success.should.be.true;

            done();

          });

      }

      createModels(modelsToCreate, cb);

    });

    it('should return failed and no token if wrong password or email', (done) => {

      const password = 'password';

      const newUser = {
        first_name: 'Lebron',
        last_name: 'James',
        email: 'lj@cavs.com',
        password: models.User.generateHash(password),
        role: 1,
        accountId: 1
      };

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.User,
        obj: newUser
      }];

      const cb = () => {

        let loginForm = {
          email: newUser.email,
          password: 'refhuw'
        };

        chai.request(app)
          .post('/users/login')
          .send(loginForm)
          .end((err, res) => {
            
            err.should.exist;
            res.should.have.status(403);
            res.body.success.should.be.false;
            assert.typeOf(res.body.token, 'undefined');
            res.body.message.should.contain('error');
            res.body.message.should.contain('password');

            loginForm.email = 'blah@blah.site'; // false email
            chai.request(app)
              .post('/users/login')
              .send(loginForm)
              .end((err, res) => {
                
                err.should.exist;
                res.should.have.status(403);
                res.body.success.should.be.false;
                assert.typeOf(res.body.token, 'undefined');
                res.body.message.should.contain('error');
                res.body.message.should.contain('email');

                done();

              });

          });

      }

      createModels(modelsToCreate, cb);

    });

    it('should return failed if attempt to login without one of the two fields filled in', 
      (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.User,
        obj: newUser
      }];

      const cb = () => {

        let loginForm = {
          email: undefined,
          password: newUser.password
        };

        chai.request(app)
          .post('/users/login')
          .send(loginForm)
          .end((err, res) => {
            
            err.should.exist;
            res.should.have.status(403);
            res.body.success.should.be.false;
            assert.typeOf(res.body.message, 'string');
            res.body.message.should.contain('error');
            res.body.message.should.contain('email');

            loginForm = {
              email: newUser.email,
              password: undefined
            };

            chai.request(app)
              .post('/users/login')
              .send(loginForm)
              .end((err, res) => {

                err.should.exist;
                res.should.have.status(403);
                res.body.success.should.be.false;
                assert.typeOf(res.body.message, 'string');
                res.body.message.should.contain('error');
                res.body.message.should.contain('password');

                done();

              });

          });

      }

      createModels(modelsToCreate, cb);

    });

  });

  describe('GET /users', () => {

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
        .get('/users')
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
            // parse userRole cookie value from chai response object
            const userRole = res.header['set-cookie'][0].split('=')[1].split(';')[0]
                .replace(new RegExp('%22','g'), '');

            chai.request(app)
              .get(`/users/?userRole=${userRole}`)
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
          password: password
        };

        // chai agent is required for accessing cookies
        const agent = chai.request.agent(app);
        agent
          .post('/users/login')
          .send(loginForm)
          .then((res) => {
            
            res.should.have.status(200);
            // parse userRole cookie value from chai response object
            const userRole = res.header['set-cookie'][0].split('=')[1].split(';')[0]
                .replace(new RegExp('%22','g'), '');

            chai.request(app)
              .get(`/users/?userRole=${userRole}`)
              .end((err, res) => {
                if (err) {
                  err.should.not.exist;
                  throw err;
                }

                res.should.have.status(200);
                res.body.users.should.be.a.array;
                res.body.users.length.should.eql(1);
                expect(res.body.users[0].id).to.be.a('number');
                expect(res.body.users[0].first_name).to.be.a('string');
                expect(res.body.users[0].last_name).to.be.a('string');
                expect(res.body.users[0].email).to.be.a('string');
                res.body.users[0].email.should.match(regularExpressions.email);
                expect(res.body.users[0].password).to.be.a('string');
                expect(normalizeStringToInteger(res.body.users[0].role)).to.be.a('number');
                res.body.users[0].createdAt.should.exist;
                res.body.users[0].updatedAt.should.exist;
                expect(res.body.users[0].AccountId);

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