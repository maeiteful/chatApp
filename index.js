const path = require('path')
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentuser, userLeave, getRoomUsers} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//Set static forlder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'MyroChat Bot';

//Run when a client connects
io.on('connection', socket => {

    socket.on('joinRoom', ({ username , room}) => {

        const user = userJoin(socket.id, username, room)

        socket.join(user.room)

        socket.emit('message', formatMessage(botName, 'Welcome to MyroChat!'));

        // Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`));

        // send Users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });




    //Listen for chat msg
    socket.on('chatMessage', (msg) => {
        const user = getCurrentuser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username,msg));
    })

      //runs when client disconnects
      socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user) {
            io.to(user.room).emit('message', formatMessage(botName,`${user.username} has left the chat`));


            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
        
    })
})


server.listen(process.env.PORT || 3000);