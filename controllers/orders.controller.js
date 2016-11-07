const router = require('express').Router();
const models = require('../models');
const notProvidedError = require('./helpers/notProvidedError');
const normalizeStringToInteger = require('./helpers/normalizeStringToInteger');
const checkPermissions = require('./helpers/checkPermissions');
const handleDBError = require('./helpers/handleDBError');

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

// get Orders that match the given id(s)
// res is the standard response obj.
// ids should be an array, or undefined (for unrestricted findAll)
// cb is the callback function which will get called with the orders, when complete
const getOrders = (res, ids, cb) => {
  const id = (ids != undefined) ? ids 
    : { $gte: 0 };
  models.Order
    .findAll({
      where: {
        id
      },
      include: [{
        model: models.Order_Detail,
        attributes: [
          'machine_serial_num',
          'quantity',
          'price',
          'createdAt',
          'updatedAt'
        ],
        include: [{
          model: models.Part,
          attributes: [
            'number',
            'description',
            'cost',
            'image_url',
            'createdAt',
            'updatedAt'
          ]
        }]
      }, {
        model: models.Order_Status,
        attributes: [
          'current',
          'createdAt',
          'updatedAt',
          'StatusTypeId'
        ]
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
// orderStatusTypeId is the number of the desired StatusTypeId
// cb is the callback function which will get called with the ids, when complete
const getOrderIdsForOrderStatusType = (res, orderStatusTypeId, cb) => {
  models.Order_Status
    .findAll({
      where: {
        StatusTypeId: orderStatusTypeId
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

// GET /orders - ADMIN ONLY
router.get('/', (req, res) => {

  const cb2 = (orders) => res.json({ orders });

  const cb = () => getOrders(res, undefined, cb2);

  // check permission for userRole = 1 means ADMIN role only
  checkPermissions(req, res, 1, null, cb);

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
    }

    const newOrder = {
      shipping_address: req.body.shipping_address,
      shipping_city: req.body.shipping_city,
      shipping_state: req.body.shipping_state,
      shipping_zip:req.body.shipping_zip,
      po_number: req.body.po_number,
      UserId: userId
    };

    models.Order
      .create(newOrder)
      .then((success) => {
        res.json({
          success: true
        });
      })
      .catch((err) => {
        console.log(err.stack);
        res.status(500).json({
          success: false,
          error: process.env.NODE_ENV !== 'production' 
              ? err.message : 'internal server error'
        });
        throw err;
      });
  }

  // check permission for userRole = 0 means only authenticated users can view
  checkPermissions(req, res, 0, null, cb);

});

// GET /orders/quoted - Admin Only
router.get('/quoted', (req, res) => {

  // StatusTypeId = 1 for priced
  const cb = () => getOrderIdsForOrderStatusType(res, 1, cb2);

  const cb2 = (ids) => getOrders(res, ids, cb3);

  const cb3 = (orders) => res.json({ orders });

  // userRole = 1 means only admin can access
  checkPermissions(req, res, 1, null, cb);

});

// GET /orders/priced - Admin Only
router.get('/priced', (req, res) => {

  // StatusTypeId = 2 for priced
  const cb = () => getOrderIdsForOrderStatusType(res, 2, cb2);

  const cb2 = (ids) => getOrders(res, ids, cb3);

  const cb3 = (orders) => res.json({ orders });

  // userRole = 1 means only admin can access
  checkPermissions(req, res, 1, null, cb);

});

// GET /orders/ordered - Admin Only
router.get('/ordered', (req, res) => {

  // StatusTypeId = 3 for priced
  const cb = () => getOrderIdsForOrderStatusType(res, 3, cb2);

  const cb2 = (ids) => getOrders(res, ids, cb3);

  const cb3 = (orders) => res.json({ orders });

  // userRole = 1 means only admin can access
  checkPermissions(req, res, 1, null, cb);

});

// GET /orders/shipped - Admin Only
router.get('/shipped', (req, res) => {

  // StatusTypeId = 4 for priced
  const cb = () => getOrderIdsForOrderStatusType(res, 4, cb2);

  const cb2 = (ids) => getOrders(res, ids, cb3);

  const cb3 = (orders) => res.json({ orders });

  // userRole = 1 means only admin can access
  checkPermissions(req, res, 1, null, cb);

});

// GET /orders/archived - Admin Only
router.get('/archived', (req, res) => {

  // StatusTypeId = 5 for priced
  const cb = () => getOrderIdsForOrderStatusType(res, 5, cb2);

  const cb2 = (ids) => getOrders(res, ids, cb3);

  const cb3 = (orders) => res.json({ orders });

  // userRole = 1 means only admin can access
  checkPermissions(req, res, 1, null, cb);

});

// GET /orders/abandoned -- Owner or Admin Only
router.get('/abandoned', (req, res) => {

  // StatusTypeId = 6 for priced
  const cb = () => getOrderIdsForOrderStatusType(res, 6, cb2);

  const cb2 = (ids) => getOrders(res, ids, cb3);

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

  getOrders(res, [id], cb);

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

module.exports = router;