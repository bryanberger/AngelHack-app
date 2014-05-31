/*
 * Main.js
 *  Main Javascript file.
 */
var socket = io();
 
function startDanceParty(){
    console.log('starting dance party');
    socket.emit('new message', {song: 'asdf'});
    return false;
}

function dancePartyTime() {
    socket.on('somebody started', function(data) {
        console.log('somebody started');
        console.log(data.userid);
        console.log(data.message);
    })
}
 
function addEventHandlers(){
    dancePartyTime();
    $('#danceParty').click(startDanceParty);
}
 
$(document).ready(function(){
    addEventHandlers();
});