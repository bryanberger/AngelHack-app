var express = require('express');
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = 3000;

server.listen(port, function(){
    console.log('Server listening at port %d', port);
});

app.use(express.static(__dirname + '/public'));

io.on('connection', function(socket) {
    socket.on('new message', function(Data){
        socket.broadcast.emit('new message', {
            userid: 'user0001',
            message: 'test'
        });
    });
});