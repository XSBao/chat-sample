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

function areThereRecords(user1Id, user2Id){
  Conversation.findAll({
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
  }).then(conversations => {
    const size = conversations.length
    return (size !== 0)
  })
}

Conversation.findOrCreateConversation = function (user1Id, user2Id, opts) {
  // ...
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
  }).then(conversations => {
    if(conversations.length === 0){
      return createConversation(user1Id, user2Id)
    }else{
      if(opts !== undefined){
        return findConversation(user1Id, user2Id, opts['days'])
      }else{
        return findConversation(user1Id, user2Id, 1000)
      } 
    }
  })

  // if (opts['days']) { //retrieve records.
  //   const days = opts['days'];
  //   return findConversation(user1Id, user2Id, days)
  // } else {//create new record.
  //   return createConversation(user1Id, user2Id)
  // }
}
module.exports = Conversation;