//Create variables to reference and store canvas
let canvas = document.getElementById('mycanvas');
let ctx = canvas.getContext('2d');

// --- Sound & Popup references ---
const soundManager = new SoundManager();
const popupContainer = document.getElementById('popup-container');
const popupMessage = document.getElementById('popup-message');
const playAgainBtn = document.getElementById('play-again-btn');

// --- Pixel Palace session tracking ---
let currentSessionId = null;
let gameEnded = false;
let lastEndSessionResult = null;

// --- Legacy high score migration ---
let highScore = 0;
let legacyValue = null;
try {
    legacyValue = localStorage.getItem('brickSmashHighScore');
} catch (e) {}
if (legacyValue !== null) {
    highScore = Number(legacyValue) || 0;
    // Migrate legacy value into PixelPalace if valid
    if (highScore > 0 && typeof window.PixelPalace !== 'undefined') {
        window.PixelPalace.evaluatePersonalBest('brick-smash', highScore);
    }
}
// Also check PixelPalace for a higher personal best
if (typeof window.PixelPalace !== 'undefined') {
    var pb = window.PixelPalace.getPersonalBest('brick-smash');
    if (pb && pb.score > highScore) {
        highScore = pb.score;
    }
}

let ballRadius = 10;
let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 2;
let dy = -2;
//create the paddle
let paddleHeight = 12;
let paddleWidth = 72;
//specify starting point of paddle
let paddleX = (canvas.width - paddleWidth) / 2;
//holding variables for right and left arrows on keyboard
let rightPressed = false;
let leftPressed = false;
//holding variables for bricks
let brickRowCount = 4;
let brickColumnCount = 7;
let brickWidth = 72;
let brickHeight = 24;
let brickPadding = 12;
let brickOffsetTop = 32;
let brickOffsetLeft = 32;
//Create variables to take score
let score = 0;

// Initialize sound on first user interaction
document.body.addEventListener('keydown', () => soundManager.init(), { once: true });
document.body.addEventListener('click', () => soundManager.init(), { once: true });

// Start Pixel Palace session
function startGameSession() {
    if (typeof window.PixelPalace !== 'undefined') {
        var result = window.PixelPalace.startSession('brick-smash');
        if (result.ok) {
            currentSessionId = result.session.id;
        }
    }
}

// End Pixel Palace session with final score
function endGameSession(finalScore) {
    if (gameEnded) return; // Prevent duplicate submission
    gameEnded = true;

    if (typeof window.PixelPalace !== 'undefined' && currentSessionId) {
        var result = window.PixelPalace.endSession(currentSessionId, { score: finalScore });
        if (result.ok) {
            lastEndSessionResult = result;
            if (result.personalBest) {
                highScore = result.personalBest.isNewBest ? finalScore : highScore;
            }
        }
    }

    // Also update legacy key for backwards compatibility
    try {
        if (finalScore > Number(localStorage.getItem('brickSmashHighScore') || 0)) {
            localStorage.setItem('brickSmashHighScore', finalScore);
            highScore = finalScore;
        }
    } catch (e) {}
}

// Start the session when the page loads (game starts immediately)
startGameSession();

//Creating arrays for the bricks
let bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
        //set the x and y position of the bricks
        bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
}

document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);
canvas.addEventListener("mousemove", mouseMoveHandler, false);

//Anchor paddle movement to mouse movement
function mouseMoveHandler(e) {
    var rect = canvas.getBoundingClientRect();
    var relativeX = e.clientX - rect.left;
    paddleX = relativeX - paddleWidth / 2;
    // Clamp the paddle to the canvas boundaries
    if (paddleX < 0) {
        paddleX = 0;
    }
    if (paddleX + paddleWidth > canvas.width) {
        paddleX = canvas.width - paddleWidth;
    }
}

function keyDownHandler(e) {
    if (e.keyCode === 39) {
        rightPressed = true;
    }
    else if (e.keyCode === 37) {
        leftPressed = true;
    }
}
function keyUpHandler(e) {
    if (e.keyCode === 39) {
        rightPressed = false;
    }
    else if (e.keyCode === 37) {
        leftPressed = false;
    }
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#FF4136';
    ctx.fill();
    ctx.closePath();
}
//Create a function to create the paddle
function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = '#007BFF';
    ctx.fill();
    ctx.closePath();
}
//Create a function to draw the bricks
function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = '#FF851B';
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}
//Create function to keep track of score and personal best
function drawScore() {
    ctx.font = '18px "Press Start 2P", cursive';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Score: ' + score, 8, 24);
    ctx.fillText('High: ' + highScore, canvas.width - 130, 24);
}

//Collision detection for the bricks
function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            if (b.status === 1) {
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy;
                    b.status = 0;
                    score++;
                    soundManager.playBrickHit();
                    if (score === brickRowCount * brickColumnCount) {
                        endGameSession(score);
                        soundManager.playWin();
                        showPopup('YOU WIN! Score: ' + score);
                    }
                }
            }
        }
    }
}

function draw() {
    //clear each instance of the canvas so a new circle can be drawn
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawScore();
    drawBricks();
    drawBall();
    drawPaddle();
    collisionDetection();
    //left and right walls
    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }
    //top walls
    if (y + dy < ballRadius) {
        dy = -dy;
    }
    else if (y + dy > canvas.height - ballRadius) {
        //detect paddle hits
        if (x > paddleX && x < paddleX + paddleWidth) {
            dy = -dy;
            soundManager.playPaddleHit();
        }
        //if no paddle hit, body of canvas is hit ==> game over
        else {
            endGameSession(score);
            soundManager.playGameOver();
            showPopup('GAME OVER');
        }
    }
    //Make paddle move
    if (rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += 7;
    }
    else if (leftPressed && paddleX > 0) {
        paddleX -= 7;
    }
    //Making the ball move
    x += dx;
    y += dy;
}

// --- Popup logic ---
function showPopup(message) {
    clearInterval(interval);

    // Try to show progression feedback overlay
    if (typeof window.PixelPalaceProgressionFeedback !== 'undefined' && lastEndSessionResult) {
        var normalized = window.PixelPalaceProgressionFeedback.normalizeResult(lastEndSessionResult);
        if (normalized) {
            window.PixelPalaceProgressionFeedback.show(normalized, function () {
                document.location.reload();
            });
            return;
        }
    }

    // Fallback to basic popup
    popupMessage.textContent = message;
    popupContainer.style.display = 'flex';
}

playAgainBtn.addEventListener('click', () => {
    document.location.reload();
});

//Create an infinite loop that creates the ball
//paints the ball on the canvas every 10 milliseconds.
let interval = setInterval(draw, 10);
