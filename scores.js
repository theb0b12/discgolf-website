document.addEventListener("DOMContentLoaded", function() {
    renderHistory();
    
    const clearHistoryBtn = document.getElementById("clearHistoryBtn");
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener("click", clearHistory);
    }
});

function renderHistory() {
    const historyListEl = document.getElementById("historyList");
    if (!historyListEl) return; // Exit if element doesn't exist on this page

    let history = JSON.parse(localStorage.getItem("discGolfHistory")) || [];

    if (history.length === 0) {
        historyListEl.innerHTML = `<p style="font-size: 0.9rem; color: var(--text-muted); font-family: monospace; text-align: center; margin-top: 30px;">No saved rounds yet.</p>`;
        return;
    }

    historyListEl.innerHTML = "";
    
    history.forEach((round) => {
        const roundCard = document.createElement("div");
        roundCard.className = "hole-row"; // Reuses your card styling
        roundCard.style.flexDirection = "column";
        roundCard.style.alignItems = "flex-start";
        roundCard.style.gap = "6px";

        // Display course name if it was saved
        const courseDisplay = round.course ? `<div style="font-size: 0.85rem; font-weight: bold; color: var(--fairway-accent);">Course: ${round.course}</div>` : "";

        roundCard.innerHTML = `
            <div style="display: flex; width: 100%; justify-content: space-between;">
                <span style="font-weight: bold; color: var(--golf-green-dark);">${round.date}</span>
                <span style="font-weight: 800;">${round.summary}</span>
            </div>
            ${courseDisplay}
            <div style="font-size: 0.8rem; color: var(--text-muted); word-break: break-all;">Scores: ${round.scores.join(", ")}</div>
        `;
        historyListEl.appendChild(roundCard);
    });
}

function clearHistory() {
    if (confirm("Are you sure you want to clear all round history?")) {
        localStorage.removeItem("discGolfHistory");
        renderHistory();
    }
}