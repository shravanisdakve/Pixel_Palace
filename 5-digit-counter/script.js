var countInterval;

function startCounter() {

    var number = parseInt(document.getElementById("number").value);

    if (isNaN(number)) {
        alert("Please enter a number");
        return;
    }
    if (number < 1 || number > 99999) {
        alert("Range out of bounds");
        return;
    }

    var currentNos = document.querySelectorAll(".counter .current");
    var nextNos = document.querySelectorAll(".counter .next");
    var count = 0;

    // Reset everything
    resetNumbers(currentNos, nextNos, 5);
    clearInterval(countInterval);

    // Calculate acceptable interval duration
    // We want the total animation to take roughly 3-5 seconds max for UX.
    // But if we just update the number directly it's boring.
    // If we count 1 by 1, 99999 takes forever.
    // Solution: If the number is large, we should increment by a larger step, 
    // OR just update the UI digits rapidly.
    // The current implementation is physical 'rolling' of digits.
    // Rolling 99999 times is too much CSS reflow.

    // Optimized approach:
    // Only animate the logical changes.
    // But implementing a full odometer effect for a jump of 1000 is hard.

    // Let's stick to the 1-by-1 increment but run it REALLY fast?
    // Browser minimum interval is ~4ms. 99999 * 4ms = 400 seconds. Still too slow.

    // Modified approach:
    // Use a mathematical ease-out function to display the number.
    // Simply update the text content 60 times a second to show the progress.
    // We lose the "rolling" animation for every single digit change, but we can animate the final settle.

    // However, to keep the existing "rolling" style valid, let's compromise:
    // If number is small (< 50), use original slow roll.
    // If number is large, just "spin" the counters randomly and land on the result?
    // Or just run a purely numeric counter.

    // Let's go with the numeric counter with a 'spin' effect.

    let duration = 2000; // 2 seconds
    let startTime = null;

    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        let progress = timestamp - startTime;
        let percentage = Math.min(progress / duration, 1);

        let currentCount = Math.floor(percentage * number);

        // Update the display to show 'currentCount'
        // We need to parse 'currentCount' into 5 digits and set them.
        updateDisplay(currentCount, currentNos);

        if (progress < duration) {
            window.requestAnimationFrame(animate);
        } else {
            // Ensure final value is set
            updateDisplay(number, currentNos);
            alert("Counter has stopped");
        }
    }

    window.requestAnimationFrame(animate);

}


function updateDisplay(val, currentNos) {
    // val is an integer, e.g. 123
    // We need to pad it to 5 digits: 00123
    let s = val.toString().padStart(5, '0');

    // s[0] corresponds to index 0? The HTML order is:
    // id="fifth" (index 0 in querySelectorAll?)
    // Let's check HTML structure.
    // <div class="counter" id="fifth"> ... </div>
    // <div class="counter" id="fourth"> ... </div>
    // The elements appear in DOM order. 
    // If CSS flex-direction is row (default), "fifth" is on the left.
    // In a number 12345, '1' is the ten-thousands place (fifth digit from right).
    // So 'fifth' div should hold the first char of the string.

    for (let i = 0; i < 5; i++) {
        currentNos[i].innerText = s[i];
    }
}

function resetNumbers(currentNos, nextNos, end) {
    for (var i = 0; i < end; ++i) {
        currentNos[i].innerText = 0;
        nextNos[i].innerText = 1;
    }
}