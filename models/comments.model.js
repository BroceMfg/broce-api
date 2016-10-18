'use strict';

module.exports = (sequelize, DataTypes) => {
  let Comment = sequelize.define('Comment', {
    text: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    classMethods: {
      associate: (models) => {
        Comment.belongsTo(models.User);
        Comment.belongsTo(models.Order);
      }
    }
  });
  return Comment;
};
