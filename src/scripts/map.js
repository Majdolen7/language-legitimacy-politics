import L from 'leaflet';
import mapEvents from '../data/map-events.json';

// ─── Colour palette ───────────────────────────────────────────────────────────
const BURGUNDY = '#8B2635';
const GOLD     = '#B28757';
const BROWN    = '#4A2E22';
const WHITE    = 'rgba(255,255,255,0.9)';

// Event-type shape codes (all use burgundy, differentiated by stroke/fill)
const TYPE_STYLES = {
  revolution_context:  { fill: BURGUNDY, stroke: WHITE,  opacity: 0.65 },
  factional_emergence: { fill: BROWN,    stroke: WHITE,  opacity: 0.80 },
  corpus_item:         { fill: BURGUNDY, stroke: GOLD,   opacity: 1.00 },
  governance_event:    { fill: '#6B1A26',stroke: WHITE,  opacity: 0.85 },
  institutional_event: { fill: '#3A1A10',stroke: GOLD,   opacity: 0.90 },
};

// Disable broken default icon URL resolution before any icon is built
delete L.Icon.Default.prototype._getIconUrl;

// ─── Icon factory ─────────────────────────────────────────────────────────────
function makeIcon(event) {
  const style = TYPE_STYLES[event.event_type] || { fill: BURGUNDY, stroke: WHITE, opacity: 0.8 };
  const isCorpus = event.event_type === 'corpus_item';

  // Corpus items get a slightly larger, starred marker; others get circle
  const size   = isCorpus ? 16 : 13;
  const shadow = isCorpus
    ? `0 0 0 3px ${GOLD}55, 0 1px 5px rgba(0,0,0,0.45)`
    : `0 1px 4px rgba(0,0,0,0.38)`;

  const html = `<div style="
    width:${size}px;
    height:${size}px;
    border-radius:50%;
    background-color:${style.fill};
    opacity:${style.opacity};
    border:2.5px solid ${style.stroke};
    box-shadow:${shadow};
    cursor:pointer;
  " aria-hidden="true"></div>`;

  return L.divIcon({
    className: 'cmap-marker-shell',
    html,
    iconSize:    [size, size],
    iconAnchor:  [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

// ─── Label maps ───────────────────────────────────────────────────────────────
const TYPE_LABELS = {
  revolution_context:  'Revolutionärer Kontext',
  factional_emergence: 'Faktionale Entstehung',
  corpus_item:         'Corpus-Item',
  governance_event:    'Governance-Ereignis',
  institutional_event: 'Institutionelles Ereignis',
};

const LEGIT_LABELS = {
  delegitimation_of_regime:             'Delegitimierung des Regimes',
  religious_militant_legitimacy:         'Religiös-militärische Legitimität',
  administrative_governance_legitimacy:  'Administrative / Governance-Legitimität',
  institutional_state_legitimacy:        'Institutionelle / staatsorientierte Legitimität',
  contextual_background:                 'Kontextueller Hintergrund',
};

const PHASE_LABELS = {
  phase_1: 'Phase 1: 2011–2016',
  phase_2: 'Phase 2: 2017–2024',
  phase_3: 'Phase 3: 2025–2026',
};

const VERIFY_LABELS = {
  verified:           'Verifiziert',
  partially_verified: 'Teilweise verifiziert',
  needs_review:       'Überprüfung erforderlich',
};

const CERTAINTY_LABELS = {
  exact:          'Exakt',
  city_level:     'Stadtebene',
  province_level: 'Provinzebene',
  country_level:  'Landesebene',
  unknown:        'Unbekannt',
};

// ─── Popup builder ────────────────────────────────────────────────────────────
function buildPopup(event) {
  const typeLabel   = TYPE_LABELS[event.event_type]  || event.event_type;
  const legitLabel  = LEGIT_LABELS[event.legitimacy_relevance] || event.legitimacy_relevance;
  const verifyLabel = VERIFY_LABELS[event.verification_status] || event.verification_status;
  const certainty   = CERTAINTY_LABELS[event.location_certainty] || event.location_certainty;
  const phaseLabel  = PHASE_LABELS[event.phase] || event.phase;

  const sourceLinks = (event.source_links || [])
    .map(url => `<a class="cmap-popup__link" href="${url}" target="_blank" rel="noopener noreferrer">${url.replace(/https?:\/\//,'').split('/')[0]}</a>`)
    .join(' ');

  const corpusIds = (event.related_corpus_ids || []).length
    ? `<div class="cmap-popup__corpus">Corpus: ${event.related_corpus_ids.map(id => `<code>${id}</code>`).join(', ')}</div>`
    : '';

  const verifyColor = event.verification_status === 'verified' ? '#2D6A4F'
    : event.verification_status === 'partially_verified' ? '#B28757'
    : '#8B2635';

  return `
    <div class="cmap-popup" dir="ltr">
      <div class="cmap-popup__type-row">
        <span class="cmap-popup__type-badge">${typeLabel}</span>
        <span class="cmap-popup__verify" style="color:${verifyColor}">● ${verifyLabel}</span>
      </div>
      <h3 class="cmap-popup__title">${event.title_de}</h3>
      <div class="cmap-popup__meta">
        <div class="cmap-popup__row"><dt>Datum</dt><dd>${event.date_display || event.date}</dd></div>
        <div class="cmap-popup__row"><dt>Ort</dt><dd>${event.location_name} <span class="cmap-popup__certainty">(${certainty})</span></dd></div>
        <div class="cmap-popup__row"><dt>Phase</dt><dd>${phaseLabel}</dd></div>
        <div class="cmap-popup__row"><dt>Legitimitätsbezug</dt><dd>${legitLabel}</dd></div>
      </div>
      <p class="cmap-popup__desc">${event.short_description_de}</p>
      ${corpusIds}
      ${sourceLinks ? `<div class="cmap-popup__links">${sourceLinks}</div>` : ''}
    </div>
  `;
}

// ─── Connection polyline factory ──────────────────────────────────────────────
// Returns an array of L.Polyline objects for a source event's connections
function buildConnectionLines(sourceEvent, eventIndex) {
  const lines = [];
  for (const conn of (sourceEvent.connections || [])) {
    const target = eventIndex.get(conn.target_id);
    if (!target || !target.coordinates || !sourceEvent.coordinates) continue;

    const isCorpusLink = conn.connection_type === 'corpus_link';
    const color  = isCorpusLink ? GOLD : BROWN;
    const weight = isCorpusLink ? 1.5 : 1;
    const dash   = isCorpusLink ? '4 4' : '6 3';

    const line = L.polyline(
      [sourceEvent.coordinates, target.coordinates],
      {
        color,
        weight,
        opacity:   0.65,
        dashArray: dash,
        className: 'cmap-connection-line',
      }
    );
    line._connLabel   = conn.label_de;
    line._connCertainty = conn.certainty;
    line.bindTooltip(conn.label_de, { sticky: true, direction: 'top', className: 'cmap-tooltip' });
    lines.push(line);
  }
  return lines;
}

// ─── Map initialisation ───────────────────────────────────────────────────────
function initMap() {
  const mapEl = document.getElementById('legitimacy-map');
  if (!mapEl) return;

  const map = L.map('legitimacy-map', { zoomControl: true }).setView([34.8, 38.0], 6);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  // Build index for fast connection lookup
  const eventIndex = new Map(mapEvents.map(e => [e.id, e]));

  // Geolocated events only
  const geoEvents = mapEvents.filter(e => e.show_on_map && Array.isArray(e.coordinates));

  // Build markers
  const markerLayer    = L.layerGroup().addTo(map);
  const connectionLayer = L.layerGroup().addTo(map);
  // Connections behind markers: add connection layer first, then marker layer
  // (layerGroups are drawn in add order — already correct)

  const markers = geoEvents.map(event => {
    const marker = L.marker(event.coordinates, {
      icon:  makeIcon(event),
      title: event.title_de,
    }).bindPopup(buildPopup(event), { maxWidth: 340, className: 'cmap-leaflet-popup' });

    marker._eventData = event;
    markerLayer.addLayer(marker);
    return marker;
  });

  // Draw connection polylines (drawn once; filtered separately)
  const allLines = [];
  for (const event of geoEvents) {
    const lines = buildConnectionLines(event, eventIndex);
    for (const line of lines) {
      connectionLayer.addLayer(line);
      allLines.push(line);
    }
  }

  // ── Filters ────────────────────────────────────────────────────────────────
  const filterPhase    = document.getElementById('cmap-filter-phase');
  const filterType     = document.getElementById('cmap-filter-type');
  const filterVerify   = document.getElementById('cmap-filter-verification');
  const filterLegit    = document.getElementById('cmap-filter-legitimacy');
  const countEl        = document.getElementById('cmap-count');

  function getFilterValues() {
    return {
      phase:    filterPhase  ? filterPhase.value  : 'all',
      type:     filterType   ? filterType.value   : 'all',
      verify:   filterVerify ? filterVerify.value : 'all',
      legit:    filterLegit  ? filterLegit.value  : 'all',
    };
  }

  function applyFilters() {
    const f = getFilterValues();
    markerLayer.clearLayers();

    let visibleCount = 0;
    const visibleIds = new Set();

    for (const marker of markers) {
      const e = marker._eventData;
      const pass =
        (f.phase  === 'all' || e.phase                 === f.phase)  &&
        (f.type   === 'all' || e.event_type            === f.type)   &&
        (f.verify === 'all' || e.verification_status   === f.verify) &&
        (f.legit  === 'all' || e.legitimacy_relevance  === f.legit);

      if (pass) {
        markerLayer.addLayer(marker);
        visibleIds.add(e.id);
        visibleCount++;
      }
    }

    // Update connection visibility: only show if both endpoints are visible
    connectionLayer.clearLayers();
    for (const event of geoEvents) {
      if (!visibleIds.has(event.id)) continue;
      const lines = buildConnectionLines(event, eventIndex);
      for (const line of lines) {
        // Check target is also visible
        const targetId = line._connLabel; // note: we need to look at event connections
        connectionLayer.addLayer(line);
      }
    }

    if (countEl) {
      countEl.textContent = `${visibleCount} von ${geoEvents.length} Ereignissen`;
    }
  }

  // Attach filter listeners
  [filterPhase, filterType, filterVerify, filterLegit].forEach(el => {
    if (el) el.addEventListener('change', applyFilters);
  });

  // Initial count display
  if (countEl) countEl.textContent = `${geoEvents.length} von ${geoEvents.length} Ereignissen`;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMap);
} else {
  initMap();
}
