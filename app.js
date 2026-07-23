/* ================================================
   MIXTAPE FOR YOU — app.js
   ================================================ */

// ═══════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════
const state = {
  currentStep:      0,
  cassetteColor:    '#f0ede4',
  cassetteAccent:   '#aecfd8',
  selectedStickers: [null, null, null],
  songs:            [],       // { name, artist, url, file }
  note:             '',
  currentTrack:     0,
  isPlaying:        false
};

const STICKERS = [
  { emoji: '🌿' }, { emoji: '🌸' }, { emoji: '🎀' }, { emoji: '🍀' },
  { emoji: '⭐' }, { emoji: '🦋' }, { emoji: '🌙' }, { emoji: '🌻' },
  { emoji: '🍂' }, { emoji: '🌺' }, { emoji: '💐' }, { emoji: '🎵' }
];

const MAX_SONGS = 8;

// ═══════════════════════════════════════════════
// SHARE LINK — encode/decode mixtape state in the URL
// ═══════════════════════════════════════════════
// No hay backend: el link "es" la data. Guardamos color,
// stickers, nota y qué canciones de SONG_LIBRARY eligió
// dentro del hash de la URL (#m=...). Al abrir un link con
// ese hash, la página se salta la creación y muestra
// directo el mixtape ya armado.
function encodeState() {
  const payload = {
    c:  state.cassetteColor,
    a:  state.cassetteAccent,
    st: state.selectedStickers,
    n:  state.note,
    sg: state.songs.map(s => s.libraryIdx).filter(i => i !== undefined && i !== null)
  };
  return btoa(encodeURIComponent(JSON.stringify(payload)));
}

function decodeState(encoded) {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded)));
  } catch (e) {
    return null;
  }
}

function buildShareUrl() {
  const base = (location.origin && location.origin !== 'null')
    ? location.origin + location.pathname
    : location.pathname;
  return base + '#m=' + encodeState();
}

// If the page was opened with a #m= link, load that mixtape
// directly into the finished "share" view instead of the landing page.
function loadFromShareLink() {
  const match = location.hash.match(/m=([^&]+)/);
  if (!match) return false;

  const data = decodeState(match[1]);
  if (!data) return false;

  state.cassetteColor    = data.c  || state.cassetteColor;
  state.cassetteAccent   = data.a  || state.cassetteAccent;
  state.selectedStickers = data.st || state.selectedStickers;
  state.note             = data.n  || '';
  state.songs = (data.sg || []).map(idx => {
    const track = SONG_LIBRARY[idx];
    if (!track) return null;
    return { name: track.name, artist: track.artist, url: 'songs/' + track.file, libraryIdx: idx };
  }).filter(Boolean);

  document.getElementById('landing').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page5').classList.add('active');

  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById('dot' + i);
    dot.classList.remove('active');
    dot.classList.add('done');
  }

  document.getElementById('shareNoteText').textContent = state.note || '♪ Aquí tienes tu mixtape ♪';
  const linkInput = document.getElementById('shareLink');
  if (linkInput) linkInput.value = buildShareUrl();

  syncStickerSlots();
  syncSongLines();
  refreshShareCassette();
  buildPlaylist();
  return true;
}

// ═══════════════════════════════════════════════
// SONG LIBRARY — real files stored in /songs
// ═══════════════════════════════════════════════
// Edita esta lista: "file" debe ser el nombre EXACTO
// del archivo que pusiste dentro de la carpeta /songs.
// Como son archivos reales (no subidas temporales),
// funcionan igual para ti y para quien reciba la carpeta.
const SONG_LIBRARY = [
  { name: 'Acá Entre Nos',   artist: 'Artista',  file: 'AcaEntreNos.mp3' },
  { name: 'Esta Cobardía',   artist: 'Artista',  file: 'EstaCobardia.mp3' },
  { name: 'Frailejón',       artist: 'Artista',  file: 'Frailejon.mp3' },
  { name: 'Perfect',         artist: 'Artista',  file: 'Perfect.mp3' },
  { name: 'Quién Fuera',     artist: 'Artista',  file: 'QuienFuera.mp3' },
  { name: 'Shallow',         artist: 'Artista',  file: 'Shallow.mp3' },
  { name: 'Siempre Seré',    artist: 'Artista',  file: 'SiempreSere.mp3' },
  { name: 'Tengo Ganas',     artist: 'Artista',  file: 'TengoGanas.mp3' },
  // Agrega más líneas aquí siguiendo el mismo formato ↑
];


// ═══════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════
function showApp() {
  document.getElementById('landing').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  buildStickerGrid();
  goStep(1);
}

function showLanding() {
  document.getElementById('landing').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  pauseAudio();
}

function goStep(n) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById('dot' + i);
    dot.classList.remove('active', 'done');
    if      (i < n)  dot.classList.add('done');
    else if (i === n) dot.classList.add('active');
  }

  document.getElementById('page' + n).classList.add('active');
  state.currentStep = n;

  syncStickerSlots();
  syncSongLines();

  // Step 3: update the animated cassette colour + stickers, and build the library
  if (n === 3) {
    refreshStep3Cassette();
    buildSongLibrary();
  }
}

function finish() {
  state.note = document.getElementById('noteText').value;
  document.getElementById('shareNoteText').textContent = state.note || '♪ Aquí tienes tu mixtape ♪';

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page5').classList.add('active');

  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById('dot' + i);
    dot.classList.remove('active');
    dot.classList.add('done');
  }

  syncStickerSlots();
  syncSongLines();
  refreshShareCassette();
  buildPlaylist();

  // Generate the real, self-contained share link
  const linkInput = document.getElementById('shareLink');
  if (linkInput) linkInput.value = buildShareUrl();
  history.replaceState(null, '', '#m=' + encodeState());
}


// ═══════════════════════════════════════════════
// STEP 1 — COLOR
// ═══════════════════════════════════════════════
function selectColor(el) {
  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  state.cassetteColor  = el.dataset.color;
  state.cassetteAccent = el.dataset.accent;

  // Update step-1 cassette
  document.getElementById('cassetteBody').setAttribute('fill', state.cassetteColor);
  ['btmCirc1','btmCirc2','btmCirc3','btmCirc4'].forEach(id => {
    document.getElementById(id).setAttribute('fill', state.cassetteAccent);
  });
}


// ═══════════════════════════════════════════════
// STEP 2 — STICKERS
// ═══════════════════════════════════════════════
function buildStickerGrid() {
  const grid = document.getElementById('stickerGrid');
  grid.innerHTML = '';
  STICKERS.forEach((s, idx) => {
    const btn = document.createElement('button');
    btn.className    = 'sticker-btn';
    btn.dataset.idx  = idx;
    btn.innerHTML    = `${s.emoji}<div class="check">✓</div>`;
    btn.onclick      = () => toggleSticker(idx, btn);
    grid.appendChild(btn);
  });
}

function toggleSticker(idx, btn) {
  const emoji       = STICKERS[idx].emoji;
  const existingSlot = state.selectedStickers.indexOf(emoji);

  if (existingSlot !== -1) {
    state.selectedStickers[existingSlot] = null;
    btn.classList.remove('selected');
  } else {
    const emptySlot = state.selectedStickers.indexOf(null);
    if (emptySlot !== -1) {
      state.selectedStickers[emptySlot] = emoji;
      btn.classList.add('selected');
    } else {
      showToast('Máximo 3 stickers'); return;
    }
  }
  syncStickerSlots();
}

// Sync sticker slots across ALL pages that have them
function syncStickerSlots() {
  const prefixes = ['slot','pslot','nslot','sslot'];
  prefixes.forEach(prefix => {
    for (let i = 0; i < 3; i++) {
      const el = document.getElementById(prefix + i);
      if (el) el.textContent = state.selectedStickers[i] || '\u3000';
    }
  });
  // Also update the SVG stickers on step 3 and step 5
  refreshStep3SvgStickers();
  refreshShareSvgStickers();
}


// ═══════════════════════════════════════════════
// STEP 3 — ANIMATED CASSETTE helpers
// ═══════════════════════════════════════════════

// Apply current colour to the step-3 cassette SVG
function refreshStep3Cassette() {
  const body = document.getElementById('s3CassetteBody');
  if (body) body.setAttribute('fill', state.cassetteColor);
  ['s3Circ1','s3Circ2','s3Circ3','s3Circ4'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.setAttribute('fill', state.cassetteAccent);
  });
  refreshStep3SvgStickers();
}

// Render up to 3 stickers inside the step-3 cassette SVG
function refreshStep3SvgStickers() {
  renderStickersInGroup('s3StickerGroup');
}

// ═══════════════════════════════════════════════
// STEP 5 — SHARE PAGE animated cassette (mirrors step 3)
// ═══════════════════════════════════════════════
function refreshShareCassette() {
  const body = document.getElementById('s5CassetteBody');
  if (body) body.setAttribute('fill', state.cassetteColor);
  ['s5Circ1','s5Circ2','s5Circ3','s5Circ4'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.setAttribute('fill', state.cassetteAccent);
  });
  refreshShareSvgStickers();
}

function refreshShareSvgStickers() {
  renderStickersInGroup('s5StickerGroup');
}

// Shared helper: draws up to 3 stickers at fixed positions on a cassette SVG group
function renderStickersInGroup(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const positions = [
    { x: 22,  y: 44 },
    { x: 138, y: 42 },
    { x: 288, y: 42 }
  ];

  state.selectedStickers.forEach((emoji, i) => {
    if (!emoji) return;
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', positions[i].x);
    t.setAttribute('y', positions[i].y);
    t.setAttribute('font-size', '22');
    t.textContent = emoji;
    container.appendChild(t);
  });
}


// ═══════════════════════════════════════════════
// STEP 3 — SONG LIBRARY (real files under /songs, no uploads)
// ═══════════════════════════════════════════════

// Render the full library; tapping a card adds/removes it from state.songs
function buildSongLibrary() {
  const list = document.getElementById('songLibrary');
  if (!list) return;
  list.innerHTML = '';

  if (!SONG_LIBRARY.length) {
    list.innerHTML = `<div class="song-library-empty">
      Aún no hay canciones en la carpeta /songs.<br>
      Agrega archivos ahí y súmalos a SONG_LIBRARY en app.js.
    </div>`;
    return;
  }

  SONG_LIBRARY.forEach((track, idx) => {
    const isSelected = state.songs.some(s => s.libraryIdx === idx);
    const div = document.createElement('div');
    div.className = 'song-item' + (isSelected ? ' selected' : '');
    div.innerHTML = `
      <div class="song-thumb">🎵</div>
      <div class="song-info">
        <div class="song-name">${track.name}</div>
        <div class="song-artist">${track.artist}</div>
      </div>
      <div class="song-check">${isSelected ? '✓' : ''}</div>`;
    div.onclick = () => toggleLibrarySong(idx);
    list.appendChild(div);
  });
}

function toggleLibrarySong(idx) {
  const existing = state.songs.findIndex(s => s.libraryIdx === idx);

  if (existing !== -1) {
    state.songs.splice(existing, 1);
  } else {
    if (state.songs.length >= MAX_SONGS) { showToast('Máximo 8 canciones'); return; }
    const track = SONG_LIBRARY[idx];
    state.songs.push({
      name: track.name,
      artist: track.artist,
      url: 'songs/' + track.file,   // real relative path, not a blob
      libraryIdx: idx
    });
  }

  buildSongLibrary();
  syncSongLines();
  updateCounter();
}

function updateCounter() {
  const el = document.getElementById('songsCounter');
  if (el) el.textContent = `${state.songs.length} / ${MAX_SONGS} canciones`;
}

function syncSongLines() {
  ['songLines3','songLines4','songLinesShare'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '';
    state.songs.slice(0, 3).forEach(s => {
      const div = document.createElement('div');
      div.className = 'case-line filled';
      div.innerHTML = `<span class="song-label">${s.name}</span>`;
      el.appendChild(div);
    });
    for (let i = Math.min(state.songs.length, 3); i < 3; i++) {
      const div = document.createElement('div');
      div.className = 'case-line';
      el.appendChild(div);
    }
  });
}


// ═══════════════════════════════════════════════
// STEP 4 — NOTE
// ═══════════════════════════════════════════════
function updateNoteCounter() {
  const val = document.getElementById('noteText').value;
  document.getElementById('noteCount').textContent = val.length;
}


// ═══════════════════════════════════════════════
// AUDIO PLAYER
// ═══════════════════════════════════════════════
const audio = document.getElementById('audioEl');

function buildPlaylist() {
  const pl = document.getElementById('playlist');
  if (!pl) return;
  pl.innerHTML = '';

  if (!state.songs.length) {
    document.getElementById('playerTitle').textContent  = 'Sin canciones';
    document.getElementById('playerArtist').textContent = '—';
    updateNowPlayingLabel();
    return;
  }

  state.songs.forEach((s, i) => {
    const div = document.createElement('div');
    div.className = 'pl-item' + (i === state.currentTrack ? ' playing' : '');
    div.innerHTML = `
      <span class="pl-num">${i === state.currentTrack ? '♪' : i + 1}</span>
      <div style="flex:1;min-width:0">
        <div class="pl-name">${s.name}</div>
        <div class="pl-artist">${s.artist}</div>
      </div>`;
    div.onclick = () => loadTrack(i, true);
    pl.appendChild(div);
  });

  loadTrack(state.currentTrack, false);
}

function loadTrack(i, autoplay) {
  if (!state.songs.length) return;
  state.currentTrack = i;
  const s = state.songs[i];
  audio.src = s.url;
  document.getElementById('playerTitle').textContent  = s.name;
  document.getElementById('playerArtist').textContent = s.artist;
  document.getElementById('playerArt').innerHTML      = '🎵';

  document.querySelectorAll('.pl-item').forEach((el, idx) => {
    el.classList.toggle('playing', idx === i);
    el.querySelector('.pl-num').textContent = idx === i ? '♪' : idx + 1;
  });

  updateNowPlayingLabel();

  if (autoplay) {
    audio.play().then(() => { state.isPlaying = true; updatePlayBtn(); updateCassetteAnim(); });
  } else {
    state.isPlaying = false;
    updatePlayBtn();
    updateCassetteAnim();
  }
}

function togglePlay() {
  if (!state.songs.length) { showToast('Añade canciones primero'); return; }
  if (state.isPlaying) { audio.pause(); state.isPlaying = false; }
  else                 { audio.play();  state.isPlaying = true;  }
  updatePlayBtn();
  updateCassetteAnim();
}

function pauseAudio() {
  audio.pause();
  state.isPlaying = false;
  updatePlayBtn();
  updateCassetteAnim();
}

function updatePlayBtn() {
  const btn = document.getElementById('playBtn');
  if (btn) btn.textContent = state.isPlaying ? '⏸' : '▶';
}

// Toggle the "playing" class on every animated cassette present in the DOM
// (step 3's wrap and/or the share page's wrap)
function updateCassetteAnim() {
  ['animCassetteWrap', 'shareCassetteWrap'].forEach(id => {
    const wrap = document.getElementById(id);
    if (!wrap) return;
    wrap.classList.toggle('playing', state.isPlaying);
  });
  updateNowPlayingLabel();
}

function updateNowPlayingLabel() {
  const label = document.getElementById('shareNowPlaying');
  if (!label) return;
  if (!state.songs.length) {
    label.textContent = '♪ Toca play para escuchar ♪';
  } else if (state.isPlaying) {
    label.textContent = '▶ ' + state.songs[state.currentTrack].name;
  } else {
    label.textContent = '♪ Toca play para escuchar ♪';
  }
}

function prevTrack() {
  if (!state.songs.length) return;
  loadTrack((state.currentTrack - 1 + state.songs.length) % state.songs.length, state.isPlaying);
}
function nextTrack() {
  if (!state.songs.length) return;
  loadTrack((state.currentTrack + 1) % state.songs.length, state.isPlaying);
}

function seekAudio(e) {
  if (!audio.duration) return;
  const bar  = document.getElementById('progressBar');
  const rect = bar.getBoundingClientRect();
  audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  document.getElementById('progressFill').style.width = (audio.currentTime / audio.duration * 100) + '%';
  document.getElementById('curTime').textContent      = fmtTime(audio.currentTime);
});
audio.addEventListener('loadedmetadata', () => {
  document.getElementById('durTime').textContent = fmtTime(audio.duration);
});
audio.addEventListener('ended', nextTrack);


// ═══════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════
function copyLink() {
  const input = document.getElementById('shareLink');
  navigator.clipboard.writeText(input ? input.value : '')
    .then(()  => showToast('¡Copiado!'))
    .catch(()  => showToast('No se pudo copiar'));
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

// If this page was opened via a shared mixtape link (#m=...),
// skip the landing page and jump straight to the finished view.
document.addEventListener('DOMContentLoaded', loadFromShareLink);
