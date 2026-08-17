const sentences = [
	"After all, you're only an immortal until someone manages to kill you. After that, you were just long-lived. As long as poverty, injustice and gross inequality persist in our world, none of us can truly rest.",

	"We were like deaf people trying to dance to a beat we couldn't hear, long after the music actually stopped. For once you have tasted flight you will walk the earth with your eyes turned skywards, for there you have been and there you will long to return.",

	"Time plays like an accordion in the way it can stretch out and compress itself in a thousand melodic ways. Months on end may pass blindingly in a quick series of chords, open-shut, together-apart; and then a single melancholy week may seem like a year's pining, one long unfolding note.",

	"Life is beautiful, as long as it consumes you. When it is rushing through you, destroying you, life is gorgeous, glorious. It is when you burn a slow fire and save fuel, that life's not worth having.",

	"As long as people have been on this earth, the moon has been a mystery to us. Think about it. She is strong enough to pull the oceans, and when she dies away, she always comes back again. My mama used to tell me Our Lady lived on the moon and that I should dance when her face was bright and hibernate when it was dark."
];

const msg = document.getElementById('msg');
const typedWords = document.getElementById('mywords');
const btn = document.getElementById('btn');

let startTime, endTime;

// --- Pixel Palace session tracking ---
let currentSessionId = null;

// --- Personal best from PixelPalace (with legacy migration) ---
let bestWPM = 0;

function loadPersonalBest() {
	// Check PixelPalace first
	if (typeof window.PixelPalace !== 'undefined') {
		var pb = window.PixelPalace.getPersonalBest('typing-sprint');
		if (pb && typeof pb.score === 'number') {
			bestWPM = pb.score;
			return;
		}
	}
	// Fall back to legacy key
	try {
		var legacy = localStorage.getItem('typingSprintBestWPM');
		if (legacy !== null) {
			bestWPM = Number(legacy) || 0;
			// Migrate to PixelPalace
			if (bestWPM > 0 && typeof window.PixelPalace !== 'undefined') {
				window.PixelPalace.evaluatePersonalBest('typing-sprint', bestWPM);
			}
		}
	} catch (e) {}
}

const playGame = () => {
	let randomNumber = Math.floor(Math.random() * sentences.length);
	msg.innerText = sentences[randomNumber];
	let date = new Date();
	startTime = date.getTime();
	btn.innerText = "Done";

	// Start Pixel Palace session
	if (typeof window.PixelPalace !== 'undefined') {
		var result = window.PixelPalace.startSession('typing-sprint');
		if (result.ok) {
			currentSessionId = result.session.id;
		}
	}
}

const endGame = () => {
	let date = new Date();
	endTime = date.getTime();
	let totalTime = 0,
		wordCount = 0;
	totalTime = Math.round((endTime - startTime) / 1000)

	let totalStr = typedWords.value;
	wordCount = wordCounter(totalStr);

	// Calculate WPM (Words Per Minute)
	let wpm = Math.round((wordCount / totalTime) * 60);
	if (!Number.isFinite(wpm) || isNaN(wpm)) wpm = 0;

	// End Pixel Palace session with WPM as score
	let newRecord = false;
	if (typeof window.PixelPalace !== 'undefined' && currentSessionId) {
		var result = window.PixelPalace.endSession(currentSessionId, { score: wpm });
		if (result.ok && result.personalBest) {
			newRecord = result.personalBest.isNewBest;
			if (newRecord) {
				bestWPM = wpm;
			}
		}
		currentSessionId = null;
	}

	// Also update legacy key for backwards compatibility
	if (wpm > bestWPM) {
		bestWPM = wpm;
		try {
			localStorage.setItem('typingSprintBestWPM', bestWPM);
		} catch (e) {}
		newRecord = true;
	}

	let finalMsg = `You Typed Total ${wordCount} words in ${totalTime} seconds. Speed: ${wpm} WPM. `;
	if (newRecord) {
		finalMsg += `\u{1F3C6} NEW HIGH SCORE!`;
	} else {
		finalMsg += `(Best: ${bestWPM} WPM)`;
	}

	msg.innerText = finalMsg;
	// Clear the textarea for the next round
	typedWords.value = '';
}

const wordCounter = (str) => {
	let response = str.split(" ").length;
	return response;
}

// Load personal best on page load
loadPersonalBest();

btn.addEventListener('click', function () {
	if (this.innerText == 'Start') {
		typedWords.disabled = false;
		playGame();
	} else if (this.innerText == "Done") {
		typedWords.disabled = true;
		btn.innerText = "Start";
		endGame();
	}
})
