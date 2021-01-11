const conn = require('../conn');
const { Sequelize } = conn;

const User = conn.define('user', {
  name: Sequelize.STRING,
  password: Sequelize.STRING,
  lastLogout: {
    type: 'TIMESTAMP',
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    allowNull: true
  },
});

User.findIdByName = function (userName) {
  const result = User.findAll({
    attributes: ['id'],
    where: {
      name: userName
    }
  })
  console.log(result)
  return result[0]
}

User.findUserByName = function (userName) {
  return User.findAll({
    where: {
      name: userName
    }
  })[0]
}

User.updateState = function (userName, logoutTime) {
  return User.update(
    { lastLogout: logoutTime },
    {
      returning: true,
      where: {
        name: userName
      }
    });
}

User.findLogoutTimeByUser = function (userName) {
  console.log('........2........')
  const result = State.findAll(
    {
      attributes: ['lastLogout'],
      where: {
        name: userName
      },
    }
  );
  return result[0];
}
module.exports = User;