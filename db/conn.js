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
var conn = ""
console.log('.........DATABASE_URL is: ')
console.log(process.env.DATABASE_URL)
if (process.env.DATABASE_URL) {
    conn = new Sequelize(process.env.DATABASE_URL,{
      username: process.env.DB_USERNAME,
      database: process.env.DB_DATABASE,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOSTNAME,
      port: 5432,
      ssl: true,
      dialect:  'postgres',
      dialectOptions:{
        ssl: {
          require:true,
          rejectUnauthorized: false
        }
      },
    })
  }
else {
  conn = new Sequelize('chat_app_db', 'postgres', 'dawson', {
    host: 'localhost',
    dialect: 'postgres'
  });
}


module.exports = conn;