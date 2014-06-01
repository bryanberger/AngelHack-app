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
var newPartyId;
var partyReady = false;
 
function startDanceParty(){
    console.log('starting dance party');
    var dataBuffer = {userId: id};
    socket.emit('new party', JSON.stringify(dataBuffer));
	unlockAudio();
    return false;
}

function setPartyStarting(data){
    currentPartyId = data.partyId;
    prepDanceParty(data);

}

function joinDanceParty(pid){
    // Clients don't care if they fail
    socket.emit('join party', JSON.stringify({userId: id, partyId: pid}));
	unlockAudio();
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
	ctxSource = context.createBufferSource(); // creates a sound source
    ctxSource.buffer = soundBuffer;           // tell the source which sound to play
    ctxSource.connect(context.destination);   // connect the source to the context's destination (the speakers)
    ctxSource.noteOn(0);                           // play the source now
                                             
    $("body").prepend('<img src="http://media2.giphy.com/media/kgKrO1A3JbWTK/giphy.gif" />');
}

// Reset our current state
function resetState(){
	partyReady = false;
}

function partyButtonClick(){
	startDanceParty();
}

function joinButtonClick(){
	var callback = function(){
		if ( partyReady === true ) {
			joinDanceParty(newPartyId);
		} else {
			setTimeout(callback, 250);
		}
	};
	callback();
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
        if ( data.partyId !== currentPartyId &&
				data.partyId !== newPartyId ) {
            newPartyId = data.partyId;
			partyReady = true;
        }
    });
    
    socket.on('party ended', function(data) {
        console.log('a party just ended');
        $('body img:first').remove();
        ctxSource.noteOff(0);
        resetState();
    });
}
 
function addEventHandlers(){
    dancePartyTime();
    $('.btnCreate').click(partyButtonClick);
	$('.btnJoin').click(joinButtonClick);
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
    ctxSource = context.createBufferSource(); // creates a sound source
    ctxSource.buffer = soundBuffer;           // tell the source which sound to play
    ctxSource.connect(context.destination);   // connect the source to the context's destination (the speakers)
	ctxSource.noteOn(0);
	ctxSource.noteOff(0);
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
		isReady = true;
        addEventHandlers();
        resetState();
        getId();
        loadAudio('dancesong3.mp3');
    }
});