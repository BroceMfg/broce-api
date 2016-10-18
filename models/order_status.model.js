'use strict';

module.exports = (sequelize, DataTypes) => {
  let Order_Status = sequelize.define('Order_Status', {
    current: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    }
  }, {
    classMethods: {
      associate: (models) => {
        Order_Status.belongsTo(models.Status_Type);
        Order_Status.belongsTo(models.Order);
      }
    }
  }, {
    tableName: 'order_status'
  });
  return Order_Status;
};
