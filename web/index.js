// Node.js libraries
var express = require('express');
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var fs = require('fs');
var port = 3000;

// Local variables
var flatDB;
var flatDBName = 'db.json';

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }
  return function() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
  };
}

function initDB(){
    fs.readFile(flatDBName, function(err,data) {
        var db;
        console.log('Reading the database file');
        if(err)
            return console.log('No database has been created');
        console.log(data.toString('utf-8'));
        try {
            flatDB = JSON.parse(data.toString('utf-8'));
        } catch ( e ) {
            return console.log('Corrupted database');
        }   
    });
}

function updateDB(){
    fs.writeFile(flatDBName, JSON.stringify(flatDB), 'utf8', function(err){
        if(err)
            return console.log('Could not write database');
        console.log('Saved database.');
    });
}

function setDBValue(key, value){
    flatDB[key] = value;
    updateDB();
}

function partyCountdown(){
    var callback = function(){
        socket.broadcast.emit('party starting', {
            id:  flatDB.activeParty.id,
            startDate : flatDB.activeParty.startDate,
            endDate : flatDB.activeParty.endDate,
            userCnt : flatDB.activeParty.userList.length
        });
    };    
    setTimeout(callback, 100);
}

// Go through our list of users, tell them its all done
function finishParty(partyId){
    socket.broadcast.emit('party ended', {
        id: flatDB.activeParty.id
    });
}

function addToParty(partyId, userId, socket){
    console.log('User ' + userId + ' wants to join ' + partyId);
    if ( typeof flatDB.activeParty !== 'undefined' &&
         flatDB.activeParty.id == partyId &&
         !flatDB.activeParty.userList.contains(userId) ) {
        console.log('User ' + userid + ' added to ' + partyId);
        flatDB.activeParty.userList.push(userId);
        updateDB();
        // broadcast to this user's socket that we successfully added them
    }
}

function createNewParty(userId){
    // check to see if this user is currently in an active party
    if ( typeof flatDB.activeParty !== 'undefined' && flatDB.activeParty.userList.contains(userId) ) {
        // User is currently already in the active party list, do not let them start a new party
        return false;
    } else if ( typeof flatDB.activeParty !== 'undefined' && 
        flatDB.activeParty.endTime < Date.now() ) {
        // There is currently a party happening!!
        return false
    }
     
    // Create a fucking party
    setDBValue('activeParty',{
        id:  guti(),
        userInitiated : userId,
        initDate : Date.now(),
        startDate : Date.now() + 50000,
        endDate : Date.now() + 250000,
        userList : [userId]
    });
    
    // Start emitting there is a party
    partyCountdown();
    
    return true
}

server.listen(port, function(){
    console.log('Server listening at port %d', port);
    initDB();
});

app.use(express.static(__dirname + '/public'));

io.on('connection', function(socket) {
    socket.on('new message', function(Data){
        socket.broadcast.emit('new message', {
            userid: 'user0001',
            message: 'test'
        });
    });
    
    socket.on('new party', function(Data){
        if ( createNewParty(userId) ){
            socket.broadcast.emit('new party', {
                partyid: 'party1',
                timeStart: '1515151515',
                timeEnd: '1515151515'
            });
        }
    });
    
    socket.on('poll party', function(Data){
        
    });
});