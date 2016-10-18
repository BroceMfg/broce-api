'use strict';
const bcrypt = require('bcrypt-nodejs');

module.exports = (sequelize, DataTypes) => {
    var User = sequelize.define('User', {
        first_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false
        },
        role: {
          type: DataTypes.INTEGER,
          allowNull: false
        }
    }, {
      classMethods: {
        associate: (models) => {
          User.hasMany(models.Order);
          User.belongsTo(models.Account);
          User.hasMany(models.Shipping_Detail);
        },
        generateHash: (password) => {
          return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
        },
        validPassword: (password, hash) => {
          return bcrypt.compareSync(password, hash);
        }
      }
    }, {
       tableName: 'users'
    });

    return User;
};
