const conn = require('../conn');
const { Sequelize } = conn;
const { Op } = Sequelize;

const Conversation = conn.define('conversation', {

});

Conversation.findOrCreateConversation = function (user1Id, user2Id) {
  console.log('........3........')
  return Promise.all([Conversation.findAll({
    where: {
      user1Id: {
        [Op.or]: [user1Id, user2Id]
      },
      user2Id: {
        [Op.or]: [user1Id, user2Id]
      }
    },
    include: [conn.models.message],
    order: [[conn.models.message, 'createdAt', 'ASC']]
  })
  ])
    .then((conversations) => {
      console.log('so far so good')
      console.log('...........')
      console.log(conversations)
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

module.exports = Conversation;