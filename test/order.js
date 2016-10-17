const chai = require('chai');
const should = chai.should();
const models = require('../models');
const app = require('../app');

describe('Orders', () => {

  beforeEach((done) => {
    models.Order_Status
      .findAll({})
      .then((items) => {
        items.forEach((item) => {
          item.destroy();
        });
        models.Order_Detail
          .findAll({})
          .then((items) => {
            items.forEach((item) => {
              item.destroy();
            });
            models.Part
              .findAll({})
              .then((items) => {
                items.forEach((item) => {
                  item.destroy();
                });
                models.Order
                  .findAll({})
                  .then((items) => {
                    items.forEach((item) => {
                      item.destroy();
                    });
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
                          })
                      })
                      .catch((err) => {
                        console.log(err.stack);
                        throw err;
                      })
                  })
                  .catch((err) => {
                    console.log(err.stack);
                    throw err;
                  })
              })
              .catch((err) => {
                console.log(err.stack);
                throw err;
              })
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

  describe('GET /orders', () => {

    // it('should return 403 forbidden response if not admin', (done) => {
    //   chai.request(app)
    //     .get('/orders')
    //     .end((err, res) => {
    //       if (err) console.log(err.stack);
    //       res.should.have.status(403);
    //       done();
    //     });
    // });

    it('should return order data if admin', (done) => {

      const newAccount = {
        id: 1,
        account_name: 'CAT',
        billing_address: '1 Main Street',
        billing_city: 'main city',
        billing_state: 'main state'
      };

      const newUser = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'jd@fake.com',
        password: 'password',
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

      models.Account
        .create(newAccount)
        .then((success) => {
          models.User
            .create(newUser)
            .then((success) => {
              models.Order
                .create(newOrder)
                .then((success) => {
                  models.Part
                    .create(newPart)
                    .then((success) => {
                      models.Order_Detail
                        .create(newOrderDetail)
                        .then((success) => {
                          models.Order_Status
                            .create(newOrderStatus)
                            .then((success) => {

                              chai.request(app)
                                .get('/orders')
                                .end((err, res) => {
                                  if (err) console.log(err.stack);
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

                            })
                            .catch((err) => {
                              console.log(err.stack);
                              throw err;
                            })
                        })
                        .catch((err) => {
                          console.log(err.stack);
                          throw err;
                        })
                    })
                    .catch((err) => {
                      console.log(err.stack);
                      throw err;
                    })
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
        })
        .catch((err) => {
          console.log(err.stack);
          throw err;
        });

    });

    // TODO: add more tests for GET /orders with dummy data    

  });

});