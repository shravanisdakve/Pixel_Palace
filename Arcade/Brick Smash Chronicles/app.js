//Create variables to reference and store canvas
let canvas = document.getElementById('mycanvas');
let ctx = canvas.getContext('2d');

// --- NEW: Sound & High Score variables ---
const soundManager = new SoundManager();
const popupContainer = document.getElementById('popup-container');
const popupMessage = document.getElementById('popup-message');
const playAgainBtn = document.getElementById('play-again-btn');

let highScore = localStorage.getItem('brickSmashHighScore') || 0;
// --- END NEW ---

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

//Creating arrays for the bricks
let bricks = [];
for (c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (r = 0; r < brickRowCount; r++) {
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
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2); //centered at (x,y) position with radius r = ballRadius starting at 0 = startAngle, ending at Math.PI*2 = endAngle (in Radians)
    ctx.fillStyle = '#FF4136';
    ctx.fill();
    ctx.closePath();
}
//Create a function to create the paddle
function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight); //centered at (x,y) position with radius r = ballRadius starting at 0 = startAngle, ending at Math.PI*2 = endAngle (in Radians)
    ctx.fillStyle = '#007BFF';
    ctx.fill();
    ctx.closePath();
}
//Create a function to draw the bricks
function drawBricks() {
    for (c = 0; c < brickColumnCount; c++) {
        for (r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                // We can have different brick colors, but for now let's use one
                ctx.fillStyle = '#FF851B';
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}
//Create function to keep track of score
function drawScore() {
    ctx.font = '18px "Press Start 2P", cursive';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Score: ' + score, 8, 24);
    ctx.fillText('High: ' + highScore, canvas.width - 130, 24); // Display High Score
}

//Collision dections for the bricks
function collisionDetection() {
    for (c = 0; c < brickColumnCount; c++) {
        for (r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            if (b.status === 1) {
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy;
                    b.status = 0;
                    score++;
                    soundManager.playBrickHit(); // Play sound
                    if (score === brickRowCount * brickColumnCount) {
                        updateHighScore();
                        soundManager.playWin();
                        showPopup('YOU WIN! Score: ' + score);
                    }
                }
            }
        }
    }
}

function checkHighScore() {
    // Legacy simple storage (for compatibility/backup)
    if (score > brickSmashHighScore) {
        brickSmashHighScore = score;
        localStorage.setItem("brickSmashHighScore", brickSmashHighScore);
    }

    // NEW: Central Leaderboard System
    // Need to check if available
    if (window.ScoreManager) {
        if (window.ScoreManager.isHighScore('brick-smash', score)) {
            // Prompt for name on new high score
            setTimeout(() => {
                let playerName = prompt("New High Score! Enter your name:", "Player 1");
                if (!playerName) playerName = "Anonymous";
                window.ScoreManager.saveScore('brick-smash', score, playerName);
            }, 100);
        } else {
            // Always save attempt if score > 0 just in case list isn't full?
            // Actually logic says only if isHighScore. 
            // Logic: isHighScore returns true if top 10 not full OR score beats #10
            window.ScoreManager.saveScore('brick-smash', score, "Player");
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
    //Calculate collision detections
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
            soundManager.playPaddleHit(); // Play sound
        }
        //if no paddle hit, body of canvas is hit ==> game over
        else {
            updateHighScore();
            soundManager.playGameOver();
            showPopup('GAME OVER');
        }
    }
    //bottom wall
    if (y + dy > canvas.height - ballRadius || y + dy < ballRadius) {
        dy = -dy;
    }
    //Make paddle move
    if (rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += 7;
    }
    else if (leftPressed && paddleX > 0) {
        paddleX -= 7;
    }
    //Making the ball move
    x += dx; //update x movement every frame
    y += dy; //update y movement every frame
}

// --- NEW: Popup logic ---
function showPopup(message) {
    clearInterval(interval); // Stop the game
    popupMessage.textContent = message;
    popupContainer.style.display = 'flex';
}

playAgainBtn.addEventListener('click', () => {
    document.location.reload();
});
// --- END NEW ---


//Create an infinite loop that creates the ball
//paints the ball on the canvas every 10 milliseconds.
let interval = setInterval(draw, 10);


//Notes
//Using HTML Canvas
//Understanding HTML Coordinates 
//Web APIs - https://developer.mozilla.org/en-US/docs/Web/API
// Drawing shapes with Canvas: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial
//MDN BrickerBreaker Tutorial  https://developer.mozilla.org/en-US/docs/Games/Tutorials/2D_Breakout_game_pure_JavaScript