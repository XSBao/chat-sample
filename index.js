const express = require('express')
const app = express()
const server = require('http').createServer(app)
const path = require('path')
const io = require('socket.io')(server)

app.use(
  express.static(path.join(__dirname, '/static'))
)

io.on('connection', socket => {
  console.log('Some client connected')
  socket.on('chat', message => {
    io.emit('chat', {message, id: socket.id})
    console.log('message from client: ', message)
  })
})

const port = process.env.PORT || 3000

server.listen(port, ()=> {
  console.log('listening on: ', port)
})