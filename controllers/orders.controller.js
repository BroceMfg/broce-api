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
  5: 'admin',
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

const createOrder = (res, order, cb) => {
  models.Order
    .create(order)
    .then((success) => {
      cb(success.id);
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

// POST /orders + form (basic auth)
router.post('/', (req, res) => {

  const cb = () => {
    // check to make sure all required form fields exist
    if (!req.body.shipping_address) return notProvidedError(res, 'shipping_address');
    if (!req.body.shipping_city) return notProvidedError(res, 'shipping_city');
    if (!req.body.shipping_state) return notProvidedError(res, 'shipping_state');
    if (!req.body.shipping_zip) return notProvidedError(res, 'shipping_zip');
    if (!req.body.po_number) return notProvidedError(res, 'po_number');
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
    const newOrder = {
      shipping_address: req.body.shipping_address,
      shipping_city: req.body.shipping_city,
      shipping_state: req.body.shipping_state,
      shipping_zip:req.body.shipping_zip,
      po_number: req.body.po_number,
      UserId: userId
    };

    createOrder(res, newOrder, (orderId) => {

      // req.body.orderDetails will be an array of objects
      // the objects will be in the form:
      // {
      //   machineSerialNum: <>,
      //   partNum: <>,
      //   partQty: <>
      // }

      JSON.parse(req.body.orderDetails).forEach((orderDetail) => {

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
                ), () => cb3(orderId));

              });
            } else {

              createOrderDetail(res, Object.assign(
                newOrderDetail,
                {
                  part_id: foundPart.id,
                  OrderId: orderId
                }
              ), () => cb3(orderId));

            }
          })
          .catch((err) => {
            handleDBError(err, res)
          })

        
      })

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

  if (req.params == undefined || req.params.id == undefined)
    return notProvidedError(res, 'id');
  const id = normalizeStringToInteger(req.params.id);

  const cb = (order) => {

    const b = req.body;

    // only allows for updating the shipping_address, shipping_city, shipping_state, 
    // shipping_zip, and po_number fields
    const orderObj = {
      shipping_address: b.shipping_address || order.shipping_address,
      shipping_city: b.shipping_city || order.shipping_city,
      shipping_state: b.shipping_state || order.shipping_state,
      shipping_zip: b.shipping_zip || order.shipping_zip,
      po_number: b.po_number || order.po_number
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
// TODO: should check if the requested status promotion is allowed
// i.e. the system shouldn't allow a "quote" Order to be promoted to "shipped"
// "quote" should only be allowed to be promoted to "priced"
router.put('/:id/status', (req, res) => {

  if (req.params == undefined || req.params.id == undefined) {
    return notProvidedError(res, 'orderId');
  }
  const id = normalizeStringToInteger(req.params.id);

  let statusTypeId;
  if (req.query.type) {
    statusTypeId = STATUS_TYPE_IDS[req.query.type];
  } else if (req.body.type) {
    statusTypeId = STATUS_TYPE_IDS[req.body.type];
  }

  const clearOldOrderStatusRecords = (cb) => {
    // set all old Order_Statuses to current=false
    models.Order_Status
      .update({
          current: false
        }, {
        where: { OrderId: id },
        fields: ['current']
      })
      .then((success) => {
        cb();
      })
      .catch((err) => {
        handleDBError(err, res);
      });
  }

  const cb = () => {
    clearOldOrderStatusRecords(() => {
      // success cb

      const orderStatus = {
        current: true,
        StatusTypeId: statusTypeId,
        OrderId: id
      };

      createOrderStatus(res, orderStatus, () => {
        res.json({
          success: true
        });
      });

    });

  }

  const checkOrderIdPermissions = (cb) => {
    models.Order
      .findOne({
        where: { id }
      })
      .then((order) => {
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
        checkPermissions(req, res, PERMISSION_IDS[permissionRole], null, cb);
      });

    } else {
      internalServerError(res);
    }

  } else {
    notProvidedError(res, 'valid status type');
  }

});

// PUT /orders/detail/{detailId}
router.put('/details/:detailId', (req, res) => {
  
  const allowedFields = ['quantity', 'price', 'ShippingOptionId', 'ShippingDetailId'];

  const cb = () => {

    const b = req.body;
    
    let detailObj = {};
    Object.keys(b)
      .filter((field) => allowedFields.indexOf(field) > -1)
      .forEach((key) => {
        detailObj[key] = b[key];
      });
    
    const id = normalizeStringToInteger(req.params.detailId);

    models.Order_Detail
      .update(detailObj, {
        where: { id }
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

  checkPermissions(req, res, 1, null, cb);

});

module.exports = router;