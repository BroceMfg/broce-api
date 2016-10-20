const chai = require('chai');
const should = chai.should();
const assert = chai.assert;
const models = require('../models');
const app = require('../app');
const deleteModels = require('./helper').deleteModels;
const createModels = require('./helper').createModels;

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

  describe('GET /orders', () => {

    it('should return 403 forbidden response if not admin', (done) => {
      chai.request(app)
        .get('/orders')
        .end((err, res) => {
          
          err.should.exist;
          res.should.have.status(403);
          res.body.success.should.be.false;
          assert.typeOf(res.body.message, 'string');
          res.body.message.toLowerCase().should.contain('no token provided');
          
          done();
        });
    });

    it('should return order data if admin', (done) => {

      const newAccount = {
        id: 1,
        account_name: 'CAT',
        billing_address: '1 Main Street',
        billing_city: 'main city',
        billing_state: 'main state'
      };

      const password = 'password';

      const newUser = {
        id: 1,
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
        UserId: 1
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

      const modelsToCreate = [{
        model: models.Account,
        obj: newAccount
      }, {
        model: models.User,
        obj: newUser
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
          email: newUser.email,
          password
        };

        chai.request(app)
          .post('/users/login')
          .send(loginForm)
          .end((err, res) => {
            if (err) {
              console.log(err.stack);
              throw err;
            }
            // should get back success res with token
            res.should.have.status(200);
            res.body.success.should.be.true;
            assert.typeOf(res.body.token, 'string');

            const token = res.body.token;
            chai.request(app)
              .get(`/orders?token=${token}`)
              .end((err, res) => {
                if (err) {
                  console.log(err.stack);
                  throw err;
                }
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

                // console.log(`res.body = ${JSON.stringify(res.body, null, 2)}`);
                done();
              });

          });
      }

      createModels(modelsToCreate, done)

    });

    // TODO: add more tests for GET /orders with dummy data    

  });

  describe('POST /orders + form', () => {

    

    const newOrder = {
      shipping_address: 'test_address',
      shipping_city: 'test_city',
      shipping_state: 'test_state',
      shipping_zip: 11111,
      po_number: 'test_po_number',
      UserId: 1
    };

    // it('should return 403 forbidden response if not authenticated user', (done) => {
    //   chai.request(app)
    //     .post('/orders')
    //     .send(newOrder)
    //     .end((err, res) => {

    //       console.log(res.body);

    //       err.should.exist;
    //       res.should.have.status(403);
    //       res.body.success.should.be.false;
    //       assert.typeOf(res.body.message, 'string');
    //       res.body.message.should.contain('error');

    //       done();
    //     })
    // });

  });

});