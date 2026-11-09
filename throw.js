let startCoords = null;
let map = null;
let startMarker = null;
let endMarker = null;
let throwLine = null;

const GPS_OPTIONS = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0
};

document.addEventListener("DOMContentLoaded", function() {
    renderThrowHistory();

    // Initialize Leaflet Map
    map = L.map('map').setView([37.7749, -122.4194], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const startBtn = document.getElementById("startBtn");
    const endBtn = document.getElementById("endBtn");
    const resetBtn = document.getElementById("resetBtn");

    startBtn.addEventListener("click", function() {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        document.getElementById("statusDisplay").textContent = "Acquiring GPS start position...";
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                startCoords = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };

                // Clear previous map layers if restarting
                if (startMarker) map.removeLayer(startMarker);
                if (endMarker) map.removeLayer(endMarker);
                if (throwLine) map.removeLayer(throwLine);

                // Center map on Tee and add marker
                map.setView([startCoords.lat, startCoords.lon], 18);
                startMarker = L.marker([startCoords.lat, startCoords.lon]).addTo(map)
                    .bindPopup("Tee").openPopup();

                document.getElementById("statusDisplay").textContent = "Tee position set! Walk to your disc and tap Mark Disc.";
                document.getElementById("distanceDisplay").textContent = "0 ft";
                startBtn.style.opacity = "0.6";
                endBtn.removeAttribute("disabled");
                resetBtn.style.display = "block";
            },
            function(error) {
                alert("Error getting GPS location: " + error.message);
                document.getElementById("statusDisplay").textContent = "Failed to get GPS location. Please ensure location services are enabled.";
            },
            GPS_OPTIONS
        );
    });

    endBtn.addEventListener("click", function() {
        if (!startCoords) return;

        document.getElementById("statusDisplay").textContent = "Acquiring GPS disc position...";

        navigator.geolocation.getCurrentPosition(
            function(position) {
                const endCoords = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };

                const distanceFeet = calculateHaversineDistance(
                    startCoords.lat, startCoords.lon,
                    endCoords.lat, endCoords.lon
                );

                // Add Disc marker and draw line between Tee and Disc
                endMarker = L.marker([endCoords.lat, endCoords.lon]).addTo(map)
                    .bindPopup(`Disc (${distanceFeet} ft)`).openPopup();

                throwLine = L.polyline([
                    [startCoords.lat, startCoords.lon],
                    [endCoords.lat, endCoords.lon]
                ], { color: '#1f2d1f', weight: 4 }).addTo(map);

                map.fitBounds(throwLine.getBounds(), { padding: [30, 30] });

                document.getElementById("distanceDisplay").textContent = `${distanceFeet} ft`;
                document.getElementById("statusDisplay").textContent = `Throw measured successfully! (${Math.round(distanceFeet / 3.28084)} meters)`;

                saveThrow(distanceFeet);
                renderThrowHistory();

                endBtn.setAttribute("disabled", "true");
                startBtn.style.opacity = "1";
            },
            function(error) {
                alert("Error getting GPS location: " + error.message);
                document.getElementById("statusDisplay").textContent = "Failed to get GPS location.";
            },
            GPS_OPTIONS
        );
    });

    resetBtn.addEventListener("click", function() {
        startCoords = null;
        document.getElementById("distanceDisplay").textContent = "0 ft";
        document.getElementById("statusDisplay").textContent = `Tap "Set Tee (Start)" where you are throwing from.`;
        startBtn.style.opacity = "1";
        endBtn.setAttribute("disabled", "true");
        resetBtn.style.display = "none";

        if (startMarker) map.removeLayer(startMarker);
        if (endMarker) map.removeLayer(endMarker);
        if (throwLine) map.removeLayer(throwLine);
    });
});

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Radius of Earth in miles
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceMiles = R * c;
    const distanceFeet = distanceMiles * 5280;

    return Math.round(distanceFeet);
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

function saveThrow(distance) {
    const throws = JSON.parse(localStorage.getItem("discGolfThrows")) || [];
    const newThrow = {
        distance: distance,
        date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    };
    throws.unshift(newThrow);
    localStorage.setItem("discGolfThrows", JSON.stringify(throws));
}

function renderThrowHistory() {
    const listEl = document.getElementById("throwList");
    if (!listEl) return;

    const throws = JSON.parse(localStorage.getItem("discGolfThrows")) || [];

    if (throws.length === 0) {
        listEl.innerHTML = `<p class="no-rounds-text">No saved throws yet.</p>`;
        return;
    }

    listEl.innerHTML = "";
    throws.forEach((t, index) => {
        const item = document.createElement("div");
        item.className = "hole-row";
        item.style.margin = "0";
        item.innerHTML = `
            <div>
                <strong>${t.distance} ft</strong>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">${t.date}</div>
            </div>
            <button type="button" onclick="deleteThrow(${index})" style="background: #a94442; color: white; border: none; padding: 6px 10px; border-radius: 3px; cursor: pointer; font-family: monospace;">X</button>
        `;
        listEl.appendChild(item);
    });
}

function deleteThrow(index) {
    const throws = JSON.parse(localStorage.getItem("discGolfThrows")) || [];
    throws.splice(index, 1);
    localStorage.setItem("discGolfThrows", JSON.stringify(throws));
    renderThrowHistory();
}