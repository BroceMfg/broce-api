'use strict';

module.exports = (sequelize, DataTypes) => {
    var Account = sequelize.define('Account', {
        account_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        billing_address: {
            type: DataTypes.STRING,
            allowNull: true
        },
        billing_city: {
          type: DataTypes.STRING,
          allowNull: true
        },
        billing_state: {
          type: DataTypes.STRING,
          allowNull: true
        }
    }, {
      classMethods: {
        associate: (models) => {
          Account.hasMany(models.User);
        }
      }
    });

    return Account;
};
