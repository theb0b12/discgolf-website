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

function renderHistory() {
    const historyListEl = document.getElementById("historyList");
    if (!historyListEl) return;

    let history = JSON.parse(localStorage.getItem("discGolfHistory")) || [];

    if (history.length === 0) {
        historyListEl.innerHTML = `<p class="no-rounds-text">No saved rounds yet.</p>`;
        return;
    }

    historyListEl.innerHTML = "";

    // Group rounds by course name[cite: 4]
    const coursesMap = {};
    history.forEach(round => {
        const courseName = round.course || "Unnamed Course";
        if (!coursesMap[courseName]) {
            coursesMap[courseName] = [];
        }
        coursesMap[courseName].push(round);
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

        rounds.forEach((round) => {
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
                    <div class="breakdown-title">Hole-by-Hole Breakdown:</div>
                    <div class="hole-grid"></div>
                </div>
            `;

            const breakdownContainer = roundCard.querySelector(".hole-breakdown-container");
            const holeGrid = roundCard.querySelector(".hole-grid");

            if (round.scores && Array.isArray(round.scores)) {
                round.scores.forEach((scoreVal, hIdx) => {
                    const parVal = round.pars && round.pars[hIdx] ? round.pars[hIdx] : 3;
                    const scoreDisplay = scoreVal !== null && scoreVal !== undefined && scoreVal !== "—" ? scoreVal : "—";
                    
                    let badgeClass = "hole-badge-neutral";
                    
                    if (scoreVal !== null && scoreVal !== undefined && scoreVal !== "—") {
                        const diff = scoreVal - parVal;
                        if (diff <= -2) {
                            badgeClass = "hole-badge-ace-eagle"; // Ace or Eagle (-2 or better)
                        } else if (diff === -1) {
                            badgeClass = "hole-badge-birdie";    // Birdie (-1)
                        } else if (diff === 0) {
                            badgeClass = "hole-badge-par";       // Par (0)
                        } else if (diff === 1) {
                            badgeClass = "hole-badge-bogey";     // Bogey (+1)
                        } else if (diff === 2) {
                            badgeClass = "hole-badge-double";    // Double Bogey (+2)
                        } else {
                            badgeClass = "hole-badge-triple-plus"; // Triple Bogey or worse (+3+)
                        }
                    }

                    const holeBox = document.createElement("div");
                    holeBox.className = `hole-box ${badgeClass}`;
                    holeBox.innerHTML = `<div class="hole-num">H${hIdx + 1}</div><div class="hole-score">${scoreDisplay}</div><div class="hole-par">P${parVal}</div>`;
                    holeGrid.appendChild(holeBox);
                });
            }

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

    // 1. Overall Trend Chart Data
    const overallLabels = chronologicalRounds.map(r => r.date.split(',')[0]);
    const overallScores = chronologicalRounds.map(r => {
        const match = r.summary.match(/Total Score:\s*(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    });

    // Calculate Least Squares Line of Best Fit
    const n = overallScores.length;
    let trendData = [];
    if (n > 1) {
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += overallScores[i];
            sumXY += i * overallScores[i];
            sumXX += i * i;
        }
        const denominator = (n * sumXX - sumX * sumX);
        const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
        const intercept = (sumY - slope * sumX) / n;

        trendData = overallScores.map((_, i) => slope * i + intercept);
    } else {
        trendData = [...overallScores];
    }

    if (overallChartInstance) {
        overallChartInstance.destroy();
    }

    const overallCtx = document.getElementById("overallTrendChart").getContext("2d");
    overallChartInstance = new Chart(overallCtx, {
        type: 'line',
        data: {
            labels: overallLabels,
            datasets: [{
                label: 'Total Score',
                data: overallScores,
                borderColor: '#2d5a27',
                backgroundColor: 'transparent', // Removed background fill
                borderWidth: 2.5,
                tension: 0.2,
                fill: false, // Ensure fill is off
                pointBackgroundColor: '#c99354',
                pointRadius: 5
            }, {
                label: 'Trend Line',
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

    // 2. Hole-by-Hole Average Performance Chart Data
    const holeTotals = {};
    
    history.forEach(round => {
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
}

function clearHistory() {
    if (confirm("Are you sure you want to clear all round history?")) {
        localStorage.removeItem("discGolfHistory");
        renderHistory();
        if (overallChartInstance) overallChartInstance.destroy();
        if (holeChartInstance) holeChartInstance.destroy();
    }
}