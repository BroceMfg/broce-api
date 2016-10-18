const express = require('express');
const favicon = require('serve-favicon');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
var app = express();

// middleware configuration
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

// logging
switch(app.get('env')){
  case 'development':
  // compact, colorful dev logging
  app.use(require('morgan')('dev'));
    break;
  case 'test':
    //use morgan to log at command line
    app.use(morgan('combined')); //'combined' outputs the Apache style LOGs
    break;
  case 'production':
    // module 'express-logger' supports daily log rotation
    app.use(require('express-logger')({ path: __dirname + '/log/requests.log'}));
  break;
}

// import routes
app.use('/', require('./routes'));

// 404 catch-all handler (middleware)
app.use(function(req, res, next){
  res.status(404).json({
    error: 404,
    message: 'error: 404 not found'
  });
});

// 500 error handler (middleware)
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).json({
    error: 500,
    message: (process.env != 'production') ? err.message : undefined
  });
});

// // catch 404 and forward to error handler
// app.use((req, res, next) => {
//   var err = new Error('Not Found');
//   err.status = 404;
//   next(err);
// });

// // development error handler
// // will print stacktrace
// if (app.get('env') === 'development') {
//   app.use((err, req, res, next) => {
//     res.status(err.status || 500);
//     res.json({
//       message: err.message,
//       error: err
//     });
//   });
// }
// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;