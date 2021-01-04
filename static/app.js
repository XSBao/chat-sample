
//const socket = io()
//referring to https://stackoverflow.com/questions/41924713/node-js-socket-io-page-refresh-multiple-connections
//to deal with user fast refreshes page
const socket = io({transports: ['websocket'], upgrade: false});

const chatContainer = document.querySelector('.chat')

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
        const mine_messagesDiv = document.createElement('div');
        mine_messagesDiv.classList.add(...['mine', 'messages'])
        if(isLast){
            const messageLastDiv = document.createElement('div');
            messageLastDiv.innerText = message;
            messageLastDiv.classList.add(...['message', 'last'])
            mine_messagesDiv.appendChild(messageLastDiv);
        }else{
            const messageDiv = document.createElement('div');
            messageDiv.innerText = message;
            messageDiv.classList.add('message')
            mine_messagesDiv.appendChild(messageDiv);
        }
        chatContainer.insertBefore(mine_messagesDiv, chatContainer.firstChild)
        //chatContainer.appendChild(mine_messagesDiv)
    }else{
        const yours_messagesDiv = document.createElement('div');
        yours_messagesDiv.classList.add(...['yours', 'messages'])
        if(isLast){
            const messageLastDiv = document.createElement('div');
            messageLastDiv.innerText = message;
            messageLastDiv.classList.add(...['message', 'last'])
            yours_messagesDiv.appendChild(messageLastDiv);
        }else{
            const messageDiv = document.createElement('div');
            messageDiv.innerText = message;
            messageDiv.classList.add('message')
            yours_messagesDiv.appendChild(messageDiv);
        }
        chatContainer.insertBefore(yours_messagesDiv, chatContainer.firstChild)
        //chatContainer.appendChild(yours_messagesDiv)
    }    
}

function undateFriendOnlineState(friendName, isOnline, lastLogoutTime){
    const friendStateElement = document.getElementById('friend-state')
    if(isOnline){        
        friendStateElement.innerText = `${friendName} is online`
    }else{
        const timeStr = extractShortTimeStrFromUTC(lastLogoutTime);
        friendStateElement.innerText = `${friendName} is offline since ${timeStr}`
    }
}

function convertUTCDateToLocalDate(utcdate) {
    if(utcdate == undefined){
        return "unknown time";
    }
    date = new Date(utcdate.toString())
    return date.toString();
}

function extractShortTimeStrFromUTC(utcdate){
    const str = convertUTCDateToLocalDate(utcdate);
    const index = str.indexOf('GMT')
    return str.substring(0, index)
}

//submit message
chat.addEventListener('submit', e => {
  e.preventDefault()
  const message = chatInput.value

  timeStr = extractShortTimeStrFromUTC(new Date());
  appendMessage(`You: ${chatInput.value} \n ${timeStr}`, true, true)
  socket.emit('send-chat-message', chatInput.value)
  chatInput.value = ''
})

socket.on('welcome-back', () => {
    const welcomeMsgElement = document.getElementById("welcome-msg");
    welcomeMsgElement.innerText = `Welcome back, ${name}`  
})

socket.on('priorMessages', messages => {
    messages.forEach(message => {
        const timeStr = extractShortTimeStrFromUTC(message.createdAt)
        if(message.user.name === name){
            const msg = `You: ${message.text} \n ${timeStr}`
            appendMessage(msg, true, false)
        }else{
            const msg = `${message.user.name}: ${message.text} \n ${timeStr}`
            appendMessage(msg, false, false)  
        }        
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
        undateFriendOnlineState(data.friendName, false, data.lastLogoutTime)
    }
})

socket.on('incomingMessage', data => {
    const timeStr = extractShortTimeStrFromUTC(data.time);
    const msg = `${data.senderName}: ${data.text} \n ${timeStr}`
    appendMessage(msg, false, true)
})

socket.on('user-login-failed', () => {
    const name = prompt("Wrong username or password. Type username again: ")
    const password = prompt('Your password: ')
    socket.emit('new-user-authentication', {name: name, password: password})
})
