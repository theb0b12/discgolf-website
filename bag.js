let bagChartInstance = null;

const typeOrder = {
    "Distance Driver": 1,
    "Fairway Driver": 2,
    "Midrange": 3,
    "Approach Putter": 4,
    "Putting Putter": 5
};

const distinctColors = [
    '#2d5a27', '#c99354', '#d32f2f', '#7b1fa2', '#1976d2', 
    '#e65100', '#00796b', '#c2185b', '#5d4037', '#455a64',
    '#afb42b', '#00bcd4', '#e91e63', '#3f51b5', '#8bc34a'
];

document.addEventListener("DOMContentLoaded", function() {
    renderBag();

    const form = document.getElementById("addDiscForm");
    if (form) {
        form.addEventListener("submit", function(e) {
            e.preventDefault();
            addDisc();
        });
    }

    const sortSelect = document.getElementById("discSortSelect");
    if (sortSelect) {
        sortSelect.addEventListener("change", function() {
            renderBag();
        });
    }
});

function getBag() {
    return JSON.parse(localStorage.getItem("discGolfBag")) || [];
}

function saveBag(bag) {
    localStorage.setItem("discGolfBag", JSON.stringify(bag));
}

function addDisc() {
    const name = document.getElementById("discName").value.trim();
    const type = document.getElementById("discType").value;
    const speed = parseFloat(document.getElementById("discSpeed").value);
    const glide = parseFloat(document.getElementById("discGlide").value);
    const turn = parseFloat(document.getElementById("discTurn").value);
    const fade = parseFloat(document.getElementById("discFade").value);

    if (!name || !type || isNaN(speed) || isNaN(glide) || isNaN(turn) || isNaN(fade)) return;

    const bag = getBag();
    bag.push({ name, type, speed, glide, turn, fade });
    saveBag(bag);

    document.getElementById("addDiscForm").reset();
    renderBag();
}

function removeDisc(index) {
    const bag = getBag();
    bag.splice(index, 1);
    saveBag(bag);
    renderBag();
}

function renderBag() {
    let bag = getBag();
    const sortVal = document.getElementById("discSortSelect") ? document.getElementById("discSortSelect").value : "type";

    // Sort the bag based on user selection
    bag.sort((a, b) => {
        if (sortVal === "type") {
            const orderA = typeOrder[a.type] || 99;
            const orderB = typeOrder[b.type] || 99;
            if (orderA !== orderB) return orderA - orderB;
            return b.speed - a.speed;
        } else if (sortVal === "speed") {
            return b.speed - a.speed;
        } else if (sortVal === "name") {
            return a.name.localeCompare(b.name);
        }
        return 0;
    });

    const listEl = document.getElementById("discList");
    if (!listEl) return;
    
    if (bag.length === 0) {
        listEl.innerHTML = `<p class="no-rounds-text">No discs in bag yet.</p>`;
    } else {
        listEl.innerHTML = "";
        
        // Map each disc type to a unique color tag background
        const typeColors = {
            "Distance Driver": "#d32f2f",    // Red
            "Fairway Driver": "#e65100",     // Orange
            "Midrange": "#2d5a27",           // Golf Green
            "Approach Putter": "#1976d2",    // Blue
            "Putting Putter": "#7b1fa2"      // Purple
        };

        bag.forEach((disc, idx) => {
            const badgeColor = typeColors[disc.type] || 'var(--fairway-accent)';
            const item = document.createElement("div");
            item.className = "hole-row";
            item.style.margin = "0";
            item.innerHTML = `
                <div>
                    <strong>${disc.name}</strong> <span style="font-size: 0.75rem; background: ${badgeColor}; color: white; padding: 2px 5px; border-radius: 3px; margin-left: 6px;">${disc.type || 'Unknown'}</span>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Speed: ${disc.speed} | Glide: ${disc.glide} | Turn: ${disc.turn} | Fade: ${disc.fade}</div>
                </div>
                <button type="button" onclick="removeDisc(${idx})" style="background: #a94442; color: white; border: none; padding: 6px 10px; border-radius: 3px; cursor: pointer; font-family: monospace;">X</button>
            `;
            listEl.appendChild(item);
        });
    }

    renderBagChart(bag);
}

function renderBagChart(bag) {
    if (bagChartInstance) {
        bagChartInstance.destroy();
    }

    const ctxCanvas = document.getElementById("bagChart");
    if (!ctxCanvas) return;
    const ctx = ctxCanvas.getContext("2d");

    // Map each disc to its aerodynamically modeled final landing coordinate (end point only)
    const dataPoints = bag.map((disc) => {
        const speed = disc.speed || 1;
        const glide = disc.glide || 3;
        const turn = disc.turn || 0;
        const fade = disc.fade || 0;

        // Forward distance based on speed and glide
        const distance = (speed * 32) + (glide * 12);

        // Lateral offset (RHBH physics: negative turn = right drift, positive fade = left hook)
        const turnOffset = -turn * (distance / 10);
        const fadeOffset = fade * (distance / 10);
        const lateralX = turnOffset - fadeOffset;

        return {
            x: Math.round(lateralX),
            y: Math.round(distance),
            discName: disc.name,
            disc: disc
        };
    });

    const pointColors = dataPoints.map((_, index) => distinctColors[index % distinctColors.length]);

    bagChartInstance = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Disc End Points',
                data: dataPoints,
                pointRadius: 9,
                pointHoverRadius: 11,
                backgroundColor: pointColors,
                borderColor: pointColors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const point = context.raw;
                            const d = point.disc;
                            const direction = point.x < 0 ? 'Left' : 'Right';
                            return `${point.discName} (${d.type}): ${point.y} ft dist, ${Math.abs(point.x)} ft ${direction} (Spd: ${d.speed}, Gld: ${d.glide}, Trn: ${d.turn}, Fad: ${d.fade})`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: { display: true, text: '← Left Fade / Right Turn → (ft)' },
                    min: -120,
                    max: 120,
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                y: {
                    type: 'linear',
                    title: { display: true, text: 'Distance (ft)' },
                    min: 0,
                    max: 500,
                    grid: { color: 'rgba(0,0,0,0.05)' }
                }
            }
        }
    });
}