const conn = require('../conn');
const { Sequelize } = conn;

const Message = conn.define('message', {
  text: Sequelize.STRING,
  user: Sequelize.JSON,//sender info
  _id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  createdAt: {
    type: 'TIMESTAMP',
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    allowNull: false
  },
  updatedAt: {
    type: 'TIMESTAMP',
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    allowNull: false
  }
},{
  timestamps: false
});

Message.createMessage = (text, sender, receiver) => {
    return Promise.all([
      Message.create({
        text,
        user: {
          _id: sender.id,
          name: sender.name
        },
      }),
      conn.models.conversation.findOrCreateConversation(sender.id, receiver.id, 0)
    ])
      .then(([message, conversation]) => {
        message.setConversation(conversation)
        return message;
      });
  };
  
module.exports = Message;