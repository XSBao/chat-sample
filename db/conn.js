const Sequelize = require('sequelize');
const conn = new Sequelize('chat_app_db', 'postgres', 'dawson', {
  host: 'localhost',
  dialect: 'postgres'
});

module.exports = conn;