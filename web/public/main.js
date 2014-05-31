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
 
function startDanceParty(){
    console.log('starting dance party');
    socket.emit('new party', {userId: id});
    return false;
}

function joinDanceParty(){
    socket.emit('join party', {userId: id, partyId: 'test'});
}

function dancePartyTime() {
    socket.on('somebody started', function(data) {
        console.log('somebody started');
        console.log(data.userid);
        console.log(data.message);
    });
    
    socket.on('party starting', function(data) {
        console.log('a party is about to start');
        $('#danceParty').attr('id',data.partyId);
        $('#danceParty').val('Join Party');
    });
    
    socket.on('party ended', function(data) {
        console.log('a party just ended');
        $('#danceParty').attr('id','');
        $('#danceParty').val('Start party');
    });
}
 
function addEventHandlers(){
    dancePartyTime();
    $('#danceParty').click(startDanceParty);
}
 
$(document).ready(function(){
    addEventHandlers();
});