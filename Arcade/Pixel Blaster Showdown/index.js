// --- Element Selectors ---
const container = document.querySelector(".container");
const startBtn = document.querySelector(".startBtn");
const cursor = document.querySelector(".cursor");
const burst = document.querySelector(".burst");
const timerEl = document.getElementById('timer');
const customAlertContainer = document.getElementById('custom-alert-container');
const customAlertMessage = document.getElementById('custom-alert-message');
const customAlertBtn = document.getElementById('custom-alert-btn');

// --- Game State Variables ---
let score = 0;
let gameDuration = 30; // Game will last 30 seconds
let balloonInterval = null;
let gameTimerInterval = null;

// --- Create Game Elements ---
const balloon = document.createElement("img");
balloon.setAttribute("class", "balloon");
balloon.setAttribute("src", "balloon1.png");

// --- Event Listeners ---

// Start Button
startBtn.addEventListener("click", startGame);

// Play Again Button
customAlertBtn.addEventListener('click', () => {
    document.location.reload();
});

// --- NEW: Custom Cursor Movement inside container ---
cursor.style.display = 'none'; // Start hidden
container.addEventListener("mousemove", (e) => {
    cursor.style.top = e.offsetY + "px";
    cursor.style.left = e.offsetX + "px";
});
container.addEventListener("mouseenter", () => {
    cursor.style.display = 'block';
});
container.addEventListener("mouseleave", () => {
    cursor.style.display = 'none';
});
// --- END NEW ---

// Game Area Clicks (for bursting balloon)
container.addEventListener("click", (e) => {
    // Show burst effect at click position
    burst.style.top = e.pageY + "px"; // Keep pageY/pageX for burst for now, as it overlays
    burst.style.left = e.pageX + "px";
    
    // Check if the click target was the balloon
    if (e.target === balloon) {
        score++;
        startBtn.innerText = "SCORE: " + score; // Update score display
    }
});


// --- Game Functions ---

function startGame() {
    // Hide start button and show score
    startBtn.style.pointerEvents = 'none'; // Make it unclickable
    startBtn.innerText = "SCORE: " + score;

    // Add balloon to the game area
    container.appendChild(balloon);

    // Start moving the balloon
    const contHeight = container.offsetHeight;
    const contWidth = container.offsetWidth;
    balloonInterval = setInterval(() => {
        const randTop = Math.random() * (contHeight - 100); // Subtract size of balloon
        const randLeft = Math.random() * (contWidth - 100); // Subtract size of balloon
        balloon.style.top = randTop + "px";
        balloon.style.left = randLeft + "px";
    }, 1000);

    // Start the game timer
    let secondsLeft = gameDuration;
    updateTimerDisplay(secondsLeft);
    gameTimerInterval = setInterval(() => {
        secondsLeft--;
        updateTimerDisplay(secondsLeft);
        if (secondsLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function endGame() {
    // Stop game loops
    clearInterval(balloonInterval);
    clearInterval(gameTimerInterval);

    // Remove the balloon from the game
    if(container.contains(balloon)) {
        container.removeChild(balloon);
    }
    
    // Show final score in popup
    showAlert("Game Over!\nYour Score: " + score);
}

function updateTimerDisplay(seconds) {
    const formattedTime = "00:" + (seconds < 10 ? '0' : '') + seconds;
    timerEl.innerHTML = formattedTime;
}

function showAlert(message) {
    customAlertMessage.textContent = message;
    customAlertContainer.style.display = 'flex';
}