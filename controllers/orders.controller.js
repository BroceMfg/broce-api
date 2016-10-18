const router = require('express').Router();
const models = require('../models');
const jwtAuthMiddleware = require('./helpers/jwtAuthMiddleware');

// middleware that authenticates a token
// any route below this will need a token to access
router.use((req, res, next) => jwtAuthMiddleware(req, res, next));

// GET /orders - ADMIN ONLY
router.get('/', (req, res) => {

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