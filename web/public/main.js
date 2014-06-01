/*
 * Main.js
 *  Main Javascript file.
 */
var socket = io();
var isReady = false;
var soundBuffer = null;
window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();
var ctxSource;

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

var id;
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
    ctxSource = context.createBufferSource(); // creates a sound source
    ctxSource.buffer = soundBuffer;                    // tell the source which sound to play
    ctxSource.connect(context.destination);       // connect the source to the context's destination (the speakers)
}

function joinDanceParty(pid){
    // Clients don't care if they fail
    socket.emit('join party', JSON.stringify({userId: id, partyId: pid}));
}

function prepDanceParty(data){
    var startDate = Date.now() + data.timeLeft;
    // set an interval that spirals closer to the closing time
    var callback = function(){
        if ( Date.now() >= startDate ) {
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
    ctxSource.start(0);                           // play the source now
                                             
    $('#danceParty').val('DANCE PARTY');
    $("body").prepend('<img src="http://media2.giphy.com/media/kgKrO1A3JbWTK/giphy.gif" />');
}

// Reset our current state
function resetState(){
    $('#danceParty').val('Start Party');
    $('#danceParty').unbind('click').click(startDanceParty);
    $('#danceParty').removeAttr('disabled');
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
            $('#danceParty').val('Join Party - ' + data.userCnt + ' Partiers');
            $('#danceParty').unbind('click').click(function(){joinDanceParty(data.partyId)});
        }
    });
    
    socket.on('party ended', function(data) {
        console.log('a party just ended');
        $('body img:first').remove();
        ctxSource.stop(0);
        resetState();
    });
}
 
function addEventHandlers(){
    dancePartyTime();
    $('#danceParty').unbind('click').click(startDanceParty);
}

function getId(){
    if ( typeof(Storage) !== 'undefined' ){
        var localItem = localStorage.getItem('id');
        if ( localItem !== null ){
            id = localItem;
        } else {
            id = guid();
            localStorage.setItem('id', id); // comment this out to create unique users every time
        }
    } else {
        id = guid();
    }
}
 
// Iphone 5/6 unlock audio
function unlockAudio(){
noteOn
}
 
function loadAudio(url) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    
    var callback = function() {
        context.decodeAudioData(request.response, function(buffer) {
            soundBuffer = buffer;
        });
    };
    
    // Decode asynchronously
    if ( typeof request.addEventListener !== 'undefined' ) {
        request.addEventListener('load', callback, false);
    } else if ( typeof request.onload !== 'undefined' ) {
        request.onload = callback;
    }
    request.send();
}
 
$(document).ready( function(){
    if ( isReady === false ) {
        addEventHandlers();
        resetState();
        getId();
        loadAudio('dancesong3.mp3');
        isReady = true;
    }
});