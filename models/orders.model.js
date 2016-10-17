'use strict';

module.exports = (sequelize, DataTypes) => {
    var Order = sequelize.define('Order', {
        shipping_address: {
            type: DataTypes.STRING,
            allowNull: true
        },
        shipping_city: {
          type: DataTypes.STRING,
          allowNull: true
        },
        shipping_state: {
          type: DataTypes.STRING,
          allowNull: true
        },
        shipping_zip: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        po_number: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
      classMethods: {
        associate: (models) => {
          Order.hasMany(models.Order_Detail);
          Order.hasMany(models.Order_Status);
          Order.belongsTo(models.User);
        }
      }
    }, {
       tableName: 'orders'
    });

    return Order;
};
