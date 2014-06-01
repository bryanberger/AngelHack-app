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
var startTimer = 5000; // 5 seconds until a dance starts
var danceTime = 10000;
var endTimer = startTimer + danceTime; // 20 second dance parties

var guid = (function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }
  return function() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
  };
})();

function initDB(){
    fs.readFile(flatDBName, function(err,data) {
        var db;
        console.log('Reading the database file');
        if(err)
            console.log('No database has been created');
        try {
            flatDB = JSON.parse(data.toString('utf-8'));
        } catch ( e ) {
            console.log('Corrupted database, rebuilding');
            flatDB = JSON.parse('{"archive":{}}');
        }
        flatDB.activeParty = undefined; // always empty out our active party
        updateDB();
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

function partyCountdown(socket){
    var callback = function(){
        var dataPacket = {
            partyId:  flatDB.activeParty.id,
            userCnt : flatDB.activeParty.userList.length
        };
        socket.emit('party starting', dataPacket);
        socket.broadcast.emit('party starting', dataPacket);
        if ( flatDB.activeParty.startDate > Date.now() ) {
            setTimeout(callback, 100);
        } else {
            // Party started!!!!!
            setTimeout(function(){finishParty(socket)}, danceTime); // tell our clients this party is done
        }
    };    
    callback();
}

// Go through our list of users, tell them its all done
function finishParty(socket, partyId){
    console.log('Ending the party ' + flatDB.activeParty.id + ', archiving');
    // Save our database, archive the current party
    flatDB.archive[flatDB.activeParty.id.toString()] = flatDB.activeParty;
    socket.emit('party ended', {partyId: flatDB.activeParty.id});
    socket.broadcast.emit('party ended', {partyId: flatDB.activeParty.id});
    flatDB.activeParty = undefined;
    updateDB();
}

function addToParty(pid, uid, socket){
    console.log('User ' + uid + ' wants to join ' + pid);
    if ( typeof flatDB.activeParty !== 'undefined' &&
         flatDB.activeParty.id == pid &&
         flatDB.activeParty.userList.indexOf(uid) === -1 ) {
        console.log('User ' + uid + ' added to ' + pid);
        flatDB.activeParty.userList.push(uid);
        updateDB();
        socket.emit('party accepted', JSON.stringify({
            userId: uid,
            partyId: flatDB.activeParty.id,
			timeLeft: flatDB.activeParty.startDate - Date.now()
        }));
        return true;
    }
}

function createNewParty(uid, socket){
    // check to see if this user is currently in an active party
    if ( typeof flatDB.activeParty !== 'undefined' && flatDB.activeParty.userList.indexOf(uid) ) {
        // User is currently already in the active party list, do not let them start a new party
        return false;
    } else if ( typeof flatDB.activeParty !== 'undefined' && 
        flatDB.activeParty.endTime < Date.now() ) {
        // There is currently a party happening!!
        return false
    }
     
    // Create a fucking party
    setDBValue('activeParty',{
        id:  guid(),
        userInitiated : uid,
        initDate : Date.now(),
        startDate : Date.now() + startTimer,
        endDate : Date.now() + endTimer,
        userList : [uid]
    });
    
    // Send to our creator that this party was started
    socket.emit('party accepted', JSON.stringify({
            userId: uid,
            partyId: flatDB.activeParty.id,
			timeLeft: flatDB.activeParty.startDate - Date.now()
    }));
   
    // Start emitting there is a party
    partyCountdown(socket);
    
    return true
}

server.listen(port, function(){
    console.log('Server listening at port %d', port);
    initDB();
});

app.use(express.static(__dirname + '/public'));

io.on('connection', function(socket) {
    socket.on('new party', function(Data){
        var dataObj = JSON.parse(Data);
        if ( createNewParty(dataObj.userId, socket) ){
            console.log('Party started!');
        } else {
            console.log('User ' + dataObj.userId + ' could not start a party!');
        }
    });
    
    socket.on('join party', function(Data){
        var dataObj = JSON.parse(Data);
        console.log('User wants to join party ' + dataObj.userId + ' : ' + dataObj.partyId);
        if ( addToParty(dataObj.partyId, dataObj.userId, socket) ){
            console.log('User ' + dataObj.userId + ' added to party ' + dataObj.partyId);
        } else {
            console.log('User ' + dataObj.userId + ' could not be added to party ' + dataObj.partyId);
        }
    });
});
