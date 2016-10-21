const router = require('express').Router();
const models = require('../models');
const setPermissionsForFollowingRoutes = require('./helpers/setPermissionsForFollowingRoutes');
const notProvidedFieldErrorResponse = require('./helpers/notProvidedFieldErrorResponse');

// middleware that restricts the following routes to the role provided
// any route below this will need a client role to access 
// the last param is 0 to specify the client role
router.use((req, res, next) => setPermissionsForFollowingRoutes(req, res, next, 0));

// POST /orders + form (basic auth)
router.post('/', (req, res) => {

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
        message: process.env.NODE_ENV != 'production' ? err.message : undefined
      });
      throw err;
    });

});

// middleware that restricts the following routes to the role provided
// any route below this will need an admin role to access 
// the last param is 1 to specify the admin role
router.use((req, res, next) => setPermissionsForFollowingRoutes(req, res, next, 1));

// GET /orders - ADMIN ONLY
router.get('/', (req, res) => {

  console.log(`req.cookies.user = ${process.env.NODE_ENV === 'test' ? req.cookies.user : undefined}`);

  console.log(`req.session.user = ${JSON.stringify(req.session.user, null, 2)}`);

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
        orders: orders
      });
    })
    .catch((err) => {
      console.error(err.stack);
      res.status(500).json({
        success: false,
        error: err.message
      });
    });

});

module.exports = router;