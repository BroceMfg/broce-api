const express = require('express');
const session = require('express-session');
const redis = require('connect-redis');
const cookieParser = require('cookie-parser');
const favicon = require('serve-favicon');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

const RedisStore = redis(session);

const redisOptions = {
  tll: 14400, // 4 hours
};

let sess = {
  store: new RedisStore(redisOptions),
  secret: process.env.SESSION_SECRET,
  resave: false,
  cookie: {
    expires: new Date(Date.now() + 3600000), // expires in one hour
    maxAge: 3600000
  },
  saveUninitialized: true
};

if (app.get('env') === 'production') {
  app.set('trust proxy', 1); // trust first proxy
  sess.cookie.secure = true; // serve secure cookies, only works with https
}

app.use(session(sess));
app.use((req, res, next) => {
  if (!req.session) {
    return next(new Error('connection to redis lost')); // handle error
  }
  next(); // otherwise continue 
});

if (process.env.NODE_ENV === 'test') app.use(cookieParser(process.env.COOKIE_SECRET));

// middleware configuration
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const corsOptions = {
  origin: process.env.CLIENT_ORIGIN,
  credentials: true,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204 
};
app.use(cors(corsOptions));

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

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      message: err.message,
      error: err
    });
  });
}
// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: err.status || 500,
    message: (process.env != 'production') ? err.message : 'unkown'
  });
});

module.exports = app;