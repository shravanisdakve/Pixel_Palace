//we are making some changes
window.requestAnimFrame = (function () {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
      return window.setTimeout(callback, 1000 / 60);
    }
  );
})();

window.cancelRequestAnimFrame = (function () {
  return (
    window.cancelAnimationFrame ||
    window.webkitCancelRequestAnimationFrame ||
    window.mozCancelRequestAnimationFrame ||
    window.oCancelRequestAnimationFrame ||
    window.msCancelRequestAnimationFrame ||
    clearTimeout
  );
})();

// Initialize canvas and required variables
var canvas = document.getElementById("canvas"),
  ctx = canvas.getContext("2d"), // Create canvas context
  W = 800, // Window's width
  H = 600, // Window's height
  particles = [], // Array containing particles
  ball = {}, // Ball object
  paddles = [], // Array containing two paddles
  mouse = {}, // Mouse object to store it's current position
  points = 0, // Varialbe to store points
  fps = 60, // Max FPS (frames per second)
  particlesCount = 20, // Number of sparks when ball strikes the paddle
  flag = 0, // Flag variable which is changed on collision
  particlePos = {}, // Object to contain the position of collision
  multipler = 1, // Varialbe to control the direction of sparks
  startBtn = {}, // Start button object
  restartBtn = {}, // Restart button object
  over = 0, // flag varialbe, cahnged when the game is over
  init, // variable to initialize animation
  paddleHit,
  level = 1;

// --- NEW: Custom Alert Popup Elements ---
const customAlertContainer = document.getElementById('custom-alert-container');
const customAlertMessage = document.getElementById('custom-alert-message');
const customAlertBtn = document.getElementById('custom-alert-btn');
// --- END NEW ---

// Add mousemove and mousedown events to the canvas
canvas.addEventListener("mousemove", trackPosition, true);
canvas.addEventListener("mousedown", btnClick, true);

// Set the canvas's height and width to full screen
canvas.width = W;
canvas.height = H;

// Function to paint canvas
function MainScreen_canvas() {
  ctx.fillStyle = "#f5f5f5"; // Lighter background for better contrast
  ctx.fillRect(0, 0, W, H);
}

// ... (skipping unchanged lines)

function updateScore() {
  ctx.fillStyle = '#000000'; // Pure black for max contrast
  ctx.font = "bold 18px Roboto, sans-serif"; // Bold and slightly larger
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Your Score : " + points, 20, 20);
  ctx.fillText("Your Level : " + level, 20, 45); // Adjusted spacing
}

// Function for creating paddles
function Paddle(pos) {
  this.h = 5;
  this.w = 150;
  this.x = W / 2 - this.w / 2;
  this.y = pos == "top" ? 0 : H - this.h;
}

paddles.push(new Paddle("bottom"));
paddles.push(new Paddle("top"));

// Ball object
ball = {
  x: W / 2,
  y: H / 2 + 300,
  r: 5,
  c: '#FF4136',
  vx: 4,
  vy: 8,
  draw: function () {
    ctx.beginPath();
    ctx.fillStyle = this.c;
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2, true);
    ctx.fill();
  },
};

// Start Button object
startBtn = {
  w: 100,
  h: 50,
  x: W / 2 - 50,
  y: H / 2 - 25,
  draw: function () {
    ctx.font = "24px 'Press Start 2P'";
    const text = "Start";
    const textWidth = ctx.measureText(text).width;

    // Dynamically adjust width and position
    this.w = textWidth + 40;
    this.x = W / 2 - this.w / 2;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(this.x, this.y, this.w, this.h);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = '#333333';
    ctx.fillText(text, W / 2, H / 2);

    ctx.strokeStyle = '#007BFF';
    ctx.lineWidth = "2";
    ctx.strokeRect(this.x, this.y, this.w, this.h);
  },
};

// Restart Button object
restartBtn = {
  w: 100,
  h: 50,
  x: W / 2 - 50,
  y: H / 2 - 50,
  draw: function () {
    ctx.font = "18px 'Press Start 2P'";
    const text = "Play Again";
    const textWidth = ctx.measureText(text).width;

    // Dynamically adjust width and position
    this.w = textWidth + 40;
    this.x = W / 2 - this.w / 2;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(this.x, this.y, this.w, this.h);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = '#333333';
    ctx.fillText(text, W / 2, H / 2 - 25);

    ctx.strokeStyle = '#007BFF';
    ctx.lineWidth = "2";
    ctx.strokeRect(this.x, this.y, this.w, this.h);
  },
};

// Function for creating particles object
function createParticles(x, y, m) {
  this.x = x || 0;
  this.y = y || 0;
  this.radius = 1.2;
  this.vx = -1.5 + Math.random() * 3;
  this.vy = m * Math.random() * 1.5;
}

// Draw everything on canvas
function draw() {
  MainScreen_canvas();
  for (var i = 0; i < paddles.length; i++) {
    p = paddles[i];
    ctx.fillStyle = '#007BFF';
    ctx.fillRect(p.x, p.y, p.w, p.h);
  }
  ball.draw();
  update();
}

// --- NEW: Show Alert Function for informational popups ---
function showAlert(message) {
  cancelRequestAnimFrame(init); // Pause the game
  customAlertMessage.textContent = message;
  customAlertContainer.style.display = 'flex';
}

// --- NEW: Event listener for the custom alert button ---
customAlertBtn.addEventListener('click', () => {
  customAlertContainer.style.display = 'none';
  animloop(); // Resume the game
});

// Function to increase speed after every 8 points
function increaseSpd() {
  if (points > 0 && points % 8 == 0) {
    level++;
    showAlert("You are now Level " + level); // MODIFIED
    if (Math.abs(ball.vx) < 15) {
      ball.vx += ball.vx < 0 ? -1 : 1;
      ball.vy += ball.vy < 0 ? -2 : 2;
    }
  }
}

// Track the position of mouse cursor
function trackPosition(e) {
  var rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
}

// Function to update positions, score and everything.
function update() {
  updateScore();
  if (mouse.x && mouse.y) {
    for (var i = 0; i < paddles.length; i++) {
      p = paddles[i];
      p.x = mouse.x - p.w / 2;
    }
  }
  ball.x += ball.vx;
  ball.y += ball.vy;
  p1 = paddles[0];
  p2 = paddles[1];
  if (collides(ball, p1)) {
    collideAction(ball, p1);
  } else if (collides(ball, p2)) {
    collideAction(ball, p2);
  } else {
    if (ball.y + ball.r > H) {
      ball.y = H - ball.r;
      gameOver();
    } else if (ball.y < 0) {
      ball.y = ball.r;
      gameOver();
    }
    if (ball.x + ball.r > W) {
      ball.vx = -ball.vx;
      ball.x = W - ball.r;
    } else if (ball.x - ball.r < 0) {
      ball.vx = -ball.vx;
      ball.x = ball.r;
    }
  }

  if (flag == 1) {
    for (var k = 0; k < particlesCount; k++) {
      particles.push(
        new createParticles(particlePos.x, particlePos.y, multiplier)
      );
    }
  }
  OntouchSpark();
  flag = 0;
}

function collides(b, p) {
  if (b.x + ball.r >= p.x && b.x - ball.r <= p.x + p.w) {
    if (b.y >= p.y - p.h && p.y > 0) {
      paddleHit = 1;
      return true;
    } else if (b.y <= p.h && p.y == 0) {
      paddleHit = 2;
      return true;
    } else return false;
  }
}

function collideAction(ball, p) {
  ball.vy = -ball.vy;
  if (paddleHit == 1) {
    ball.y = p.y - p.h;
    particlePos.y = ball.y + ball.r;
    multiplier = -1;
  } else if (paddleHit == 2) {
    ball.y = p.h + ball.r;
    particlePos.y = ball.y - ball.r;
    multiplier = 1;
  }
  points++;
  increaseSpd();
  particlePos.x = ball.x;
  flag = 1;
}

function OntouchSpark() {
  for (var j = 0; j < particles.length; j++) {
    par = particles[j];
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0, 123, 255, 0.5)';
    if (par.radius > 0) {
      ctx.arc(par.x, par.y, par.radius, 0, Math.PI * 2, false);
    }
    ctx.fill();
    par.x += par.vx;
    par.y += par.vy;
    par.radius = Math.max(par.radius - 0.05, 0.0);
  }
}

function updateScore() {
  ctx.fillStyle = '#000000'; // Pure black for max contrast
  ctx.font = "bold 18px Roboto, sans-serif"; // Bold and slightly larger
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Your Score : " + points, 20, 20);
  ctx.fillText("Your Level : " + level, 20, 45); // Adjusted spacing
}

function gameOver() {
  ctx.fillStyle = '#333333';
  ctx.font = "20px 'Press Start 2P', cursive";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Game Over", W / 2, H / 2 - 100);

  cancelRequestAnimFrame(init);
  level = 1;
  over = 1;
  restartBtn.draw();
}

function animloop() {
  init = requestAnimFrame(animloop);
  draw();
}

function startScreen() {
  draw();
  startBtn.draw();
  ctx.fillText("Bounce it Back", W / 2, 115);
}

// On button click (Restart and start)
function btnClick(e) {
  var rect = canvas.getBoundingClientRect();
  var mx = e.clientX - rect.left;
  var my = e.clientY - rect.top;

  if (startBtn.w && mx >= startBtn.x && mx <= startBtn.x + startBtn.w && my >= startBtn.y && my <= startBtn.y + startBtn.h) {
    animloop();
    startBtn = {};
  }

  if (over == 1) {
    if (mx >= restartBtn.x && mx <= restartBtn.x + restartBtn.w) {
      ball.x = W / 2;
      ball.y = H / 2 + 300;
      points = 0;
      ball.vx = 4;
      ball.vy = 8;
      animloop();
      over = 0;
    }
  }
}
// Show the start screen only after fonts are loaded
document.fonts.ready.then(function () {
  startScreen();
});