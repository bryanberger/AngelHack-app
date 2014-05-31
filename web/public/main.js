/*
 * Main.js
 *  Main Javascript file.
 */
var socket = io();

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
    socket.emit('new party', dataBuffer);
    return false;
}

function setPartyStarting(partyId){
    currentPartyId = partyId;
    $('#danceParty').val('Party Starting...');
    $('#danceParty').attr('disabled','disabled');
}

function joinDanceParty(pid){
    // Clients don't care if they fail
    socket.emit('join party', {userId: id, partyId: pid});
    setPartyStarting(pid);
}

function dancePartyTime() {    
    socket.on('party accepted', function(data) {
        if ( id === data.userId ) {
            console.log('Our party was accepted');
            setPartyStarting(data.partyId);
        } else {
            console.log('Someone elses party was accepted');
        }
    });
    
    socket.on('party starting', function(data) {
        console.log('a party is about to start');
        if ( data.partyId !== currentPartyId ) {
            $('#danceParty').val('Join Party');
            $('#danceParty').click(function(){joinDanceParty(data.partyId)});
        }
    });
    
    socket.on('party ended', function(data) {
        console.log('a party just ended');
        currentPartyId = data.partyId;
        $('#danceParty').val('Start party');
        $('#danceParty').click(startDanceParty);
    });
}
 
function addEventHandlers(){
    dancePartyTime();
    $('#danceParty').click(startDanceParty);
}
 
$(document).ready(function(){
    addEventHandlers();
});