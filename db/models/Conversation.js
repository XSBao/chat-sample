const conn = require('../conn');
const { Sequelize } = conn;
const { Op } = Sequelize;

const Conversation = conn.define('conversation', {

});

function findConversation(user1Id, user2Id, days) {
  let timeLimit = new Date();
  timeLimit.setDate(timeLimit.getDate() - days);
  return Conversation.findAll({
    where: {
      user1Id: {
        [Op.or]: [user1Id, user2Id]
      },
      user2Id: {
        [Op.or]: [user1Id, user2Id]
      }
    },
    include: [{
      model: conn.models.message,
      where: {
        createdAt: {
          [Op.gte]: timeLimit
        }
      }
    }],
    order: [[conn.models.message, 'createdAt', 'ASC']]
  })
    .then(conversations => {
      if (conversations.length !== 0) {
        const conversation = conversations[0];
        return conversation;
      } else {
        return Conversation.create({
          user1Id: user1Id,
          user2Id: user2Id
        }, {
          include: [conn.models.message],
          order: [[conn.models.message, 'createdAt', 'ASC']]
        });
      }
    });
};

function createConversation(user1Id, user2Id) {
  return Conversation.findAll({
    where: {
      user1Id: {
        [Op.or]: [user1Id, user2Id]
      },
      user2Id: {
        [Op.or]: [user1Id, user2Id]
      }
    },
    include: [{
      model: conn.models.message,
    }],
    order: [[conn.models.message, 'createdAt', 'ASC']]
  })
    .then(conversations => {
      if (conversations.length !== 0) {
        const conversation = conversations[0];
        return conversation;
      } else {
        return Conversation.create({
          user1Id: user1Id,
          user2Id: user2Id
        }, {
          include: [conn.models.message],
          order: [[conn.models.message, 'createdAt', 'ASC']]
        });
      }
    });
};

Conversation.findOrCreateConversation = function (user1Id, user2Id, opts) {
  // ...
  if (opts['day']) { //retrieve records.
    const days = opts['day'];
    return findConversation(user1Id, user2Id, days)
  } else {//create new record.
    return createConversation(user1Id, user2Id)
  }
}
module.exports = Conversation;