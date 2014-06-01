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
var danceOffNow = false;
var currentPartyId;
var listPartyId;
var listExpires;
var partyReady = false;
var partyGifs = ['http://static.fjcdn.com/gifs/Praise_f5e992_796049.gif',
				'http://media2.giphy.com/media/kgKrO1A3JbWTK/giphy.gif',
				'http://media2.giphy.com/media/hsBZfDG7wiWHu/giphy.gif',
				'http://college-social.com/content/uploads/sites/7/2014/03/jimmyelmo_its_a_gif_party-s480x270-142843-580.gif',
				'http://static.fjcdn.com/gifs/PARTY_6f9750_2098765.gif',
				'http://31.media.tumblr.com/c99133aa872ca545945d804a5d2a0216/tumblr_mglmrjTf2E1rusugho1_500.gif',
				'http://media.giphy.com/media/wtVljL9rUURW0/giphy.gif',
				'http://img2.wikia.nocookie.net/__cb20131123181002/adventuretimewithfinnandjake/images/9/9c/Party_hard_pug.gif',
				'http://partyhard.me/gifs/dancing-man-party-hard-gif.gif',
				'http://www.lucidchan.org/ph/src/129832260942.gif'];
var id;
var partyTimerId = -1;
var songReady = false;
			
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

function startDanceParty(){
    console.log('starting dance party');

	//var callback = function(geoPos){	
		var dataBuffer = {
			userId: id,
			songId: $('select#genre option:selected').val(),
			songTitle: $('select#genre option:selected').text(),
			partyName: $('input#name').val(),
			partyDescription: $('textarea#description').val()
		};
		socket.emit('new party', JSON.stringify(dataBuffer));
		unlockAudio();
	//};

	/*
	determine if the handset has client side geo location capabilities
	if(geo_position_js.init()){
	   geo_position_js.getCurrentPosition(callback, callback);
	}
	else{
	   console.log('Could not connect to geo');
	   callback();
	}
	*/
    return false;
}

function setPartyStarting(data){
    currentPartyId = data.partyId;
	loadAudio(data.songPath,function(){songReady=true;}); // load the song
    prepDanceParty(data);
}

function joinDanceParty(pid){
    // Clients don't care if they fail
    socket.emit('join party', JSON.stringify({userId: id, partyId: pid}));
	unlockAudio();
}

function prepDanceParty(data){
    var startDate = data.startDate;
    // set an interval that spirals closer to the closing time
    var callback = function(){
        if ( songReady === true && Date.now() >= startDate ) {
            // Frakking dance off
            clearInterval(partyTimerId);
			$('div.timerUpdate').text('');
			$('.secs').text('');
            danceOff(data);
        } else {
			// Update our dance off text
			$('div.partyName').text(data.partyName);
			//$('div.songPath').text('Song path: ' + data.songPath);
			$('div.genre').text('Genre: ' + data.songTitle);
			//$('div.partyDesc').text('Party Description: ' + data.partyDescription);
			if ( startDate - Date.now() > 0.0 ) {
                $('div.timerUpdate').text(Math.ceil((startDate - Date.now())/1000));
            } else {
                $('div.timerUpdate').text('0');
            }
			$('.secs').text('seconds until party...');

            
        }
    };
    partyTimerId = setInterval(callback, 10);
}

// Dance off NOW!
function danceOff(data){
	ctxSource = context.createBufferSource(); // creates a sound source
    ctxSource.buffer = soundBuffer;           // tell the source which sound to play
    ctxSource.connect(context.destination);   // connect the source to the context's destination (the speakers)
    ctxSource.noteOn(0);                           // play the source now
	var idx = Math.floor(Math.random()*partyGifs.length);
    $(".dance-img").prepend('<img src="' + partyGifs[idx] + '" />');
	danceOffNow = true;
}

function danceOver(){
	// leave party
	$('.dance-img img').remove();
	ctxSource.noteOff(0);
	resetState();	
}

// Reset our current state
function resetState(){
	partyReady = false;
	danceOffNow = false;
	songReady = false;

	PageTransitions.animate($('#goHome'));
	$('ul.party-list').hide(); // hide our list of items
}

// Button events
function partyButtonClick(){
	startDanceParty();
}

function joinButtonClick(){
	joinDanceParty(listPartyId);
}

// Check to see if we are in the middle of a dance party
function backButtonClick(){
	if ( danceOffNow === true ) {
		console.log('leaving the party early');
		danceOver();		
	} else { 
		console.log('canceled any chance of a party');
		clearInterval(partyTimerId); // if this is set
	}
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
    
	// Add this to our join list if its not already there
    socket.on('party starting', function(data) {
        console.log('a party is about to start');
        if ( data.partyId !== currentPartyId &&
				data.partyId !== listPartyId ) {
            listPartyId = data.partyId;
			listExpires = data.timeExpires; // how long until this expires?
			$('p.list-item-title').each(function(){$(this).text(data.partyName);});
			$('p.list-item-subtitle').each(function(){$(this).text(data.partyDescription);});
			if ( data.timeLeft > 60000 ) {
				$('p.list-item-time').text('starts in ' + Math.ceil(data.timeLeft/60000.0) + ' minutes');
			} else {
				$('p.list-item-time').text('starts in ' + Math.ceil(data.timeLeft/1000.0) + ' seconds!');
			}
			$('ul.party-list').show(); // make sure we are visible
        }
    });
    
    socket.on('party ended', function(data) {
		if ( data.partyId === currentPartyId && danceOffNow == true ) {
			console.log('a party just ended');
			danceOver();
		}
    });
}
 
function addEventHandlers(){
    dancePartyTime();
    $('.btnCreate').click(partyButtonClick);
	$('.btnJoin').click(joinButtonClick);
	$('.btnBack').click(backButtonClick);
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
 
function loadAudio(url, cb) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    var callback = function() {
        context.decodeAudioData(request.response, function(buffer) {
            soundBuffer = buffer;
			if ( typeof cb !== 'undefined' ) {
				cb();
			}
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
		loadAudio('songs/fluffer.wav'); // made to unlock audio on Iphone 5/6
    }
});