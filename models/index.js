'use strict';

var fs = require('fs');
var path = require('path');
var Sequelize = require('sequelize');

// use test db if we're testing
// console.log(`process.env.NODE_ENV = ${process.env.NODE_ENV}`);
// if (process.env.NODE_ENV == 'test') process.env.POSTGRESQL_LOCAL_DB='broce_parts_test';

const sequelize = new Sequelize(
  process.env.EL_DB_USER,
  process.env.EL_DB_USER,
  process.env.EL_DB_PASS,
  {
    host: process.env.EL_DB_HOST,
    dialect: 'postgres',
    dialectOptions: {
      ssl: false
    },
    define: {
      timestamps: true
    },
    freezeTableName: true,
    pool: {
      max: 3,
      min: 0,
      idle: 10000
    },
    logging: process.env.NODE_ENV !== 'production' ? console.log() : null
  }
);

// var sequelize = new Sequelize(process.env.POSTGRESQL_LOCAL_DB, '', '', {
  // host: process.env.POSTGRESQL_LOCAL_HOST,
  // dialect: 'postgres',
  // dialectOptions: {
    // ssl: false
  // },
  // define: {
    // timestamps: true
  // },
  // freezeTableName: true,
  // pool: {
    // max: 9,
    // min: 0,
    // idle: 10000
  // },
  // logging: process.env.NODE_ENV == 'dev'
// });

var db = {};

fs
  .readdirSync(__dirname)
  .filter((file) => {
    return (file.indexOf('.') !== 0) && (file !== 'index.js');
  })
  .forEach((file) => {
    var model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
