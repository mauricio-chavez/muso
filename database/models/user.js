const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const User = sequelize.define('User', {
  psid: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  accessToken: {
    type: DataTypes.STRING,
    field: 'access_token',
  },
  refreshToken: {
    type: DataTypes.STRING,
    field: 'refresh_token',
  },
});

module.exports = User;
