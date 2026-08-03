const character=document.getElementById("character");
const block=document.getElementById("block");
const block2=document.getElementById("block2");
const co=document.getElementById("co");
var counter=0;

// --- NEW: Custom Alert Popup Elements ---
const customAlertContainer = document.getElementById('custom-alert-container');
const customAlertMessage = document.getElementById('custom-alert-message');
const customAlertBtn = document.getElementById('custom-alert-btn');
// --- END NEW ---

var je = setInterval(() => {
    co.classList.add("animate2");
    setTimeout(() => {
        co.classList.add("show");
    }, 2000);
}, 1000);

function jump(){
    if(character.classList === "animate"){return}
    character.classList.add("animate");
    setTimeout(function(){
        character.classList.remove("animate");
    },300);
}

function myFunction(event){
    var x = event.keyCode;
    if(x==32){
        jump();
    }
}

// Add touch/click listeners to make it mobile-playable
document.addEventListener("click", jump);
document.addEventListener("touchstart", function(e) {
    // Avoid double trigger on hybrid devices
    e.preventDefault();
    jump();
}, { passive: false });

// --- NEW: Show Alert Function ---
function showAlert(message) {
    // Stop all game loops
    clearInterval(je);
    clearInterval(checkDead);
    clearInterval(add);
    
    customAlertMessage.textContent = message;
    customAlertContainer.style.display = 'flex';
}

// --- NEW: Event listener for the custom alert button ---
customAlertBtn.addEventListener('click', () => {
    document.location.reload(); // Reload the page to play again
});

var checkDead = setInterval(function() {
    let characterTop = parseInt(window.getComputedStyle(character).getPropertyValue("top"));
    let blockLeft = parseInt(window.getComputedStyle(block).getPropertyValue("left"));
    if(blockLeft<20 && blockLeft>-20 && characterTop>=130 ){
        block.style.animation = "none";
        showAlert("Game Over. score: "+Math.floor(counter/100)); // MODIFIED
        counter=0;
    }
    else if(ka()){
        // ka() will handle the alert
    }
    else{
        counter++;
        document.getElementById("scoreSpan").innerHTML = Math.floor(counter/100);
    }
}, 10);

var add = setInterval(() => {
    block2.classList.add("animate1");
    setTimeout(() => {
        block2.classList.remove("animate1");
    }, 9000);
},7000);

function ka(){
    let characterTop = parseInt(window.getComputedStyle(character).getPropertyValue("top"));
    let blockTop = parseInt(window.getComputedStyle(block2).getPropertyValue("left"));
    if( blockTop <20 && characterTop==100){
        block2.classList.remove("animate1");
        showAlert("Game Over. score: "+Math.floor(counter/100)); // MODIFIED
        counter=0;
        return true; // Return true to satisfy the if condition in checkDead
    }
    return false;
};