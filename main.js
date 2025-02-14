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

// Variabel untuk menyimpan status layer
let layerVisible = true;
let userCoordinates = null;
let userLongitude = null;
let userLatitude = null;

// Fungsi untuk menampilkan layer
document.getElementById("set-source").onclick = function () {
  layer.setSource(new OSM()); // Menampilkan kembali layer peta
  map.addLayer(markerLayer); // Menampilkan kembali marker layer
  overlay.setPosition(userCoordinates); // Menampilkan kembali pop-up

  layerVisible = true;
  Swal.fire({
    title: "Layer Ditampilkan",
    text: "Layer OpenStreetMap telah ditampilkan.",
    icon: "success",
    timer: 1500,
    showConfirmButton: false,
  });
};

// Fungsi untuk menyembunyikan layer, marker, dan pop-up
document.getElementById("unset-source").onclick = function () {
  layer.setSource(null); // Menyembunyikan peta
  map.removeLayer(markerLayer); // Menyembunyikan marker layer
  overlay.setPosition(undefined); // Menutup pop-up

  layerVisible = false;
  Swal.fire({
    title: "Layer Disembunyikan",
    text: "Layer OpenStreetMap dan markernya telah disembunyikan.",
    icon: "info",
    timer: 1500,
    showConfirmButton: false,
  });
};

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

        if (layerVisible) {
          overlay.setPosition(userCoordinates);
        }

        popup.querySelector(".close-btn").addEventListener("click", () => {
          overlay.setPosition(undefined);
        });
      })
      .catch(() => {
        popup.innerHTML = `
          <button class="close-btn">&times;</button>
          <h3>Lokasi Anda</h3>
          <p>Data lokasi tidak ditemukan.</p>
          <p><strong>Koordinat:</strong> ${longitude.toFixed(6)}, ${latitude.toFixed(6)}</p>
        `;

        if (layerVisible) {
          overlay.setPosition(userCoordinates);
        }

        popup.querySelector(".close-btn").addEventListener("click", () => {
          overlay.setPosition(undefined);
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
map.on("click", function (event) {
  if (!layerVisible) return; // Jangan tampilkan marker atau pop-up jika layer disembunyikan

  const clickedCoordinates = toLonLat(event.coordinate);
  const [longitude, latitude] = clickedCoordinates;

  markerSource.clear(); // Hapus semua marker lama

  const marker = new Feature({
    geometry: new Point(event.coordinate),
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
      const locationName = data.display_name || "Informasi lokasi tidak ditemukan";

      popup.innerHTML = `
        <button class="close-btn">&times;</button>
        <h3>Informasi Lokasi</h3>
        <p><strong>Alamat:</strong> ${locationName}</p>
        <p><strong>Koordinat:</strong> ${longitude.toFixed(6)}, ${latitude.toFixed(6)}</p>
      `;

      overlay.setPosition(event.coordinate);

      popup.querySelector(".close-btn").addEventListener("click", () => {
        overlay.setPosition(undefined);
      });
    })
    .catch(() => {
      popup.innerHTML = `
        <button class="close-btn">&times;</button>
        <h3>Informasi Lokasi</h3>
        <p>Data lokasi tidak ditemukan.</p>
        <p><strong>Koordinat:</strong> ${longitude.toFixed(6)}, ${latitude.toFixed(6)}</p>
      `;

      overlay.setPosition(event.coordinate);

      popup.querySelector(".close-btn").addEventListener("click", () => {
        overlay.setPosition(undefined);
      });
    });
});

// Fungsi untuk kembali ke lokasi pengguna
document.getElementById("back-to-location").onclick = function () {
  if (userCoordinates) {
    map.getView().setCenter(userCoordinates);
    map.getView().setZoom(20);

    if (layerVisible) {
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

      overlay.setPosition(userCoordinates);
    }
  } else {
    Swal.fire({
      title: "Error",
      text: "Lokasi Anda belum tersedia. Pastikan Anda memberikan izin akses lokasi.",
      icon: "error",
    });
  }
};

const searchInput = document.getElementById('search-location');
const searchButton = document.getElementById('search-button');

// Mengubah tombol search menjadi ikon kaca pembesar
searchButton.innerHTML = '<img src="https://cdn-icons-png.flaticon.com/512/622/622669.png" alt="Search" style="width: 20px; height: 20px; background: none; border: none;">';

searchButton.addEventListener('click', () => {
  const query = searchInput.value;
  if (query) {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
      .then(response => response.json())
      .then(results => {
        if (results.length > 0) {
          const { lon, lat, display_name } = results[0];
          const coordinates = fromLonLat([parseFloat(lon), parseFloat(lat)]);

          // Pindahkan tampilan peta
          map.getView().setCenter(coordinates);
          map.getView().setZoom(15);

          // Bersihkan marker lama
          markerSource.clear();

          // Tambahkan marker baru
          const marker = new Feature({
            geometry: new Point(coordinates),
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

          // Tampilkan popup dengan informasi lokasi
          popup.innerHTML = `
            <button class="close-btn">&times;</button>
            <h3>Hasil Pencarian</h3>
            <p><strong>Alamat:</strong> ${display_name}</p>
            <p><strong>Koordinat:</strong> ${lon}, ${lat}</p>
          `;
          overlay.setPosition(coordinates);

          // Event untuk menutup popup
          popup.querySelector(".close-btn").addEventListener("click", () => {
            overlay.setPosition(undefined);
          });
        } else {
          Swal.fire({
            title: "Lokasi Tidak Ditemukan",
            text: `Lokasi "${query}" tidak ditemukan. Coba lagi dengan kata kunci lain.`,
            icon: "warning",
            timer: 2000,
            showConfirmButton: false,
          });
        }
      })
      .catch(error => {
        Swal.fire({
          title: "Error",
          text: "Terjadi kesalahan saat mencari lokasi.",
          icon: "error",
        });
        console.error('Error searching location:', error);
      });
  } else {
    Swal.fire({
      title: "Input Kosong",
      text: "Masukkan nama lokasi terlebih dahulu.",
      icon: "info",
      timer: 1500,
      showConfirmButton: false,
    });
  }
});


//ui

