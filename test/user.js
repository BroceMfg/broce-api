const chai = require('chai');
const should = chai.should();
const assert = chai.assert;
const models = require('../models');
const app = require('../app');

describe('Orders', () => {

  beforeEach((done) => {
    models.User
      .findAll({})
      .then((items) => {
        items.forEach((item) => {
          item.destroy();
        });
        models.Account
          .findAll({})
          .then((items) => {
            items.forEach((item) => {
              item.destroy();
            });
            done();
          })
          .catch((err) => {
            console.log(err.stack);
            throw err;
          });
      })
      .catch((err) => {
        console.log(err.stack);
        throw err;
      });
  });
    
  describe('POST /users + form', () => {

    it('should return success if user successfully created', (done) => {

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

      models.Account
        .create(newAccount)
        .then((success) => {
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
            
        })
        .catch((err) => {
          console.log(err.stack);
          throw err;
        });

    });

    it('should return failed if attempt to create user with existing email', (done) => {

      const newAccount = {
        id: 1,
        account_name: 'CAT',
        billing_address: '1 Main Street',
        billing_city: 'main city',
        billing_state: 'main state'
      };

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

      models.Account
        .create(newAccount)
        .then((success) => {
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
            
        })
        .catch((err) => {
          console.log(err.stack);
          throw err;
        });

    });

    // for now we're treating all fields as "required" fields
    it('should return failed if attempt to create user without a required field', (done) => {

      const newAccount = {
        id: 1,
        account_name: 'CAT',
        billing_address: '1 Main Street',
        billing_city: 'main city',
        billing_state: 'main state'
      };

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

      models.Account
        .create(newAccount)
        .then((success) => {
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
            
        })
        .catch((err) => {
          console.log(err.stack);
          throw err;
        });

    });

  });

});