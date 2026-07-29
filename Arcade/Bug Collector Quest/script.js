const screens = document.querySelectorAll('.screen');
const choose_insect_btns = document.querySelectorAll('.choose-insect-btn');
const start_btn = document.getElementById('start-btn')
const game_container = document.getElementById('game-container')
const timeEl = document.getElementById('time')
const scoreEl = document.getElementById('score')
const message = document.getElementById('message')

// --- NEW: Custom Alert Popup Elements ---
const customAlertContainer = document.getElementById('custom-alert-container');
const customAlertMessage = document.getElementById('custom-alert-message');
const customAlertBtn = document.getElementById('custom-alert-btn');

let score = 0;
let selected_insect = {};
let seconds = 30; // Game duration
let timeInterval = null;
let isGameOver = false;


start_btn.addEventListener('click', () => screens[0].classList.add('up'))

choose_insect_btns.forEach(btn => {
    btn.addEventListener('click', () => {
        const img = btn.querySelector('img')
        const src = img.getAttribute('src')
        const alt = img.getAttribute('alt')
        selected_insect = { src, alt }
        screens[1].classList.add('up')
        setTimeout(createInsect, 1000)
        startGame()
    })
})

// --- NEW: Event listener for the custom alert button ---
customAlertBtn.addEventListener('click', () => {
    document.location.reload();
});

function startGame() {
    isGameOver = false;
    timeInterval = setInterval(decreaseTime, 1000)
}

function decreaseTime() {
    let m = Math.floor(seconds / 60)
    let s = seconds % 60
    m = m < 10 ? `0${m}` : m
    s = s < 10 ? `0${s}` : s
    timeEl.innerHTML = `Time: ${m}:${s}`
    
    if (seconds <= 0) {
        endGame();
    } else {
        seconds--
    }
}

function endGame() {
    isGameOver = true;
    clearInterval(timeInterval);
    showAlert(`Game Over!\nYour Score: ${score}`);
}

function createInsect() {
    if (isGameOver) return; // Stop creating insects when game is over

    const insect = document.createElement('div')
    insect.classList.add('insect')
    const { x, y } = getRandomLocation()
    insect.style.top = `${y}px`
    insect.style.left = `${x}px`
    insect.innerHTML = `<img src="${selected_insect.src}" alt="${selected_insect.alt}" style="transform: rotate(${Math.random() * 360}deg)" />`

    insect.addEventListener('click', catchInsect)

    game_container.appendChild(insect)
}

function getRandomLocation() {
    // MODIFIED: Use the window's inner dimensions for responsive spawning
    const width = window.innerWidth
    const height = window.innerHeight
    const x = Math.random() * (width - 200) + 100
    const y = Math.random() * (height - 200) + 100
    return { x, y }
}

function catchInsect() {
    if (isGameOver) return;

    increaseScore()
    this.classList.add('caught')
    setTimeout(() => this.remove(), 2000)
    addInsects()
}

function addInsects() {
    if (isGameOver) return;
    
    setTimeout(createInsect, 1000)
    setTimeout(createInsect, 1500)
}

function increaseScore() {
    score++
    if(score > 19) {
        message.classList.add('visible')
    }
    scoreEl.innerHTML = `Score: ${score}`
}

function showAlert(message) {
    customAlertMessage.textContent = message;
    customAlertContainer.style.display = 'flex';
}
