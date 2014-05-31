/*
 * Main.js
 *   All of our official Javascript code
 */
 
// Global variables go here
var pollRate = 2500;
var checkCnt = 0;
var danceTimer;
var id = '';
 
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
 
// Function to check to see if a dance party is ready
function checkDanceParty(){
    console.log('Checking for dance party.');
    // Lets do an AJAX callback against the PHP
    $.get( "http://localhost/checkParty.php?id=" + id + "&checkCnt=" + checkCnt , function( data ) {
        console.log(data);
        // if data.startParty?
        //    startDanceParty!!!
    });
    checkCnt = checkCnt + 1;
}

function receiveDanceParty(){
    checkCnt = 0;
    clearInterval(danceTimer);
}

function endDanceParty(){
    danceTimer = setInterval(checkDanceParty, pollRate);
}
 
function askForDanceParty(e){
    // Ask for a dance party
    console.log('Asking for a dance party');
}
 
function addEventHandlers(){
    $('#startButton').click(askForDanceParty);
}
 
// Start running once the DOM is ready
$(document).ready(function(){
    $( "p" ).text( "The DOM is now loaded and can be manipulated." );
    // Generate a user id
    id = 'user' + guid();
    addEventHandlers();
    // Update loop for the dance party check
    danceTimer = setInterval(checkDanceParty, pollRate); // poll every 5 seconds
});
