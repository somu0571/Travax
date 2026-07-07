document.addEventListener("DOMContentLoaded", () => {
    const mapContainer = document.getElementById('map');
    if (mapContainer && mapContainer._leaflet_id) {
        mapContainer._leaflet_id = null;
    }

    let currentCoords = [75.7873, 26.9124]; // Default to Jaipur fallback
    if (typeof coordinates !== 'undefined' && Array.isArray(coordinates) && coordinates.length >= 2) {
        currentCoords = coordinates;
    } else {
        console.warn("Coordinates missing or malformed. Defaulting to fallback view.");
    }

    const lng = currentCoords[0];
    const lat = currentCoords[1];

    const map = L.map('map').setView([lat, lng], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const title = typeof listingTitle !== 'undefined' ? listingTitle : "Stay Location";
    L.marker([lat, lng]).addTo(map)
        .bindPopup(`<h6><b>${title}</b></h6><p class="mb-0 text-muted">Exact location provided after booking.</p>`)
        .openPopup();

    setTimeout(() => {
        map.invalidateSize();
    }, 200);
});