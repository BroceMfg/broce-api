const router = require('express').Router();
const models = require('../models');
const notProvidedError = require('./helpers/notProvidedError');
const checkPermissions = require('./helpers/checkPermissions');
const handleDBError = require('./helpers/handleDBError');
const internalServerError = require('./helpers/internalServerError');
const permissionDenied = require('./helpers/permissionDenied');

// ----- helper functions ----- //

// let system know how to relate other tables to Order
// router.use((req, res, next) => {
//   // let system know how to relate Order_Detail and Order
//   models.Order_Detail.belongsTo(models.Order, { foreignKey: 'OrderId' });
//   models.Order.belongsTo(models.Order_Detail, { foreignKey: 'id' });

//   // let system know how to relate Order_Status and Order
//   models.Order_Status.belongsTo(models.Order, { foreignKey: 'OrderId' });
//   models.Order.belongsTo(models.Order_Status, { foreignKey: 'id' });

//   // let system know how to relate Order_Detail and Part
//   models.Order_Detail.belongsTo(models.Part, { foreignKey: 'part_id' });
//   models.Part.belongsTo(models.Order_Detail, { foreignKey: 'id' });

//   next();
// });

const PERMISSION_IDS = {
  client: 0,
  admin: 1
};

const STATUS_TYPES = {
  1: 'quote',
  2: 'priced',
  3: 'ordered',
  4: 'shipped',
  5: 'archived',
  6: 'abandoned'
};

const STATUS_TYPE_IDS_PERMISSIONS = {
  client: [2, 4, 5],
  admin: [1, 3, 6]
};

// GET /notifications
router.get('/', (req, res) => {
  // check permission for userRole = 0 means only authenticated users can view
  checkPermissions(req, res, 0, null, () => {
    console.log('req.session.user');
    console.log(req.session.user);
    const userId = req.session.user.id;
    const isAdmin = PERMISSION_IDS.admin === req.session.user.role;
    const where = {
      UserId: isAdmin ? { $gt: 0 } : req.session.user.id,
    };
    models.Order
      .findAll({ where })
      .then((foundOrders) => {
        const noneFoundCb = () => res.json({ foundNotifs: [] });
        if (foundOrders) {

          models.Order_Status
            .findAll({
              where: {
                OrderId: { $in: foundOrders.map(o => o.id) },
                StatusTypeId: {
                  $in: STATUS_TYPE_IDS_PERMISSIONS[isAdmin ? 'admin': 'client']
                },
                current: true
              }
            })
            .then((foundOrderStatuses) => {
              models.Notification
                .findAll({
                  where: {
                    OrderId: { $in: foundOrderStatuses.map(o => o.OrderId) }
                  }
                })
                .then((foundNotifs) => {
                  if (foundNotifs && foundNotifs.length > 0) {
                    return res.json({
                      foundNotifs: foundNotifs.map(n => ({
                        id: n.id,
                        OrderId: n.OrderId,
                        new: n.new,
                        status: STATUS_TYPES[n.StatusTypeId]
                      }))
                    });
                  } else {
                    return noneFoundCb();
                  }
                })
                .catch((err) => {
                  handleDBError(err, res)
                });
            })
            .catch((err) => {
              handleDBError(err, res);
            });
        }
        else {
          return noneFoundCb();
        }
      })
      .catch((err) => {
        handleDBError(err, res)
      });
  });

});

// POST /notifications/seen/:orderId
router.post('/seen/:orderId', (req, res) => {
  checkPermissions(req, res, 0, null, () => {
    const userId = req.session.user.id;
    const isAdmin = PERMISSION_IDS.admin === req.session.user.role;
    models.Order
      .find({
        where: {
          id: req.params.orderId
        }
      })
      .then((foundOrder) => {
        if (foundOrder && (isAdmin || foundOrder.UserId === userId)) {
          models.Order_Status
            .find({
              where: {
                OrderId: foundOrder.id,
                current: true
              }
            })
            .then((foundOrderStatus) => {
              if (foundOrderStatus) {
                if (STATUS_TYPE_IDS_PERMISSIONS[isAdmin ? 'admin' : 'client']
                  .includes(foundOrderStatus.StatusTypeId)
                ) {
                  const cb = () => res.json({
                    success: true
                  });
                  if (foundOrderStatus.StatusTypeId > 3) {
                    models.Notification
                      .destroy({
                        where: {
                          OrderId: req.params.orderId
                        }
                      })
                      .then(cb)
                      .catch((err) => {
                        handleDBError(err, res);
                      })
                  } else {
                    models.Notification
                      .update({
                        new: false
                      }, {
                        where: {
                          OrderId: req.params.orderId
                        }
                      })
                      .then(cb)
                      .catch((err) => {
                        handleDBError(err, res);
                      })
                  }
                } else {
                  return permissionDenied(res);
                }
              } else {
                return internalServerError(res);
              }
            })
            .catch((err) => {
              handleDBError(err, res);
            });
        } else {
          return permissionDenied(res);
        }
      })
      .catch((err) => {
        handleDBError(err, res);
      });
  });
});


module.exports = router;