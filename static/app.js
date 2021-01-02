
const socket = io()
const messageContainer = document.querySelector('.message-container')

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

function appendMessage(message){
    const messageElement = document.createElement('div');
    messageElement.innerText = message;
    messageContainer.appendChild(messageElement)
}

//submit message
chat.addEventListener('submit', e => {
  e.preventDefault()
  const message = chatInput.value
  appendMessage('You: ' + chatInput.value)
  socket.emit('send-chat-message', chatInput.value)
  chatInput.value = ''
})

socket.on('user-connected', userName => {
    appendMessage(`Welcome back, ${userName}`)    
})

socket.on('inform-friend-info', data => {
    if(data.isFriendOnline){
        appendMessage(`Your friend ${data.friendName} is online`)
    }else{
        appendMessage(`Your friend ${data.friendName} is offline`)
    }
})

socket.on('friend-state-change', data => {
    if(data.isFriendOnline){
        appendMessage(`Your friend ${data.friendName} is online.`)
    }else{
        appendMessage(`Your friend ${data.friendName} is offline.`)
    }
})

socket.on('chat-message', data => {
    appendMessage(`${data.name}: ${data.message}`)
})

socket.on('user-login-failed', () => {
    const name = prompt("Wrong username or password. Type username again: ")
    const password = prompt('Your password: ')
    socket.emit('new-user-authentication', {name: name, password: password})
})
