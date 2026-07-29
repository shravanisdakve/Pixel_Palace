const character = document.querySelector(".dino");
const block = document.querySelector(".cactus");

// --- NEW: Custom Alert Popup Elements ---
const customAlertContainer = document.getElementById('custom-alert-container');
const customAlertMessage = document.getElementById('custom-alert-message');
const customAlertBtn = document.getElementById('custom-alert-btn');
// --- END NEW ---

const jump = () => {
    if (!character.classList.contains("animate")) {
        character.classList.add('animate');
    }
    setTimeout(function() {
        character.classList.remove('animate')
    }, 500);
}

// --- NEW: Show Alert Function ---
function showAlert(message) {
    clearInterval(checkDead); // Stop the game loop
    customAlertMessage.textContent = message;
    customAlertContainer.style.display = 'flex';
}

// --- NEW: Event listener for the custom alert button ---
customAlertBtn.addEventListener('click', () => {
    document.location.reload(); // Reload the page to play again
});


var checkDead = setInterval(function() {
    var characterTop = parseInt(window.getComputedStyle(character).getPropertyValue("top"));
    var blockLeft = parseInt(window.getComputedStyle(block).getPropertyValue("left"));

    if (blockLeft < 40 && blockLeft > 0 && characterTop >= 460) { // Adjusted collision detection
        block.style.animation = "none";
        block.style.display = "none";
        showAlert("Uh..Oh, you lose."); // MODIFIED
    }
}, 10);
