const holeNumInput = document.getElementById("holeNum");
const parInput = document.getElementById("par");
const toggleParBtn = document.getElementById("toggleParBtn");

holeNumInput.addEventListener("input", updateHoles);
parInput.addEventListener("input", updateHoles);

// Toggle individual par editing mode directly on the body
toggleParBtn.addEventListener("click", function() {
    document.body.classList.toggle("editing-par");
    
    if (document.body.classList.contains("editing-par")) {
        toggleParBtn.textContent = "Done Editing Pars";
    } else {
        toggleParBtn.textContent = "Edit Individual Pars";
    }
});

function updateHoles() {
    let holeNum = parseInt(holeNumInput.value, 10) || 0;
    let defaultPar = parseInt(parInput.value, 10) || 3;
    
    // Safety caps
    if (holeNum > 21) {
        holeNum = 21;
        holeNumInput.value = 21;
    }
    if (defaultPar > 5) {
        defaultPar = 5;
        parInput.value = 5;
    }
    
    // Remove previously generated hole rows
    const oldRows = document.querySelectorAll(".hole-row");
    oldRows.forEach(row => row.remove());

    // Find the total score header to insert rows right before it
    const totalScoreEl = document.getElementById("totalScore");

    // Generate fresh hole rows dynamically
    for (let i = 0; i < holeNum; i++) {
        const row = document.createElement("div");
        row.className = "hole-row";
        
        row.innerHTML = `
            <span class="hole-label">Hole ${i + 1}</span>
            <div class="hole-controls">
                <span class="par-display">
                    Par: <span class="par-text">${defaultPar}</span>
                    <input type="number" inputmode="numeric" class="par-input" value="${defaultPar}" min="1" max="5">
                </span>
                <span class="score-group">
                    Score: <input type="number" inputmode="numeric" class="score-input" placeholder="—" min="1" max="15">
                </span>
            </div>
        `;
        
        // Insert each row right before the total score display
        totalScoreEl.parentNode.insertBefore(row, totalScoreEl);
    }
    
    calculateTotal();
}

// Function to calculate total score and live score relative to played holes only
function calculateTotal() {
    const scoreInputs = document.querySelectorAll(".score-input");
    const parInputs = document.querySelectorAll(".par-input");
    const parTexts = document.querySelectorAll(".par-text");

    let totalScore = 0;
    let playedPar = 0; // Par sum for ONLY the holes that have been scored

    // Update all par text elements first
    parInputs.forEach((input, index) => {
        const parValue = parseInt(input.value, 10) || 0;
        if (parTexts[index]) {
            parTexts[index].textContent = parValue;
        }
    });

    // Calculate score and par strictly for holes that have a score entered
    scoreInputs.forEach((input, index) => {
        if (input.value.trim() !== "") {
            const scoreValue = parseInt(input.value, 10);
            if (!isNaN(scoreValue)) {
                totalScore += scoreValue;
                // Add the par value corresponding specifically to this played hole
                const holePar = parseInt(parInputs[index].value, 10) || 0;
                playedPar += holePar;
            }
        }
    });

    // Relative to par currently while playing
    let realScore = totalScore - playedPar;

    document.getElementById("totalScore").textContent = "Total Score: " + totalScore + " (" + realScore + ")";
}

// Event listener on the body using event delegation
document.body.addEventListener("input", function(event) {
    if (event.target.classList.contains("score-input") || event.target.classList.contains("par-input")) {
        calculateTotal();
    }
});