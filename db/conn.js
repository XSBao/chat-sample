const Sequelize = require('sequelize');
/*
const conn = new Sequelize('chat_app_db', 'postgres', 'dawson', {
  host: 'db',
  dialect: 'postgres'
});

let conn
if (process.env.DATABASE_URL) {
  // the application is executed on Heroku ... use the postgres database
  conn = new Sequelize(process.env.DATABASE_URL, {
    dialect:  'postgres',
    protocol: 'postgres',
    logging:  true //false
  });
} else {
  // the application is executed on the local machine
  //conn = new Sequelize("postgres:///chat_app_db");
  conn = new Sequelize('chat_app_db', 'postgres', 'dawson', {
    host: 'localhost',
    dialect: 'postgres'
  });
}
*/
var database = process.env.DATABASE_URL || 'campeonatodb'
var conn = ""
console.log(database)
if (process.env.DATABASE_URL) {
    conn = new Sequelize(database)
}
else {
  conn = new Sequelize('chat_app_db', 'postgres', 'dawson', {
    host: 'localhost',
    dialect: 'postgres'
  });
}


module.exports = conn;