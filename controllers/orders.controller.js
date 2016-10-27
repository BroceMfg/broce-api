const router = require('express').Router();
const models = require('../models');
const notProvidedFieldErrorResponse = require('./helpers/notProvidedFieldErrorResponse');
const normalizeStringToInteger = require('./helpers/normalizeStringToInteger');
const checkPermissions = require('./helpers/checkPermissions');
const handleDBFindErrorAndRespondWithAppropriateJSON = require('./helpers/handleDBFindErrorAndRespondWithAppropriateJSON');

// GET /orders - ADMIN ONLY
router.get('/', (req, res) => {

  const cb = () => {

    // let system know how to relate Order_Detail and Order
    models.Order_Detail.belongsTo(models.Order, { foreignKey: 'OrderId' });
    models.Order.belongsTo(models.Order_Detail, { foreignKey: 'id' });

    // let system know how to relate Order_Status and Order
    models.Order_Status.belongsTo(models.Order, { foreignKey: 'OrderId' });
    models.Order.belongsTo(models.Order_Status, { foreignKey: 'id' });

    // let system know how to relate Order_Detail and Part
    models.Order_Detail.belongsTo(models.Part, { foreignKey: 'part_id' });
    models.Part.belongsTo(models.Order_Detail, { foreignKey: 'id' });

    models.Order
      .findAll({
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
        res.json({
          orders
        });
      })
      .catch((err) => {
        console.error(err.stack);
        res.status(500).json({
          success: false,
          error: process.env.NODE_ENV !== 'production' 
              ? err.message : 'internal server error'
        });
      });
  }

  // check permission for userRole = 1 means ADMIN role only
  checkPermissions(req, res, 1, null, cb);

});

// POST /orders + form (basic auth)
router.post('/', (req, res) => {

  const cb = () => {
    // check to make sure all required form fields exist
    if (!req.body.shipping_address) return notProvidedFieldErrorResponse(res, 'shipping_address');
    if (!req.body.shipping_city) return notProvidedFieldErrorResponse(res, 'shipping_city');
    if (!req.body.shipping_state) return notProvidedFieldErrorResponse(res, 'shipping_state');
    if (!req.body.shipping_zip) return notProvidedFieldErrorResponse(res, 'shipping_zip');
    if (!req.body.po_number) return notProvidedFieldErrorResponse(res, 'po_number');

    // get current user's id
    // make sure it's a valid userId
    // TODO: actually get the logged in user's id
    const userId = 1;

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
        return res.json({
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

// GET /orders/quoted -- Owner or Admin Only
router.get('/quoted', (req, res) => {

  res.json({
    message: 'quoted'
  });

});

// GET /orders/priced -- Owner or Admin Only
router.get('/priced', (req, res) => {

  res.json({
    message: 'priced'
  });

});

// GET /orders/ordered -- Owner or Admin Only
router.get('/ordered', (req, res) => {

  res.json({
    message: 'ordered'
  });

});

// GET /orders/shipped -- Owner or Admin Only
router.get('/shipped', (req, res) => {

  res.json({
    message: 'shipped'
  });

});

// GET /orders/archived -- Owner or Admin Only
router.get('/archived', (req, res) => {

  res.json({
    message: 'archived'
  });

});

// GET /orders/abandoned -- Owner or Admin Only
router.get('/abandoned', (req, res) => {

  res.json({
    message: 'abandoned'
  });

});

// GET /orders/{id} -- Owner or Admin Only
router.get('/:id', (req, res) => {

  // let system know how to relate Order_Detail and Order
  models.Order_Detail.belongsTo(models.Order, { foreignKey: 'OrderId' });
  models.Order.belongsTo(models.Order_Detail, { foreignKey: 'id' });

  // let system know how to relate Order_Status and Order
  models.Order_Status.belongsTo(models.Order, { foreignKey: 'OrderId' });
  models.Order.belongsTo(models.Order_Status, { foreignKey: 'id' });

  // let system know how to relate Order_Detail and Part
  models.Order_Detail.belongsTo(models.Part, { foreignKey: 'part_id' });
  models.Part.belongsTo(models.Order_Detail, { foreignKey: 'id' });

  if (req.params == undefined || req.params.id == undefined)
    return notProvidedFieldErrorResponse(res, 'id');
  const id = normalizeStringToInteger(req.params.id);

  const cb = (order) => {
    res.json({
      order
    });
  }

  models.Order
    .findOne({
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
    .then((order) => {
      if (order == undefined || order.UserId == undefined) {
        handleDBFindErrorAndRespondWithAppropriateJSON(new Error('no user id',
          'order does not contain a UserId property'), res);
      } else {
        checkPermissions(req, res, null, order.UserId, () => cb(order))
      }
    })
    .catch((err) => {
      handleDBFindErrorAndRespondWithAppropriateJSON(err, res);
    });

});

// PUT /orders/{id} -- Owner or Admin Only
router.put('/:id', (req, res) => {

  if (req.params == undefined || req.params.id == undefined)
    return notProvidedFieldErrorResponse(res, 'id');
  const id = normalizeStringToInteger(req.params.id);

  const cb = (order) => {

    const b = req.body;

    // only allows for updating the shipping_address, shipping_city, shipping_state, 
    // shipping_zip, and po_number fields
    let orderObj = {
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
        handleDBFindErrorAndRespondWithAppropriateJSON(err, res);
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
        handleDBFindErrorAndRespondWithAppropriateJSON(new Error('no user id',
          'order does not contain a UserId property'), res);
      } else {
        checkPermissions(req, res, null, order.UserId, () => cb(order));
      }
    })
    .catch((err) => {
      handleDBFindErrorAndRespondWithAppropriateJSON(err, res);
    });

});

// DELETE /orders/{id} -- ADMIN ONLY
router.delete('/:id', (req, res) => {

  if (req.params == undefined || req.params.id == undefined)
    return notProvidedFieldErrorResponse(res, 'id');
  const id = normalizeStringToInteger(req.params.id);

  const cb = (order) => {
    order.destroy({ force: true })
      .then((success) => {
        res.json({
          success: true
        });
      })
      .catch((err) => {
        handleDBFindErrorAndRespondWithAppropriateJSON(err, res);
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
        handleDBFindErrorAndRespondWithAppropriateJSON(new Error('no user id',
          'order does not contain a UserId property'), res);
      } else {
        checkPermissions(req, res, 1, null, () => cb(order));
      }
    })
    .catch((err) => {
      handleDBFindErrorAndRespondWithAppropriateJSON(err, res);
    });

});

module.exports = router;