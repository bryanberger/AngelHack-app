/*
 * Main.js
 *  Main Javascript file.
 */
var socket = io();
 
function startDanceParty(){
    socket.emit('client message', 'start');
    return false;
}
 
function addEventHandlers(){
    $('#danceParty').submit(startDanceParty);
}
 
$(document).ready(function(){
    addEventHandlers();
});