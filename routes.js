const router = require('express').Router();
const validateToken = require('./middleware/validateToken');
const models = require('./models');
const ordersController = require('./controllers/orders.controller.js');
const usersController = require('./controllers/users.controller.js');
const accountsController = require('./controllers/accounts.controller.js');
const partsController = require('./controllers/parts.controller.js');
const notificationsController = require('./controllers/notifications.controller.js');

// GET / - default
router.get('/', (req, res) => {

  res.json({
    title: 'Broce Parts API'
  });

});

const decoded = {};
// this code will get run before each of the routes below
router.use((req, res, next) => {
  // set oauth2Client's credentials using the tokens we obtained via auth
  if (req.query && req.query.token) {
    return validateToken(
      req.query.token,
      (success) => {
        decoded.user = success.user;
        decoded.exp = success.exp;
        oauth2Client.setCredentials(success.user.teamTokens);
        return next();
      },
      () => denied(res, 'Invalid Auth Token')
    );
  }
  return next(new Error('No token provided.'));
});

// router.use('/', (req, res, next) => {
  // // console.log('------');
  // // console.log(req);
  // // console.log('------');
  // return next();
// });

router.use('/orders', ordersController);
router.use('/users', usersController);
router.use('/accounts', accountsController);
router.use('/parts', partsController);
router.use('/notifications', notificationsController);

module.exports = router;
