'use strict';

module.exports = (sequelize, DataTypes) => {
  let Shipping_Detail = sequelize.define('Shipping_Detail', {
    tracking_number: {
      type: DataTypes.STRING,
      allowNull: true
    },
    cost: {
      type: DataTypes.FLOAT,
      allowNull: true
    }
  }, {
    classMethods: (models) => {
      Shipping_Detail.hasOne(models.Order_Detail);
      Shipping_Detail.belongsTo(models.User, {as: 'ShippedBy'});
    }
  });
  return Shipping_Detail;
};
