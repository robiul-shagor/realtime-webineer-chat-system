// Get URL Parameteras
function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// Cookie functions
function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

// Peer JS 
const myPeer = new Peer({
    config: {'iceServers': [
        {urls: "stun:stun.l.google.com:19302"},
        {urls: "stun:stun.services.mozilla.com"},
        {urls: "stun:stun.stunprotocol.org:3478"},
        {url: "stun:stun.l.google.com:19302"},
        {url: "stun:stun.services.mozilla.com"},
        {url: "stun:stun.stunprotocol.org:3478"},
        {
          'urls': 'turn:numb.viagenie.ca',
          'credential': 'Shagor994999',
          'username': 'mrhshagor@gmail.com'
        },
        {
          'urls': 'turn:13.250.13.83:3478?transport=udp',
          'username': 'YzYNCouZM1mhqhmseWk6',
          'credential': 'YzYNCouZM1mhqhmseWk6'
        }
    ]} 
});

// Get Room Id via URL
let roomID = getParameterByName('user'); 

// Get Room Id via URL
let userName = getParameterByName('name'); 

// Get Success URL
let success_url = getParameterByName('url'); 

// Get ID
let user_id_ctn = getParameterByName('id'); 

// Booking ID
let booking_id = getParameterByName('booking'); 

const existingCalls = [];
var iceCandidates = [];

var rtc_server = {
  iceServers: [
    {urls: "stun:stun.l.google.com:19302"},
    {urls: "stun:stun.services.mozilla.com"},
    {urls: "stun:stun.stunprotocol.org:3478"},
    {url: "stun:stun.l.google.com:19302"},
    {url: "stun:stun.services.mozilla.com"},
    {url: "stun:stun.stunprotocol.org:3478"},
    {
      'urls': 'turn:numb.viagenie.ca',
      'credential': 'Shagor994999',
      'username': 'mrhshagor@gmail.com'
    },
    {
      'urls': 'turn:13.250.13.83:3478?transport=udp',
      'username': 'YzYNCouZM1mhqhmseWk6',
      'credential': 'YzYNCouZM1mhqhmseWk6'
    }
  ]
}

//const socket = io.connect("199.241.138.108:5000");
const socket = io('https://webineer.ntwasl.com', {transports: ['websocket']});

function startTimer(duration, display) {
    var timer = duration, minutes, seconds;
    setInterval(function () {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            timer = duration;
        }
    }, 1000);
}

// Video Control
const myVideo = document.getElementById('local-video'); // Create a new video tag to show our video
const audremote = document.getElementById('remote-video');
myVideo.muted = true; // Mute ourselves on our end so there is no feedback loop

// Full Screen Api
function toggleFullScreen() {
  if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

// Access the user's video and audio
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    addVideoStream(myVideo, stream) // Display our video to ourselves

    myPeer.on('call', call => { // When we join someone's room we will receive a call from them
        call.answer(stream); // Stream them our video/audio
        const video = document.getElementById("remote-video"); // Create a video tag for them
        call.on('stream', userVideoStream => { // When we recieve their stream
            addVideoStream(video, userVideoStream); // Display their video to ourselves
            // var fiveMinutes = 60 * 30,
            // display = document.querySelector('#time');
            // startTimer(fiveMinutes, display);
        });

        // console.log(call);
    });

    // When internet problem
    myPeer.on('error', function(err) {
        if( err.type == 'network') {

        }        
        if( err.type == 'peer-unavailable') {
            
        }    
        if( err.type == 'server-error') {
            
        }      
        if( err.type == 'socket-error') {
            
        }
    });
    
    socket.on('user-connected', userId => { // If a new user connect
        connectToNewUser(userId, stream);
        // var fiveMinutes = 60 * 30,
        // display = document.querySelector('#time');
        // startTimer(fiveMinutes, display);
        //console.log(`user connected ${userId}`);
    });

    // End Call
    var endCall =  document.getElementById("end-call-button");
    var endCallTimer = document.querySelector('#time').innerHTML;
    endCall.addEventListener("click", (e) => {
        e.preventDefault();
        location.href = 'https://stagging.ntwasl.com/dashboard/'+success_url+'?call_timer='+endCallTimer.split(':')[0]+'&sessions=success&id='+user_id_ctn+'&booking='+booking_id+'';
        //console.log(endCallTimer.split(':')[0]);
    });

    // Mute Audio
    var audiobtn =  document.getElementById("mute-audio-btn");
    audiobtn.addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("mute-audio-btn").style.display = 'none';
        document.getElementById("unmute-audio-btn").style.display = 'block';


        stream.getTracks().forEach( track => {
            //console.log(track);
            if( track.kind == 'audio' ) {
              track.enabled = false;
              track.muted = true;
            }
        });

        // myVideo.muted = true;
        // audremote.muted = true;
    });

    // Unmute Audio
    var unmuteaudiobtn =  document.getElementById("unmute-audio-btn");
    unmuteaudiobtn.addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("mute-audio-btn").style.display = 'block';
        document.getElementById("unmute-audio-btn").style.display = 'none';

        // stream.getTracks().forEach( track => {
        //     if( track.kind == 'audio' ) {
        //       track.enabled = true;
        //     }
        // });

        stream.getTracks().forEach( track => {
            console.log(track);
            if( track.kind == 'audio' ) {
              track.enabled = true;
              track.muted = false;
            }
        });

        // myVideo.muted = false;
        // audremote.muted = false;
    });

    //Disable Video media
    var videobtnDisable =  document.getElementById("video-disable-btn");
    videobtnDisable.addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("video-disable-btn").style.display = 'none';
        document.getElementById("video-enable-btn").style.display = 'block';
        // Disable Video
        stream.getTracks().forEach( track => {
            if( track.kind == 'video' ) {
            track.enabled = false;
            }
        });

        // Disable Video
        myVideo.pause();
    });

    // Resume Video
    var videobtnEnable =  document.getElementById("video-enable-btn");
    videobtnEnable.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("video-enable-btn").style.display = 'none';
      document.getElementById("video-disable-btn").style.display = 'block';

      stream.getTracks().forEach( track => {
        if( track.kind == 'video' ) {
          track.enabled = true;
        }
      });

      // Disable Video
      myVideo.play();
    });

    // Chat Open
    var chatButton =  document.getElementById("chat-panel");
    var closeChatButton =  document.getElementById("close-chat");
    var chatPanel=  document.getElementById("chat-boxs");
    chatButton.addEventListener("click", (e) => {
        e.preventDefault();
        chatPanel.classList.toggle('active');
    });   
    
    closeChatButton.addEventListener("click", (e) => {
        e.preventDefault();
        chatPanel.classList.toggle('active');
    });

    // Full Screen video
    var full_screen_btn = document.getElementById("full-screen");
    full_screen_btn.addEventListener("click", (e) => {
      e.preventDefault();
      
      myVideo.classList.toggle('active');
      toggleFullScreen();
  });

});

myPeer.on('open', id => { // When we first open the app, have us join a room
    socket.emit('join-room', roomID, id);
	
	//var clients = socket.clients(roomID);
    //console.log(socket);
	
    var fiveMinutes = 60 * 30,
    display = document.querySelector('#time');
    startTimer(fiveMinutes, display);
});

function connectToNewUser(userId, stream) { // This runs when someone joins our room
    const call = myPeer.call(userId, stream) // Call the user who just joined
    // Add their video
    const video = document.getElementById("remote-video"); 
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream);


    });
    // If they leave, remove their video
    call.on('close', () => {
        video.remove()
    });
    // var fiveMinutes = 60 * 30,
    // display = document.querySelector('#time');
    // startTimer(fiveMinutes, display);
}


function addVideoStream(video, stream) {
    video.srcObject = stream; 
    video.addEventListener('loadedmetadata', () => { // Play the video as it loads
        video.play();
    });

	//console.log();
    //myVideo.append(video); // Append video element to videoGrid
    // console.log('user connected');
    // console.log(stream);
}

// Chat 
let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");
const user = userName;

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("message", text.value, user);
    
    messages.innerHTML =
    messages.innerHTML +
    `<div class="message me">
        <b><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512" class="fa-user-circle"><path fill="currentColor" d="M248 104c-53 0-96 43-96 96s43 96 96 96 96-43 96-96-43-96-96-96zm0 144c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm0-240C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 448c-49.7 0-95.1-18.3-130.1-48.4 14.9-23 40.4-38.6 69.6-39.5 20.8 6.4 40.6 9.6 60.5 9.6s39.7-3.1 60.5-9.6c29.2 1 54.7 16.5 69.6 39.5-35 30.1-80.4 48.4-130.1 48.4zm162.7-84.1c-24.4-31.4-62.1-51.9-105.1-51.9-10.2 0-26 9.6-57.6 9.6-31.5 0-47.4-9.6-57.6-9.6-42.9 0-80.6 20.5-105.1 51.9C61.9 339.2 48 299.2 48 256c0-110.3 89.7-200 200-200s200 89.7 200 200c0 43.2-13.9 83.2-37.3 115.9z"></path></svg><span> ${user}</span> </b>
        <span>${text.value}</span>
    </div>`;
    text.value = "";

    messages.scrollTop = messages.scrollHeight;
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value, user);
    messages.innerHTML =
    messages.innerHTML +
    `<div class="message me">
        <b><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512" class="fa-user-circle"><path fill="currentColor" d="M248 104c-53 0-96 43-96 96s43 96 96 96 96-43 96-96-43-96-96-96zm0 144c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm0-240C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 448c-49.7 0-95.1-18.3-130.1-48.4 14.9-23 40.4-38.6 69.6-39.5 20.8 6.4 40.6 9.6 60.5 9.6s39.7-3.1 60.5-9.6c29.2 1 54.7 16.5 69.6 39.5-35 30.1-80.4 48.4-130.1 48.4zm162.7-84.1c-24.4-31.4-62.1-51.9-105.1-51.9-10.2 0-26 9.6-57.6 9.6-31.5 0-47.4-9.6-57.6-9.6-42.9 0-80.6 20.5-105.1 51.9C61.9 339.2 48 299.2 48 256c0-110.3 89.7-200 200-200s200 89.7 200 200c0 43.2-13.9 83.2-37.3 115.9z"></path></svg><span> ${user}</span> </b>
        <span>${text.value}</span>
    </div>`;
    text.value = "";
    messages.scrollTop = messages.scrollHeight;
  }
});

var chatPanelBox =  document.getElementById("chat-boxs");
var chatButtonNotifier =  document.getElementById("chat-panel");
socket.on("createMessage", (message, userName, user_name) => {
  messages.innerHTML =
    messages.innerHTML +
    `<div class="message">
        <b><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512" class="fa-user-circle"><path fill="currentColor" d="M248 104c-53 0-96 43-96 96s43 96 96 96 96-43 96-96-43-96-96-96zm0 144c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm0-240C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 448c-49.7 0-95.1-18.3-130.1-48.4 14.9-23 40.4-38.6 69.6-39.5 20.8 6.4 40.6 9.6 60.5 9.6s39.7-3.1 60.5-9.6c29.2 1 54.7 16.5 69.6 39.5-35 30.1-80.4 48.4-130.1 48.4zm162.7-84.1c-24.4-31.4-62.1-51.9-105.1-51.9-10.2 0-26 9.6-57.6 9.6-31.5 0-47.4-9.6-57.6-9.6-42.9 0-80.6 20.5-105.1 51.9C61.9 339.2 48 299.2 48 256c0-110.3 89.7-200 200-200s200 89.7 200 200c0 43.2-13.9 83.2-37.3 115.9z"></path></svg><span>${user_name}</span> </b>
        <span>${message}</span>
    </div>`;

    messages.scrollTop = messages.scrollHeight;

    if( chatPanelBox.classList.contains('active') ) {
      //nothing happen
    } else {
      chatButtonNotifier.className += "new-message";
    }
});