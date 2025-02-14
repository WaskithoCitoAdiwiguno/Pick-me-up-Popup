import Map from "https://cdn.skypack.dev/ol/Map.js";
import View from "https://cdn.skypack.dev/ol/View.js";
import TileLayer from "https://cdn.skypack.dev/ol/layer/Tile.js";
import OSM from "https://cdn.skypack.dev/ol/source/OSM.js";
import Overlay from "https://cdn.skypack.dev/ol/Overlay.js";
import { toLonLat, fromLonLat } from "https://cdn.skypack.dev/ol/proj.js";
import Feature from "https://cdn.skypack.dev/ol/Feature.js";
import Point from "https://cdn.skypack.dev/ol/geom/Point.js";
import VectorSource from "https://cdn.skypack.dev/ol/source/Vector.js";
import VectorLayer from "https://cdn.skypack.dev/ol/layer/Vector.js";
import { Style, Icon } from "https://cdn.skypack.dev/ol/style.js";
import Swal from "https://cdn.skypack.dev/sweetalert2";


// Langsung buat TileLayer dengan source OSM agar peta tampil dari awal
const layer = new TileLayer({
  source: new OSM(),
});

// Create Map
const map = new Map({
  target: "map",
  layers: [layer],
  view: new View({
    center: fromLonLat([107.57634352477324, -6.87436891415509]), // Center to Sarijadi, Bandung
    zoom: 16,
  }),
});

// Tombol hide/unhide UI
const toggleUIBtn = document.createElement('button');
toggleUIBtn.textContent = 'Hide UI';
toggleUIBtn.style.position = 'absolute';
toggleUIBtn.style.top = '10px';
toggleUIBtn.style.right = '10px';
toggleUIBtn.style.zIndex = '1200';
toggleUIBtn.style.background = '#28a745';
toggleUIBtn.style.color = 'white';
toggleUIBtn.style.border = 'none';
toggleUIBtn.style.padding = '10px 15px';
toggleUIBtn.style.borderRadius = '5px';
toggleUIBtn.style.cursor = 'pointer';
document.body.appendChild(toggleUIBtn);

let uiHidden = false;
toggleUIBtn.addEventListener('click', () => {
  const controls = document.getElementById('controls');
  if (!uiHidden) {
    controls.style.display = 'none';
    toggleUIBtn.textContent = 'Show UI';
    uiHidden = true;
  } else {
    controls.style.display = 'block';
    toggleUIBtn.textContent = 'Hide UI';
    uiHidden = false;
  }
});

// Pop-up untuk informasi lokasi
const popup = document.createElement("div");
popup.className = "popup";
document.body.appendChild(popup);

const overlay = new Overlay({
  element: popup,
  autoPan: true,
});
map.addOverlay(overlay);

// Sumber data marker
const markerSource = new VectorSource();
const markerLayer = new VectorLayer({
  source: markerSource,
});
map.addLayer(markerLayer);

// Variabel untuk melacak status pop-up
let popupVisible = true;
let userCoordinates = null;
let userLongitude = null;
let userLatitude = null;

// Ambil lokasi pengguna
navigator.geolocation.getCurrentPosition(
  (pos) => {
    const { latitude, longitude } = pos.coords;
    userCoordinates = fromLonLat([longitude, latitude]);
    userLongitude = longitude;
    userLatitude = latitude;
    
    map.getView().setCenter(userCoordinates);
    map.getView().setZoom(20);

    const marker = new Feature({
      geometry: new Point(userCoordinates),
    });
    marker.setStyle(
      new Style({
        image: new Icon({
          src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
          scale: 0.05,
        }),
      })
    );
    markerSource.addFeature(marker);

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lon=${longitude}&lat=${latitude}`)
      .then((response) => response.json())
      .then((data) => {
        const locationName = data.display_name || "Tidak ada data lokasi";
        popup.innerHTML = `
          <button class="close-btn">&times;</button>
          <h3>Lokasi Anda</h3>
          <p><strong>Alamat:</strong> ${locationName}</p>
          <p><strong>Koordinat:</strong> ${longitude.toFixed(6)}, ${latitude.toFixed(6)}</p>
        `;
        overlay.setPosition(userCoordinates);

        popup.querySelector(".close-btn").addEventListener("click", () => {
          overlay.setPosition(undefined);
          popupVisible = false;
        });
      })
      .catch(() => {
        popup.innerHTML = `
          <button class="close-btn">&times;</button>
          <h3>Lokasi Anda</h3>
          <p>Data lokasi tidak ditemukan.</p>
          <p><strong>Koordinat:</strong> ${longitude.toFixed(6)}, ${latitude.toFixed(6)}</p>
        `;
        overlay.setPosition(userCoordinates);
        popup.querySelector(".close-btn").addEventListener("click", () => {
          overlay.setPosition(undefined);
          popupVisible = false;
        });
      });
  },
  () => {
    Swal.fire({
      title: "Error",
      text: "Gagal mengambil lokasi. Pastikan Anda memberikan izin akses lokasi.",
      icon: "error",
    });
  }
);

// Event klik di peta untuk mendapatkan informasi lokasi
map.on('click', function (event) {
  const clickedCoordinates = event.coordinate;
  const [longitude, latitude] = toLonLat(clickedCoordinates);

  markerSource.clear();

  const marker = new Feature({
    geometry: new Point(clickedCoordinates)
  });
  marker.setStyle(new Style({
    image: new Icon({
      src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
      scale: 0.05
    })
  }));
  markerSource.addFeature(marker);

  const popupContent = `
    <button class="close-btn">&times;</button>
    <h3>Lokasi Anda</h3>
    <p><strong>Alamat:</strong> Pusdiklat Pos, Jalan Kampus Polban, Ciwaruga, West Bandung, West Java, Java, 40515, Indonesia</p>
    <p><strong>Koordinat:</strong> 107.575250, -6.873057</p>
  `;

  popup.innerHTML = popupContent;
  overlay.setPosition(clickedCoordinates);

  const pinButton = popup.querySelector('.pin-btn');
  pinButton.addEventListener('click', () => {
    const marker = new Feature({
      geometry: new Point(clickedCoordinates)
    });
    marker.setStyle(new Style({
      image: new Icon({
        src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
        scale: 0.05
      })
    }));
    markerSource.addFeature(marker);
  });

  const closeButton = popup.querySelector('.close-btn');
  closeButton.addEventListener('click', () => {
    overlay.setPosition(undefined);
  });
});

const backToLocationButton = document.getElementById("back-to-location");

document.getElementById("back-to-location").onclick = function () {
  if (userCoordinates) {
    map.getView().setCenter(userCoordinates);
    map.getView().setZoom(20);

    const marker = new Feature({
      geometry: new Point(userCoordinates),
    });
    marker.setStyle(
      new Style({
        image: new Icon({
          src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
          scale: 0.05,
        }),
      })
    );
    markerSource.addFeature(marker);

    if (userLongitude !== null && userLatitude !== null) {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lon=${userLongitude}&lat=${userLatitude}`)
        .then((response) => response.json())
        .then((data) => {
          const locationName = data.display_name || "Tidak ada data lokasi";
          popup.innerHTML = `
          <button class="close-btn">&times;</button>
          <h3>Lokasi Anda</h3>
          <p>Data lokasi tidak ditemukan.</p>
          <p><strong>Koordinat:</strong> ${longitude.toFixed(6)}, ${latitude.toFixed(6)}</p>
          `;
          overlay.setPosition(userCoordinates);

          popup.querySelector(".close-btn").addEventListener("click", () => {
            overlay.setPosition(undefined);
            popupVisible = false;
          });
        })
        .catch(() => {
          popup.innerHTML = `
            <button class="close-btn">&times;</button>
            <h3>Lokasi Anda</h3>
            <p>Data lokasi tidak ditemukan.</p>
            <p><strong>Koordinat:</strong> ${userLongitude.toFixed(6)}, ${userLatitude.toFixed(6)}</p>
          `;
          overlay.setPosition(userCoordinates);
          popup.querySelector(".close-btn").addEventListener("click", () => {
            overlay.setPosition(undefined);
            popupVisible = false;
          });
        });
    }
  } else {
    Swal.fire({
      title: "Error",
      text: "Lokasi Anda belum tersedia. Pastikan Anda memberikan izin akses lokasi.",
      icon: "error",
    });
  }
};

const mapElement = document.getElementById('map');
const toggleButton = document.getElementById('toggle-view');
const controls = document.getElementById('controls');
let isFullscreen = false;

toggleButton.addEventListener('click', () => {
  if (isFullscreen) {
    mapElement.classList.remove('fullscreen');
    mapElement.classList.add('webpage');
    toggleButton.textContent = 'Switch to Fullscreen';
  } else {
    mapElement.classList.remove('webpage');
    mapElement.classList.add('fullscreen');
    toggleButton.textContent = 'Switch to Webpage';
  }
  isFullscreen = !isFullscreen;
});

controls.style.position = 'absolute';
controls.style.zIndex = '1100';

const searchInput = document.getElementById('search-location');
const searchButton = document.getElementById('search-button');

// Mengubah tombol search menjadi ikon kaca pembesar
searchButton.innerHTML = '<img src="https://cdn-icons-png.flaticon.com/512/622/622669.png" alt="Search" style="width: 20px; height: 20px; background: none; border: none;">';

searchButton.addEventListener('click', () => {
  const query = searchInput.value;
  if (query && !isFullscreen) {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
      .then(response => response.json())
      .then(results => {
        if (results.length > 0) {
          const { lon, lat } = results[0];
          const coordinates = fromLonLat([parseFloat(lon), parseFloat(lat)]);
          map.getView().setCenter(coordinates);
          map.getView().setZoom(15);
        } else {
          alert('Location not found');
        }
      })
      .catch(error => console.error('Error searching location:', error));
  }
});
