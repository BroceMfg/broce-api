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

});