const crypto = require('crypto');
const express = require('express')
const conn = require('./db').conn;
const app = express()
const server = require('http').createServer(app)
const path = require('path')
//const io = require('socket.io')(server);

const io = require('socket.io')(server, { 'pingTimeout': 5000, 'pingInterval': 25000 });

const { User, Conversation, Message } = require('./db').models;
//User.sync({ force: false });
conn.sync({ logging: false, force: false });//forec: false, if you have force: false and the table exists, any field additions/modifications/deletions you have won't be executed 

const userAndSockets = {};//containting key-value pairs consisting of the users’ IDs and their corresponding socket IDs:
const userLastLogoutTime = {};//containing the last time user log out.
let forcedToDisconnect = false;

app.use(
  express.static(path.join(__dirname, '/static'))
)

function isOnline(friendName) {
  userAndSocketsKeys = Object.keys(userAndSockets)
  for (let i = 0; i < userAndSocketsKeys.length; i++) {
    let key = userAndSocketsKeys[i]
    let value = userAndSockets[key]
    if (value == friendName) {
      return key;
    }
  }
  return -1;
}

function searchAndDisconnectDuplicateClients(userName, socketId) {
  const id = isOnline(userName)
  if (id !== -1 && id !== socketId) {
    //find duplicate client, force it to drop
    forcedToDisconnect = true;
    io.to(id).emit('force-disconnect');
    io.to(socketId).emit('duplicate-disconnected');
  }
}

io.on('connection', socket => {
  socket.on('new-user-authentication', credentials => {
    const secret = 'Babe, I love u';
    const hash = crypto.createHmac('sha256', secret)
      .update(credentials.password)
      .digest('hex');
    credentials.password = hash.toString();

    let name = credentials.name.trim().toLowerCase();
    let password = credentials.password;

    function convertUTCDateToLocalDate(utcdate) {
      if (utcdate == undefined) {
        return "unknown time";
      }
      date = new Date(utcdate.toString())
      return date.toString();
    }

    function extractShortTimeStrFromUTC(utcdate) {
      const str = convertUTCDateToLocalDate(utcdate);
      const index = str.indexOf('GMT')
      return str.substring(0, index)
    }

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
        where: {
          name,
          password
        }
      }),
      User.findAll({
        where: {
          name: getFriendName(name)
        }
      })
    ]).then(([result1, result2]) => {
      if (result1.length === 0) {
        //login failed
        socket.emit('user-login-failed')
      }
      else {
        //findOrCreate() returns the database object and a boolean value indicating whether the record was found or created.
        // We just care about the object here, so that’s why we’re using user[0].
        const currentUser = result1[0];
        const friendUser = result2[0];
        userAndSockets[socket.id] = currentUser.name;
        searchAndDisconnectDuplicateClients(currentUser.name, socket.id)
        const friendName = getFriendName(name);

        //the messages in the latest 3 days wil be displayed
        const opts = {};
        opts['days'] = 3;
        Conversation.findOrCreateConversation(currentUser.id, friendUser.id, opts).then((conversation) => {
          let titles = []
          let texts = []
          let times = []
          let isme = []
          conversation.messages.forEach(message => {
            const timeStr = extractShortTimeStrFromUTC(message.createdAt)
            let title = ''
            if (message.user.name === name) {//own message
              isme.push(true)
              title = (name === 'yan') ? 'Babe' : 'You';
            } else {
              isme.push(false)
              title = (name === 'yan') ? 'Honey' : 'Babe';
            }
            titles.push(title)
            texts.push(message.text)
            times.push(message.createdAt)
          });
          socket.emit('priorMessages', { titles, texts, times, isme })

        });

        let title = (name === 'yan') ? 'Babe' : name;
        socket.emit('welcome-back', { title, toDisableNoteSetting: (name === 'yan') });

        //inform me of my friends's info
        title = (friendName === 'yan') ? 'Babe' : 'Honey'

        const isFriendOnline = (isOnline(friendName) !== -1);
        if (isFriendOnline) {
          socket.emit('inform-friend-info', { title, isFriendOnline, lastLogoutTime: null });
        } else {
          if (friendUser.lastLogout === null) {
            socket.emit('inform-friend-info', { title, isFriendOnline, lastLogoutTime: null });
          } else {
            socket.emit('inform-friend-info', { title, isFriendOnline, lastLogoutTime: friendUser.lastLogout });
          }
        }
        //inform friends of my infor
        title = (name === 'yan') ? 'Babe' : 'Honey'
        const friendSocketid = findSockedIdByName(friendName)
        io.to(friendSocketid).emit('friend-state-change', { title, isFriendOnline: true, lastLogoutTime: null });
        //socket.broadcast.emit('friend-state-change', { title, isFriendOnline: true, lastLogoutTime: null });
      }
    });

  });

  function getFriendName(senderName) {
    return senderName === 'yan' ? 'xueshan' : 'yan';
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
    return -1;
  }

  socket.on('typing', senderName => {
    let title = (senderName === 'yan') ? 'Babe' : 'Honey';
    const receiverName = getFriendName(senderName);
    const receiverSocketid = findSockedIdByName(receiverName)
    io.to(receiverSocketid).emit('typing-return', title)
  })

  socket.on('typing-done', senderName => {
    let title = (senderName === 'yan') ? 'Babe' : 'Honey';
    const receiverName = getFriendName(senderName);
    const receiverSocketid = findSockedIdByName(receiverName)
    io.to(receiverSocketid).emit('typing-done-return', title)
  })

  //get new message from user
  socket.on('send-chat-message', (message) => {
    const senderName = userAndSockets[socket.id];
    const receiverName = getFriendName(senderName);
    //const sender = User.findUserByName(senderName)
    //const receiver = User.findUserByName(receiverName)
    Promise.all([
      User.findAll({
        where: {
          name: senderName,
        }
      }),
      User.findAll({
        where: {
          name: receiverName,
        }
      }),
    ]).then(([sender, receiver]) => {
      Message.createMessage(message, sender[0], receiver[0])
        .then((message) => {
          //socket.emit('incomingMessage', {message, friendName});
          let title = (senderName === 'yan') ? 'Babe' : 'Honey';
          //send mesage back to the receivers
          const receiverSocketid = findSockedIdByName(receiverName)
          io.to(receiverSocketid).emit('incomingMessage', { title, text: message.text, time: message.createdAt, displayNote: (senderName === 'yan') })
          //socket.broadcast.emit('incomingMessage', { title, text: message.text, time: message.createdAt, displayNote: (senderName === 'yan') });

          //send message back to the sender with the produced title
          title = (senderName === 'yan') ? 'Babe' : 'You'
          socket.emit('display-your-own-message', { title, text: message.text, time: message.createdAt });

        });
    });

  });

  socket.on('disconnect', () => {
    if (userAndSockets[socket.id] === undefined) {
      return;
    }
    const currentUserName = userAndSockets[socket.id];
    const logoutTime = new Date();
    if (!forcedToDisconnect) {//normally log out
      User.updateState(currentUserName, logoutTime).then(result => {
        //inform friends of my infor
        title = (currentUserName === 'yan') ? 'Babe' : 'Honey'
        const friendName = (currentUserName === 'yan') ? 'xueshan' : 'yan'
        const friendSocketid = findSockedIdByName(friendName)
        if (result[0]) {
          const logoutTime = result[1][0].lastLogout;
          io.to(friendSocketid).emit('friend-state-change', { title, isFriendOnline: false, lastLogoutTime: logoutTime })
          //socket.broadcast.emit('friend-state-change', { title, isFriendOnline: false, lastLogoutTime: logoutTime })
        }
      })
    } else {//be foreced to logout, no need to inform firends.
      forcedToDisconnect = false;
    }
    delete userAndSockets[socket.id]
  })
})

const port = process.env.PORT || 3000

server.listen(port, () => {
  console.log('listening on: ', port)
})
