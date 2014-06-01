// Node.js libraries
var express = require('express');
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var fs = require('fs');
var port = process.env.PORT || 3000;

// Local variables
var flatDB;
var flatDBName = 'db.json';
var startTimer = 120*1000; // 30 seconds until a dance starts
var danceTime = 30*1000; // dance parties are 30 seconds long
var endTimer = startTimer + danceTime; // 20 second dance parties
var startTimerId;
var songFiles = {
	'80s':'songs/dancesong1.mp3',
	'electro':'songs/dancesong2.mp3',
	'house':'songs/dancesong3.mp3',
	'pop':'songs/dancesong4.mp3'
};

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
		if ( typeof flatDB.archive === 'undefined' ){
			flatDB.archive = {};
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
		if ( flatDB.activeParty == undefined) {
			return; // race condition, just exist out for now
		}
        var dataPacket = {
            partyId : flatDB.activeParty.id,
			partyName : flatDB.activeParty.partyName,
			partyDescription : flatDB.activeParty.partyDescription,
			timeLeft : flatDB.activeParty.startDate - Date.now(),
			timeExpires : flatDB.activeParty.endDate - Date.now(),
            startDate : flatDB.activeParty.startDate,
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

    if (typeof flatDB.activeParty !== 'undefined') {
        console.log('Ending the party ' + flatDB.activeParty.id + ', archiving');

        // Save our database, archive the current party
        flatDB.archive[flatDB.activeParty.id.toString()] = flatDB.activeParty;
        socket.emit('party ended', {partyId: flatDB.activeParty.id});
        socket.broadcast.emit('party ended', {partyId: flatDB.activeParty.id});
        flatDB.activeParty = undefined;
        updateDB();
    }
    
}

function sendPartyAccepted(data, socket){
    var dataPacket = {
        userId: data.userId,
		partyId: flatDB.activeParty.id,
		timeLeft: flatDB.activeParty.startDate - Date.now(),
        startDate: flatDB.activeParty.startDate,
		songId: flatDB.activeParty.songId,
		songTitle: flatDB.activeParty.songTitle,
		songPath: songFiles[flatDB.activeParty.songId],
		partyName: flatDB.activeParty.partyName,
		partyDescription: flatDB.activeParty.partyDescription
    };
    if ( data.userId === flatDB.activeParty.userInitiated ) {
        dataPacket['owner'] = true;
    }
    socket.emit('party accepted', JSON.stringify(dataPacket));
}

function sendForceStart(data, socket){
    var dataPacket = {
        userId: data.userId,
		partyId: flatDB.activeParty.id,
		timeLeft: flatDB.activeParty.startDate - Date.now(),
        startDate: flatDB.activeParty.startDate
    };
    socket.emit('party forcestart', JSON.stringify(dataPacket));
    socket.broadcast.emit('party forcestart', JSON.stringify(dataPacket));
}

function addToParty(data, socket){
    if ( typeof flatDB.activeParty !== 'undefined'
	   && flatDB.activeParty.id == data.partyId ) {
        if ( flatDB.activeParty.userList.indexOf(data.userId) === -1 ) {
            flatDB.activeParty.userList.push(data.userId);
            updateDB();
        }
        sendPartyAccepted(data, socket);	
        return true;
    }
}

function forcestartParty(data, socket){
    if ( typeof flatDB.activeParty !== 'undefined'
        && flatDB.activeParty.id === data.partyId
        && flatDB.activeParty.userInitiated === data.userId ) {
        // Set the start date and end date
        flatDB.activeParty.startDate = Date.now();
        flatDB.activeParty.endDate = flatDB.activeParty.startDate + danceTime;
        sendForceStart(data, socket);
        return true;
    } else {
        return false;
    }
};

function createNewParty(data, socket){
    // check to see if this user is currently in an active party
    if ( typeof flatDB.activeParty !== 'undefined' ) {
        // User is currently already in the active party list, do not let them start a new party
        return false;
    } else if ( typeof flatDB.activeParty !== 'undefined' && 
        flatDB.activeParty.endTime < Date.now() ) {
        // There is currently a party happening!!
        return false
    }
     
    // Create a party
    setDBValue('activeParty',{
        id:  guid(),
        userInitiated : data.userId,
        initDate : Date.now(),
        startDate : Date.now() + startTimer,
        endDate : Date.now() + endTimer,
		songId: data.songId,
		songTitle: data.songTitle,
		partyName: data.partyName,
		partyDescription: data.partyDescription,
        userList : [data.userId]
    });
    
    // Send to our creator that this party was started
    sendPartyAccepted(data, socket);
	
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
        if ( createNewParty(dataObj, socket) ){
            console.log('Party started!');
        } else {
            console.log('User ' + dataObj.userId + ' could not start a party!');
        }
    });
    
    socket.on('join party', function(Data){
        var dataObj = JSON.parse(Data);
        console.log('User wants to join party ' + dataObj.userId + ' : ' + dataObj.partyId);
        if ( addToParty(dataObj, socket) ){
            console.log('User ' + dataObj.userId + ' added to party ' + dataObj.partyId);
        } else {
            console.log('User ' + dataObj.userId + ' could not be added to party ' + dataObj.partyId);
        }
    });

    socket.on('forcestart party', function(Data){
        var dataObj = JSON.parse(Data);
        console.log('User wants to forcestart party ' + dataObj.userId + ' : ' + dataObj.partyId);
        if ( forcestartParty(dataObj, socket) ){
            console.log('User ' + dataObj.userId + ' force started the party ' + dataObj.partyId);
        } else {
            console.log('User ' + dataObj.userId + ' could not force start the party ' + dataObj.partyId);
        }
    });
});
