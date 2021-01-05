const crypto = require('crypto');
const express = require('express')
const conn = require('./db').conn;
const app = express()
const server = require('http').createServer(app)
const path = require('path')
const io = require('socket.io')(server);
const { User, Conversation, Message } = require('./db').models;
const { Sequelize } = conn;
const { Op } = Sequelize;

//User.sync({ force: false });
conn.sync({ logging: false, force: false });//forec: false, if you have force: false and the table exists, any field additions/modifications/deletions you have won't be executed 

const userAndSockets = {};//containting key-value pairs consisting of the users’ IDs and their corresponding socket IDs:

app.use(
  express.static(path.join(__dirname, '/static'))
)

function isOnline(friendName) {
  userAndSocketsKeys = Object.keys(userAndSockets)
  for (let i = 0; i < userAndSocketsKeys.length; i++) {
    let key = userAndSocketsKeys[i]
    let value = userAndSockets[key]
    if (value == friendName) {
      return true;
    }
  }
  return false;
}

function getFriendName(myName) {
  return myName === 'yan' ? 'xueshan' : 'yan';
}

function findSockedIdByName(userName) {
  userAndSocketsKeys = Object.keys(userAndSockets)
  for (let i = 0; i < userAndSocketsKeys.length; i++) {
    let key = userAndSocketsKeys[i]
    let value = userAndSockets[key]
    if (value == userName) {
      return key;
    }
  }
  return false;
}

// function convertUTCDateToLocalDate(utcdate) {
//   date = new Date(utcdate.toString())
//   return date.toString();
// }

io.on('connection', socket => {
  socket.on('new-user-authentication', credentials => {
    const secret = 'Babe, I love u';
    const hash = crypto.createHmac('sha256', secret)
      .update(credentials.password)
      .digest('hex');
    credentials.password = hash.toString();
    const { myName, password } = credentials;

    Promise.all([
      /*
        User.findOrCreate({//when
          where: {
            name,
            password
        }
        }),
        */
      User.findAll({
        attributes: ['id', 'lastLogout'],
        where: {
          name: myName,
          password: password
        }
      }),
      User.findAll({
        attributes: ['id', 'lastLogout'],
        where: {
          name: {
            name: getFriendName(myName)
          }
        }
      })
    ]).then(([result1, result2]) => {
      if (result1[0].length === 0) {
        //login failed
        socket.emit('user-login-failed')
        return {};
      } else {
        //findOrCreate() returns the database object and a boolean value indicating whether the record was found or created.
        // We just care about the object here, so that’s why we’re using user[0].
        currentUser = result1[0];
        friendUser = result2[0];
        userAndSockets[socket.id] = myName;

        socket.emit('welcome-back');
        const friendName = friendUser.name;
        if (isOnline(friendName)) {
          socket.emit('inform-friend-info', { friendName, isFriendOnline, lastLogoutTime: null });
        } else {
              socket.emit('inform-friend-info', { friendName, isFriendOnline, lastLogoutTime: friendUser.lastLogout });
        }
        
        socket.broadcast.emit('friend-state-change', { friendName: currentUser.name, isFriendOnline: true, lastLogoutTime: null });
        Conversation.findOrCreateConversation(currentUser.id, friendUser.id).then((conversation) => {
          if (conversation.length !== 0) {//no conversation record in db
            socket.emit('priorMessages', conversation.messages)
          }
        });
      }
    });

  });

  

  //get new message from user
  socket.on('send-chat-message', (message) => {
    const senderName = userAndSockets[socket.id];
    const receiverName = getFriendName(senderName);
    Promise.all([
      User.findUserByName(senderName),
      User.findUserByName(receiverName),
    ]).then(([sender, receiver]) => {
      Message.createMessage(message, sender[0], receiver[0])
        .then((message) => {
          //socket.emit('incomingMessage', {message, friendName});
          const receiverSocketId = findSockedIdByName(receiverName);
          socket.broadcast.emit('incomingMessage', { text: message.text, time: message.createdAt, senderName });
        });
    });

  });

  socket.on('disconnect', () => {
    if(userAndSockets.length === 0){
      return;
    }
    const currentUserName = userAndSockets[socket.id];
    Promise.all([
      User.findUserByName(currentUserName)
    ]).then(currentUser => {
        const logoutTime = new Date();
        User.createOrUpdateState(currentUserName, logoutTime)
        socket.broadcast.emit('friend-state-change', { friendName: currentUserName, isFriendOnline: false, lastLogoutTime: logoutTime })
        delete userAndSockets[socket.id]
      })
  })
})

const port = process.env.PORT || 8000
server.listen(port, () => {
  console.log('listening on: ', port)
})

