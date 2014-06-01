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

var partyGifs = ['http://static.fjcdn.com/gifs/Praise_f5e992_796049.gif',
				'http://media2.giphy.com/media/kgKrO1A3JbWTK/giphy.gif',
				'http://mashable.com/wp-content/uploads/2013/06/Party-GIF.gif',
				'http://media2.giphy.com/media/hsBZfDG7wiWHu/giphy.gif',
				'http://college-social.com/content/uploads/sites/7/2014/03/jimmyelmo_its_a_gif_party-s480x270-142843-580.gif',
				'http://static.fjcdn.com/gifs/PARTY_6f9750_2098765.gif',
				'http://31.media.tumblr.com/c99133aa872ca545945d804a5d2a0216/tumblr_mglmrjTf2E1rusugho1_500.gif',
				'http://media.giphy.com/media/wtVljL9rUURW0/giphy.gif'];

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

	var callback = function(geoPos){	
		var dataBuffer = {
			userId: id,
			songId: $('select#genre option:selected').val(),
			songTitle: $('select#genre option:selected').text(),
			partyName: $('input#name').val(),
			partyDescription: $('textarea#description').val()
		};
		socket.emit('new party', JSON.stringify(dataBuffer));
		unlockAudio();
	};

	//determine if the handset has client side geo location capabilities
	if(geo_position_js.init()){
	   geo_position_js.getCurrentPosition(callback, callback);
	}
	else{
	   console.log('Could not connect to geo');
	   callback();
	}

    return false;
}

function setPartyStarting(data){
    currentPartyId = data.partyId;
	loadAudio(data.songPath); // load the song
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
            // Frakking dance off
			$('div.timerUpdate').text('');
            danceOff(data);
        } else {
			// Update our dance off text
			$('div.partyName').text('Party name: ' + data.partyName);
			$('div.genre').text('Song title: ' + data.songTitle);
			$('div.partyDescription').text('Party Description: ' + data.partyDescription);
			$('div.timerUpdate').text('Party starts in ' + Math.ceil((startDate - Date.now())/1000) + ' seconds.....');
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
	var idx = Math.floor(Math.random()*partyGifs.length);
    $(".dance-img").prepend('<img src="' + partyGifs[idx] + '" />');
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
			$('div.timerUpdate').text('Waiting for party....');
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
		// Add to the list of available parties
    });
    
    socket.on('party ended', function(data) {
        console.log('a party just ended');
        $('.dance-img img').remove();
        ctxSource.noteOff(0);
        resetState();
		// transition to home page, remove item from party-list
        PageTransitions.animate($('#goHome'));
    });
}
 
function addEventHandlers(){
    dancePartyTime();
    $('.btnCreate').click(partyButtonClick);
	$('.btnJoin').click(joinButtonClick);
}

function getUserId(){
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
        getUserId();
		loadAudio('fluffer.wav'); // made to unlock audio on Iphone 5/6
    }
});