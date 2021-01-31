
//const socket = io()
//referring to https://stackoverflow.com/questions/41924713/node-js-socket-io-page-refresh-multiple-connections
//to deal with user fast refreshes page
const socket = io({ transports: ['websocket'], upgrade: false });
const chatContainer = document.querySelector('.chat')
const friendStateElement = document.getElementById('friend-state')
const loveHeader = document.getElementById('love-header')
const welcomeMsgElement = document.getElementById("welcome-msg")
const systemInfoElement = document.getElementById("system-info")
const chat = document.getElementById('send-form')
const notificationBtn = document.getElementById('notificationBtn');
let forcedToDisconnect = false;

//new login
let name = prompt('Your name: ')
while (name == null || name.length == 0) {
    name = prompt('Your name: ')
}
let password = prompt('Your password: ')
while (password == null || password.length == 0) {
    password = prompt('Your password: ')
}
socket.emit('new-user-authentication', { name: name, password: password })

function appendMessage(message, isMe, isLast) {
    const messageElement = document.createElement('div');
    messageElement.innerText = message;
    if (isMe) {
        const mine_messagesDiv = document.createElement('div');
        mine_messagesDiv.classList.add(...['mine', 'messages'])
        if (isLast) {
            const messageLastDiv = document.createElement('div');
            messageLastDiv.innerText = message;
            messageLastDiv.classList.add(...['message', 'last'])
            mine_messagesDiv.appendChild(messageLastDiv);
        } else {
            const messageDiv = document.createElement('div');
            messageDiv.innerText = message;
            messageDiv.classList.add('message')
            mine_messagesDiv.appendChild(messageDiv);
        }
        chatContainer.insertBefore(mine_messagesDiv, chatContainer.firstChild)
    } else {
        const yours_messagesDiv = document.createElement('div');
        yours_messagesDiv.classList.add(...['yours', 'messages'])
        if (isLast) {
            const messageLastDiv = document.createElement('div');
            messageLastDiv.innerText = message;
            messageLastDiv.classList.add(...['message', 'last'])
            yours_messagesDiv.appendChild(messageLastDiv);
        } else {
            const messageDiv = document.createElement('div');
            messageDiv.innerText = message;
            messageDiv.classList.add('message')
            yours_messagesDiv.appendChild(messageDiv);
        }
        chatContainer.insertBefore(yours_messagesDiv, chatContainer.firstChild)
    }
}

function undateFriendOnlineState(title, isOnline, lastLogoutTime) {
    if (isOnline) {
        friendStateElement.innerText = `${title} is online`
    } else {
        if (lastLogoutTime == null) {
            friendStateElement.innerText = `${title} is offline`
        } else {
            const timeStr = extractShortTimeStrFromUTC(lastLogoutTime);
            friendStateElement.innerText = `${title} is offline since ${timeStr}`
        }
    }
}

function convertUTCDateToLocalDate(utcdate) {
    if (utcdate == undefined) {
        return "unknown time";
    }
    date = new Date(utcdate.toString())
    return date.toString();
}

function extractShortTimeStrFromUTC(utcdate) {
    const str = convertUTCDateToLocalDate(utcdate);
    const index = str.indexOf('GMT')
    return str.substring(0, index)
}

//submit message
chat.addEventListener('submit', e => {
    e.preventDefault()
    const chatInput = document.getElementById('send-input')
    const message = chatInput.value
    if (message === '') {
        return;
    }
    socket.emit('send-chat-message', message)
    chatInput.value = ''
})

notificationBtn.addEventListener('click', () => {
    function handlePermission(permission) {
        // set the button to shown or hidden, depending on what the user answers
        if (Notification.permission === 'denied' || Notification.permission === 'default') {
            notificationBtn.style.display = 'block';
        } else {
            notificationBtn.style.display = 'none';
        }
    }

    function checkNotificationPromise() {
        try {
            Notification.requestPermission().then();
        } catch (e) {
            return false;
        }
        return true;
    }

    if (!('Notification' in window)) {
        console.log("This browser does not support notifications.");
    } else {
        if (checkNotificationPromise()) {
            Notification.requestPermission()
                .then((permission) => {
                    handlePermission(permission);
                })
        } else {
            Notification.requestPermission(function (permission) {
                handlePermission(permission);
            });
        }
    }
});

socket.on('display-your-own-message', (data) => {
    const timeStr = extractShortTimeStrFromUTC(data.time);
    const msg = `${data.title}: ${data.text} \n ${timeStr}`
    appendMessage(msg, true, true)
    var objDiv = document.querySelector(".chat");
    objDiv.scrollTop = objDiv.scrollHeight;
})

socket.on('welcome-back', (data) => {
    forcedToDisconnect = false;
    if (data.toDisableNoteSetting) {
        notificationBtn.style.display = 'none';
    } else {
        notificationBtn.style.display = 'block';
    }
    document.body.style.background = "url('header_opt.jpg')";
    //loveHeader.innerText = 'We love \n for always and forever';
    loveHeader.innerText = 'Our own chat application';
    const welcomeMsgElement = document.getElementById("welcome-msg");
    welcomeMsgElement.innerText = `Welcome back, ${data.title}`
    //chat.innerHTML = '<input type="text" id="send-input"><button type="submit" id="send-submit" >Send</button>'

    chat.innerHTML = '<textarea type="Text" id="send-input" cols="40" rows="5"></textarea><button type="submit" id="send-submit" >Send</button>'
    const typer = document.getElementById('send-input');

    typer.addEventListener('keydown', handleKeyDown);
    typer.addEventListener('keyup', handleKeyUp);
})

socket.on('priorMessages', data => {
    for (let i = 0; i < data.titles.length; i++) {
        //titles, texts, times
        const timeStr = extractShortTimeStrFromUTC(data.times[i])
        const msg = `${data.titles[i]}: ${data.texts[i]} \n ${timeStr}`
        appendMessage(msg, data.isme[i], false)
    }
    var objDiv = document.querySelector(".chat");
    objDiv.scrollTop = objDiv.scrollHeight;
})

socket.on('inform-friend-info', data => {
    if (data.isFriendOnline) {
        undateFriendOnlineState(data.title, true, null)
    } else {
        undateFriendOnlineState(data.title, false, data.lastLogoutTime)
    }
})

socket.on('friend-state-change', data => {
    if (data.isFriendOnline) {
        undateFriendOnlineState(data.title, true, null)
    } else {
        undateFriendOnlineState(data.title, false, data.lastLogoutTime)
    }
})

socket.on('incomingMessage', data => {
    const timeStr = extractShortTimeStrFromUTC(data.time);
    const msg = `${data.title}: ${data.text} \n ${timeStr}`
    appendMessage(msg, false, true)

    console.log(document.hidden)
    console.log(data.displayNote)
    if (document.hidden && data.displayNote) {
        //var img = '/to-do-notifications/img/icon-128.png';
        var text = msg;
        //var notification = new Notification('To do list', { body: text, icon: img });
        var notification = new Notification('Our Home', { body: text });
    }
    var objDiv = document.querySelector(".chat");
    objDiv.scrollTop = objDiv.scrollHeight;
})

socket.on('user-login-failed', () => {
    name = prompt("Wrong username or password. Type username again: ")
    password = prompt('Your password: ')
    socket.emit('new-user-authentication', { name: name, password: password })
})

socket.on('force-disconnect', () => {
    forcedToDisconnect = true;
    socket.close();
    console.log('you are forced to be disconnected')
})

socket.on('duplicate-disconnected', () => {
    systemInfoElement.innerText = 'Your another client is forced to logout.'
})

socket.on('typing-return', title => {
    friendStateElement.innerHTML = `${title} is typing...`;
})

socket.on('typing-done-return', title => {
    friendStateElement.innerHTML = `${title} is online`;
})

socket.on('disconnect', () => {
    if (!forcedToDisconnect) {
        //socket.connect();
        console.log('naturally disconnected, reconnecting...')
        socket.emit('new-user-authentication', { name: name, password: password })
    }

    chatContainer.textContent = ''
    welcomeMsgElement.innerText = 'You are offline. Reload this page to login'
    friendStateElement.innerText = ``
    systemInfoElement.innerText = ``
    loveHeader.innerText = ''
    document.body.style.background = "url('')";
    chat.innerText = ''
})

let timer, timeoutVal = 1000; // time it takes to wait for user to stop typing in ms
let counter = 0;


// when user is pressing down on keys, clear the timeout
function handleKeyDown(e) {
    counter = counter + 1;
    if (counter === 1) {
        socket.emit('typing', name)
    }
    window.clearTimeout(timer);
}

// when the user has stopped pressing on keys, set the timeout
// if the user presses on keys before the timeout is reached, then this timeout is canceled
function handleKeyUp(e) {
    window.clearTimeout(timer); // prevent errant multiple timeouts from being generated
    timer = window.setTimeout(() => {
        counter = 0;
        socket.emit('typing-done', name)
    }, timeoutVal);
}
