const chai = require('chai');
const should = chai.should();
const assert = chai.assert;
const expect = chai.expect;
const models = require('../models');
const app = require('../app');
const deleteModels = require('./helper').deleteModels;
const createModels = require('./helper').createModels;
const normalizeStringToInteger = require('../controllers/helpers/normalizeStringToInteger');

describe('Orders', () => {

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

  describe('GET /orders - ADMIN ONLY', () => {

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
      accountId: 1
    };

    const newAdminUser = {
      id: 99,
      first_name: 'John',
      last_name: 'Doe',
      email: 'jd@fake.com',
      password: models.User.generateHash(password),
      role: 1,
      accountId: 1
    };

    const newOrder = {
      id: 1,
      shipping_address: 'an address',
      shipping_city: 'a city',
      shipping_state: 'a state',
      shipping_zip: 11111,
      po_number: '1234',
      UserId: 99
    };

    const newOrderDetail = {
      id: 1,
      machine_serial_num: 77,
      quantity: 1,
      price: 19.99,
      OrderId: 1,
      ShippingOptionId: 1,
      ShippingDetailId: 1,
      part_id: 1
    };

    const newPart = {
      id: 1,
      number: 'FX-22-LS-3',
      description: 'foobar',
      cost: 19.99,
      image_url: 'image url'
    };

    const newOrderStatus = {
      id: 1,
      current: true,
      StatusTypeId: 1,
      OrderId: 1
    };

    it('should return 403 forbidden response if not authenticated at all', (done) => {

      chai.request(app)
        .get('/orders')
        .end((err, res) => {
          
          err.should.exist;
          res.should.have.status(403);
          res.body.success.should.be.false;
          assert.typeOf(res.body.message, 'string');
          res.body.message.toLowerCase().should.contain('no user data found');
          
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
          password
        };

        const agent = chai.request.agent(app);
        agent
          .post('/users/login')
          .send(loginForm)
          .then((res) => {

            // const role = res.header['set-cookie'][0].split('=')[1].split(';')[0]
            //   .replace(new RegExp('%22','g'), '');

            return agent
              .get('/orders')
              .then((res) => {
                // should never get here
                res.should.not.exist;
                done();
              })
              .catch((err) => {

                err.should.exist;
                err.should.have.status(403);
                err.response.text.toLowerCase().should.contain('permission denied');

                done();
              });

          })

      }

      createModels(modelsToCreate, cb);

    });

    it('should return order data if admin', (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.User,
        obj: newAdminUser
      }, {
        model: models.Order,
        obj: newOrder
      }, {
        model: models.Part,
        obj: newPart
      }, {
        model: models.Order_Detail,
        obj: newOrderDetail
      }, {
        model: models.Order_Status,
        obj: newOrderStatus
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

            // should get res with admin cookie back here

            return agent
              .get(`/orders?token=${token}`)
              .then((res) => {

                res.should.have.status(200);
                res.body.orders.should.a('array');
                res.body.orders.length.should.eql(1);
                res.body.orders[0].id.should.eql(newOrder.id);
                res.body.orders[0].shipping_address.should.eql(newOrder.shipping_address);
                res.body.orders[0].shipping_city.should.eql(newOrder.shipping_city);
                res.body.orders[0].shipping_state.should.eql(newOrder.shipping_state);
                res.body.orders[0].shipping_zip.should.eql(newOrder.shipping_zip);
                res.body.orders[0].po_number.should.eql(newOrder.po_number);
                res.body.orders[0].UserId.should.eql(newOrder.UserId);

                res.body.orders[0].Order_Details.should.be.a('array');
                res.body.orders[0].Order_Statuses.should.be.a('array');

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
          })

      }

      createModels(modelsToCreate, done)

    });

    // TODO: add more tests for GET /orders with dummy data    

  });

  describe('POST /orders + form', () => {

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
      accountId: 1
    };

    const newOrder = {
      shipping_address: 'test_address',
      shipping_city: 'test_city',
      shipping_state: 'test_state',
      shipping_zip: 11111,
      po_number: 'test_po_number',
      UserId: 1
    };

    it('should return 403 forbidden response if not authenticated user', (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.User,
        obj: newAdminUser
      }];

      const cb = () => {

        const agent = chai.request.agent(app);
        chai.request(app)
          .post('/orders')
          .send(newOrder)
          .end((err, res) => {

            err.should.exist;
            res.should.have.status(403);
            res.body.success.should.be.false;
            assert.typeOf(res.body.message, 'string');
            res.body.message.toLowerCase().should.contain('no user data found');
            
            done();
          });
      }

      createModels(modelsToCreate, cb);
      
    });

    it('should return success if authenticated client user', (done) => {

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
            // should send res with admin cookie
            return agent
              .post('/orders')
              .send(newOrder)
              .then((res) => {

                res.should.have.status(200);
                done();
              })
              .catch((err) => {
                console.log(`err = ${JSON.stringify(err, null, 2)}`); 
                console.log(err.stack);
                throw err;
              })

          })
          .catch((err) => {
            console.log(err.stack);
            throw err;
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
            // shoudl send res with admin cookie
            return agent
              .post('/orders')
              .send(newOrder)
              .then((res) => {

                res.should.have.status(200);
                done();
              })
              .catch((err) => {
                console.log(`err = ${JSON.stringify(err, null, 2)}`); 
                console.log(err.stack);
                throw err;
              })

          })
          .catch((err) => {
            console.log(err.stack);
            throw err;
          });
      }

      createModels(modelsToCreate, cb);
      
    });

  });

  describe('GET /orders/{id} - Owner or Admin Only', () => {

    const newAccount = {
      id: 1,
      account_name: 'CAT',
      billing_address: '1 Main Street',
      billing_city: 'main city',
      billing_state: 'main state'
    };

    const password = 'password';

    const newAdminUser = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'jd@fake.com',
      password: models.User.generateHash(password),
      role: 1,
      AccountId: 1
    };

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
      AccountId: 1
    };

    const newOrder = {
      id: 2,
      shipping_address: 'an address',
      shipping_city: 'a city',
      shipping_state: 'a state',
      shipping_zip: 11111,
      po_number: '1234',
      UserId: 2
    };

    const newOrderDetail = {
      id: 1,
      machine_serial_num: 77,
      quantity: 1,
      price: 19.99,
      OrderId: 2,
      ShippingOptionId: 1,
      ShippingDetailId: 1,
      part_id: 1
    };

    const newPart = {
      id: 1,
      number: 'FX-22-LS-3',
      description: 'foobar',
      cost: 19.99,
      image_url: 'image url'
    };

    const newOrderStatus = {
      id: 1,
      current: true,
      StatusTypeId: 1,
      OrderId: 2
    };

    it('should return 403 forbidden response if not authenticated user', (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.User,
        obj: newClientUser
      }, {
        model: models.Order,
        obj: newOrder
      }, {
        model: models.Part,
        obj: newPart
      }, {
        model: models.Order_Detail,
        obj: newOrderDetail
      }, {
        model: models.Order_Status,
        obj: newOrderStatus
      }];

      const cb = () => {

        // trying to access newOrder as unauthenticated user
        chai.request(app)
          .get(`/orders/${newOrder.id}`)
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

    it('should return 403 forbidden response if authenticated but not appropriate user and not admin',
      (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.User,
        obj: newClientUser
      }, {
        model: models.User,
        obj: newIrrelevantClientUser
      }, {
        model: models.Order,
        obj: newOrder
      }, {
        model: models.Part,
        obj: newPart
      }, {
        model: models.Order_Detail,
        obj: newOrderDetail
      }, {
        model: models.Order_Status,
        obj: newOrderStatus
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
              .get(`/orders/${newOrder.id}?userId=${userId}&userRole=${userRole}`)
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

    it('should return success if appropriate user',
      (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.User,
        obj: newClientUser
      }, {
        model: models.User,
        obj: newIrrelevantClientUser
      }, {
        model: models.Order,
        obj: newOrder
      }, {
        model: models.Part,
        obj: newPart
      }, {
        model: models.Order_Detail,
        obj: newOrderDetail
      }, {
        model: models.Order_Status,
        obj: newOrderStatus
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

            // trying to access newClientUser as newClientUser
            chai.request(app)
              .get(`/orders/${newOrder.id}?userId=${userId}&userRole=${userRole}`)
              .end((err, res) => {
                if (err) {
                  err.should.not.exist;
                  done();
                }

                res.should.have.status(200);
                res.body.order.id.should.eql(newOrder.id);
                res.body.order.shipping_address.should.eql(newOrder.shipping_address);
                res.body.order.shipping_city.should.eql(newOrder.shipping_city);
                res.body.order.shipping_zip.should.eql(newOrder.shipping_zip);
                res.body.order.po_number.should.eql(newOrder.po_number);
                res.body.order.UserId.should.eql(normalizeStringToInteger(userId));
                res.body.order.Order_Details.should.be.a('array');
                res.body.order.Order_Statuses.should.be.a('array');

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
        obj: newClientUser
      }, {
        model: models.User,
        obj: newIrrelevantClientUser
      }, {
        model: models.User,
        obj: newAdminUser
      }, {
        model: models.Order,
        obj: newOrder
      }, {
        model: models.Part,
        obj: newPart
      }, {
        model: models.Order_Detail,
        obj: newOrderDetail
      }, {
        model: models.Order_Status,
        obj: newOrderStatus
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

            // trying to access newClientUser as admin
            chai.request(app)
              .get(`/orders/${newOrder.id}?userId=${userId}&userRole=${userRole}`)
              .end((err, res) => {
                if (err) {
                  err.should.not.exist;
                  done();
                }

                res.should.have.status(200);
                res.body.order.id.should.eql(newOrder.id);
                res.body.order.shipping_address.should.eql(newOrder.shipping_address);
                res.body.order.shipping_city.should.eql(newOrder.shipping_city);
                res.body.order.shipping_zip.should.eql(newOrder.shipping_zip);
                res.body.order.po_number.should.eql(newOrder.po_number);
                res.body.order.UserId.should.eql(newOrder.UserId);
                res.body.order.Order_Details.should.be.a('array');
                res.body.order.Order_Statuses.should.be.a('array');

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

  describe('PUT /orders/{id} - Owner or Admin Only', () => {

    const newAccount = {
      id: 1,
      account_name: 'CAT',
      billing_address: '1 Main Street',
      billing_city: 'main city',
      billing_state: 'main state'
    };

    const password = 'password';

    const newAdminUser = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'jd@fake.com',
      password: models.User.generateHash(password),
      role: 1,
      AccountId: 1
    };

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
      AccountId: 1
    };

    const newOrder = {
      id: 2,
      shipping_address: 'an address',
      shipping_city: 'a city',
      shipping_state: 'a state',
      shipping_zip: 11111,
      po_number: '1234',
      UserId: 2
    };

    const newOrderDetail = {
      id: 1,
      machine_serial_num: 77,
      quantity: 1,
      price: 19.99,
      OrderId: 2,
      ShippingOptionId: 1,
      ShippingDetailId: 1,
      part_id: 1
    };

    const newPart = {
      id: 1,
      number: 'FX-22-LS-3',
      description: 'foobar',
      cost: 19.99,
      image_url: 'image url'
    };

    const newOrderStatus = {
      id: 1,
      current: true,
      StatusTypeId: 1,
      OrderId: 2
    };

    const orderForm = {
      shipping_address: 'a new address',
      shipping_city: 'a new city',
      shipping_state: 'a new state',
      shipping_zip: 99999,
      po_number: '666'
    };

    it('should return 403 forbidden response if not authenticated user', (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.User,
        obj: newClientUser
      }, {
        model: models.Order,
        obj: newOrder
      }, {
        model: models.Part,
        obj: newPart
      }, {
        model: models.Order_Detail,
        obj: newOrderDetail
      }, {
        model: models.Order_Status,
        obj: newOrderStatus
      }];

      const cb = () => {

        // trying to access newOrder as unauthenticated user
        chai.request(app)
          .put(`/orders/${newOrder.id}`)
          .send(orderForm)
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

    it('should return 403 forbidden response if authenticated but not appropriate user and not admin',
      (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.User,
        obj: newClientUser
      }, {
        model: models.User,
        obj: newIrrelevantClientUser
      }, {
        model: models.Order,
        obj: newOrder
      }, {
        model: models.Part,
        obj: newPart
      }, {
        model: models.Order_Detail,
        obj: newOrderDetail
      }, {
        model: models.Order_Status,
        obj: newOrderStatus
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

            // trying to update newOrder as newIrrelevantUser
            chai.request(app)
              .put(`/orders/${newOrder.id}?userId=${userId}&userRole=${userRole}`)
              .send(orderForm)
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

    it('should return success if appropriate user',
      (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.User,
        obj: newClientUser
      }, {
        model: models.User,
        obj: newIrrelevantClientUser
      }, {
        model: models.Order,
        obj: newOrder
      }, {
        model: models.Part,
        obj: newPart
      }, {
        model: models.Order_Detail,
        obj: newOrderDetail
      }, {
        model: models.Order_Status,
        obj: newOrderStatus
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
              .put(`/orders/${newOrder.id}?userId=${userId}&userRole=${userRole}`)
              .send(orderForm)
              .end((err, res) => {
                if (err) {
                  err.should.not.exist;
                  done();
                }

                res.should.have.status(200);
                res.body.success.should.be.true;

                models.Order
                  .findOne({
                    where: { id: newOrder.id }
                  })
                  .then((order) => {
                    
                    order.id.should.eql(newOrder.id);
                    expect(order.shipping_address).to.equal(orderForm.shipping_address);
                    expect(order.shipping_city).to.equal(orderForm.shipping_city);
                    expect(order.shipping_state).to.equal(orderForm.shipping_state);
                    expect(order.shipping_zip).to.equal(orderForm.shipping_zip);
                    expect(order.po_number).to.equal(orderForm.po_number);
                    expect(order.UserId).to.equal(newClientUser.id);
                    
                    done();
                  })
                  .catch((err) => {
                    err.should.not.exist;
                    throw err;
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

    it('should return success if admin',
      (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.User,
        obj: newAdminUser
      }, {
        model: models.User,
        obj: newClientUser
      }, {
        model: models.Order,
        obj: newOrder
      }, {
        model: models.Part,
        obj: newPart
      }, {
        model: models.Order_Detail,
        obj: newOrderDetail
      }, {
        model: models.Order_Status,
        obj: newOrderStatus
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

            // trying to update newOrder as admin
            chai.request(app)
              .put(`/orders/${newOrder.id}?userId=${userId}&userRole=${userRole}`)
              .send(orderForm)
              .end((err, res) => {
                if (err) {
                  err.should.not.exist;
                  done();
                }

                res.should.have.status(200);
                res.body.success.should.be.true;

                models.Order
                  .findOne({
                    where: { id: newOrder.id }
                  })
                  .then((order) => {
                    
                    order.id.should.eql(newOrder.id);
                    expect(order.shipping_address).to.equal(orderForm.shipping_address);
                    expect(order.shipping_city).to.equal(orderForm.shipping_city);
                    expect(order.shipping_state).to.equal(orderForm.shipping_state);
                    expect(order.shipping_zip).to.equal(orderForm.shipping_zip);
                    expect(order.po_number).to.equal(orderForm.po_number);
                    expect(order.UserId).to.equal(newClientUser.id);
                    
                    done();
                  })
                  .catch((err) => {
                    err.should.not.exist;
                    throw err;
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

  describe('DELETE /orders/{id} - ADMIN ONLY', () => {

    const newAccount = {
      id: 1,
      account_name: 'CAT',
      billing_address: '1 Main Street',
      billing_city: 'main city',
      billing_state: 'main state'
    };

    const password = 'password';

    const newAdminUser = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'jd@fake.com',
      password: models.User.generateHash(password),
      role: 1,
      AccountId: 1
    };

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
      AccountId: 1
    };

    const newOrder = {
      id: 2,
      shipping_address: 'an address',
      shipping_city: 'a city',
      shipping_state: 'a state',
      shipping_zip: 11111,
      po_number: '1234',
      UserId: 2
    };

    const newOrderDetail = {
      id: 1,
      machine_serial_num: 77,
      quantity: 1,
      price: 19.99,
      OrderId: 2,
      ShippingOptionId: 1,
      ShippingDetailId: 1,
      part_id: 1
    };

    const newPart = {
      id: 1,
      number: 'FX-22-LS-3',
      description: 'foobar',
      cost: 19.99,
      image_url: 'image url'
    };

    const newOrderStatus = {
      id: 1,
      current: true,
      StatusTypeId: 1,
      OrderId: 2
    };

    const orderForm = {
      shipping_address: 'a new address',
      shipping_city: 'a new city',
      shipping_state: 'a new state',
      shipping_zip: 99999,
      po_number: '666'
    };

    it('should return 403 forbidden response if not authenticated user', (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.User,
        obj: newClientUser
      }, {
        model: models.Order,
        obj: newOrder
      }, {
        model: models.Part,
        obj: newPart
      }, {
        model: models.Order_Detail,
        obj: newOrderDetail
      }, {
        model: models.Order_Status,
        obj: newOrderStatus
      }];

      const cb = () => {

        // trying to delete newOrder as unauthenticated user
        chai.request(app)
          .delete(`/users/${newOrder.id}`)
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
        model: models.User,
        obj: newClientUser
      }, {
        model: models.User,
        obj: newIrrelevantClientUser
      }, {
        model: models.Order,
        obj: newOrder
      }, {
        model: models.Part,
        obj: newPart
      }, {
        model: models.Order_Detail,
        obj: newOrderDetail
      }, {
        model: models.Order_Status,
        obj: newOrderStatus
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

            // trying to delete newOrder as newIrrelevantUser
            chai.request(app)
              .delete(`/orders/${newOrder.id}/?userId=${userId}&userRole=${userRole}`)
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

    it('should return 403 forbidden if appropriate user (only the admin can delete orders)',
      (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.User,
        obj: newClientUser
      }, {
        model: models.User,
        obj: newIrrelevantClientUser
      }, {
        model: models.Order,
        obj: newOrder
      }, {
        model: models.Part,
        obj: newPart
      }, {
        model: models.Order_Detail,
        obj: newOrderDetail
      }, {
        model: models.Order_Status,
        obj: newOrderStatus
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

            // trying to delete newOrder as newClientUser
            chai.request(app)
              .delete(`/orders/${newOrder.id}/?userId=${userId}&userRole=${userRole}`)
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
        obj: newClientUser
      }, {
        model: models.User,
        obj: newAdminUser
      }, {
        model: models.Order,
        obj: newOrder
      }, {
        model: models.Part,
        obj: newPart
      }, {
        model: models.Order_Detail,
        obj: newOrderDetail
      }, {
        model: models.Order_Status,
        obj: newOrderStatus
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

            // trying to delete newOrder as newClientUser
            chai.request(app)
              .delete(`/orders/${newOrder.id}/?userId=${userId}&userRole=${userRole}`)
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

  describe('GET /orders/quoted - ADMIN ONLY', () => {

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

    const newOrder = {
      id: 1,
      shipping_address: 'an address',
      shipping_city: 'a city',
      shipping_state: 'a state',
      shipping_zip: 11111,
      po_number: '1234',
      UserId: 1
    };

    const newQuotedOrder = {
      id: 1,
      shipping_address: 'an address',
      shipping_city: 'a city',
      shipping_state: 'a state',
      shipping_zip: 11111,
      po_number: '1234',
      UserId: 1
    };

    const newPricedOrder = {
      id: 2,
      shipping_address: 'an address',
      shipping_city: 'a city',
      shipping_state: 'a state',
      shipping_zip: 11111,
      po_number: '1234',
      UserId: 1
    };

    const newOrderedOrder = {
      id: 3,
      shipping_address: 'an address',
      shipping_city: 'a city',
      shipping_state: 'a state',
      shipping_zip: 11111,
      po_number: '1234',
      UserId: 1
    };

    const newShippedOrder = {
      id: 4,
      shipping_address: 'an address',
      shipping_city: 'a city',
      shipping_state: 'a state',
      shipping_zip: 11111,
      po_number: '1234',
      UserId: 1
    };

    const newArchivedOrder = {
      id: 5,
      shipping_address: 'an address',
      shipping_city: 'a city',
      shipping_state: 'a state',
      shipping_zip: 11111,
      po_number: '1234',
      UserId: 1
    };

    const newAbandonedOrder = {
      id: 6,
      shipping_address: 'an address',
      shipping_city: 'a city',
      shipping_state: 'a state',
      shipping_zip: 11111,
      po_number: '1234',
      UserId: 1
    };

    const newQuotedOrderDetail = {
      id: 1,
      machine_serial_num: 77,
      quantity: 1,
      price: 19.99,
      OrderId: 1,
      ShippingOptionId: 1,
      ShippingDetailId: 1,
      part_id: 1
    };

    const newPricedOrderDetail = {
      id: 2,
      machine_serial_num: 77,
      quantity: 1,
      price: 19.99,
      OrderId: 2,
      ShippingOptionId: 1,
      ShippingDetailId: 1,
      part_id: 1
    };

    const newOrderedOrderDetail = {
      id: 3,
      machine_serial_num: 77,
      quantity: 1,
      price: 19.99,
      OrderId: 3,
      ShippingOptionId: 1,
      ShippingDetailId: 1,
      part_id: 1
    };

    const newShippedOrderDetail = {
      id: 4,
      machine_serial_num: 77,
      quantity: 1,
      price: 19.99,
      OrderId: 4,
      ShippingOptionId: 1,
      ShippingDetailId: 1,
      part_id: 1
    };

    const newArchivedOrderDetail = {
      id: 5,
      machine_serial_num: 77,
      quantity: 1,
      price: 19.99,
      OrderId: 5,
      ShippingOptionId: 1,
      ShippingDetailId: 1,
      part_id: 1
    };

    const newAbandonedOrderDetail = {
      id: 6,
      machine_serial_num: 77,
      quantity: 1,
      price: 19.99,
      OrderId: 6,
      ShippingOptionId: 1,
      ShippingDetailId: 1,
      part_id: 1
    };

    const newPart = {
      id: 1,
      number: 'FX-22-LS-3',
      description: 'foobar',
      cost: 19.99,
      image_url: 'image url'
    };

    const newQuotedOrderStatus = {
      id: 1,
      current: true,
      StatusTypeId: 1,
      OrderId: 1
    };

    const newPricedOrderStatus = {
      id: 2,
      current: true,
      StatusTypeId: 2,
      OrderId: 2
    };

    const newOrderedOrderStatus = {
      id: 3,
      current: false,
      StatusTypeId: 3,
      OrderId: 3
    };

    const newShippedOrderStatus = {
      id: 4,
      current: false,
      StatusTypeId: 4,
      OrderId: 4
    };

    const newArchivedOrderStatus = {
      id: 5,
      current: false,
      StatusTypeId: 5,
      OrderId: 5
    };

    const newAbandonedOrderStatus = {
      id: 6,
      current: false,
      StatusTypeId: 6,
      OrderId: 6
    };

    it('should return 403 forbidden if not authenticated user', (done) => {

      chai.request(app)
        .get('/orders/quoted')
        .end((err, res) => {
          err.should.exist;
          res.should.have.status(403);
          res.body.success.should.be.false;
          assert.typeOf(res.body.message, 'string');
          res.body.message.should.contain('no user data found');

          done();
        });

    });

    it('should return 403 forbidden if authenticated but not admin', (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.User,
        obj: newClientUser
      }, {
        model: models.Order,
        obj: newQuotedOrder
      }, {
        model: models.Order,
        obj: newPricedOrder
      }, {
        model: models.Order,
        obj: newOrderedOrder
      }, {
        model: models.Order,
        obj: newShippedOrder
      }, {
        model: models.Order,
        obj: newArchivedOrder
      }, {
        model: models.Order,
        obj: newAbandonedOrder
      }, {
        model: models.Part,
        obj: newPart
      }, {
        model: models.Order_Detail,
        obj: newQuotedOrderDetail
      }, {
        model: models.Order_Detail,
        obj: newPricedOrderDetail
      }, {
        model: models.Order_Detail,
        obj: newOrderedOrderDetail
      }, {
        model: models.Order_Detail,
        obj: newShippedOrderDetail
      }, {
        model: models.Order_Detail,
        obj: newArchivedOrderDetail
      }, {
        model: models.Order_Detail,
        obj: newAbandonedOrderDetail
      }, {
        model: models.Order_Status,
        obj: newQuotedOrderStatus
      }, {
        model: models.Order_Status,
        obj: newPricedOrderStatus
      }, {
        model: models.Order_Status,
        obj: newOrderedOrderStatus
      }, {
        model: models.Order_Status,
        obj: newShippedOrderStatus
      }, {
        model: models.Order_Status,
        obj: newArchivedOrderStatus
      }, {
        model: models.Order_Status,
        obj: newAbandonedOrderStatus
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

            // trying to get quoted orders as newClientUser
            chai.request(app)
              .get(`/orders/quoted/?userId=${userId}&userRole=${userRole}`)
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

    it('should return quoted orders if admin', (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.User,
        obj: newAdminUser
      }, {
        model: models.Order,
        obj: newQuotedOrder
      }, {
        model: models.Order,
        obj: newPricedOrder
      }, {
        model: models.Order,
        obj: newOrderedOrder
      }, {
        model: models.Order,
        obj: newShippedOrder
      }, {
        model: models.Order,
        obj: newArchivedOrder
      }, {
        model: models.Order,
        obj: newAbandonedOrder
      }, {
        model: models.Part,
        obj: newPart
      }, {
        model: models.Order_Detail,
        obj: newQuotedOrderDetail
      }, {
        model: models.Order_Detail,
        obj: newPricedOrderDetail
      }, {
        model: models.Order_Detail,
        obj: newOrderedOrderDetail
      }, {
        model: models.Order_Detail,
        obj: newShippedOrderDetail
      }, {
        model: models.Order_Detail,
        obj: newArchivedOrderDetail
      }, {
        model: models.Order_Detail,
        obj: newAbandonedOrderDetail
      }, {
        model: models.Order_Status,
        obj: newQuotedOrderStatus
      }, {
        model: models.Order_Status,
        obj: newPricedOrderStatus
      }, {
        model: models.Order_Status,
        obj: newOrderedOrderStatus
      }, {
        model: models.Order_Status,
        obj: newShippedOrderStatus
      }, {
        model: models.Order_Status,
        obj: newArchivedOrderStatus
      }, {
        model: models.Order_Status,
        obj: newAbandonedOrderStatus
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

            // trying to get quoted orders as newAdminUser
            chai.request(app)
              .get(`/orders/quoted/?userId=${userId}&userRole=${userRole}`)
              .end((err, res) => {
                if (err) {
                  err.should.not.exist;
                  done();
                }

                res.should.have.status(200);

                // Orders
                const orders = res.body.orders;
                orders.should.be.a('array');
                expect(orders.length).to.equal(1);
                expect(orders[0].id).to.equal(newQuotedOrder.id);
                expect(orders[0].shipping_address).to.equal(newQuotedOrder.shipping_address);
                expect(orders[0].shipping_city).to.equal(newQuotedOrder.shipping_city);
                expect(orders[0].shipping_state).to.equal(newQuotedOrder.shipping_state);
                expect(orders[0].shipping_zip).to.equal(newQuotedOrder.shipping_zip);
                expect(orders[0].po_number).to.equal(newQuotedOrder.
                  po_number);
                expect(orders[0].UserId).to.equal(newQuotedOrder.UserId);
                
                // Order_Details
                expect(orders[0].Order_Details).to.be.a('array');
                expect(orders[0].Order_Details.length).to.equal(1);
                expect(orders[0].Order_Details[0].machine_serial_num).to.equal(newQuotedOrderDetail.machine_serial_num);
                expect(orders[0].Order_Details[0].quantity).to.equal(newQuotedOrderDetail.quantity);
                expect(orders[0].Order_Details[0].price).to.equal(newQuotedOrderDetail.price);
                expect(orders[0].Order_Details[0].Part).to.be.a('object');
                expect(orders[0].Order_Details[0].Part.number).to.equal(newPart.number);
                expect(orders[0].Order_Details[0].Part.description).to.equal(newPart.description);
                expect(orders[0].Order_Details[0].Part.cost).to.equal(newPart.cost);
                expect(orders[0].Order_Details[0].Part.image_url).to.equal(newPart.image_url);
                
                // Order_Statuses
                expect(orders[0].Order_Statuses).to.be.a('array');
                expect(orders[0].Order_Statuses.length).to.equal(1);
                expect(orders[0].Order_Statuses[0].current).to.equal(
                  newQuotedOrderStatus.current);
                expect(orders[0].Order_Statuses[0].StatusTypeId).to.equal(newQuotedOrderStatus.StatusTypeId);

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

  describe('GET /orders/priced - ADMIN ONLY', () => {

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

    const newOrder = {
      id: 1,
      shipping_address: 'an address',
      shipping_city: 'a city',
      shipping_state: 'a state',
      shipping_zip: 11111,
      po_number: '1234',
      UserId: 1
    };

    const newQuotedOrder = {
      id: 1,
      shipping_address: 'an address',
      shipping_city: 'a city',
      shipping_state: 'a state',
      shipping_zip: 11111,
      po_number: '1234',
      UserId: 1
    };

    const newPricedOrder = {
      id: 2,
      shipping_address: 'an address',
      shipping_city: 'a city',
      shipping_state: 'a state',
      shipping_zip: 11111,
      po_number: '1234',
      UserId: 1
    };

    const newOrderedOrder = {
      id: 3,
      shipping_address: 'an address',
      shipping_city: 'a city',
      shipping_state: 'a state',
      shipping_zip: 11111,
      po_number: '1234',
      UserId: 1
    };

    const newShippedOrder = {
      id: 4,
      shipping_address: 'an address',
      shipping_city: 'a city',
      shipping_state: 'a state',
      shipping_zip: 11111,
      po_number: '1234',
      UserId: 1
    };

    const newArchivedOrder = {
      id: 5,
      shipping_address: 'an address',
      shipping_city: 'a city',
      shipping_state: 'a state',
      shipping_zip: 11111,
      po_number: '1234',
      UserId: 1
    };

    const newAbandonedOrder = {
      id: 6,
      shipping_address: 'an address',
      shipping_city: 'a city',
      shipping_state: 'a state',
      shipping_zip: 11111,
      po_number: '1234',
      UserId: 1
    };

    const newQuotedOrderDetail = {
      id: 1,
      machine_serial_num: 77,
      quantity: 1,
      price: 19.99,
      OrderId: 1,
      ShippingOptionId: 1,
      ShippingDetailId: 1,
      part_id: 1
    };

    const newPricedOrderDetail = {
      id: 2,
      machine_serial_num: 77,
      quantity: 1,
      price: 19.99,
      OrderId: 2,
      ShippingOptionId: 1,
      ShippingDetailId: 1,
      part_id: 1
    };

    const newOrderedOrderDetail = {
      id: 3,
      machine_serial_num: 77,
      quantity: 1,
      price: 19.99,
      OrderId: 3,
      ShippingOptionId: 1,
      ShippingDetailId: 1,
      part_id: 1
    };

    const newShippedOrderDetail = {
      id: 4,
      machine_serial_num: 77,
      quantity: 1,
      price: 19.99,
      OrderId: 4,
      ShippingOptionId: 1,
      ShippingDetailId: 1,
      part_id: 1
    };

    const newArchivedOrderDetail = {
      id: 5,
      machine_serial_num: 77,
      quantity: 1,
      price: 19.99,
      OrderId: 5,
      ShippingOptionId: 1,
      ShippingDetailId: 1,
      part_id: 1
    };

    const newAbandonedOrderDetail = {
      id: 6,
      machine_serial_num: 77,
      quantity: 1,
      price: 19.99,
      OrderId: 6,
      ShippingOptionId: 1,
      ShippingDetailId: 1,
      part_id: 1
    };

    const newPart = {
      id: 1,
      number: 'FX-22-LS-3',
      description: 'foobar',
      cost: 19.99,
      image_url: 'image url'
    };

    const newQuotedOrderStatus = {
      id: 1,
      current: true,
      StatusTypeId: 1,
      OrderId: 1
    };

    const newPricedOrderStatus = {
      id: 2,
      current: true,
      StatusTypeId: 2,
      OrderId: 2
    };

    const newOrderedOrderStatus = {
      id: 3,
      current: false,
      StatusTypeId: 3,
      OrderId: 3
    };

    const newShippedOrderStatus = {
      id: 4,
      current: false,
      StatusTypeId: 4,
      OrderId: 4
    };

    const newArchivedOrderStatus = {
      id: 5,
      current: false,
      StatusTypeId: 5,
      OrderId: 5
    };

    const newAbandonedOrderStatus = {
      id: 6,
      current: false,
      StatusTypeId: 6,
      OrderId: 6
    };

    it('should return 403 forbidden if not authenticated user', (done) => {

      chai.request(app)
        .get('/orders/priced')
        .end((err, res) => {
          err.should.exist;
          res.should.have.status(403);
          res.body.success.should.be.false;
          assert.typeOf(res.body.message, 'string');
          res.body.message.should.contain('no user data found');

          done();
        });

    });

    it('should return 403 forbidden if authenticated but not admin', (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.User,
        obj: newClientUser
      }, {
        model: models.Order,
        obj: newQuotedOrder
      }, {
        model: models.Order,
        obj: newPricedOrder
      }, {
        model: models.Order,
        obj: newOrderedOrder
      }, {
        model: models.Order,
        obj: newShippedOrder
      }, {
        model: models.Order,
        obj: newArchivedOrder
      }, {
        model: models.Order,
        obj: newAbandonedOrder
      }, {
        model: models.Part,
        obj: newPart
      }, {
        model: models.Order_Detail,
        obj: newQuotedOrderDetail
      }, {
        model: models.Order_Detail,
        obj: newPricedOrderDetail
      }, {
        model: models.Order_Detail,
        obj: newOrderedOrderDetail
      }, {
        model: models.Order_Detail,
        obj: newShippedOrderDetail
      }, {
        model: models.Order_Detail,
        obj: newArchivedOrderDetail
      }, {
        model: models.Order_Detail,
        obj: newAbandonedOrderDetail
      }, {
        model: models.Order_Status,
        obj: newQuotedOrderStatus
      }, {
        model: models.Order_Status,
        obj: newPricedOrderStatus
      }, {
        model: models.Order_Status,
        obj: newOrderedOrderStatus
      }, {
        model: models.Order_Status,
        obj: newShippedOrderStatus
      }, {
        model: models.Order_Status,
        obj: newArchivedOrderStatus
      }, {
        model: models.Order_Status,
        obj: newAbandonedOrderStatus
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

            // trying to get quoted orders as newClientUser
            chai.request(app)
              .get(`/orders/priced/?userId=${userId}&userRole=${userRole}`)
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

    it('should return quoted orders if admin', (done) => {

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.User,
        obj: newAdminUser
      }, {
        model: models.Order,
        obj: newQuotedOrder
      }, {
        model: models.Order,
        obj: newPricedOrder
      }, {
        model: models.Order,
        obj: newOrderedOrder
      }, {
        model: models.Order,
        obj: newShippedOrder
      }, {
        model: models.Order,
        obj: newArchivedOrder
      }, {
        model: models.Order,
        obj: newAbandonedOrder
      }, {
        model: models.Part,
        obj: newPart
      }, {
        model: models.Order_Detail,
        obj: newQuotedOrderDetail
      }, {
        model: models.Order_Detail,
        obj: newPricedOrderDetail
      }, {
        model: models.Order_Detail,
        obj: newOrderedOrderDetail
      }, {
        model: models.Order_Detail,
        obj: newShippedOrderDetail
      }, {
        model: models.Order_Detail,
        obj: newArchivedOrderDetail
      }, {
        model: models.Order_Detail,
        obj: newAbandonedOrderDetail
      }, {
        model: models.Order_Status,
        obj: newQuotedOrderStatus
      }, {
        model: models.Order_Status,
        obj: newPricedOrderStatus
      }, {
        model: models.Order_Status,
        obj: newOrderedOrderStatus
      }, {
        model: models.Order_Status,
        obj: newShippedOrderStatus
      }, {
        model: models.Order_Status,
        obj: newArchivedOrderStatus
      }, {
        model: models.Order_Status,
        obj: newAbandonedOrderStatus
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

            // trying to get quoted orders as newAdminUser
            chai.request(app)
              .get(`/orders/priced/?userId=${userId}&userRole=${userRole}`)
              .end((err, res) => {
                if (err) {
                  err.should.not.exist;
                  done();
                }

                res.should.have.status(200);

                // Orders
                const orders = res.body.orders;
                orders.should.be.a('array');
                expect(orders.length).to.equal(1);
                expect(orders[0].id).to.equal(newPricedOrder.id);
                expect(orders[0].shipping_address).to.equal(newPricedOrder.shipping_address);
                expect(orders[0].shipping_city).to.equal(newPricedOrder.shipping_city);
                expect(orders[0].shipping_state).to.equal(newPricedOrder.shipping_state);
                expect(orders[0].shipping_zip).to.equal(newPricedOrder.shipping_zip);
                expect(orders[0].po_number).to.equal(newPricedOrder.
                  po_number);
                expect(orders[0].UserId).to.equal(newPricedOrder.UserId);
                
                // Order_Details
                expect(orders[0].Order_Details).to.be.a('array');
                expect(orders[0].Order_Details.length).to.equal(1);
                expect(orders[0].Order_Details[0].machine_serial_num).to.equal(newPricedOrderDetail.machine_serial_num);
                expect(orders[0].Order_Details[0].quantity).to.equal(newPricedOrderDetail.quantity);
                expect(orders[0].Order_Details[0].price).to.equal(newPricedOrderDetail.price);
                expect(orders[0].Order_Details[0].Part).to.be.a('object');
                expect(orders[0].Order_Details[0].Part.number).to.equal(newPart.number);
                expect(orders[0].Order_Details[0].Part.description).to.equal(newPart.description);
                expect(orders[0].Order_Details[0].Part.cost).to.equal(newPart.cost);
                expect(orders[0].Order_Details[0].Part.image_url).to.equal(newPart.image_url);
                
                // Order_Statuses
                expect(orders[0].Order_Statuses).to.be.a('array');
                expect(orders[0].Order_Statuses.length).to.equal(1);
                expect(orders[0].Order_Statuses[0].current).to.equal(
                  newPricedOrderStatus.current);
                expect(orders[0].Order_Statuses[0].StatusTypeId).to.equal(newPricedOrderStatus.StatusTypeId);

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