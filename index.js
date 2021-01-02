const crypto = require('crypto');

const express = require('express')
const conn = require('./db').conn;
const app = express()
const server = require('http').createServer(app)
const path = require('path')
const io = require('socket.io')(server);
const { User, Conversation, Message } = require('./db').models;
//User.sync({ force: false });
conn.sync({ logging: false, force: false });//forec: false, if you have force: false and the table exists, any field additions/modifications/deletions you have won't be executed 

const userAndSockets = {};//containting key-value pairs consisting of the users’ IDs and their corresponding socket IDs:

app.use(
  express.static(path.join(__dirname, '/static'))
)

async function testPgConnection() {

  /*
  try {
    await conn.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
  */
}

function isOnline(friendName){
  userAndSocketsKeys = Object.keys(userAndSockets)
  console.log(userAndSocketsKeys)
  console.log(`searching for ${friendName}, type if ${typeof(friendName)}`)
  console.log(userAndSockets)
  for(let i = 0; i < userAndSocketsKeys.length; i++){
    let key = userAndSocketsKeys[i]
    let value = userAndSockets[key]
    console.log(`current key is: ${key}, current value is: ${value},and type if ${typeof(value)}`)
    if(value == friendName){
      console.log('retrun true')
      return true;
    }
  }
  console.log('retrun false')
  return false;
}

function informFriendInfo(socket, friendName){
  const isFriendOnline = isOnline(friendName);
  socket.emit('inform-friend-info', { friendName, isFriendOnline });
}

io.on('connection', socket => {
  testPgConnection();
  /*
  const myLove = {name: 'yan', password: '493593'}
  socket.on('new-user-authentication', data =>{
    console.log(data.name, data.password)
    if(myLove.name === data.name && myLove.password === data.password){
      users[socket.id] = data.name;
      socket.emit('user-connected', data.name)
    }else{
      socket.emit('user-login-failed')
    }
  })
*/

  socket.on('new-user-authentication', credentials => {
    const secret = 'Babe, I love u';
    const hash = crypto.createHmac('sha256', secret)
      .update(credentials.password)
      .digest('hex');
    // console.log('...............')
    // console.log(credentials.password)
    // console.log(hash)
    // console.log('...............')
    credentials.password = hash.toString();

    const { name, password } = credentials;
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
      User.findAll()
    ]).then(([user, users]) => {
      if (user.length === 0) {
        //login failed
        socket.emit('user-login-failed')
      }
      else {
        //findOrCreate() returns the database object and a boolean value indicating whether the record was found or created.
        // We just care about the object here, so that’s why we’re using user[0].
        const currentUser = user[0];
        userAndSockets[socket.id] = currentUser.name;
        let friendName = '';
        if(currentUser.name === 'yan'){
          friendName = 'xueshan'
        }else{
          friendName = 'yan'
        }
        socket.emit('user-connected', currentUser.name);
        informFriendInfo(socket, friendName)
        socket.broadcast.emit('friend-state-change', {friendName: currentUser.name, isFriendOnline:true});
      }
    });

  });

  socket.on('chat', users => {
    Conversation.findOrCreateConversation(users.user.id, users.receiver.id)
      .then(conversation => socket.emit('priorMessages', conversation.messages));
  });

  socket.on('send-chat-message', message => {
    socket.broadcast.emit('chat-message', { message: message, name: userAndSockets[socket.id] })
    console.log('message from client: ', message)
  })

  socket.on('disconnect', () => {
    const currentUserName = userAndSockets[socket.id];
    console.log(`user disconnected: ${currentUserName}`)
    socket.broadcast.emit('friend-state-change', {friendName: currentUserName, isFriendOnline:false})
    delete userAndSockets[socket.id]
    console.log(userAndSockets)
  })
})

const port = process.env.PORT || 3000

server.listen(port, () => {
  console.log('listening on: ', port)
})
