console.log("Score_keeper.js script loaded.");

// Existing element selectors
const p1Button = document.querySelector('.p1button');
const p2Button = document.querySelector('.p2button');
const rstButton = document.querySelector('.reset');
const p1Display = document.querySelector('.p1scrdisp');
const p2Display = document.querySelector('.p2scrdisp');
const winningScore = document.querySelector('.limit');
const body = document.querySelector('body');

// --- NEW: Custom Alert Popup Elements ---
const customAlertContainer = document.getElementById('custom-alert-container');
const customAlertMessage = document.getElementById('custom-alert-message');
const customAlertBtn = document.getElementById('custom-alert-btn');
// --- END NEW ---

let p1Score = 0;
let p2Score = 0;
let limit = 5;
let isGameOver = false;

// --- NEW: Show Alert Function ---
function showAlert(message) {
    customAlertMessage.textContent = message;
    customAlertContainer.style.display = 'flex';
}

// --- NEW: Event listener for the custom alert button ---
customAlertBtn.addEventListener('click', () => {
    customAlertContainer.style.display = 'none';
});

// player 1 Score update
p1Button.addEventListener('click', function(evt) {
	if (isGameOver !== true && limit !== 0) {
		p1Score += 1;

		if (p1Score == limit) {
			isGameOver = true;
			p1Display.classList.add('winner');
			p2Display.classList.add('loser');
			p1Button.style.background = '#20c997';
			p2Button.style.background = '#f03e3e';
			showAlert("PLAYER 1 WON!!"); // MODIFIED
		}

		p1Display.textContent = p1Score;
	}
});


// Player 2 Score update
p2Button.addEventListener('click', function(evt) {
	if (isGameOver !== true && limit !== 0) {
		p2Score += 1;

		if (p2Score == limit) {
			isGameOver = true;
			p2Display.classList.add('winner');
			p1Display.classList.add('loser');
			p2Button.style.background = '#20c997';
			p1Button.style.background = '#f03e3e';
			showAlert("PLAYER 2 WON!!"); // MODIFIED
		}
		p2Display.textContent = p2Score;
	}
});

//Reseting all scores
rstButton.addEventListener('click', reset);

function reset() {
	isGameOver = false;
	p1Score = 0;
	p2Score = 0;
	p1Display.textContent = p1Score;
	p2Display.textContent = p2Score;
	p1Display.classList.remove('winner', 'loser');
	p2Display.classList.remove('loser', 'winner');

	p1Button.style.background = '#005f4e'; // Reset to original theme color
	p2Button.style.background = '#665200'; // Reset to original theme color
}

//  Limit set by user
winningScore.addEventListener('change', () => {
	limit = parseInt(winningScore.value)
	reset();
});