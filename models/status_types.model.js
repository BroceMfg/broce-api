'use strict';

module.exports = (sequelize, DataTypes) => {
  let Status_Type = sequelize.define('Status_Type', {
    status: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    classMethods: {
      associate: (models) => {
        // connect to order_status
        Status_Type.hasMany(models.Order_Status);
        Status_Type.hasOne(models.Notification);
      }
    }
  }, {
    tableName: 'status_types'
  });
  return Status_Type;
};
