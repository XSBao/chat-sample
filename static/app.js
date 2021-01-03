
const socket = io()
const chatContainer = document.getElementById('chat')

const chat = document.getElementById('send-form')
const chatInput = document.getElementById('send-input')

//new login
let name = prompt('Your name: ')
while(name.length == 0){
    name = prompt('Your name: ')
}
let password = prompt('Your password: ')
while(password.length == 0){
    password = prompt('Your password: ')
}
socket.emit('new-user-authentication', {name:name, password: password})

function appendMessage(message, isMe, isLast){
    const messageElement = document.createElement('div');
    messageElement.innerText = message;
    if(isMe){
        messageElement.classList.add(['mine', 'messages'])
        if(isLast){
            messageElement.classList.add(['message', 'last'])
        }else{
            messageElement.classList.add('message')
        }
    }else{
        messageElement.classList.add(['yours', 'messages'])
        if(isLast){
            messageElement.classList.add(['message', 'last'])
        }else{
            messageElement.classList.add('message')
        }
    }
    chatContainer.appendChild(messageElement)
}

function undateFriendOnlineState(friendName, isOnline, lastLogoutTime){
    const friendStateElement = document.getElementById('friend-state')
    if(isOnline){        
        friendStateElement.innerText = `${friendName} is online`
    }else{
        friendStateElement.innerText = `${friendName} is offline since ${lastLogoutTime}`
    }
}

function convertUTCDateToLocalDate(utcdate) {
    date = new Date(utcdate.toString())
    return date.toString();
}

//submit message
chat.addEventListener('submit', e => {
  e.preventDefault()
  const message = chatInput.value
  appendMessage('You: ' + chatInput.value)
  socket.emit('send-chat-message', chatInput.value)
  chatInput.value = ''
})

socket.on('welcome-back', () => {
    const welcomeMsgElement = document.getElementById("welcome-msg");
    welcomeMsgElement.innerText = `Welcome back, ${name}`  
})

socket.on('priorMessages', messages => {
    messages.forEach(message => {
        const msg = `${message.user.name}: ${message.text} at time: ${convertUTCDateToLocalDate(message.createdAt)}`
        appendMessage(msg, false, false)  
    });
      
})

socket.on('inform-friend-info', data => {
    if(data.isFriendOnline){
        undateFriendOnlineState(data.friendName, true, null )
    }else{
        undateFriendOnlineState(data.friendName, false, data.lastLogoutTime)
    }
})

socket.on('friend-state-change', data => {
    if(data.isFriendOnline){
        undateFriendOnlineState(data.friendName, true, null )
    }else{
        console.log('.................')
        console.log(data.lastLogoutTime)
        undateFriendOnlineState(data.friendName, false, data.lastLogoutTime)
    }
})

socket.on('incomingMessage', data => {
    const msg = `${data.senderName}: ${data.text} at ${data.time}`
    appendMessage(msg, false, true)
})

socket.on('user-login-failed', () => {
    const name = prompt("Wrong username or password. Type username again: ")
    const password = prompt('Your password: ')
    socket.emit('new-user-authentication', {name: name, password: password})
})
