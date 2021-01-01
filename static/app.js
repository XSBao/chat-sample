const socket = io()

const chat = document.querySelector('.chat-form')
const chatInput = document.querySelector('.chat-input')

chat.addEventListener('submit', e => {
  e.preventDefault()
  socket.emit('chat', chatInput.value)
  chatInput.value = ''
})

const chatDump = document.querySelector('.chat-dump')
const render = ({message, id}) => {
  const div = document.createElement('div')
  if(id === socket.id){
      //myself
      div.classList.add('me')
  }else{
    div.classList.add('others')
  }

  div.innerText = message; // insert content of message into div
  chatDump.appendChild(div)
}

socket.on('chat', data => {
    render(data)
})

