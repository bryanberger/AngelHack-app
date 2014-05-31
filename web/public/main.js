/*
 * Main.js
 *  Main Javascript file.
 */
var socket = io();
var isReady = false;

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

var id = guid();
var currentPartyId;
 
function startDanceParty(){
    console.log('starting dance party');
    var dataBuffer = {userId: id};
    socket.emit('new party', JSON.stringify(dataBuffer));
    return false;
}

function setPartyStarting(data){
    currentPartyId = data.partyId;
    $('#danceParty').val('Party Starting...');
    $('#danceParty').attr('disabled','disabled');
    prepDanceParty(data);
}

function joinDanceParty(pid){
    // Clients don't care if they fail
    socket.emit('join party', JSON.stringify({userId: id, partyId: pid}));
}

function prepDanceParty(data){
    var startDate = data.startDate;
    // set an interval that spirals closer to the closing time
    var callback = function(){
        if ( Date.now() >= data.startDate ) {
            // Fucking dance off
            danceOff(data);
        } else {
            setTimeout(callback, 10);
        }
    };
    callback();
}

// Dance off NOW!
function danceOff(data){
    console.log('DAAAAAAAAAAAAAAAAANCE');
    $("body").prepend('<img src="http://media2.giphy.com/media/kgKrO1A3JbWTK/giphy.gif" />');
    $('#danceParty').val('DANCE PARTY');
}

function dancePartyTime() {    
    socket.on('party accepted', function(data) {
        var dataObj = JSON.parse(data);
        if ( id === dataObj.userId ) {
            console.log('Our party was accepted');
            setPartyStarting(dataObj);
        } else {
            console.log('Someone elses party was accepted');
        }
    });
    
    socket.on('party starting', function(data) {
        console.log('a party is about to start');
        if ( data.partyId !== currentPartyId ) {
            $('#danceParty').val('Join Party');
            $('#danceParty').unbind('click').click(function(){joinDanceParty(data.partyId)});
        }
    });
    
    socket.on('party ended', function(data) {
        console.log('a party just ended');
        currentPartyId = data.partyId;
        $('#danceParty').val('Start party');
        $('#danceParty').unbind('click').click(startDanceParty);
    });
}
 
function addEventHandlers(){
    dancePartyTime();
    $('#danceParty').unbind('click').click(startDanceParty);
}
 
$(document).ready( function(){
    if ( isReady === false ) {
        addEventHandlers();
        isReady = true;
    }
});