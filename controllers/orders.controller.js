const router = require('express').Router();
const models = require('../models');
const notProvidedError = require('./helpers/notProvidedError');
const normalizeStringToInteger = require('./helpers/normalizeStringToInteger');
const normalizeNumberString = require('./helpers/normalizeNumberString');
const checkPermissions = require('./helpers/checkPermissions');
const handleDBError = require('./helpers/handleDBError');
const internalServerError = require('./helpers/internalServerError');

// ----- helper functions ----- //

// let system know how to relate other tables to Order
router.use((req, res, next) => {
  // let system know how to relate Order_Detail and Order
  models.Order_Detail.belongsTo(models.Order, { foreignKey: 'OrderId' });
  models.Order.belongsTo(models.Order_Detail, { foreignKey: 'id' });

  // let system know how to relate Order_Status and Order
  models.Order_Status.belongsTo(models.Order, { foreignKey: 'OrderId' });
  models.Order.belongsTo(models.Order_Status, { foreignKey: 'id' });

  // let system know how to relate Order_Detail and Part
  models.Order_Detail.belongsTo(models.Part, { foreignKey: 'part_id' });
  models.Part.belongsTo(models.Order_Detail, { foreignKey: 'id' });

  next();
});

const PERMISSION_IDS = {
  client: 0,
  admin: 1
};

const STATUS_TYPE_IDS = {
  quote: 1,
  priced: 2,
  ordered: 3,
  shipped: 4,
  archived: 5,
  abandoned: 6
};

const STATUS_TYPE_IDS_PERMISSIONS = {
  1: 'client',
  2: 'admin',
  3: 'client',
  4: 'admin',
  5: 'admin,client',
  6: 'client'
};

// get Orders that match the given id(s)
// res is the standard response obj.
// ids should be an array, or undefined (for unrestricted findAll)
// cb is the callback function which will get called with the orders, when complete
const getOrders = (res, ids, userId, cb) => {
  const id = (ids != undefined) ? ids : { $gte: 0 };
  // if userId = 'ADMIN', the user is an admin, thus return all orders
  // elseif userId exists, use it to query for that user's orders
  // else query for lt 0 (i.e. nothing), because an error has occurred if userId is undefined
  const UserId = (userId != undefined) ? ((userId !== 'ADMIN') ? userId : { $gte: 0 }) : { $lt: 0 };
  models.Order
    .findAll({
      where: {
        id,
        UserId
      },
      include: [{
        model: models.Order_Detail,
        include: [{
          model: models.Part
        }, {
          model: models.Shipping_Detail
        }]
      }, {
        model: models.Order_Status
      }]
  })
  .then((orders) => {
    cb(orders);
  })
  .catch((err) => {
    handleDBError(err, res)
  });
}

// get orderIds that match the given StatusTypeId
// res is the standard response obj.
// orderStatusTypeId is the number of the desired StatusTypeId(s)
// orderStatusTypeId can be an array if more than one desired
// if orderStatusTypeId undefined, then all statusTypes will be found
// cb is the callback function which will get called with the ids, when complete
const getOrderIdsForOrderStatusType = (res, orderStatusTypeId, cb) => {
  const StatusTypeId = (orderStatusTypeId != undefined) ? orderStatusTypeId : { $gte: 0 };
  models.Order_Status
    .findAll({
      where: {
        StatusTypeId
      },
      attributes: ['OrderId']
    })
    .then((results) => {
      const ids = results.map((result) => {
        return result.OrderId;
      });

      cb(ids);

    })
    .catch((err) => {
      handleDBError(err, res)
    });
}

const promoteOrderStatus = (req, res, id, statusType) => {
  let statusTypeId = STATUS_TYPE_IDS[statusType];
  let userId;

  const checkIfPromotionIsAllowed = (cb) => {
    // check if the requested status type promotion is allowed
    // exception for promoting to abandoned or archived
    if ([5,6].indexOf(statusTypeId) > -1) {
      cb();
    } else {
      models.Order_Status
        .findAll({
          where: {
            OrderId: id,
            current: true
          }
        })
        .then((orderStatuses) => {
          if (orderStatuses) {
            const currentStatusTypeId = orderStatuses
              .sort((a, b) => {
                return (a.StatusTypeId || 0) < (b.StatusTypeId || 0);
              })[0].StatusTypeId || 0;
            if (currentStatusTypeId + 1 === statusTypeId) {
              cb();
            } else {
              const message = 'The requested status type promotion is not allowed';
              internalServerError(res, message);
            }
          } else {
            internalServerError(res);
          }
        })
        .catch((err) => {
          handleDBError(err, res);
        });
      }
  }

  const clearOldOrderStatusRecords = (cb) => {
    // set current Order_Status to current=false
    models.Order_Status
      .update({
          current: false
        }, {
        where: {
          OrderId: id
        },
        fields: ['current'],
        returning: true
      })
      .then((success) => {
        cb();
      })
      .catch((err) => {
        handleDBError(err, res);
      });
  }

  const cb = () => {
    checkIfPromotionIsAllowed(() => {
      // success cb
      clearOldOrderStatusRecords(() => {
        // success cb

        const orderStatus = {
          current: true,
          StatusTypeId: statusTypeId,
          OrderId: id
        };

        createOrderStatus(res, orderStatus, () => {
          models.Notification
            .update({
              StatusTypeId: statusTypeId,
              new: true
            }, {
              where: {
                OrderId: id
              }
            })
            .then(() => res.json({
              success: true
            }))
            .catch((err) => {
              handleDBError(err, res);
            });
        });
      });
    })
  }

  const checkOrderIdPermissions = (cb) => {
    models.Order
      .findOne({
        where: { id }
      })
      .then((order) => {
        userId = order.UserId;
        checkPermissions(req, res, null, order.UserId, cb);
      })
      .catch((err) => {
        handleDBError(err, res);
      })
  }

  if (statusTypeId !== undefined) {

    const permissionRole = STATUS_TYPE_IDS_PERMISSIONS[statusTypeId];
    if (permissionRole) {

      checkOrderIdPermissions(() => {
        // NOTE: admin users can also do things as a "client" here
        // this is because checkPermissions will grant client access to clients or admins
        let pRoles;
        if (permissionRole.includes(',')) {
          pRoles = permissionRole.split(',').map(r => PERMISSION_IDS[r]);
        }
        checkPermissions(req, res, pRoles || PERMISSION_IDS[permissionRole], null, cb);
      });

    } else {
      internalServerError(res);
    }

  } else {
    notProvidedError(res, 'valid status type');
  }
}

const promoteIfStatusType = (req, res, successObj) => {
  let orderId;
  // parse the successObj array for an orderId
  // successObj[1] is an array of objects that were updated
  // because we know all of these orderDetails will have
  // the same OrderId, we can just look at the 0th one
  if (successObj[1] && successObj[1][0]) {
    orderId = successObj[1][0].OrderId;
  }

  if (req.query && req.query.statusType) {
    if (orderId) {
      const statusType = req.query.statusType;
      promoteOrderStatus(req, res, orderId, statusType);
    } else {
      internalServerError(res);
    }
  } else {
    res.json({
      success: true
    });
  }
}

const createOrder = (res, order, cb) => {
  models.Order
    .create(order)
    .then((success) => {
      models.Notification
        .create({
          OrderId: success.id,
          StatusTypeId: 1
        })
        .then(() => cb(success.id))
        .catch((err) => {
          handleDBError(err, res);
        });
    })
    .catch((err) => {
      handleDBError(err, res);
    });
}

const createOrderDetail = (res, orderDetail, cb) => {
  models.Order_Detail
    .create(orderDetail)
    .then((success) => {
      cb(success.id);
    })
    .catch((err) => {
      handleDBError(err, res);
    })
}

const createOrderStatus = (res, orderStatus, cb) => {
  models.Order_Status
    .create(orderStatus)
    .then((success) => {
      cb(success.id);
    })
    .catch((err) => {
      handleDBError(err, res);
    })
}

const createPart = (res, part, cb) => {
  models.Part
    .create(part)
    .then((success) => {
      cb(success.id);
    })
    .catch((err) => {
      handleDBError(err, res);
    })
}

const createShippingAddress = (res, address, cb) => {
  models.Shipping_Address
    .create(address)
    .then((success) => {
      cb(success.id);
    })
    .catch((err) => {
      handleDBError(err, res);
    })
}

const createShippingDetail = (res, shippingDetail, cb) => {
  models.Shipping_Detail
    .create(shippingDetail)
    .then((success) => {
      cb(success.id);
    })
    .catch((err) => {
      handleDBError(err, res);
    })
}

// ----- end helper functions ----- //

// GET /orders - ADMIN ONLY
router.get('/', (req, res) => {

  let typeIds;
  if (req.query.status) {
    typeIds = req.query.status.split(',').map(statusType => STATUS_TYPE_IDS[statusType]);
  }

  let userId;
  const cb = () => getOrderIdsForOrderStatusType(res, typeIds, cb2);

  const cb2 = (ids) => getOrders(res, ids, userId, cb3);

  const cb3 = (orders) => res.json({ orders });

  console.log(req.session.user);

  // check permission for userRole = 1 means ADMIN role only
  if (req.session.user.role === 1) {
    userId = 'ADMIN';
    checkPermissions(req, res, 1, null, cb);
  } else {
    userId = req.session.user.id;
    checkPermissions(req, res, 0, null, cb);
  }

});

// POST /orders/:id/discount - Admin Only
router.post('/:id/discount', (req, res) => {

  const cb = () => {
    if (req.body.discount && req.params.id) {
      // discount of 0 means remove the discount
      const discount = req.body.discount !== '0' ? req.body.discount : null;
      models.Order
        .findOne({
          where: { id: req.params.id }
        })
        .then(foundOrder => {
          if (foundOrder) {
            models.Order_Detail
              .update({ discount }, {
                where: { OrderId: foundOrder.id }
              })
              .then(() => res.json({
                success: true
              }))
              .catch(err => handleDBError(err, res));
          } else {
            const message = 'Could not find an order with that id.';
            return internalServerError(res, message);
          }
        })
        .catch(err => handleDBError(err, res));
    } else {
      const message = 'Expected a value for discount, id, but found none.';
      return internalServerError(res, message);
    }
  };

  checkPermissions(req, res, 1, null, cb);
});

// POST /orders + form (basic auth)
router.post('/', (req, res) => {

  const cb = () => {

    console.log('POST /orders');
    console.log(req.body);

    // check to make sure all required form fields exist
    if (!req.body.orderDetails) return notProvidedError(res, 'orderDetails');

    // get current user's id
    const userId = process.env.NODE_ENV === 'test' ?
      require('./helpers/checkPermissions/getUserId.test')(req) :
      normalizeNumberString(req.session.user.id);

    // make sure it's a valid userId
    if (userId == undefined) {
      return res.status(403).json({
        success: false,
        message: 'error: no user data found'
      });
    } else {
      cb2(userId);
    }
  }

  const cb2 = (userId) => {
  const newOrder = { UserId: userId };

    createOrder(res, newOrder, (orderId) => {

      // req.body.orderDetails will be a string
      // will be in the form:
      // machineSerialNum=212121,partNum=etc54,partQty=3|machineSerialNum=212121,partNum=jht21,partQty=1
      // where | denotes the split of multiple orderDetails

      const orderDetails = req.body.orderDetails.split('|').map((oD) => {
        const split = oD.split(',');
        const data = {};
        split.forEach((s) => {
          const pair = s.split('=');
          data[pair[0]] = pair[1];
        });
        return data;
      });

      console.log(orderDetails);

      orderDetails.forEach((orderDetail) => {
        const number = orderDetail.partNum;
        models.Part
          .find({
            where: {
              number
            }
          })
          .then((foundPart) => {
            const part = { number };
            const newOrderDetail = {
              machine_serial_num: orderDetail.machineSerialNum,
              quantity: orderDetail.partQty
            };
            if (!foundPart) {
              createPart(res, part, (part_id) => {
                createOrderDetail(res, Object.assign(
                  newOrderDetail,
                  {
                    part_id,
                    OrderId: orderId
                  }
                ), () => {});
              });
            } else {
              createOrderDetail(res, Object.assign(
                newOrderDetail,
                {
                  part_id: foundPart.id,
                  OrderId: orderId
                }
              ), () => {});
            }
          })
          .catch((err) => {
            handleDBError(err, res)
          });
      });
      return cb3(orderId);
    });
  }

  const cb3 = (orderId) => {
    models.Status_Type
      .find({
        where: { status: req.body.status || 'quote' }
      })
      .then((success) => {
        const orderStatus = {
          current: true,
          StatusTypeId: success.id,
          OrderId: orderId
        };
        createOrderStatus(res, orderStatus, successResponse);
      })
      .catch((err) => {
        handleDBError(err, res);
      });
  }

  const successResponse = () => {
    return res.json({
      success: true
    });
  }

  // check permission for userRole = 0 means only authenticated users can view
  checkPermissions(req, res, 0, null, cb);

});

// POST /orders/:id/part - Add another part to an existing order - Admin Only
router.post('/:id/part', (req, res) => {
  const b = req.body;
  if (!b.machine_number) return notProvidedError(res, 'machine_number');
  if (!b.part_number) return notProvidedError(res, 'part_number');
  if (!b.part_number_quantity) return notProvidedError(res, 'part_number_quantity');

  const cb2 = (orders) => {
    if (orders && orders[0]) {
      const order = orders[0];
      models.Part
        .find({
          where: { number: b.part_number }
        })
        .then((foundPart) => {
          const successCB = () => res.json({ success: true });
          const createOrderDet = (partId) => {
            const newOrderDet = {
              OrderId: req.params.id,
              machine_serial_num: b.machine_number,
              part_id: partId,
              quantity: b.part_number_quantity
            };
            createOrderDetail(res, newOrderDet, successCB);
          }
          if (foundPart) {
            // see if this pair of mach_serial_num and part_num
            // already exists in this order.
            // if so, we'll just update its quantity
            models.Order_Detail
              .find({
                where: {
                  OrderId: req.params.id,
                  machine_serial_num: b.machine_number,
                  part_id: foundPart.id
                }
              })
              .then((foundOD) => {
                if (foundOD) {
                  models.Order_Detail
                    .update({
                        quantity: foundOD.quantity
                          + parseInt(b.part_number_quantity, 10)
                      }, {
                      where: {
                        id: foundOD.id
                      }
                    })
                    .then(successCB)
                    .catch((err) => {
                      handleDBError(err, res);
                    });
                } else {
                  createOrderDet(foundPart.id);
                }
              })
              .catch((err) => {
                handleDBError(err, res);
              });
          } else {
            createPart(res, { number: b.part_number }, createOrderDet);
          }
        })
        .catch((err) => {
          handleDBError(err, res);
        });
    } else {
      handleDBError(
        new Error('no order with that id found',
          'no order with that id found'), res);
    }
  }

  const cb = () => getOrders(res, [req.params.id], 'ADMIN', cb2);

  // userRole = 1 means only admin can access
  checkPermissions(req, res, 1, null, cb);
});

// GET /orders/quoted - Admin Only
router.get('/quoted', (req, res) => {

  // StatusTypeId = 1 for priced
  const cb = () => getOrderIdsForOrderStatusType(res, 1, cb2);

  const cb2 = (ids) => getOrders(res, ids, 'ADMIN', cb3);

  const cb3 = (orders) => res.json({ orders });

  // userRole = 1 means only admin can access
  checkPermissions(req, res, 1, null, cb);

});

// GET /orders/priced - Admin Only
router.get('/priced', (req, res) => {

  // StatusTypeId = 2 for priced
  const cb = () => getOrderIdsForOrderStatusType(res, 2, cb2);

  const cb2 = (ids) => getOrders(res, ids, 'ADMIN', cb3);

  const cb3 = (orders) => res.json({ orders });

  // userRole = 1 means only admin can access
  checkPermissions(req, res, 1, null, cb);

});

// GET /orders/ordered - Admin Only
router.get('/ordered', (req, res) => {

  // StatusTypeId = 3 for priced
  const cb = () => getOrderIdsForOrderStatusType(res, 3, cb2);

  const cb2 = (ids) => getOrders(res, ids, 'ADMIN', cb3);

  const cb3 = (orders) => res.json({ orders });

  // userRole = 1 means only admin can access
  checkPermissions(req, res, 1, null, cb);

});

// GET /orders/shipped - Admin Only
router.get('/shipped', (req, res) => {

  // StatusTypeId = 4 for priced
  const cb = () => getOrderIdsForOrderStatusType(res, 4, cb2);

  const cb2 = (ids) => getOrders(res, ids, 'ADMIN', cb3);

  const cb3 = (orders) => res.json({ orders });

  // userRole = 1 means only admin can access
  checkPermissions(req, res, 1, null, cb);

});

// GET /orders/archived - Admin Only
router.get('/archived', (req, res) => {

  // StatusTypeId = 5 for priced
  const cb = () => getOrderIdsForOrderStatusType(res, 5, cb2);

  const cb2 = (ids) => getOrders(res, ids, 'ADMIN', cb3);

  const cb3 = (orders) => res.json({ orders });

  // userRole = 1 means only admin can access
  checkPermissions(req, res, 1, null, cb);

});

// GET /orders/abandoned -- Owner or Admin Only
router.get('/abandoned', (req, res) => {

  // StatusTypeId = 6 for priced
  const cb = () => getOrderIdsForOrderStatusType(res, 6, cb2);

  const cb2 = (ids) => getOrders(res, ids, 'ADMIN', cb3);

  const cb3 = (orders) => res.json({ orders });

  // userRole = 1 means only admin can access
  checkPermissions(req, res, 1, null, cb);

});

// GET /orders/{id} -- Owner or Admin Only
router.get('/:id', (req, res) => {

  if (req.params == undefined || req.params.id == undefined)
    return notProvidedError(res, 'id');
  const id = normalizeStringToInteger(req.params.id);

  const cb = (orders) => {
    const order = orders[0];
    if (order == undefined || order.UserId == undefined) {
      handleDBError(
        new Error('no order with that id found',
          'order does not contain a UserId property'), res);
    } else {
      checkPermissions(req, res, null, order.UserId, () => cb2(order))
    }
  }

  const cb2 = (order) => {
    res.json({
      order
    });
  }

  getOrders(res, [id], 'ADMIN', cb);

});

// PUT /orders/{id} -- Owner or Admin Only
router.put('/:id', (req, res) => {
  const b = req.body;
  if (!b.shipping_address) return notProvidedError(res, 'shipping_address');
  if (!b.shipping_city) return notProvidedError(res, 'shipping_city');
  if (!b.shipping_state) return notProvidedError(res, 'shipping_state');
  if (!b.shipping_zip) return notProvidedError(res, 'shipping_zip');
  if (!b.po_number) return notProvidedError(res, 'po_number');

  if (req.params == undefined || req.params.id == undefined)
    return notProvidedError(res, 'id');
  const id = normalizeStringToInteger(req.params.id);

  const cb = (order) => {

    const b = req.body;

    // only allows for updating the shipping_address, shipping_city, shipping_state,
    // shipping_zip, and po_number fields
    const orderObj = {
      shipping_address: b.shipping_address,
      shipping_city: b.shipping_city,
      shipping_state: b.shipping_state,
      shipping_zip: b.shipping_zip,
      po_number: b.po_number,
    };

    models.Order
      .update(orderObj, {
        where: {
          id: order.id
        }
      })
      .then((success) => {
        res.json({
          success: true
        });
      })
      .catch((err) => {
        handleDBError(err, res);
      });

  }

  models.Order
    .findOne({
      where: {
        id
      }
    })
    .then((order) => {
      if (order == undefined || order.UserId == undefined) {
        handleDBError(new Error('no user id',
          'order does not contain a UserId property'), res);
      } else {
        checkPermissions(req, res, null, order.UserId, () => cb(order));
      }
    })
    .catch((err) => {
      handleDBError(err, res);
    });

});

// DELETE /orders/{id} -- ADMIN ONLY
router.delete('/:id', (req, res) => {

  if (req.params == undefined || req.params.id == undefined)
    return notProvidedError(res, 'id');
  const id = normalizeStringToInteger(req.params.id);

  const cb = (order) => {
    order.destroy({ force: true })
      .then((success) => {
        res.json({
          success: true
        });
      })
      .catch((err) => {
        handleDBError(err, res);
      });
  }

  models.Order
    .findOne({
      where: {
        id
      }
    })
    .then((order) => {
      if (order == undefined || order.UserId == undefined) {
        handleDBError(new Error('no user id',
          'order does not contain a UserId property'), res);
      } else {
        checkPermissions(req, res, 1, null, () => cb(order));
      }
    })
    .catch((err) => {
      handleDBError(err, res);
    });

});

// PUT /orders/{orderId}/status?type={statusType}
router.put('/:id/status', (req, res) => {

  if (req.params == undefined || req.params.id == undefined) {
    return notProvidedError(res, 'orderId');
  }
  const id = normalizeStringToInteger(req.params.id);

  let statusType;
  if (!req.query || !req.query.type) {
    if (!req.body || !req.body.type) {
      return notProvidedError(res, 'type');
    } else {
      statusType = req.body.type;
    }
  } else {
    statusType = req.query.type;
  }

  promoteOrderStatus(req, res, req.params.id, statusType);

});

// PUT /orders/details/{detailId(s)}?statusType={statusType}
// e.g.: /orders/details/73,74,75?statusType=shipped
router.put('/details/:detailIds', (req, res) => {
  const b = req.body;

  const cb = () => {
    if (b && (b.tracking_number || b.cost)) {
      const shippingDetail = {
        tracking_number: b.tracking_number || null,
        cost: b.cost || null
      };
      createShippingDetail(res, shippingDetail, cb2);
    } else cb2();
  }

  // ShippingDetailId is optional. If used, will be defined in cb (above)
  const cb2 = (ShippingDetailId) => {
    const allowedFields = ['quantity', 'price', 'ShippingOptionId', 'ShippingDetailId'];

    let detailObj = { ShippingDetailId };
    Object.keys(b)
      .filter((field) => allowedFields.indexOf(field) > -1)
      .forEach((key) => {
        detailObj[key] = b[key];
      });

    const detailIds = req.params.detailIds.split(',');

    models.Order_Detail
      .update(detailObj, {
        where: {
          id: detailIds
        },
        returning: true
      })
      .then((success) => {
        promoteIfStatusType(req, res, success);
      })
      .catch((err) => {
        handleDBError(err, res);
      });
  }

  // admin only
  checkPermissions(req, res, 1, null, cb);
});

// POST /orders/details/{detailIds}/shippingaddress?statusType={statusType}
// e.g.: /orders/details/73,74,75/shippingaddress?statusType=ordered
router.post('/details/:detailIds/shippingaddress', (req, res) => {
  // make sure req.params.detailIds exists before going any further
  if (req.params === undefined || req.params.detailIds === undefined) {
    return notProvidedError(res, 'detailIds');
  }

  const cb2 = (ShippingAddressId) => {
    // add our newly created ShippingAddress' id to the orderDetails
    models.Order_Detail
      .update({
          ShippingAddressId
        }, {
        where: {
          id: req.params.detailIds.split(',')
        },
        fields: ['ShippingAddressId'],
        returning: true
      })
      .then((success) => {
        promoteIfStatusType(req, res, success);
      })
      .catch((err) => {
        handleDBError(err, res);
      });
  }

  const cb = () => {
    if (!req.body.street) return notProvidedError(res, 'street');
    if (!req.body.city) return notProvidedError(res, 'city');
    if (!req.body.state) return notProvidedError(res, 'state');
    if (!req.body.zip) return notProvidedError(res, 'zip');

    const {
      street,
      city,
      state,
      zip,
      po_number
    } = req.body;
    const UserId = req.session.user.id;

    const address = {
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      zip: req.body.zip,
      po_number: req.body.po_number,
      UserId: req.session.user.id
    };

    const where = {
      street,
      city,
      state,
      zip,
      po_number: po_number || null,
      UserId
    };

    models.Shipping_Address
      .findOne({ where })
      .then(foundShipAddr => {
        console.log('got here');
        console.log(foundShipAddr);
        if (foundShipAddr) {
          cb2(foundShipAddr.id);
        } else {
          createShippingAddress(res, address, cb2);
        }
      })
      .catch((err) => {
        handleDBError(err, res);
      });
  }

  models.Order_Detail
    .findAll({
      where: {
        id: req.params.detailIds.split(',')
      },
      attributes: ['OrderId'],
      include: [{
        model: models.Order,
        attributes: ['UserId'],
        include: [{
          model: models.User,
          attributes: ['id']
        }],
      }]
    })
    .then((success) => {
      // find the userId(s) mapped to the orderDetail ids in the request
      const userIds = success
        .map((item) => item.Order.User.id).reduce((a, b) => {
          if (a.indexOf(b) < 0) {
            a.push(b);
          }
          return a;
        }, []);

      // if userIds !== 1, then something went wrong
      if (userIds.length < 1 || userIds.length > 1) {
        // something must have went wrong on the client if we received
        // a request with orderDetails that map to different orders
        // i.e. orderDetails that map to multiple userIds
        internalServerError(res);
      } else {
        // successfully found a userId, now check if the current
        // user is authorized to do this under the found userId
        checkPermissions(req, res, null, userIds[0], cb);
      }
    })
    .catch((err) => {
      handleDBError(err, res);
    });
});

module.exports = router;
