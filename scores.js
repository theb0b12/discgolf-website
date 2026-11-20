let overallChartInstance = null;
let holeChartInstance = null;

document.addEventListener("DOMContentLoaded", function() {
    renderHistory();
    setupTabs();
    
    const clearHistoryBtn = document.getElementById("clearHistoryBtn");
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener("click", clearHistory);
    }

    if (typeof confetti === "function") {
        confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.2 }
        });
    }
});

function setupTabs() {
    const historyBtn = document.getElementById("historyTabBtn");
    const analyticsBtn = document.getElementById("analyticsTabBtn");
    const historyContent = document.getElementById("historyTabContent");
    const analyticsContent = document.getElementById("analyticsTabContent");

    historyBtn.addEventListener("click", () => {
        historyBtn.classList.add("active-tab");
        analyticsBtn.classList.remove("active-tab");
        
        historyContent.style.display = "block";
        analyticsContent.style.display = "none";
    });

    analyticsBtn.addEventListener("click", () => {
        analyticsBtn.classList.add("active-tab");
        historyBtn.classList.remove("active-tab");
        
        analyticsContent.style.display = "block";
        historyContent.style.display = "none";

        renderAnalyticsCharts();
    });
}

// Helper or inline logic to get relative score (+/-) for a round
function getRelativeScore(round) {
    if (round.scores && round.pars && Array.isArray(round.scores) && Array.isArray(round.pars)) {
        let totalRel = 0;
        let hasPlayed = false;
        round.scores.forEach((s, idx) => {
            if (s !== null && s !== undefined && s !== "—" && !isNaN(s)) {
                const p = round.pars[idx] || 3;
                totalRel += (s - p);
                hasPlayed = true;
            }
        });
        if (hasPlayed) return totalRel;
    }
    // Fallback parsing from summary string if pars array isn't present in older saved rounds (backwards compatibility)
    const match = round.summary && round.summary.match(/\(([-\+]\d+|\d+)\)/);
    if (match) {
        return parseInt(match[1], 10);
    }
    return 0;
}
function formatRoundSummary(scores, pars, fallbackDefaultPar = 3) {
    let totalScore = 0;
    let playedPar = 0;

    scores.forEach((scoreVal, idx) => {
        if (scoreVal !== null && scoreVal !== undefined && scoreVal !== "" && !isNaN(scoreVal)) {
            const numScore = parseInt(scoreVal, 10);
            const holePar = (pars && pars[idx] !== undefined && pars[idx] !== null)
                ? parseInt(pars[idx], 10)
                : fallbackDefaultPar;
            totalScore += numScore;
            playedPar += holePar;
        }
    });

    const relScore = totalScore - playedPar;
    return `Total Score: ${totalScore} (${relScore})`;
}

function saveEditedRound(historyIndex, newScores, newPars) {
    const history = JSON.parse(localStorage.getItem("discGolfHistory")) || [];
    const targetRound = history[historyIndex];
    if (!targetRound) return;

    const normalizedScores = newScores.map(val => {
        if (val === "" || val === null || val === undefined) return null;
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? null : parsed;
    });

    const normalizedPars = newPars.map((val, idx) => {
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed)) return parsed;
        return (targetRound.pars && targetRound.pars[idx]) || targetRound.defaultPar || 3;
    });

    history[historyIndex] = {
        ...targetRound,
        scores: normalizedScores,
        pars: normalizedPars,
        summary: formatRoundSummary(normalizedScores, normalizedPars, targetRound.defaultPar || 3)
    };

    localStorage.setItem("discGolfHistory", JSON.stringify(history));
    renderHistory();

    const analyticsContent = document.getElementById("analyticsTabContent");
    if (analyticsContent && analyticsContent.style.display !== "none") {
        renderAnalyticsCharts();
    }
}

function renderHistory() {
    const historyListEl = document.getElementById("historyList");
    if (!historyListEl) return;

    let history = JSON.parse(localStorage.getItem("discGolfHistory")) || [];

    if (history.length === 0) {
        historyListEl.innerHTML = `<p class="no-rounds-text">No saved rounds yet.</p>`;
        return;
    }

    historyListEl.innerHTML = "";

    // Group rounds by course name while keeping original localStorage index
    const coursesMap = {};
    history.forEach((round, historyIndex) => {
        const courseName = round.course || "Unnamed Course";
        if (!coursesMap[courseName]) {
            coursesMap[courseName] = [];
        }
        coursesMap[courseName].push({ round, historyIndex });
    });

    Object.keys(coursesMap).forEach((courseName) => {
        const rounds = coursesMap[courseName];

        const courseContainer = document.createElement("div");
        courseContainer.className = "course-group-card";

        const courseHeader = document.createElement("div");
        courseHeader.innerHTML = `
            <div class="course-group-header">
                <h3 class="course-title">${courseName}</h3>
                <span class="round-count-badge">${rounds.length} round${rounds.length > 1 ? 's' : ''}</span>
            </div>
        `;
        courseContainer.appendChild(courseHeader);

        const roundsListEl = document.createElement("div");
        roundsListEl.className = "rounds-sublist";

        rounds.forEach(({ round, historyIndex }) => {
            const roundCard = document.createElement("div");
            roundCard.className = "hole-row round-card-item";

            const summaryText = round.summary || "";

            roundCard.innerHTML = `
                <div class="round-toggle-header">
                    <div>
                        <span class="round-date">${round.date}</span>
                    </div>
                    <div class="round-summary-group">
                        <span class="round-summary-text">${summaryText}</span>
                        <span class="toggle-indicator">▼ View Holes</span>
                    </div>
                </div>
                <div class="hole-breakdown-container" style="display: none;">
                    <div class="breakdown-title">Hole by Hole Breakdown:</div>
                    <div class="hole-grid"></div>
                </div>
            `;

            const breakdownContainer = roundCard.querySelector(".hole-breakdown-container");
            const holeGrid = roundCard.querySelector(".hole-grid");
            let isEditing = false;

            const renderHoleBoxes = () => {
                holeGrid.innerHTML = "";
                if (!round.scores || !Array.isArray(round.scores)) return;

                round.scores.forEach((scoreVal, hIdx) => {
                    const parVal = (round.pars && round.pars[hIdx] !== undefined && round.pars[hIdx] !== null)
                        ? round.pars[hIdx]
                        : (round.defaultPar || 3);

                    const holeBox = document.createElement("div");

                    if (isEditing) {
                        const currentScore = (scoreVal !== null && scoreVal !== undefined && scoreVal !== "—") ? scoreVal : "";
                        holeBox.className = "hole-box hole-badge-neutral";
                        holeBox.innerHTML = `
                            <div class="hole-num">H${hIdx + 1}</div>
                            <input type="number" inputmode="numeric" min="1" max="15" class="edit-score-input" data-hole="${hIdx}" value="${currentScore}" placeholder="—" style="width: 100%; text-align: center; font-family: monospace; font-weight: 800;">
                            <div class="hole-par">P <input type="number" inputmode="numeric" min="1" max="5" class="edit-par-input" data-hole="${hIdx}" value="${parVal}" style="width: 34px; text-align: center; font-family: monospace;"></div>
                        `;
                    } else {
                        const scoreDisplay = scoreVal !== null && scoreVal !== undefined && scoreVal !== "—" ? scoreVal : "—";
                        let badgeClass = "hole-badge-neutral";

                        if (scoreVal !== null && scoreVal !== undefined && scoreVal !== "—") {
                            const diff = scoreVal - parVal;
                            if (diff <= -2) {
                                badgeClass = "hole-badge-ace-eagle";
                            } else if (diff === -1) {
                                badgeClass = "hole-badge-birdie";
                            } else if (diff === 0) {
                                badgeClass = "hole-badge-par";
                            } else if (diff === 1) {
                                badgeClass = "hole-badge-bogey";
                            } else if (diff === 2) {
                                badgeClass = "hole-badge-double";
                            } else {
                                badgeClass = "hole-badge-triple-plus";
                            }
                        }

                        holeBox.className = `hole-box ${badgeClass}`;
                        holeBox.innerHTML = `<div class="hole-num">H${hIdx + 1}</div><div class="hole-score">${scoreDisplay}</div><div class="hole-par">P${parVal}</div>`;
                    }

                    holeGrid.appendChild(holeBox);
                });
            };

            renderHoleBoxes();

            const actionsBar = document.createElement("div");
            actionsBar.style.marginTop = "8px";
            actionsBar.style.display = "flex";
            actionsBar.style.gap = "8px";

            const editBtn = document.createElement("button");
            editBtn.type = "button";
            editBtn.className = "tab-btn";
            editBtn.style.padding = "6px 10px";
            editBtn.style.fontSize = "0.8rem";
            editBtn.textContent = "Edit Round";

            const cancelBtn = document.createElement("button");
            cancelBtn.type = "button";
            cancelBtn.className = "tab-btn";
            cancelBtn.style.padding = "6px 10px";
            cancelBtn.style.fontSize = "0.8rem";
            cancelBtn.style.display = "none";
            cancelBtn.textContent = "Cancel";

            editBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (!isEditing) {
                    isEditing = true;
                    breakdownContainer.style.display = "block";
                    toggleHeader.querySelector(".toggle-indicator").textContent = "▲ Hide Holes";
                    editBtn.textContent = "Save Changes";
                    cancelBtn.style.display = "inline-block";
                    renderHoleBoxes();
                } else {
                    const scoreInputs = holeGrid.querySelectorAll(".edit-score-input");
                    const parInputs = holeGrid.querySelectorAll(".edit-par-input");
                    const updatedScores = Array.from(scoreInputs).map(inp => inp.value.trim());
                    const updatedPars = Array.from(parInputs).map(inp => inp.value.trim());
                    saveEditedRound(historyIndex, updatedScores, updatedPars);
                }
            });

            cancelBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                isEditing = false;
                editBtn.textContent = "Edit Round";
                cancelBtn.style.display = "none";
                renderHoleBoxes();
            });

            actionsBar.appendChild(editBtn);
            actionsBar.appendChild(cancelBtn);
            breakdownContainer.appendChild(actionsBar);

            const toggleHeader = roundCard.querySelector(".round-toggle-header");
            toggleHeader.addEventListener("click", () => {
                const isHidden = breakdownContainer.style.display === "none";
                breakdownContainer.style.display = isHidden ? "block" : "none";
                toggleHeader.querySelector(".toggle-indicator").textContent = isHidden ? "▲ Hide Holes" : "▼ View Holes";
            });

            roundsListEl.appendChild(roundCard);
        });

        courseContainer.appendChild(roundsListEl);
        historyListEl.appendChild(courseContainer);
    });
}


function renderAnalyticsCharts() {
    let history = JSON.parse(localStorage.getItem("discGolfHistory")) || [];
    if (history.length === 0) return;

    const chronologicalRounds = [...history].reverse();

    // 1. Overall Trend Chart Data (Normalized to relative score +/-)
    const overallLabels = chronologicalRounds.map(r => r.date.split(',')[0]);
    const overallScores = chronologicalRounds.map(r => getRelativeScore(r));

    // Calculate Least Squares Line of Best Fit & Slope
    const n = overallScores.length;
    let trendData = [];
    let slopeVal = 0;
    if (n > 1) {
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += overallScores[i];
            sumXY += i * overallScores[i];
            sumXX += i * i;
        }
        const denominator = (n * sumXX - sumX * sumX);
        slopeVal = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
        const intercept = (sumY - slopeVal * sumX) / n;

        trendData = overallScores.map((_, i) => slopeVal * i + intercept);
    } else {
        trendData = [...overallScores];
    }

    // Format slope string for the key/legend
    const slopeFormatted = slopeVal >= 0 ? `+${slopeVal.toFixed(1)}` : slopeVal.toFixed(1);
    const trendLabel = n > 1 ? `Trend (${slopeFormatted} per round)` : `Trend Line`;

    if (overallChartInstance) {
        overallChartInstance.destroy();
    }

    const overallCtx = document.getElementById("overallTrendChart").getContext("2d");
    overallChartInstance = new Chart(overallCtx, {
        type: 'line',
        data: {
            labels: overallLabels,
            datasets: [{
                label: 'Score',
                data: overallScores,
                borderColor: '#2d5a27',
                backgroundColor: 'transparent',
                borderWidth: 2.5,
                tension: 0.2,
                fill: false,
                pointBackgroundColor: '#c99354',
                pointRadius: 5
            }, {
                label: trendLabel, // Uses our dynamic slope key here!
                data: trendData,
                borderColor: '#c99354',
                borderWidth: 2,
                borderDash: [6, 6],
                fill: false,
                pointRadius: 0,
                tension: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    display: true,
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });

    // 2. Hole-by-Hole Average Performance Chart Setup with Course Dropdown Filter
    const courseSelect = document.getElementById("holePerformanceCourseSelect");
    
    // Get unique list of courses from history
    const courses = [...new Set(history.map(r => r.course || "Unnamed Course"))];
    
    // Remember current selection if possible
    const currentSelection = courseSelect.value;
    courseSelect.innerHTML = "";
    
    courses.forEach(courseName => {
        const option = document.createElement("option");
        option.value = courseName;
        option.textContent = courseName;
        courseSelect.appendChild(option);
    });

    if (courses.includes(currentSelection)) {
        courseSelect.value = currentSelection;
    }

    // Function to render the hole chart for the selected course
    const updateHoleChartForSelectedCourse = () => {
        const selectedCourse = courseSelect.value;
        const holeTotals = {};
        
        history.forEach(round => {
            const roundCourse = round.course || "Unnamed Course";
            if (roundCourse === selectedCourse) {
                if (round.scores && Array.isArray(round.scores)) {
                    round.scores.forEach((score, hIdx) => {
                        if (score !== null && score !== undefined && score !== "—") {
                            if (!holeTotals[hIdx]) {
                                holeTotals[hIdx] = { scoreSum: 0, count: 0, parSum: 0 };
                            }
                            holeTotals[hIdx].scoreSum += parseInt(score, 10);
                            const par = round.pars && round.pars[hIdx] ? round.pars[hIdx] : 3;
                            holeTotals[hIdx].parSum += par;
                            holeTotals[hIdx].count += 1;
                        }
                    });
                }
            }
        });

        const holeLabels = [];
        const avgScores = [];
        const avgPars = [];

        Object.keys(holeTotals).sort((a, b) => parseInt(a) - parseInt(b)).forEach(hIdx => {
            const stats = holeTotals[hIdx];
            holeLabels.push(`Hole ${parseInt(hIdx) + 1}`);
            avgScores.push((stats.scoreSum / stats.count).toFixed(1));
            avgPars.push((stats.parSum / stats.count).toFixed(1));
        });

        if (holeChartInstance) {
            holeChartInstance.destroy();
        }

        const holeCtx = document.getElementById("holePerformanceChart").getContext("2d");
        holeChartInstance = new Chart(holeCtx, {
            type: 'bar',
            data: {
                labels: holeLabels,
                datasets: [
                    {
                        label: 'Avg Score',
                        data: avgScores,
                        backgroundColor: '#2d5a27',
                        borderRadius: 3
                    },
                    {
                        label: 'Avg Par',
                        data: avgPars,
                        backgroundColor: '#c99354',
                        borderRadius: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    };

    // Attach listener once
    if (!courseSelect.hasAttribute("data-listener-attached")) {
        courseSelect.setAttribute("data-listener-attached", "true");
        courseSelect.addEventListener("change", updateHoleChartForSelectedCourse);
    }

    updateHoleChartForSelectedCourse();
}

function clearHistory() {
    if (confirm("Are you sure you want to clear all round history?")) {
        localStorage.removeItem("discGolfHistory");
        renderHistory();
        if (overallChartInstance) overallChartInstance.destroy();
        if (holeChartInstance) holeChartInstance.destroy();
    }
}