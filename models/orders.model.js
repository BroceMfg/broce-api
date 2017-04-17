'use strict';

module.exports = (sequelize, DataTypes) => {
  var Order = sequelize.define('Order', {}, {
      classMethods: {
        associate: (models) => {
          Order.hasMany(models.Order_Detail);
          Order.hasMany(models.Order_Status);
          Order.belongsTo(models.User);
          Order.hasOne(models.Notification);
        }
      }
    }, {
       tableName: 'orders'
    });

    return Order;
};
