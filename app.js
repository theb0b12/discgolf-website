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
        toggleParBtn.textContent = "Edit Pars";
    }
});

function getSavedCourses() {
    return JSON.parse(localStorage.getItem("discGolfCourses")) || [];
}

function saveCourseToStorage(courseData) {
    let courses = getSavedCourses();
    // Check if course with same name already exists, update it; otherwise push new
    const existingIndex = courses.findIndex(c => c.name.toLowerCase() === courseData.name.toLowerCase());
    if (existingIndex >= 0) {
        courses[existingIndex] = { ...courses[existingIndex], ...courseData };
    } else {
        courses.push(courseData);
    }
    localStorage.setItem("discGolfCourses", JSON.stringify(courses));
    populateSavedCoursesDropdown();
}

function populateSavedCoursesDropdown() {
    const selectEl = document.getElementById("savedCourseSelect");
    if (!selectEl) return;

    const courses = getSavedCourses();
    
    // Preserve default options
    selectEl.innerHTML = `
        <option value="" disabled selected>Select Saved Course...</option>
        <option value="custom">Custom / New Course</option>
    `;

    courses.forEach(course => {
        const option = document.createElement("option");
        option.value = course.id;
        option.textContent = `${course.name} ${course.layout ? '(' + course.layout + ')' : ''} - ${course.holeCount} Holes`;
        selectEl.appendChild(option);
    });
}

function loadCourseIntoCalculator(courseId) {
    const courses = getSavedCourses();
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    // Set Course Name
    document.getElementById("name").value = course.name;

    // Set Hole Count
    holeNumInput.value = course.holeCount;

    // Trigger updateHoles to generate rows
    updateHoles();

    // Populate individual pars
    const parInputs = document.querySelectorAll(".par-input");
    course.pars.forEach((parVal, idx) => {
        if (parInputs[idx]) {
            parInputs[idx].value = parVal;
        }
    });

    calculateTotal();
}

// Hook into DOMContentLoaded in app.js
document.addEventListener("DOMContentLoaded", function() {
    populateSavedCoursesDropdown();

    const savedCourseSelect = document.getElementById("savedCourseSelect");
    if (savedCourseSelect) {
        savedCourseSelect.addEventListener("change", function() {
            if (this.value === "custom") {
                document.getElementById("name").value = "";
                holeNumInput.value = "";
                parInput.value = "";
                updateHoles();
            } else {
                loadCourseIntoCalculator(this.value);
            }
        });
    }

    const courseNameInput = document.getElementById("name");
    const saveCourseContainer = document.getElementById("saveCourseCheckboxContainer");
    
    if (courseNameInput && saveCourseContainer) {
        courseNameInput.addEventListener("input", function() {
            const nameVal = this.value.trim();
            if (nameVal.length > 0) {
                const courses = getSavedCourses();
                const exists = courses.some(c => c.name.toLowerCase() === nameVal.toLowerCase());
                // Show checkbox if it's a new or modified course layout
                saveCourseContainer.style.display = exists ? "none" : "block";
            } else {
                saveCourseContainer.style.display = "none";
            }
        });
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

function saveRound(){
    const saveLayoutChecked = document.getElementById("saveCourseLayoutCheck")?.checked;
    const courseName = document.getElementById("name").value.trim();

    if (saveLayoutChecked && courseName) {
        const scoreInputs = document.querySelectorAll(".score-input");
        const parInputs = document.querySelectorAll(".par-input");
        const courseData = {
            id: "course_" + Date.now(),
            name: courseName,
            layout: "Standard",
            holeCount: scoreInputs.length,
            pars: Array.from(parInputs).map(input => parseInt(input.value, 10) || 3)
        };
        saveCourseToStorage(courseData);
    }
    const scoreInputs = document.querySelectorAll(".score-input");
    const parInputs = document.querySelectorAll(".par-input");
    let hasScores = Array.from(scoreInputs).some(input => input.value.trim() !== "");
    
    if (!hasScores) {
        alert("Please enter at least one hole's score before saving!");
        return;
    }

    const roundData = {
        date: new Date().toLocaleDateString(undefined, { 
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
        }),
        summary: document.getElementById("totalScore").textContent,
        scores: Array.from(scoreInputs).map(input => input.value.trim() !== "" ? parseInt(input.value.trim(), 10) : null),
        pars: Array.from(parInputs).map(input => parseInt(input.value, 10) || 3),
        course: document.getElementById("name").value.trim() // trims the white space
    };

    let history = JSON.parse(localStorage.getItem("discGolfHistory")) || [];
    history.unshift(roundData);
    localStorage.setItem("discGolfHistory", JSON.stringify(history));
    // redirect to scores after clicking the button
    window.location.href = "scores";
}


const saveRoundBtn = document.getElementById("saveRoundBtn");
saveRoundBtn.addEventListener("click", saveRound);