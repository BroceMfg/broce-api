'use strict';

module.exports = (sequelize, DataTypes) => {
  let Shipping_Address = sequelize.define('Shipping_Address', {
    street: {
      type: DataTypes.STRING,
      allowNull: false
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false
    },
    zip: {
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
        Shipping_Address.hasMany(models.Order_Detail);
        Shipping_Address.belongsTo(models.User);
      }
    }
  }, {
    tableName: 'shipping_address'
  });
  return Shipping_Address;
};
