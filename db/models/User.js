const conn = require('../conn');
const { Sequelize } = conn;

const User = conn.define('user', {
  name: Sequelize.STRING,
  password: Sequelize.STRING
});

User.findIdByName = function(userName) {
  console.log(`searchinging username: ${userName}`)
  const result = User.findAll({
    attributes:['id'],
    where: {
      name: userName
    }
  })
  console.log(result)
}

User.findUserByName = function(userName) {
  return User.findAll({
    where: {
      name: userName
    }
  })[0]
}

module.exports = User;