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

});