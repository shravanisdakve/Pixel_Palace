const dice = document.getElementById('dice');
const rollBtn = document.getElementById('rollBtn');

let currentClass = '';

// Map number to rotation (approximate for the cube layout)
// front=1, back=6, right=3, left=4, top=5, bottom=2
// transforms need to be accumulated or absolute.
// A simpler way for a 3D rolling effect is to add random rotations to the current rotation.

// We will track the total rotation X and Y.
let rotateX = 0;
let rotateY = 0;

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

rollBtn.addEventListener('click', () => {
    // 1. Determine the result (1-6)
    const result = getRandomInt(1, 6);
    
    // 2. Determine necessary final rotation to show that face
    // This is tricky with cumulative rotations. 
    // Instead, we will rotate wildly by a multiple of 90 degrees plus some extra spins.
    
    const spins = 5; // Number of full rotations
    
    // We want to land on a specific face.
    // Let's define the target rotations for each number relative to (0,0,0) which is 'front' (1)
    
    // 1: x=0, y=0
    // 6: x=0, y=180 (back)
    // 3: x=0, y=-90 (right) 
    // 4: x=0, y=90 (left)
    // 5: x=-90, y=0 (top)
    // 2: x=90, y=0 (bottom)
    
    let xTarget = 0;
    let yTarget = 0;
    
    switch(result) {
        case 1: xTarget = 0; yTarget = 0; break;
        case 6: xTarget = 0; yTarget = 180; break;
        case 3: xTarget = 0; yTarget = -90; break;
        case 4: xTarget = 0; yTarget = 90; break;
        case 5: xTarget = -90; yTarget = 0; break;
        case 2: xTarget = 90; yTarget = 0; break;
    }

    // Add multiples of 360 to xTarget and yTarget so we spin
    // We also need to be careful about the current rotation state.
    // If we are currently at 360, 360, we want to go to 360+xTarget + 360*spins
    
    // It's cleaner to just purely add random 360s to the offsets.
    // But we need to ensure the modulo aligns with the target.
    
    // Let's calculate the delta needed to get to the target from the current position in modulo 360 space.
    
    // Normalize current rotation to 0-360 range conceptually for target calculation, 
    // but practically we just need the "next" multiple of 360 that aligns with the target.
    
    // Actually, simpler logic:
    // Generate random extra spins (at least 2 full spins)
    const extraX = (getRandomInt(2, 4) * 360);
    const extraY = (getRandomInt(2, 4) * 360);
    
    // We need to snap to the specific face.
    // Since we accumulate rotations, we can just set the new transform to be exactly the target + accumulated full spins.
    // But since the previous rotateX might be 1080, we want to go to e.g. 1080 + 720 + targetOffset.
    
    // Round current to nearest 90-ish? No/
    
    // Let's just create a new variable for "target total rotation"
    
    // We want the final rotation to be:
    // X = (multiple of 360) + xTarget
    // Y = (multiple of 360) + yTarget
    
    // To ensure it looks like it's spinning forward, we add to the current value.
    
    // Current accumulated rotation
    // We want to reach (Current + roughly 720) but snapped to the target.
    
    // How to snap:
    // 1. Calculate the 'remainder' of current rotation (mod 360).
    // 2. Find difference between remainder and target.
    // 3. Add that difference + full spins.
    
    // Correction: CSS transforms order matters. If we rotateX then rotateY, the axes change.
    // For a simple dice, usually just updating rotateX and rotateY simultaneously works if we just stick to world axes.
    // But in CSS `transform: rotateX(..) rotateY(..)` rotates Y relative to the new X.
    // THIS IS THE TRAP.
    
    // To avoid complex 3D math, let's just pick random faces and not worry too much about "landing" perfectly on a pre-determined number if this was a complex game.
    // But the user expects the visual to match the logic.
    
    // SIMPLIFIED APPROACH for robustness:
    // We only update rotation based on the specific mapping I derived above.
    // To make it spin, we add specific multiples of 360 to the values.
    
    // Since we always start from "last known valid face position", we can just add 360s.
    // Wait, if I am at "Right" (0, -90) and I want to go to "Top" (-90, 0).
    // If I animate from (0, -90) to (-90, 0), it might look weird.
    
    // Doing it correctly requires a quaternion or accumulating matrix, which is too hard for this simple script.
    
    // Hacky solution:
    // Just reset transition to none, snap to 0,0, then spin? No, that glitches.
    
    // Better Simplified Solution:
    // Just use a random number of 90 degree turns? 
    // No, let's use the standard "Roll" approach where we just produce a random outcome and animate to it.
    // The previous state is 'rotateX', 'rotateY'.
    
    // Let's rely on the fact that for a cube,
    // Target X must be k*360 + offset.
    // Target Y must be k*360 + offset.
    
    // We will maintain a global `xRot` and `yRot`.
    // When rolling 1: xRot needs to be a multiple of 360.
    // When rolling 6 (Back): xRot needs to vary, but Y needs to be 180 + k*360.
    
    // Let's fix the specific offsets for the 6 faces:
    // 1 (Front): rotateX(0deg) rotateY(0deg)
    // 6 (Back): rotateX(180deg) rotateY(0deg)  <-- Easier than Y rotation
    // 2 (Bottom): rotateX(-90deg) rotateY(0deg)
    // 5 (Top): rotateX(90deg) rotateY(0deg)
    // 3 (Right): rotateX(0deg) rotateY(-90deg)
    // 4 (Left): rotateX(0deg) rotateY(90deg)
    
    // Correction on my earlier mapping:
    // Top (5) is usually rotateX(-90deg) (tilting backwards shows top) or rotateX(90deg) (tilting forward shows bottom).
    // Let's clear up the CSS:
    // .front  { transform: translateZ(50px); }
    // .back   { transform: rotateY(180deg) translateZ(50px); }
    // .right  { transform: rotateY(90deg) translateZ(50px); }  <-- Face on the right
    // .left   { transform: rotateY(-90deg) translateZ(50px); } <-- Face on the left
    // .top    { transform: rotateX(90deg) translateZ(50px); }  <-- Face on top?? No, rotateX(90) rotates the element around X axis.
    // If we look at the screen, X axis is horizontal. RotateX(90) brings the Top of the element towards us? Or away?
    // It flips it so it's flat.
    // Let's assume standard CSS box model.
    
    // Final targets logic:
    // 1: X=0, Y=0
    // 6: X=180, Y=0
    // 2: X=-90, Y=0 (Assuming 2 is bottom? In my CSS: .bottom { rotateX(-90deg) ... })
    //    Actually, if the face is AT -.bottom { transform: rotateX(-90deg) translateZ(50px); }
    //    To show it, we need to rotate the CUBE by +90deg on X.
    
    // Let's define the TARGET CUBE ROTATION to show a face:
    // To show Front (1):  X=0, Y=0
    // To show Back (6):   X=180, Y=0
    // To show Right (3):  X=0,  Y=-90 (Rotate cube left to see right face)
    // To show Left (4):   X=0,  Y=90
    // To show Top (5):    X=-90, Y=0
    // To show Bottom (2): X=90, Y=0
    
    let targetX = 0;
    let targetY = 0;
    
    switch(result) {
        case 1: targetX = 0; targetY = 0; break;
        case 6: targetX = 180; targetY = 0; break;
        case 2: targetX = 90; targetY = 0; break; // Bottom
        case 5: targetX = -90; targetY = 0; break; // Top
        case 3: targetX = 0; targetY = -90; break; // Right
        case 4: targetX = 0; targetY = 90; break; // Left
    }
    
    // Add randomness (full spins)
    // We assume the previous 'rotateX' and 'rotateY' are the base.
    // We want to animate FROM current TO target + spins.
    
    // But we need to account for the fact that the previous state might have been "Bottom" (X=90).
    // If we just add 360, we go to 450.
    // If the new target is "Top" (-90), we want to go to -90 + k*360.
    // 450 is logically 90.
    // We want the closest path forward? Or just a lot of spinning?
    // A lot of spinning looks better.
    
    // Let's just create a new accumulation.
    // But we need to match the "phase".
    
    // Current logical rotation = rotateX % 360.
    // Just taking the new target and adding a large multiple of 360 is usually sufficient if the multiple is large enough to mask the phase jump direction.
    // Actually, simply:
    // rotateX += (360*5) + (targetX - (rotateX % 360));
    // This correction term (targetX - (rotateX % 360)) adjusts the offset to land on the correct face.
    // Wait, (rotateX % 360) might be negative or large.
    
    // Let's do it cleaner:
    // Always add at least 5 full spins (1800 deg).
    // Plus the difference to get to the specific angle.
    
    // We know we want to end at 'targetX'.
    // Current is 'currentX'.
    // We want nextX = currentX + 360*5 + adjustment.
    // adjustment = targetX - (currentX % 360).
    // If currentX is 90, targetX is -90. currentX % 360 is 90. adj = -180.
    // nextX = 90 + 1800 - 180 = 1710.
    // 1710 % 360 = 270 == -90. Correct.
    
    // Bug with JS modulo of negative numbers: -90 % 360 is -90.
    // But sometimes it behaves oddly.
    
    // Let's rely on stored values.
    
    rotateX += 1800 + (targetX - (rotateX % 360));
    rotateY += 1800 + (targetY - (rotateY % 360));
    
    // This 'resetting' of the phase works.
    
    dice.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    
});
