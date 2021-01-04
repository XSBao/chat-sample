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
const userLastLogoutTime = {};//containing the last time user log out.

app.use(
  express.static(path.join(__dirname, '/static'))
)

function isOnline(friendName){
  userAndSocketsKeys = Object.keys(userAndSockets)
  for(let i = 0; i < userAndSocketsKeys.length; i++){
    let key = userAndSocketsKeys[i]
    let value = userAndSockets[key]
    if(value == friendName){
      return true;
    }
  }
  return false;
}

io.on('connection', socket => {
  socket.on('new-user-authentication', credentials => {
    const secret = 'Babe, I love u';
    const hash = crypto.createHmac('sha256', secret)
      .update(credentials.password)
      .digest('hex');
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
        Promise.all([
          User.findAll({
            where: {
              name:name,
            }
          }),
          User.findAll({
            where: {
              name:getFriendName(name),
            }
          }),
        ]).then(([user, friend]) =>{
          Conversation.findOrCreateConversation(user[0].id, friend[0].id).then((conversation) => {
            if(conversation.length !== 0){//no conversation record in db
              socket.emit('priorMessages', conversation.messages)
            }            
          });          
        });
        socket.emit('welcome-back');
        const isFriendOnline = isOnline(friendName);
        if(isFriendOnline){
          socket.emit('inform-friend-info', { friendName, isFriendOnline, lastLogoutTime: null});
        }else{
          socket.emit('inform-friend-info', { friendName, isFriendOnline, lastLogoutTime: userLastLogoutTime[friendName]});
        }        
        socket.broadcast.emit('friend-state-change', {friendName: currentUser.name, isFriendOnline:true, lastLogoutTime: null});
      }
    });

  });

  function getFriendName(senderName){
    if(senderName === 'yan'){
      return 'xueshan'
    }else{
      return 'yan'
    }
  }



  function findSockedIdByName(userName){
    userAndSocketsKeys = Object.keys(userAndSockets)
    for(let i = 0; i < userAndSocketsKeys.length; i++){
      let key = userAndSocketsKeys[i]
      let value = userAndSockets[key]
      if(value == userName){
        return key;
      }
    }
    return false;
  }


  function convertUTCDateToLocalDate(utcdate) {
    date = new Date(utcdate.toString())
    return date.toString();
}

  //get new message from user
  socket.on('send-chat-message', (message) => {
    const senderName = userAndSockets[socket.id];
    const receiverName = getFriendName(senderName);
    const sender = User.findUserByName(senderName)
    const receiver = User.findUserByName(receiverName)
    Promise.all([
      User.findAll({
        where: {
          name:senderName,
        }
      }),
      User.findAll({
        where: {
          name:receiverName,
        }
      }),
    ]).then(([sender, receiver]) =>{
      Message.createMessage(message, sender[0], receiver[0])
            .then((message) => {
              //socket.emit('incomingMessage', {message, friendName});
              const receiverSocketId = findSockedIdByName(receiverName);
              socket.broadcast.emit('incomingMessage', {text: message.text, time: message.createdAt, senderName});
          });
    });
    
  });

  

  socket.on('disconnect', () => {
    const currentUserName = userAndSockets[socket.id];
    userLastLogoutTime[currentUserName] = new Date();
    socket.broadcast.emit('friend-state-change', {friendName: currentUserName, isFriendOnline:false, lastLogoutTime: userLastLogoutTime[currentUserName]})
    delete userAndSockets[socket.id]
  })
})

const port = process.env.PORT || 3000

server.listen(port, () => {
  console.log('listening on: ', port)
})
