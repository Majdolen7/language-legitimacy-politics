import L from 'leaflet';
import allCorpus from '../data/speeches.json';

// Phase colours — used for primary corpus markers
const PHASE_COLORS = {
  'Phase 1: Jabhat al-Nusra (2013–2016)':       '#8B5E35',
  'Phase 2: Jabhat Fath al-Sham (2016–2017)':   '#9A7B4A',
  'Phase 3: Hayat Tahrir al-Sham (2017–2024)':  '#4A5C38',
  'Phase 4: Post-Regime Transition (2024–)':     '#2A3848',
};
const CONTEXT_COLOR   = '#7A6555'; // neutral warm gray for context events
const FALLBACK_COLOR  = '#9A7B4A'; // muted gold

// Avoid broken default marker icon requests when using divIcon
delete L.Icon.Default.prototype._getIconUrl;

// ------------------------------------------------------------------
// Items eligible for the map
// ------------------------------------------------------------------
const mapItems = allCorpus.filter(s =>
  s.geospatial_status === 'Geolocated' &&
  s.latitude  !== null &&
  s.longitude !== null
);

const primaryMapItems = mapItems.filter(s => s.material_type === 'Primary corpus item');
const contextMapItems = mapItems.filter(s => s.material_type === 'Context event');

// ------------------------------------------------------------------
// Icon factories
// ------------------------------------------------------------------
function primaryIcon(phase) {
  const color = PHASE_COLORS[phase] || FALLBACK_COLOR;
  return L.divIcon({
    className: 'lm-marker-shell',
    html: `<div style="width:14px;height:14px;border-radius:50%;background-color:${color};border:2.5px solid rgba(255,255,255,0.85);box-shadow:0 1px 4px rgba(0,0,0,0.38);cursor:pointer;" aria-hidden="true"></div>`,
    iconSize:    [14, 14],
    iconAnchor:  [7, 7],
    popupAnchor: [0, -10],
  });
}

function contextIcon() {
  return L.divIcon({
    className: 'lm-marker-shell',
    html: `<div style="width:12px;height:12px;background-color:${CONTEXT_COLOR};border:2px solid rgba(255,255,255,0.8);box-shadow:0 1px 3px rgba(0,0,0,0.3);cursor:pointer;transform:rotate(45deg);" aria-hidden="true"></div>`,
    iconSize:    [12, 12],
    iconAnchor:  [6, 6],
    popupAnchor: [0, -10],
  });
}

// ------------------------------------------------------------------
// Popup builder
// ------------------------------------------------------------------
function buildPopup(item) {
  const phaseColor = PHASE_COLORS[item.phase] || FALLBACK_COLOR;
  const color      = item.material_type === 'Primary corpus item' ? phaseColor : CONTEXT_COLOR;

  const keywords = (item.keywords || [])
    .map(k => `<span class="lm-popup__keyword">${k}</span>`)
    .join('');

  const links = [];
  if (item.video)      links.push(`<a class="lm-popup__link" href="${item.video}" target="_blank" rel="noopener noreferrer">Video</a>`);
  if (item.transcript) links.push(`<a class="lm-popup__link" href="${item.transcript}" target="_blank" rel="noopener noreferrer">Transcript</a>`);
  if (item.source)     links.push(`<a class="lm-popup__link" href="${item.source}" target="_blank" rel="noopener noreferrer">Source</a>`);

  return `
    <div class="lm-popup">
      <h3>${item.title}</h3>
      <div class="lm-popup__meta">
        <p><strong>Speaker:</strong> ${item.speaker_name_used || item.speaker}</p>
        <p><strong>Date:</strong> ${item.date}</p>
        <p><strong>Location:</strong> ${item.exact_location}</p>
        <p><strong>Phase:</strong> ${item.phase}</p>
        <p><strong>Type:</strong> ${item.speech_type}</p>
        <p><strong>Material:</strong> ${item.material_type}</p>
      </div>
      <span class="lm-popup__badge" style="background:${color}22;color:${color};border:1px solid ${color}55;">${item.phase}</span>
      ${keywords ? `<div class="lm-popup__keywords">${keywords}</div>` : ''}
      <p class="lm-popup__summary">${item.summary}</p>
      ${links.length ? `<div class="lm-popup__links">${links.join('')}</div>` : ''}
      <p class="lm-popup__certainty">Location certainty: ${item.location_certainty} &middot; ${item.geospatial_status}</p>
    </div>
  `;
}

// ------------------------------------------------------------------
// Map initialisation
// ------------------------------------------------------------------
function initMap() {
  const mapEl = document.getElementById('legitimacy-map');
  if (!mapEl) return;

  const map = L.map('legitimacy-map', { zoomControl: true }).setView([34.8, 38.0], 6);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  const layerGroup = L.layerGroup().addTo(map);

  // Build marker list for primary items
  const primaryMarkers = primaryMapItems.map(item => {
    const marker = L.marker([item.latitude, item.longitude], {
      icon:  primaryIcon(item.phase),
      title: item.title,
    }).bindPopup(buildPopup(item), { maxWidth: 320, className: 'lm-leaflet-popup' });
    marker._phase        = item.phase;
    marker._materialType = item.material_type;
    layerGroup.addLayer(marker);
    return marker;
  });

  // Build marker list for context items (always visible, different icon)
  const contextMarkers = contextMapItems.map(item => {
    const marker = L.marker([item.latitude, item.longitude], {
      icon:  contextIcon(),
      title: item.title,
    }).bindPopup(buildPopup(item), { maxWidth: 320, className: 'lm-leaflet-popup' });
    marker._phase        = item.phase;
    marker._materialType = item.material_type;
    layerGroup.addLayer(marker);
    return marker;
  });

  // ------------------------------------------------------------------
  // Filter by phase (primary corpus only; context markers stay visible)
  // ------------------------------------------------------------------
  const filterEl = document.getElementById('map-filter-phase');
  const countEl  = document.getElementById('map-geo-count');

  function setCount(n) {
    if (countEl) {
      countEl.innerHTML = `<strong>${n}</strong> of <strong>${primaryMapItems.length}</strong> geolocated speeches displayed`;
    }
  }

  function applyFilter() {
    const selected = filterEl ? filterEl.value : 'all';
    layerGroup.clearLayers();

    // Context markers always stay on map
    contextMarkers.forEach(m => layerGroup.addLayer(m));

    let visible = 0;
    primaryMarkers.forEach(marker => {
      if (selected === 'all' || marker._phase === selected) {
        layerGroup.addLayer(marker);
        visible++;
      }
    });
    setCount(visible);
  }

  if (filterEl) filterEl.addEventListener('change', applyFilter);
  setCount(primaryMapItems.length);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMap);
} else {
  initMap();
}
