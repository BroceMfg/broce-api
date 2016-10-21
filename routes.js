const router = require('express').Router();
const models = require('./models');
const ordersController = require('./controllers/orders.controller.js');
const usersController = require('./controllers/users.controller.js');

// GET / - default
router.get('/', (req, res) => {

  res.json({
    title: 'Broce Parts API'
  });
  
});

// // POST /authenticate/admin - authenticate an admin user
// router.post('/authenticate/admin', function(req, res) {

//   // find the user
//   models.User
//     .findOne({
//       where: {
//         email: req.body.email,
//         role: 1 // role 1 = admin
//       }
//     })
//     .then((user) => {
//       if (!user) {
//         res.json({
//           success: false,
//           message: 'Authentication failed. User is not an admin.'
//         });
//       } else if (user) {
//         // check if passwords match


//         if (user.password != req.body.password) {
//           res.json({
//             success: false,
//             message: 'Authentication failed. Wrong password.'
//           });
//         } else {

//           // TODO jwt.sign(user is breaking the post call
//           // figure out how to sign user properly

//           // if user is found and password is correct
//           // create a token
//           const token = jwt.sign(user, process.env.JWT_SECRET, {
//             expiresIn: 60 * 60 * 24 // expires in 24 hours
//           });

//           // return the information including token as JSON
//           res.json({
//             success: true,
//             message: 'Enjoy your token!',
//             token: token
//           });
//         }
//       } else {
//         res.json({
//           success: false,
//           message: 'Authentication failed. Unkown error.'
//         });
//       }
//     })
//     .catch((err) => {
//       console.error(err);
//       res.json({
//         success: false,
//         message: err.message
//       })
//     });

// });

router.use('/orders', ordersController);
router.use('/users', usersController);

module.exports = router;