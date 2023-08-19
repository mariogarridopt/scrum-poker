const USER_ID = getMyUserId();

var visibleMode = false;

const SCORE_LIST = ['0' , '0.5' , '1', '2', '3', '5', '8', '13', '20', '40', '100', '∞', '☕'];

const ROOM_CODE = getRoomCode();
const API_ENDPOINT = "https://2z191infs6.execute-api.eu-west-2.amazonaws.com/prod/" + ROOM_CODE;


const ICON_UNREAD = '⬜';
const ICON_READ = '✅';

function getMyUserId() {
    const localId = localStorage.getItem('user_id');

    if(localId != null) {
        return localId;
    }

    const newId = (((1+Math.random())*0x10000)|0).toString(16).substring(1);

    localStorage.setItem('user_id', newId);

    return newId;
}

function getRoomCode() {
    const query_params = new URLSearchParams(window.location.search);

    if(query_params.has('room')) {
        const roomCode = query_params.get('room');
        localStorage.setItem('room_code', roomCode);
        return roomCode;
    }

    const oldCode = localStorage.getItem('room_code');
    if(oldCode != null) {
        return oldCode;
    }

    const newCode = (Math.random() + 1).toString(36).substring(7).toUpperCase();
    localStorage.setItem('room_code', newCode);

    return newCode;
}

function getMyName() {
    const localName = localStorage.getItem('user_name');

    if(localName != null) {
        return localName;
    }

    return 'Anonymous';
}

function isMainUser(user){
    return user.id == USER_ID;
}

function activeClassToggle(elem) {
    const cards = document.querySelectorAll('#card-deck .card');
    for (let i = 0; i < cards.length; i++) {
        cards[i].classList.remove('active');
    }

    elem.classList.add('active');
}

function redrawTableScores() {
    const cards = document.querySelectorAll('#results-table .card');

    for (let i = 0; i < cards.length; i++) {
        const score = cards[i].getAttribute('data-score');
        if(visibleMode) {
            cards[i].innerHTML = score;
        }else {
            cards[i].innerHTML = (score == '-') ? ICON_UNREAD : ICON_READ;
        }
    }

    updateAverage();
}

function drawUser(user){
    const tr = document.createElement('tr');
    if(isMainUser(user)) {
        tr.id = 'current-user';
        tr.addEventListener('click', function() {
            pickName(true);
            const td = tr.getElementsByTagName('td')[0];
            td.innerHTML = user.name;
        });
    }

    const td1 = document.createElement('td');
    td1.innerHTML = user.name;
    tr.appendChild(td1);

    const td2 = document.createElement('td');
    td2.classList.add('card');
    td2.setAttribute('data-score', user.score);
    if(visibleMode) {
        td2.innerHTML = user.score;
    } else {
        td2.innerHTML = (user.score == '-') ? ICON_UNREAD : ICON_READ;
    }
    tr.appendChild(td2);

    document.getElementById('results-table').appendChild(tr);
}

function drawAllUsers(userList) {
    // clear all users
    document.getElementById('results-table').innerHTML = "";

    // draw header
    const tr = document.createElement('tr');
    tr.classList.add('bottom-border');
    const th1 = document.createElement('th');
    th1.innerHTML = 'Name';
    tr.appendChild(th1);
    const th2 = document.createElement('th');
    th2.innerHTML = 'Story Points';
    tr.appendChild(th2);
    document.getElementById('results-table').appendChild(tr);

    // draw users
    for (let i = 0; i < userList.length; i++) {
        drawUser(userList[i]);
    }

    redrawTableScores();
}


function pickName(force = false) {
    var name = getMyName();

    if(name == 'Anonymous' || force) {
        const promptedName = prompt("What display name would you like to use?");
        
        if(promptedName != null && promptedName != "") {
            name = promptedName;
        }

        localStorage.setItem('user_name', name);
    }
}

function updateAverage() {
    if(visibleMode) {
        const cards = document.querySelectorAll('#results-table .card');
        
        let sum = 0;
        let participants = 0;
        for (let i = 0; i < cards.length; i++) {
            const score = cards[i].innerHTML = cards[i].getAttribute('data-score');
            if(!isNaN(score)) {
                sum += Number(score);
                participants++;
            }
        }

        const average = sum / participants;

        let closest = 1000;
        let closestNumber = 0;
        for (let i = 0; i < SCORE_LIST.length; i++) {
            if(!isNaN(SCORE_LIST[i])) {
                const number = Number(SCORE_LIST[i]);
                const difference = Math.abs(number - average)
                if(difference < closest) {
                    closest = difference;
                    closestNumber = number;
                }
            }
        }
        
        document.getElementById('average-score').innerHTML = closestNumber;
    } else {
        document.getElementById('average-score').innerHTML = '-';
    }
}

function showUrl() {
    const currentUrl = window.location.href;
    document.getElementById('current-url').innerHTML = currentUrl;

    document.getElementById('current-url').addEventListener('click', function() {
        window.prompt("Copy to clipboard: Ctrl+C, Enter", currentUrl);
    }
    );
}

function parseTitle(url) {
    const words = url.split("-")

    for (let i = 0; i < words.length; i++) {
        words[i] = words[i][0].toUpperCase() + words[i].substr(1);
    }

    return words.join(" ");
}

function setTitle() {
    const params = new URLSearchParams(window.location.search);
    if(params.has('room')) {
        document.getElementById('room-name').innerHTML = 
            parseTitle(params.get('room')) + " " +
            document.getElementById('room-name').innerHTML;
    }
}

function toggleVisibleMode(){
    const newVis = !visibleMode;

    const button = document.getElementById('show-estimates');
    button.innerHTML = newVis ? 'Hide Estimates' : 'Show Estimates';

    visibleMode = newVis;
    redrawTableScores();

    APIsetVisiable(newVis);
}

function forceURLWithRoomCode() {
    const params = new URLSearchParams(window.location.search);
    const room_code = getRoomCode();
    if(!params.has('room')) {
        window.location.replace("?room=" + room_code);
    }
}

// API METHODS
function APIsubmitUser(user) {
    fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
    }).then(response => {
        APIgetAllScores();
    });
}

function APIsetVisiable(visible) {
    fetch(API_ENDPOINT, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: '{"visible": ' + (visible ? 1 : 0) + '}'
    }).then(response => {
        visibleMode = visible;
        redrawTableScores();
    });
}

function APIgetAllScores() {
    fetch(API_ENDPOINT, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        var iExist = false;

        for (let i = 0; i < data.users.length; i++) {
            if(data.users[i].id == USER_ID) {
                iExist = true;
                break;
            }
        }

        if(iExist == false) {
            const user = {
                id: USER_ID,
                name: getMyName(),
                score: '-'
            };

            APIsubmitUser(user);
            data.users.push(user);
        }

        drawAllUsers(data.users);
    })
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
        drawAllUsers([{
            id: USER_ID,
            name: getMyName(),
            score: '-'
        }]);
    });
}

function APIClearScores() {
   fetch(API_ENDPOINT, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        const cards = document.querySelectorAll('#results-table .card');
        for (let i = 0; i < cards.length; i++) {
            cards[i].setAttribute('data-score', '-');
        }

        APIsetVisiable(false);
    });
}

// START APP
forceURLWithRoomCode();
pickName();
showUrl();

window.addEventListener('load', function () {
    setTitle();

    const baseElement = document.getElementById('base-card');

    for (let i = 0; i < SCORE_LIST.length; i++) {
        const text = SCORE_LIST[i];
        const newElement = baseElement.cloneNode(true);
        newElement.querySelector('.card-number').innerHTML = text;
        newElement.setAttribute('data-score', text);
            
        document.getElementById('card-deck').appendChild(newElement);
    }

    const cards = document.querySelectorAll('#card-deck .card');
    for (let i = 0; i < cards.length; i++) {
        cards[i].addEventListener('click', function() {
            const score = cards[i].getAttribute('data-score');

            // change color
            activeClassToggle(cards[i]);
            
            // change interface
            const userElement = document.querySelectorAll('#current-user .card')[0];
            console.log(userElement);
            userElement.dataset.score = score;
            redrawTableScores();
            
            // inform api
            APIsubmitUser({
                id: USER_ID,
                name: getMyName(),
                score: cards[i].getAttribute('data-score')
            });
        });
    }

    document.getElementById('show-estimates').addEventListener('click', toggleVisibleMode);
    
    APIgetAllScores();
});

