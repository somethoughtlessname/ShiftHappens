/* ── storage ── */
function ls(k,d){ try{ const v=localStorage.getItem(k); return v!==null?JSON.parse(v):d; }catch(e){ return d; } }
function lsSet(k,v){ localStorage.setItem(k,JSON.stringify(v)); }

/* ── local date key (YYYY-MM-DD, local timezone) ── */
function localDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/* ── state ── */
let jobs            = ls('sch_jobs', []);
let nwSelectedColor = null;
let nwSelectedDow   = 1;
let activeWeek      = 'this';
let activeHours     = 'scheduled';
let activeFirstDow  = 1;
let activeJobId     = null;
let jsSelectedColor = null;

/* ── swatch colors ── */
function getSwatchColors() {
  const s = getComputedStyle(document.documentElement);
  return [1,2,3,4,5,6,7,8,9,10].map(i => s.getPropertyValue('--swatch-' + i).trim());
}

function buildSwatches(onclickFn) {
  return getSwatchColors().map(c =>
    `<button class="nw-swatch" style="background:${c};" data-color="${c}" onclick="${onclickFn}(this)"></button>`
  ).join('');
}

function buildDowBtns(onclickFn) {
  return ['S','M','T','W','T','F','S'].map((d,i) =>
    `<button class="dow-btn${i===1?' active':''}" data-dow="${i}" onclick="${onclickFn}(this)">${d}</button>`
  ).join('');
}

const DOT_GRID = `<div class="dot-grid">
  <span class="dot"></span><span class="dot green"></span><span class="dot"></span>
  <span class="dot"></span><span class="dot green"></span><span class="dot"></span>
  <span class="dot"></span><span class="dot green"></span><span class="dot"></span>
</div>`;

/* ── build all windows dynamically ── */
function buildWindows() {
  const html = `
    <!-- NEW JOB WINDOW -->
    <div class="data-window" id="newWindow">
      <div class="data-window-header">
        <button class="data-window-back" onclick="closeWindow('newWindow')">&#9664;</button>
        <div class="data-window-title">New Job</div>
      </div>
      <div class="data-body">
        <div class="label-card">Enter Job Title</div>
        <div class="nw-title-card">
          <input class="nw-title-input" id="nwTitleInput" type="text" placeholder="Job title" oninput="nwCheckReady()" maxlength="80">
        </div>
        <div class="label-card">Select Job Color</div>
        <div class="nw-color-card" id="nwColorCard">${buildSwatches('nwPickColor')}</div>
        <div class="label-card">Select First Day of Work Week</div>
        <div class="dow-card" id="nwDowCard">${buildDowBtns('nwPickDow')}</div>
      </div>
      <div class="nw-footer" id="nwFooter" onclick="nwCreate()">Create New Job Entry</div>
    </div>

    <!-- JOB WINDOW -->
    <div class="data-window" id="jobWindow">
      <div class="data-window-header">
        <button class="data-window-back" onclick="closeWindow('jobWindow')">&#9664;</button>
        <div class="data-window-title" id="jobWindowTitle"></div>
        <button class="data-window-settings" onclick="openJobSettings()">${DOT_GRID}</button>
      </div>
      <div class="data-body" id="jobWindowBody">
        <div class="filter-card">
          <button class="filter-btn" id="fwPrev" onclick="setWeek('prev')">Last Week</button>
          <button class="filter-btn active" id="fwThis" onclick="setWeek('this')">This Week</button>
          <button class="filter-btn" id="fwNext" onclick="setWeek('next')">Next Week</button>
        </div>
        <div class="filter-card" id="hoursCard">
          <button class="filter-btn active secondary" id="fhScheduled" onclick="setHoursType('scheduled')">Scheduled Hours</button>
          <button class="filter-btn secondary" id="fhWorked" onclick="setHoursType('worked')">Worked Hours</button>
        </div>
        <div class="date-range-card" id="dateRangeCard"></div>
        <div id="dayCards" style="display:flex;flex-direction:column;gap:var(--margin);"></div>
        <div class="totals-card">
          <div class="totals-label">Total Hours</div>
          <div class="totals-value" id="totalsValue">00 Hours  00 Minutes</div>
        </div>
      </div>
      <div class="clear-card-wrap">
        <div class="clear-card" id="clearSchedCard" onclick="clearCurrentSchedule()">Clear Schedule</div>
      </div>
    </div>

    <!-- JOB SETTINGS WINDOW -->
    <div class="data-window" id="jobSettingsWindow">
      <div class="data-window-header">
        <button class="data-window-back" onclick="closeWindow('jobSettingsWindow')">&#9664;</button>
        <div class="data-window-title">Job Settings</div>
      </div>
      <div class="data-body">
        <div class="label-card">Change Job Title</div>
        <div class="nw-title-card">
          <input class="nw-title-input" id="jsTitleInput" type="text" placeholder="Job title" oninput="jsUpdateTitle()" maxlength="80">
        </div>
        <div class="label-card">Select Job Color</div>
        <div class="nw-color-card" id="jsColorCard">${buildSwatches('jsPickColor')}</div>
        <div class="label-card">Select First Day of Work Week</div>
        <div class="dow-card" id="dowCard">${buildDowBtns('jsPickDow')}</div>
        <div class="clear-card" id="clearFullCard" onclick="clearFullSchedule()">Clear Full Schedule</div>
        <div class="delete-card" id="deleteCard" onclick="jsDeleteJob()">Delete Job</div>
      </div>
    </div>

    <!-- SETTINGS WINDOW -->
    <div class="data-window" id="settingsWindow">
      <div class="data-window-header">
        <button class="data-window-back" onclick="closeWindow('settingsWindow')">&#9664;</button>
        <div class="data-window-title">Settings</div>
      </div>
      <!-- settings tab bar -->
      <div class="filter-card" style="flex-shrink:0;border-radius:0;border-left:none;border-right:none;border-top:none;">
        <button class="filter-btn active" id="stab-display"  onclick="settingsTab('display')">Display</button>
        <button class="filter-btn"        id="stab-cards"    onclick="settingsTab('cards')">Cards</button>
        <button class="filter-btn"        id="stab-other"    onclick="settingsTab('other')">Other</button>
        <button class="filter-btn"        id="stab-theme"    onclick="settingsTab('theme')">Theme</button>
      </div>

      <!-- DISPLAY TAB -->
      <div class="data-body" id="spanel-display">
        <div class="label-card">What shows in the main window</div>

        <div class="toggle-card" id="toggleJobCards" onclick="settingToggle('showJobCards')"><div class="toggle-check"><svg width=\"16\" height=\"13\" viewBox=\"0 0 16 13\" fill=\"none\"><path d=\"M1.5 6.5 L6 11 L14.5 1.5\" stroke=\"white\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg></div><div class="toggle-content"><div class="toggle-label">Job Cards</div><div class="toggle-blurb">Shows each job as a card with your next shift countdown</div></div></div>

        <div id="quickScheduleToggleSlot"></div>

        <div id="historyToggleSlot"></div>
      </div>

      <!-- CARDS TAB -->
      <div class="data-body" id="spanel-cards" style="display:none;">
        <div class="label-card">Job Card Sections</div>

        <div id="timerSectionsToggleSlot"></div>

        <div id="miniGraphToggleSlot"></div>

        <div id="miniGraphDaysSlot"></div>

        <div id="timeDotToggleSlot"></div>
      </div>

      <!-- THEME TAB -->
      <div class="data-body" id="spanel-theme" style="display:none;">
        <div class="label-card">Pick a Theme</div>
        <div id="settingsSavedThemesList"></div>
      </div>

      <!-- OTHER TAB -->
      <div class="data-body" id="spanel-other" style="display:none;">
        <div class="label-card">Notifications</div>
        <div style="font-size:var(--text-xs);color:var(--text-mid);padding:2px 4px 6px;">Test that push notifications are working on your device</div>
        <div class="toggle-card" id="notifTestBtn" onclick="testNotification()" style="cursor:pointer;">
          <div class="toggle-check" style="background:var(--secondary);">
            <svg width="12" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 2 Q2 1 3 1.5 L13.5 7.5 Q15 8 13.5 8.5 L3 14.5 Q2 15 2 14 Z" fill="var(--text-light)"/></svg>
          </div>
          <div class="toggle-content">
            <div class="toggle-label">Send Test Notification</div>
            <div class="toggle-blurb">Test that push notifications are working on this device</div>
          </div>
        </div>
        <div id="notifStatus" style="font-size:var(--text-xs);font-weight:var(--fw-bold);text-align:center;color:var(--text-mid);padding:4px;min-height:18px;"></div>
      </div>
    </div>

    <!-- SCHEDULE MODAL -->
    <div class="sched-modal-overlay" id="schedModal">
      <div class="sched-modal">
        <div class="sched-modal-header">
          <button class="sched-modal-back" onclick="closeSchedModal()">&#9664;</button>
          <div class="sched-modal-title" id="schedModalTitle"></div>
        </div>
        <div class="sched-modal-body" id="schedModalBody"></div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
}


/* ── app settings ── */
const _settingsDefaults = { showJobCards: true, showQuickSchedule: true, showTimeDot: true, showHistory: true, showTimerSections: true, showMiniGraph: true, miniGraphDays: 3, theme: 'none' };
let appSettings = Object.assign({}, _settingsDefaults, ls('sch_settings', {}));

function settingToggle(key) {
  appSettings[key] = !appSettings[key];
  lsSet('sch_settings', appSettings);
  updateSettingsUI();
  renderJobs();
}

function updateSettingsUI() {
  const CHK = `<svg width="16" height="13" viewBox="0 0 16 13" fill="none"><path d="M1.5 6.5 L6 11 L14.5 1.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  function makeToggle(id, onclick, label, blurb) {
    return `<div class="toggle-card" id="${id}" onclick="${onclick}"><div class="toggle-check">${CHK}</div><div class="toggle-content"><div class="toggle-label">${label}</div><div class="toggle-blurb">${blurb}</div></div></div>`;
  }



  // Timer sections
  const tsSlot = document.getElementById('timerSectionsToggleSlot');
  if (tsSlot) tsSlot.innerHTML = makeToggle('toggleTimerSections', "settingToggle('showTimerSections')", 'Quick Shift Timer', 'Timer button on the right side of each job card');

  // Mini graph
  const mgSlot = document.getElementById('miniGraphToggleSlot');
  if (mgSlot) mgSlot.innerHTML = makeToggle('toggleMiniGraph', "settingToggle('showMiniGraph')", 'Weekly Graph', 'Daily bars showing past worked and upcoming scheduled hours');

  // Mini graph days
  const mgDays = document.getElementById('miniGraphDaysSlot');
  if (mgDays) {
    const cur = appSettings.miniGraphDays || 3;
    mgDays.innerHTML = `<div class="filter-card" style="flex-shrink:0;">
      <button class="filter-btn${cur===3?' active':''}" onclick="setMiniGraphDays(3)">3 Days</button>
      <button class="filter-btn${cur===5?' active':''}" onclick="setMiniGraphDays(5)">5 Days</button>
      <button class="filter-btn${cur===7?' active':''}" onclick="setMiniGraphDays(7)">7 Days</button>
    </div>`;
  }

  // Quick schedule slot (only if loaded)
  const qsSlot = document.getElementById('quickScheduleToggleSlot');
  if (qsSlot) {
    qsSlot.innerHTML = typeof renderQuickSchedule === 'function'
      ? makeToggle('toggleQuickSchedule', "settingToggle('showQuickSchedule')", 'Quick Schedule', '7-day shift timeline with hour markers across all jobs')
      : '';
  }

  // Time dot slot (only if QS loaded)
  const tdSlot = document.getElementById('timeDotToggleSlot');
  if (tdSlot) {
    tdSlot.innerHTML = typeof renderQuickSchedule === 'function'
      ? makeToggle('toggleTimeDot', "settingToggle('showTimeDot')", 'Current Time Indicator', 'Small diamond on the schedule marking where you are now')
      : '';
  }

  // History slot (only if loaded)
  const slot = document.getElementById('historyToggleSlot');
  if (slot) {
    slot.innerHTML = typeof renderHistory === 'function'
      ? makeToggle('toggleHistory', "settingToggle('showHistory')", 'History', 'This week, next week and the last 10 weeks of hours')
      : '';
  }

  // Saved themes quick-apply list
  const stList = document.getElementById('settingsSavedThemesList');
  if (stList && typeof ThemeSystem !== 'undefined') {
    const themes = ThemeSystem.getSavedThemes();
    if (themes.length === 0) {
      stList.innerHTML = '<div style="font-size:var(--text-xs);color:var(--text-mid);padding:4px 8px;">No saved themes yet — use the Theme Builder to create one</div>';
    } else {
      stList.style.cssText = 'display:flex;flex-direction:column;gap:var(--margin);';
      stList.innerHTML = '';
      themes.forEach((theme, i) => {
        if (!theme?.baseColors) return;
        const pri = theme.baseColors.primary   || '#48a971';
        const sec = theme.baseColors.secondary || '#5A8DB8';
        const acc = theme.baseColors.accent    || '#8a7ca8';
        const bg4 = theme.baseColors.bg4       || '#ffffff';
        const bdr = theme.baseColors.border    || '#000000';
        const tl  = theme.baseColors.textLight || '#ffffff';
        const bw  = '3px';

        const card = document.createElement('div');
        card.style.cssText = `border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;cursor:pointer;display:flex;flex-direction:column;`;
        card.onclick = () => {
          ThemeSystem.loadTheme(i);
          // refresh the saved themes list after applying
          if (typeof updateSettingsUI === 'function') updateSettingsUI();
        };
        card.innerHTML =
          // top row — primary / secondary / accent color bands
          `<div style="display:flex;height:var(--qs-hdr);">
            <div style="flex:1;background:${pri};border-right:${bw} solid ${bdr};"></div>
            <div style="flex:1;background:${sec};border-right:${bw} solid ${bdr};"></div>
            <div style="flex:1;background:${acc};"></div>
          </div>` +
          // bottom row — name
          `<div style="height:var(--job-half);background:var(--bg-2);border-top:${bw} solid ${bdr};display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:var(--fw-bold);letter-spacing:var(--ls-wide);text-transform:uppercase;color:var(--text-mid);">${theme.name}</div>`;

        stList.appendChild(card);
      });
    }
  }

  // Apply active class based on settings
  const toggleMap = {
    showJobCards: 'toggleJobCards', showQuickSchedule: 'toggleQuickSchedule',
    showTimeDot: 'toggleTimeDot', showHistory: 'toggleHistory',
    showTimerSections: 'toggleTimerSections', showMiniGraph: 'toggleMiniGraph',
  };
  Object.keys(toggleMap).forEach(k => {
    const card = document.getElementById(toggleMap[k]);
    if (card) card.classList.toggle('active', !!appSettings[k]);
  });
}

/* ── window helpers ── */
function openWindow(id) {
  document.getElementById(id).classList.add('open');
  if (id === 'newWindow') { refreshSwatchCards(); nwAutoSelect(); }
}
function closeWindow(id) {
  document.getElementById(id).classList.remove('open');
}

/* ── new job ── */
function nwAutoSelect() {
  const first = document.querySelector('#nwColorCard .nw-swatch');
  if (first) nwPickColor(first);
}
function nwPickColor(el) {
  document.querySelectorAll('#nwColorCard .nw-swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  nwSelectedColor = el.dataset.color;
  // update active dow button color
  const activeDow = document.querySelector('#nwDowCard .dow-btn.active');
  if (activeDow && nwSelectedColor) { activeDow.style.background = nwSelectedColor; activeDow.style.color = 'var(--color-10)'; }
  nwCheckReady();
}
function nwPickDow(el) {
  document.querySelectorAll('#nwDowCard .dow-btn').forEach(b => {
    b.classList.remove('active');
    b.style.background = '';
    b.style.color = '';
  });
  el.classList.add('active');
  if (nwSelectedColor) { el.style.background = nwSelectedColor; el.style.color = 'var(--color-10)'; }
  nwSelectedDow = parseInt(el.dataset.dow);
}
function nwCheckReady() {
  const title = document.getElementById('nwTitleInput').value.trim();
  document.getElementById('nwFooter').classList.toggle('ready', title.length > 0 && !!nwSelectedColor);
}
function nwCreate() {
  if (!document.getElementById('nwFooter').classList.contains('ready')) return;
  const title = document.getElementById('nwTitleInput').value.trim();
  const job = { id: Date.now(), title, color: nwSelectedColor, firstDow: nwSelectedDow };
  jobs.push(job);
  lsSet('sch_jobs', jobs);
  renderJobs();
  document.getElementById('nwTitleInput').value = '';
  nwSelectedColor = null;
  document.querySelectorAll('#nwColorCard .nw-swatch').forEach(s => s.classList.remove('selected'));
  document.querySelectorAll('#nwDowCard .dow-btn').forEach((b,i) => b.classList.toggle('active', i === 1));
  nwSelectedDow = 1;
  document.getElementById('nwFooter').classList.remove('ready');
  if (typeof renderQuickSchedule === 'function' && appSettings.showQuickSchedule) { buildQuickSchedule(); renderQuickSchedule(); }
  if (typeof renderHistory === 'function') { buildHistory(); renderHistory(); }
  closeWindow('newWindow');
}

/* ── countdown ── */
function formatCountdown(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
function getNextShiftCountdown(job) {
  if (!job.schedule) return null;
  const now = new Date();
  for (let d = 0; d < 14; d++) {
    const date = new Date(now);
    date.setDate(now.getDate() + d);
    date.setHours(0,0,0,0);
    const sched = job.schedule[localDateKey(date)];
    if (!sched || !sched.start || sched.start === 'OFF' || sched.start === 'NONE') continue;
    const startMins = parseTimeToMins(sched.start);
    if (startMins === null) continue;
    const shiftDate = new Date(date);
    shiftDate.setHours(Math.floor(startMins / 60), startMins % 60, 0, 0);
    const diffMs = shiftDate - now;
    if (diffMs > 0) return formatCountdown(Math.round(diffMs / 60000));
  }
  return null;
}


/* ══════════════════════════════════════
   OVERLAY ENGINE
══════════════════════════════════════ */
let fxIntervals = [];
let fxRAFs = [];

const OVERLAY_CFG_DEFAULTS = {
  overlay:'none',
  grn:{layer:'under',intensity:'med',size:'med'},
  crt:{layer:'under',color:'green',lines:'med'},
  stt:{layer:'under',intensity:'med',speed:'med'},
  glc:{speed:'med',intensity:'med'},
  prx:{layer:'mixed',speed:'med',density:'med'},
  dtr:{layer:'under',intensity:'med',size:'med'},
  pxl:{layer:'under',size:'med',intensity:'med'},
  vgn:{layer:'over',strength:'med',spread:'med'},
  gls:{layer:'under',size:'med',opacity:'med'},
  crs:{layer:'under',spacing:'med',opacity:'med'},
};

const LAYER_FILTERS_APP=['grn','crt','stt','dtr','vgn','gls','crs'];
const LAYER_MIXED_APP=['prx'];

const OVERLAY_SETTINGS_DEF = {
  non: [],
  grn: [
    {key:'intensity',lbl:'Intensity',opts:[{v:'low',l:'Low'},{v:'med',l:'Med'},{v:'high',l:'High'}]},
    {key:'size',     lbl:'Grain',    opts:[{v:'fine',l:'Fine'},{v:'med',l:'Med'},{v:'coarse',l:'Coarse'}]},
  ],
  crt: [
    {key:'color',lbl:'Color',opts:[{v:'green',col:'#00ff60'},{v:'amber',col:'#ffaa22'},{v:'blue',col:'#2266ff'},{v:'white',col:'#ffffff'},{v:'red',col:'#ff3322'},{v:'purple',col:'#bb33ff'},{v:'cyan',col:'#00ffdd'},{v:'orange',col:'#ff8822'}],isColor:true},
    {key:'lines',lbl:'Lines',opts:[{v:'light',l:'Light'},{v:'med',l:'Med'},{v:'heavy',l:'Heavy'}]},
  ],
  stt: [
    {key:'intensity',lbl:'Intensity',opts:[{v:'low',l:'Low'},{v:'med',l:'Med'},{v:'high',l:'High'}]},
    {key:'speed',    lbl:'Speed',    opts:[{v:'slow',l:'Slow'},{v:'med',l:'Med'},{v:'fast',l:'Fast'}]},
  ],
  glc: [
    {key:'speed',    lbl:'Speed',    opts:[{v:'slow',l:'Slow'},{v:'med',l:'Med'},{v:'fast',l:'Fast'}]},
    {key:'intensity',lbl:'Intensity',opts:[{v:'low',l:'Low'},{v:'med',l:'Med'},{v:'high',l:'High'}]},
  ],
  prx: [
    {key:'speed',  lbl:'Speed',  opts:[{v:'slow',l:'Slow'},{v:'med',l:'Med'},{v:'fast',l:'Fast'}]},
    {key:'density',lbl:'Density',opts:[{v:'sparse',l:'Sparse'},{v:'med',l:'Med'},{v:'dense',l:'Dense'}]},
  ],
  dtr: [
    {key:'intensity',lbl:'Intensity',opts:[{v:'light',l:'Light'},{v:'med',l:'Med'},{v:'heavy',l:'Heavy'}]},
    {key:'size',     lbl:'Pattern', opts:[{v:'fine',l:'Fine'},{v:'med',l:'Med'},{v:'coarse',l:'Coarse'}]},
  ],
  pxl: [
    {key:'size',     lbl:'Size',     opts:[{v:'small',l:'Small'},{v:'med',l:'Med'},{v:'large',l:'Large'}]},
    {key:'intensity',lbl:'Intensity',opts:[{v:'light',l:'Light'},{v:'med',l:'Med'},{v:'heavy',l:'Heavy'}]},
  ],
  vgn: [
    {key:'strength',lbl:'Strength',opts:[{v:'light',l:'Light'},{v:'med',l:'Med'},{v:'heavy',l:'Heavy'}]},
    {key:'spread',  lbl:'Spread',  opts:[{v:'tight',l:'Tight'},{v:'med',l:'Med'},{v:'wide',l:'Wide'}]},
  ],
  gls: [
    {key:'size',   lbl:'Cells',  opts:[{v:'small',l:'Small'},{v:'med',l:'Med'},{v:'large',l:'Large'}]},
    {key:'opacity',lbl:'Opacity',opts:[{v:'light',l:'Light'},{v:'med',l:'Med'},{v:'heavy',l:'Heavy'}]},
  ],
  crs: [
    {key:'spacing',lbl:'Spacing',opts:[{v:'tight',l:'Tight'},{v:'med',l:'Med'},{v:'wide',l:'Wide'}]},
    {key:'opacity',lbl:'Opacity',opts:[{v:'light',l:'Light'},{v:'med',l:'Med'},{v:'heavy',l:'Heavy'}]},
  ],
};

function getOverlayCfg() {
  if (!appSettings.overlayCfg) appSettings.overlayCfg = JSON.parse(JSON.stringify(OVERLAY_CFG_DEFAULTS));
  return appSettings.overlayCfg;
}

function clearThemeFx() {
  fxIntervals.forEach(id => { clearInterval(id); clearTimeout(id); });
  fxIntervals = []; fxRAFs.forEach(cancelAnimationFrame); fxRAFs = [];
  const tbOpen = document.getElementById('themeBuilderWindow') &&
                 document.getElementById('themeBuilderWindow').classList.contains('open');
  const fxb = document.getElementById('fx-back');
  const fxf = document.getElementById('fx-fore');
  if (!tbOpen) {
    if (fxb) { fxb.innerHTML = ''; fxb.style.zIndex = '2'; }
    if (fxf) { fxf.innerHTML = ''; fxf.style.zIndex = '2'; }
  }
  const pback = document.getElementById('tbPreviewFxBack'); if (pback) pback.innerHTML = '';
  const pfore = document.getElementById('tbPreviewFxFore'); if (pfore) pfore.innerHTML = '';
  if (!(document.getElementById('themeBuilderWindow')&&document.getElementById('themeBuilderWindow').classList.contains('open'))) document.body.style.filter = '';
  const demoEl = document.querySelector('.tb-demo-section'); if (demoEl) demoEl.style.filter = '';
  document.body.classList.remove('overlay-over');
  const app = document.getElementById('mainApp');
  if (app) { app.style.transform = ''; }
}

function setOverlay(id) {
  const cfg = getOverlayCfg();
  cfg.overlay = id;
  appSettings.overlay = id;
  lsSet('sch_settings', appSettings);
  clearThemeFx();
  applyOverlay();
  // update selector buttons
  const slot = document.getElementById('themePickerSlot');
  if (slot) slot.querySelectorAll('.filter-btn').forEach(btn => {
    const m = btn.getAttribute('onclick').match(/setOverlay\('(.*?)'\)/);
    if (m) btn.classList.toggle('active', m[1] === id);
  });
  buildOverlaySettings(id);
}

function buildOverlaySettings(id) {
  const nameEl = document.getElementById('overlaySettingsName');
  if (nameEl) nameEl.textContent = id === 'none' ? '—' : id.toUpperCase();
  // layer toggle
  const layerWrap = document.getElementById('overlayLayerWrap');
  if (layerWrap) {
    layerWrap.innerHTML = '';
    const cfg = getOverlayCfg();
    const hasLayer = LAYER_FILTERS_APP.includes(id) || LAYER_MIXED_APP.includes(id);
    if (hasLayer) {
      const opts = LAYER_MIXED_APP.includes(id) ? ['under','mixed','over'] : ['under','over'];
      opts.forEach(v => {
        const b = document.createElement('button');
        b.textContent = v.charAt(0).toUpperCase() + v.slice(1);
        b.style.cssText = `height:13px;padding:0 8px;border:var(--border-width) solid var(--border-color);border-radius:99px;background:${(cfg[id]||{}).layer===v?'var(--secondary)':'var(--bg-2)'};color:${(cfg[id]||{}).layer===v?'var(--text-light)':'var(--muted)'};font-size:9px;font-weight:800;text-transform:uppercase;cursor:pointer;`;
        b.onclick = () => {
          if (cfg[id]) cfg[id].layer = v;
          lsSet('sch_settings', appSettings);
          buildOverlaySettings(id); applyOverlay();
        };
        layerWrap.appendChild(b);
      });
    }
  }
  // settings rows
  const body = document.getElementById('tbOverlaySettings') || document.getElementById('overlaySettingsBody');
  if (!body) return;
  body.innerHTML = '';
  body.style.cssText = 'border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;min-height:calc(var(--job-half)*2);';
  const defs = OVERLAY_SETTINGS_DEF[id] || [];
  if (!defs.length) {
    body.innerHTML = '<div style="min-height:calc(var(--job-half)*2);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);color:var(--muted);letter-spacing:var(--ls-wide);">SELECT AN OVERLAY</div>';
    return;
  }
  const cfg = getOverlayCfg();
  defs.forEach((def, defIdx) => {
    const row = document.createElement('div');
    const isLast = defIdx === defs.length - 1;
    row.style.cssText = `display:flex;align-items:stretch;height:var(--job-half);${isLast ? '' : 'border-bottom:var(--border-width) solid var(--border-color);'}`;
    const lbl = document.createElement('div');
    lbl.style.cssText = 'width:64px;flex-shrink:0;border-right:var(--border-width) solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);background:var(--bg-3);';
    lbl.textContent = def.lbl;
    const opts = document.createElement('div');
    opts.style.cssText = 'display:flex;flex:1;';
    def.opts.forEach((opt, i) => {
      const isOn = (cfg[id]||{})[def.key] === opt.v;
      const b = document.createElement('div');
      b.style.cssText = `flex:1;display:flex;align-items:center;justify-content:center;border-right:var(--border-width) solid var(--border-color);cursor:pointer;background:${isOn?'var(--secondary)':'var(--bg-2)'};color:${isOn?'var(--text-light)':'var(--muted)'};font-size:9px;font-weight:800;text-transform:uppercase;`;
      if (i === def.opts.length - 1) b.style.borderRight = 'none';
      if (def.isColor) {
        const dot = document.createElement('span');
        dot.style.cssText = `width:13px;height:13px;border-radius:50%;background:${opt.col};border:2px solid ${isOn?'rgba(255,255,255,0.9)':'rgba(0,0,0,0.4)'};${isOn?`box-shadow:0 0 6px 2px ${opt.col};`:''};display:inline-block;`;
        b.appendChild(dot);
      } else { b.textContent = opt.l; }
      b.onclick = () => { if (cfg[id]) cfg[id][def.key] = opt.v; lsSet('sch_settings', appSettings); buildOverlaySettings(id); applyOverlay(); };
      opts.appendChild(b);
    });
    row.append(lbl, opts);
    body.appendChild(row);
  });
}

function applyOverlay() {
  clearThemeFx();
  const cfg = getOverlayCfg();
  const id = cfg.overlay || 'none';
  if (id !== 'none') {
    const layer = (cfg[id] || {}).layer || 'under';
    const fxb = document.getElementById('fx-back');
    const fxf = document.getElementById('fx-fore');
    const pback = document.getElementById('tbPreviewFxBack');
    const pfore = document.getElementById('tbPreviewFxFore');
    if (layer === 'over') {
      // fx layers sit between body bg and app content
      // app content (z:10003 via body.overlay-over) is above them
      if (fxb) fxb.style.zIndex = '10000';
      if (fxf) fxf.style.zIndex = '10001';
      if (pback) pback.style.zIndex = '5';
      if (pfore) pfore.style.zIndex = '15';
      document.body.classList.add('overlay-over');
    } else if (layer === 'under') {
      if (fxb) fxb.style.zIndex = '1';
      if (fxf) fxf.style.zIndex = '1';
      if (pback) pback.style.zIndex = '0';
      if (pfore) pfore.style.zIndex = '0';
      document.body.classList.remove('overlay-over');
    } else {
      // mixed (parallax)
      if (fxb) fxb.style.zIndex = '1';
      if (fxf) fxf.style.zIndex = '10001';
      if (pback) pback.style.zIndex = '0';
      if (pfore) pfore.style.zIndex = '15';
      document.body.classList.add('overlay-over');
    }
  } else {
    document.body.classList.remove('overlay-over');
  }
  const OVERLAYS = getOverlayFns();
  if (OVERLAYS[id]) OVERLAYS[id](cfg[id]||{});
}

function overlayTarget(layer) {
  return layer === 'over' ? 'fx-fore' : 'fx-back';
}

function mkFxC(target, op, blend) {
  const tbOpen = document.getElementById('themeBuilderWindow') &&
                 document.getElementById('themeBuilderWindow').classList.contains('open');

  function makeCanvas(parent, w, h) {
    if (!parent) return document.createElement('canvas');
    const c = document.createElement('canvas');
    c.width = w || window.innerWidth; c.height = h || window.innerHeight;
    let s = `position:absolute;inset:0;width:100%;height:100%;`;
    if (op != null) s += `opacity:${op};`; if (blend) s += `mix-blend-mode:${blend};`;
    c.style.cssText = s;
    parent.appendChild(c);
    return c;
  }

  if (tbOpen) {
    const previewId = target === 'fx-back' ? 'tbPreviewFxBack' : 'tbPreviewFxFore';
    const preview = document.getElementById(previewId);
    const pw = (preview && preview.offsetWidth > 0) ? preview.offsetWidth : 300;
    const ph = (preview && preview.offsetHeight > 0) ? preview.offsetHeight : 200;
    return makeCanvas(preview, pw, ph);
  } else {
    return makeCanvas(document.getElementById(target), window.innerWidth, window.innerHeight);
  }
}

function getThemeRGBs() {
  const cs = getComputedStyle(document.documentElement);
  return ['--primary','--secondary','--accent','--swatch-1','--swatch-2','--swatch-3','--swatch-4','--swatch-5','--swatch-6','--swatch-7','--swatch-8'].map(v => {
    const hex = cs.getPropertyValue(v).trim().replace('#','');
    return [parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16)];
  }).filter(([r]) => !isNaN(r));
}

function getOverlayFns() { return {
  non: () => {},

  grn: (c) => {
    const op = {low:.12,med:.22,high:.38}[c.intensity||'med'];
    const ps = {fine:1,med:2,coarse:4}[c.size||'med'];
    const cv = mkFxC(overlayTarget(c.layer||'under'), op, null);
    const ctx = cv.getContext('2d');
    function d() { if ((getOverlayCfg().overlay) !== 'grn') return;
      const img = ctx.createImageData(cv.width, cv.height);
      for (let y=0;y<cv.height;y+=ps) for (let x=0;x<cv.width;x+=ps) { const v=Math.random()*255; for(let dy=0;dy<ps;dy++) for(let dx=0;dx<ps;dx++){const i=((y+dy)*cv.width+(x+dx))*4;if(i<img.data.length-3){img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=Math.random()*65;}}}
      ctx.putImageData(img,0,0); fxRAFs.push(requestAnimationFrame(d)); }
    d();
  },

  crt: (c) => {
    const colMap = {green:'brightness(0.78) contrast(1.4) saturate(0) sepia(1) hue-rotate(80deg) brightness(1.1)',amber:'brightness(0.75) contrast(1.3) saturate(0) sepia(1) brightness(0.95)',blue:'brightness(0.82) contrast(1.35) saturate(0) sepia(1) hue-rotate(165deg) saturate(2) brightness(0.9)',white:'brightness(0.9) contrast(1.15) saturate(0) brightness(1.05)',red:'brightness(0.78) contrast(1.4) saturate(0) sepia(1) hue-rotate(320deg) saturate(1.5)',purple:'brightness(0.78) contrast(1.4) saturate(0) sepia(1) hue-rotate(250deg) saturate(1.8)',cyan:'brightness(0.8) contrast(1.35) saturate(0) sepia(1) hue-rotate(130deg) saturate(2.5)',orange:'brightness(0.78) contrast(1.3) saturate(0) sepia(1) hue-rotate(355deg) saturate(1.8)'};
    const tintMap = {green:'rgba(0,255,60,0.10)',amber:'rgba(255,160,0,0.12)',blue:'rgba(0,140,255,0.14)',white:'rgba(255,255,255,0.06)',red:'rgba(255,40,0,0.14)',purple:'rgba(160,0,255,0.14)',cyan:'rgba(0,255,220,0.14)',orange:'rgba(255,120,0,0.14)'};
    const col = c.color||'green'; const sp = {light:4,med:3,heavy:2}[c.lines||'med'];
    const tbOpenNow = document.getElementById('themeBuilderWindow')&&document.getElementById('themeBuilderWindow').classList.contains('open');
    if (!tbOpenNow) document.body.style.filter = colMap[col];
    else {
      const demoEl = document.querySelector('.tb-demo-section');
      if (demoEl) demoEl.style.filter = colMap[col];
    }
    const tgt = overlayTarget(c.layer||'under');
    const realTgt = tbOpenNow ? (tgt==='fx-back'?'tbPreviewFxBack':'tbPreviewFxFore') : tgt;
    const realFore = tbOpenNow ? 'tbPreviewFxFore' : 'fx-fore';
    const sl = document.createElement('div');
    sl.style.cssText = `position:absolute;inset:0;background:repeating-linear-gradient(to bottom,transparent 0,transparent ${sp}px,rgba(0,0,0,0.45) ${sp}px,rgba(0,0,0,0.45) ${sp+1}px);`;
    const rtEl = document.getElementById(realTgt); if(rtEl) rtEl.appendChild(sl);
    const vg = document.createElement('div');
    vg.style.cssText = 'position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 38%,rgba(0,0,0,0.92) 100%);';
    const rfEl = document.getElementById(realFore); if(rfEl) rfEl.appendChild(vg);
    const gt = document.createElement('div');
    gt.style.cssText = `position:absolute;inset:0;background:${tintMap[col]};mix-blend-mode:screen;`;
    if(rfEl) rfEl.appendChild(gt);
    const wave = document.createElement('div');
    wave.style.cssText = `position:absolute;left:0;right:0;height:45px;background:linear-gradient(to bottom,transparent,${tintMap[col]},transparent);`;
    if(rfEl) rfEl.appendChild(wave);
    const wrapH = tbOpenNow ? (document.getElementById('tbPreviewFxBack')||{}).offsetHeight||200 : window.innerHeight;
    let wy=0, b=0.78, bt=0.78;
    fxIntervals.push(setInterval(() => { wy=(wy+2)%wrapH; wave.style.top=wy+'px'; }, 16));
    fxIntervals.push(setInterval(() => { if(getOverlayCfg().overlay!=='crt')return; if(Math.random()<0.04)bt=0.68+Math.random()*0.18; b+=(bt-b)*0.06; if(!tbOpenNow) document.body.style.filter=colMap[col].replace(/brightness\([^)]+\)/,`brightness(${b.toFixed(3)})`); }, 16));
  },

  stt: (c) => {
    const op = {low:.12,med:.2,high:.35}[c.intensity||'med'];
    const cv = mkFxC(overlayTarget(c.layer||'under'), op, null);
    const ctx = cv.getContext('2d');
    function d() { if(getOverlayCfg().overlay!=='stt')return; const img=ctx.createImageData(cv.width,cv.height); for(let i=0;i<img.data.length;i+=4){const v=Math.random()*255;img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=175;} ctx.putImageData(img,0,0); fxRAFs.push(requestAnimationFrame(d)); }
    d();
    const delay = {slow:1400,med:900,fast:350}[c.speed||'med'];
    fxIntervals.push(setInterval(() => { if(Math.random()<0.06){cv.style.transition='opacity 0.25s';cv.style.opacity=''+(.35+Math.random()*.35);setTimeout(()=>cv.style.opacity=''+op,300+Math.random()*600);} }, delay));
  },

  glc: (c) => {
    const tbOpenNow = document.getElementById('themeBuilderWindow')&&document.getElementById('themeBuilderWindow').classList.contains('open');
    const glitchTarget = tbOpenNow ? document.querySelector('.tb-demo-section') : document.getElementById('mainApp');
    const appEl = glitchTarget;
    if (!appEl) return;
    const kids = () => Array.from(appEl.children);
    const baseDelay = () => Math.round({slow:600,med:280,fast:80}[c.speed||'med'] + Math.random()*300);
    const maxSh = {low:18,med:40,high:70}[c.intensity||'med'];
    function spawn() { if(getOverlayCfg().overlay!=='glc')return; const r=Math.random();
      if(r<.38){const els=kids();const start=Math.floor(Math.random()*els.length);const targets=els.slice(start,start+1+Math.floor(Math.random()*3));const sh=(Math.random()-.5)*maxSh*2;targets.forEach(el=>{el.style.transition='none';el.style.transform=`translateX(${sh}px)`;});setTimeout(()=>targets.forEach(el=>el.style.transform=''),20+Math.random()*60);}
      else if(r<.62){kids().forEach(el=>{el.style.transition='none';el.style.transform=`translateX(${(Math.random()-.5)*maxSh}px)`;});setTimeout(()=>kids().forEach(el=>el.style.transform=''),15+Math.random()*40);}
      else if(r<.8){const els=kids();const el=els[Math.floor(Math.random()*els.length)];if(el){el.style.filter='drop-shadow(3px 0 rgba(255,0,60,0.75)) drop-shadow(-3px 0 rgba(0,255,240,0.75))';setTimeout(()=>el.style.filter='',35+Math.random()*70);}}
      else{appEl.style.transition='none';appEl.style.transform=`translateY(${(Math.random()-.5)*maxSh*.18}px) translateX(${(Math.random()-.5)*maxSh*.12}px)`;setTimeout(()=>appEl.style.transform='',25);}
      fxIntervals.push(setTimeout(spawn, baseDelay())); }
    spawn();
  },

  prx: (c) => {
    const spd = {slow:.12,med:.35,fast:.85}[c.speed||'med'];
    const n   = {sparse:30,med:70,dense:140}[c.density||'med'];
    const layer = c.layer||'mixed';
    const t1 = layer==='over'?'fx-fore':'fx-back';
    const t2 = layer==='over'?'fx-fore':'fx-back';
    const t3 = layer==='under'?'fx-back':'fx-fore';
    [{t:t1,n,minSz:.5,maxSz:2,sp:spd*.2,op:.18},{t:t2,n:Math.round(n*.45),minSz:2,maxSz:4,sp:spd*.5,op:.28},{t:t3,n:Math.round(n*.15),minSz:4,maxSz:9,sp:spd*1.3,op:.4}].forEach(({t,n:cn,minSz,maxSz,sp,op}) => {
      const cv = mkFxC(t, op, null); const ctx = cv.getContext('2d');
      const pts = Array.from({length:cn}, () => ({x:Math.random()*cv.width,y:Math.random()*cv.height,spd:sp*(0.8+Math.random()*.4),sz:minSz+Math.random()*(maxSz-minSz)}));
      function d() { if(getOverlayCfg().overlay!=='prx')return; ctx.clearRect(0,0,cv.width,cv.height); ctx.fillStyle='#fff'; pts.forEach(p=>{p.y+=p.spd;if(p.y>cv.height)p.y=-p.sz;ctx.beginPath();ctx.arc(p.x,p.y,p.sz,0,Math.PI*2);ctx.fill();}); fxRAFs.push(requestAnimationFrame(d)); }
      d();
    });
  },

  dtr: (c) => {
    const opMap = {light:.2,med:.35,heavy:.55};
    const M8 = [[0,48,12,60,3,51,15,63],[32,16,44,28,35,19,47,31],[8,56,4,52,11,59,7,55],[40,24,36,20,43,27,39,23],[2,50,14,62,1,49,13,61],[34,18,46,30,33,17,45,29],[10,58,6,54,9,57,5,53],[42,26,38,22,41,25,37,21]];
    const M4 = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
    const M2 = [[0,2],[3,1]];
    const Msel = {fine:M8,med:M4,coarse:M2}[c.size||'med']||M8; const Msz = Msel.length;
    const cv = mkFxC(overlayTarget(c.layer||'under'), opMap[c.intensity||'med'], null);
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(cv.width, cv.height);
    for (let y=0;y<cv.height;y++) for (let x=0;x<cv.width;x++) { const t=Msel[y%Msz][x%Msz]/(Msz*Msz); const v=t>.5?255:0; const i=(y*cv.width+x)*4; img.data[i]=img.data[i+1]=img.data[i+2]=v; img.data[i+3]=80; }
    ctx.putImageData(img,0,0);
  },

  pxl: (c) => {
    const ps = {small:3,med:5,large:8}[c.size||'med'];
    const op = {light:.18,med:.28,heavy:.4}[c.intensity||'med'];
    const rgbs = getThemeRGBs();
    // Always under — never goes over content
    const cv = mkFxC('fx-back', op, null);
    const ctx = cv.getContext('2d');
    if (!cv.width || !cv.height) return;
    // Draw ps×ps squares directly — guaranteed square, no scaling artifacts
    for (let y = 0; y < cv.height; y += ps) {
      for (let x = 0; x < cv.width; x += ps) {
        const base = rgbs[Math.floor(Math.random() * rgbs.length)];
        const dark = Math.random() < .38;
        const f = dark ? (.15 + Math.random() * .25) : (.55 + Math.random() * .45);
        const n = v => Math.max(0, Math.min(255, Math.round(v * f + (Math.random() - .5) * 20)));
        ctx.fillStyle = `rgb(${n(base[0])},${n(base[1])},${n(base[2])})`;
        ctx.fillRect(x, y, ps, ps); // always ps×ps = always square
      }
    }
  },

  vgn: (c) => {
    const str = {light:.5,med:.72,heavy:.9}[c.strength||'med'];
    const sp  = {tight:.12,med:.22,wide:.35}[c.spread||'med'];
    const cv = mkFxC(overlayTarget(c.layer||'over'), 1, null); const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(cv.width/2,cv.height/2,cv.height*sp,cv.width/2,cv.height/2,cv.height*.92);
    g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,`rgba(0,0,0,${str})`);
    ctx.fillStyle=g; ctx.fillRect(0,0,cv.width,cv.height);
  },

  gls: (c) => {
    const cellSize = {small:25,med:45,large:80}[c.size||'med'];
    const op = {light:.3,med:.5,heavy:.72}[c.opacity||'med'];
    const cv = mkFxC(overlayTarget(c.layer||'under'), op, 'screen');
    const ctx = cv.getContext('2d');
    const cs2 = getComputedStyle(document.documentElement);
    const baseHues = ['--primary','--secondary','--accent'].map(v => {
      const hex = cs2.getPropertyValue(v).trim().replace('#','');
      const r=parseInt(hex.slice(0,2),16)/255,g=parseInt(hex.slice(2,4),16)/255,b=parseInt(hex.slice(4,6),16)/255;
      const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min; if(d===0)return 120;
      let h=0; if(max===r)h=((g-b)/d+(g<b?6:0))/6;else if(max===g)h=((b-r)/d+2)/6;else h=((r-g)/d+4)/6; return Math.round(h*360);
    });
    const cols = Math.ceil(cv.width/cellSize)+1; const rows = Math.ceil(cv.height/cellSize)+1;
    const cw = cv.width/cols; const ch = cv.height/rows; const jit = 0.42;
    const pts = []; for(let row=0;row<=rows;row++) for(let col=0;col<=cols;col++) pts.push({x:col*cw+(Math.random()-.5)*cw*jit*2,y:row*ch+(Math.random()-.5)*ch*jit*2});
    for(let row=0;row<rows;row++) for(let col=0;col<cols;col++) {
      const i=row*(cols+1)+col; const tl=pts[i],tr=pts[i+1],bl=pts[i+(cols+1)],br=pts[i+(cols+2)];
      if(!tl||!tr||!bl||!br) continue;
      const hue=(baseHues[Math.floor(Math.random()*baseHues.length)]+(Math.random()-.5)*90+360)%360;
      const sat=35+Math.random()*50,lit=25+Math.random()*42,alpha=.5+Math.random()*.2;
      ctx.fillStyle=`hsla(${hue},${sat}%,${lit}%,${alpha.toFixed(2)})`;
      ctx.beginPath(); ctx.moveTo(tl.x,tl.y); ctx.lineTo(tr.x,tr.y); ctx.lineTo(br.x,br.y); ctx.lineTo(bl.x,bl.y); ctx.closePath(); ctx.fill();
    }
  },

  crs: (c) => {
    const sp  = {tight:4,med:7,wide:13}[c.spacing||'med'];
    const op  = {light:.12,med:.22,heavy:.4}[c.opacity||'med'];
    const cv = mkFxC(overlayTarget(c.layer||'under'), op, null);
    const ctx = cv.getContext('2d'); const ang = Math.PI/4;
    ctx.strokeStyle='rgba(0,0,0,0.9)'; ctx.lineWidth=.6;
    for(let d=-cv.height*2;d<cv.width*2;d+=sp){ctx.save();ctx.translate(cv.width/2,cv.height/2);ctx.rotate(ang);ctx.beginPath();ctx.moveTo(d,-cv.height*2);ctx.lineTo(d,cv.height*2);ctx.stroke();ctx.restore();}
    ctx.strokeStyle='rgba(0,0,0,0.5)';
    for(let d=-cv.height*2;d<cv.width*2;d+=sp){ctx.save();ctx.translate(cv.width/2,cv.height/2);ctx.rotate(-ang);ctx.beginPath();ctx.moveTo(d,-cv.height*2);ctx.lineTo(d,cv.height*2);ctx.stroke();ctx.restore();}
  },
}; }

function setTheme(id) { setOverlay(id); } // legacy alias
function applyTheme() { applyOverlay(); } // legacy alias


function settingsTab(tab) {
  ['display','cards','other','theme'].forEach(t => {
    document.getElementById('spanel-' + t).style.display = t === tab ? 'flex' : 'none';
    document.getElementById('stab-'   + t).classList.toggle('active', t === tab);
  });
}

function setMiniGraphDays(n) {
  appSettings.miniGraphDays = n;
  lsSet('sch_settings', appSettings);
  updateSettingsUI();
  renderJobs();
}

function nowTimeStr() {
  const now = new Date();
  let h = now.getHours(), m = now.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ' ' + ap;
}

function getTimerState(job) {
  const key = localDateKey(new Date());
  const w = job.worked && job.worked[key];
  if (!w || !w.start) return 'idle';
  if (w.start && !w.end) return 'running';
  return 'done';
}

function timerIcon(state, job) {
  if (state === 'running') {
    return '<div class="job-card-pause"><div class="job-card-pause-bar"></div><div class="job-card-pause-bar"></div></div>';
  } else if (state === 'done') {
    return '<div class="job-card-check"></div>';
  }
  return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2 Q2 1 3 1.5 L13.5 7.5 Q15 8 13.5 8.5 L3 14.5 Q2 15 2 14 Z" fill="currentColor" style="color:var(--text-mid)" stroke="var(--muted)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>';
}

function getElapsedStr(job) {
  const key = localDateKey(new Date());
  const w = job.worked && job.worked[key];
  if (!w || !w.start) return null;
  const startMins = parseTimeToMins(w.start);
  if (startMins === null) return null;
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  let diff = nowMins - startMins;
  if (diff < 0) diff += 24 * 60;
  const hh = String(Math.floor(diff / 60)).padStart(2,'0');
  const mm = String(diff % 60).padStart(2,'0');
  return hh + 'h ' + mm + 'm';
}

function timerTap(jobId, e) {
  e.stopPropagation();
  const job = jobs.find(j => j.id === jobId);
  if (!job) return;
  const key = localDateKey(new Date());
  if (!job.worked) job.worked = {};
  const state = getTimerState(job);

  if (state === 'idle') {
    // start shift
    job.worked[key] = { start: nowTimeStr(), end: null };
    lsSet('sch_jobs', jobs);
    renderJobs();
  } else if (state === 'running') {
    // end shift
    job.worked[key].end = nowTimeStr();
    lsSet('sch_jobs', jobs);
    renderJobs();
    if (typeof renderHistory === 'function') { buildHistory(); renderHistory(); }
  } else {
    // done — ask to reset
    showTimerResetModal(job, key);
  }
}

function showTimerResetModal(job, key) {
  let modal = document.getElementById('timerResetModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'timerResetModal';
    modal.className = 'modal-blur-overlay';
    modal.innerHTML = '<div style="background:var(--bg-2);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);width:100%;max-width:320px;overflow:hidden;">'
      + '<div style="padding:16px;font-size:var(--text-sm);font-weight:var(--fw-bold);color:var(--text-light);text-align:center;letter-spacing:var(--ls-wider);text-transform:uppercase;">Reset Today&#39;s Shift?</div>'
      + '<div style="display:flex;border-top:var(--border-width) solid var(--border-color);">'
      + '<div id="timerResetNo" style="flex:1;padding:12px;text-align:center;font-size:var(--text-sm);font-weight:var(--fw-bold);color:var(--text-mid);cursor:pointer;border-right:var(--border-width) solid var(--border-color);">Cancel</div>'
      + '<div id="timerResetYes" style="flex:1;padding:12px;text-align:center;font-size:var(--text-sm);font-weight:var(--fw-bold);color:var(--text-light);cursor:pointer;">Reset</div>'
      + '</div></div>';
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
  document.getElementById('timerResetNo').onclick  = () => { modal.style.display = 'none'; };
  document.getElementById('timerResetYes').onclick = () => {
    if (!job.worked) job.worked = {};
    delete job.worked[key];
    lsSet('sch_jobs', jobs);
    modal.style.display = 'none';
    renderJobs();
    if (typeof renderHistory === 'function') { buildHistory(); renderHistory(); }
  };
}


/* ── mini graph ── */
function buildMiniGraph(job, container) {
  const cs       = getComputedStyle(document.documentElement);
  const green    = cs.getPropertyValue('--primary').trim();
  const blue     = cs.getPropertyValue('--secondary').trim();
  const white    = cs.getPropertyValue('--text-light').trim();
  const n        = appSettings.miniGraphDays || 3;
  const total    = n * 2 + 1;
  const today    = new Date(); today.setHours(0,0,0,0);
  const days     = [];

  for (let i = -n; i <= n; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    const key = localDateKey(d);
    const when = i < 0 ? 'past' : i === 0 ? 'today' : 'future';
    const src  = when === 'past' ? job.worked : job.schedule;
    const entry = src && src[key];
    let hours = 0, hasShift = false;
    if (entry && entry.start && entry.start !== 'OFF' && entry.start !== 'NONE' && entry.end) {
      const s = parseTimeToMins(entry.start), e = parseTimeToMins(entry.end);
      if (s !== null && e !== null) {
        let diff = e - s; if (diff <= 0) diff += 1440;
        hours = diff / 60; hasShift = true;
      }
    } else if (entry && entry.start === 'OFF') {
      hasShift = false;
    }
    days.push({ when, hasShift, hours });
  }

  const INNER   = 39; // 45px left - 6px borders
  const colW    = INNER / total;
  const dotSize = Math.max(2, Math.min(6, Math.floor(colW * 0.55)));
  const maxH    = Math.max(...days.map(d => d.hours), 1);

  days.forEach(d => {
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:flex-end;flex:1;';
    const barColor = d.when === 'past' ? green : d.when === 'today' ? blue : white;

    if (!d.hasShift) {
      const dot = document.createElement('div');
      dot.style.cssText = `width:${dotSize}px;height:${dotSize}px;border-radius:50%;background:${barColor};flex-shrink:0;`;
      col.appendChild(dot);
    } else {
      const bar = document.createElement('div');
      bar.style.cssText = `width:100%;border-radius:2px 2px 0 0;min-height:2px;background:${barColor};height:${Math.round((d.hours / maxH) * 30)}px;`;
      col.appendChild(bar);
    }
    container.appendChild(col);
  });
}

/* ── render jobs ── */
function renderJobs() {
  const app = document.getElementById('mainApp');
  app.innerHTML = '';
  // order: 1) job cards (below), 2) quick schedule, 3) history
  if (appSettings.showJobCards) {
    if (jobs.length === 0) {
      const placeholder = document.createElement('div');
      placeholder.className = 'label-card';
      placeholder.textContent = 'Tap New to Add a Job';
      placeholder.style.cursor = 'pointer';
      placeholder.onclick = () => openWindow('newWindow');
      app.appendChild(placeholder);
    } else {
      const lbl = document.createElement('div');
      lbl.className = 'label-card';
      lbl.textContent = 'Time Until Next Shift';
      app.appendChild(lbl);
    }
  }
  if (appSettings.showJobCards) jobs.forEach(job => {
    const countdown = getNextShiftCountdown(job);
    const card = document.createElement('div');
    card.className = 'job-card';
    const timerState  = getTimerState(job);
    const bottomText  = timerState === 'running' ? (getElapsedStr(job) || '00h 00m') : (countdown || '-- h -- m');
    const showTimer   = appSettings.showTimerSections !== false;
    const showGraph   = appSettings.showMiniGraph !== false;
    card.innerHTML =
      (showGraph ? `<div class="job-card-left" id="graph-${job.id}" style="display:flex;flex-direction:row;align-items:flex-end;padding:3px 4px;gap:1px;"></div>` : '') +
      `<div class="job-card-center">` +
        `<div class="job-card-top" style="background:${job.color}">` +
          `<span class="job-card-title">${job.title}</span>` +
        `</div>` +
        `<div class="job-card-bottom">${bottomText}</div>` +
      `</div>` +
      (showTimer ? `<div class="job-card-right" onclick="timerTap(${job.id}, event)">${timerIcon(timerState, job)}</div>` : '');
    if (showGraph) {
      const graphEl = card.querySelector('#graph-' + job.id);
      if (graphEl) buildMiniGraph(job, graphEl);
    }
    card.onclick = () => openJobWindow(job);
    app.appendChild(card);
  });
  // enforce order: quick schedule then history
  if (typeof renderQuickSchedule === 'function' && appSettings.showQuickSchedule) {
    buildQuickSchedule(); renderQuickSchedule();
  }
  if (typeof renderHistory === 'function') { buildHistory(); renderHistory(); }
}

/* ── job window ── */
function refreshSwatchCards() {
  const nw = document.getElementById('nwColorCard');
  const js = document.getElementById('jsColorCard');
  if (nw) nw.innerHTML = buildSwatches('nwPickColor');
  if (js) js.innerHTML = buildSwatches('jsPickColor');
}

function openJobWindow(job) {
  refreshSwatchCards();
  activeJobId    = job.id;
  activeFirstDow = job.firstDow !== undefined ? job.firstDow : 1;
  const titleEl = document.getElementById('jobWindowTitle');
  titleEl.textContent = job.title;
  titleEl.style.cssText = `background:${job.color};font-size:var(--text-md);font-weight:var(--fw-heavy);letter-spacing:var(--ls-wider);`;
  activeWeek  = 'this';
  activeHours = 'scheduled';
  updateWeekUI();
  document.getElementById('jobWindow').classList.add('open');
}

/* ── job settings ── */
function openJobSettings() {
  const job = jobs.find(j => j.id === activeJobId);
  if (!job) return;
  document.getElementById('jsTitleInput').value = job.title;
  document.querySelectorAll('#jsColorCard .nw-swatch').forEach(s => {
    s.classList.toggle('selected', s.dataset.color === job.color);
  });
  jsSelectedColor = job.color;
  const savedDow = job.firstDow !== undefined ? job.firstDow : 1;
  document.querySelectorAll('#dowCard .dow-btn').forEach(b => {
    const isActive = parseInt(b.dataset.dow) === savedDow;
    b.classList.toggle('active', isActive);
    b.style.background = isActive ? job.color : '';
    b.style.color = isActive ? 'var(--color-10)' : '';
  });
  document.getElementById('deleteCard').classList.remove('confirm');
  document.getElementById('deleteCard').textContent = 'Delete Job';
  openWindow('jobSettingsWindow');
}
function jsUpdateTitle() {
  const job = jobs.find(j => j.id === activeJobId);
  if (!job) return;
  const val = document.getElementById('jsTitleInput').value.trim();
  if (!val) return;
  job.title = val;
  lsSet('sch_jobs', jobs);
  document.getElementById('jobWindowTitle').textContent = val;
  renderJobs();
}
function jsPickColor(el) {
  document.querySelectorAll('#jsColorCard .nw-swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  jsSelectedColor = el.dataset.color;
  const job = jobs.find(j => j.id === activeJobId);
  if (job) { job.color = jsSelectedColor; lsSet('sch_jobs', jobs); renderJobs();
    const titleEl = document.getElementById('jobWindowTitle');
    if (titleEl) titleEl.style.background = jsSelectedColor; }
}
function jsPickDow(el) {
  const job = jobs.find(j => j.id === activeJobId);
  document.querySelectorAll('#dowCard .dow-btn').forEach(b => {
    b.classList.remove('active');
    b.style.background = '';
    b.style.color = '';
  });
  el.classList.add('active');
  if (job) { el.style.background = job.color; el.style.color = 'var(--color-10)'; }
  activeFirstDow = parseInt(el.dataset.dow);
  if (job) { job.firstDow = activeFirstDow; lsSet('sch_jobs', jobs); }
  updateDateRange();
}
let deleteConfirmPending = false;
function jsDeleteJob() {
  const card = document.getElementById('deleteCard');
  if (!deleteConfirmPending) {
    deleteConfirmPending = true;
    card.classList.add('confirm');
    card.textContent = 'Tap Again to Confirm Delete';
    setTimeout(() => {
      deleteConfirmPending = false;
      card.classList.remove('confirm');
      card.textContent = 'Delete Job';
    }, 3000);
    return;
  }
  jobs = jobs.filter(j => j.id !== activeJobId);
  lsSet('sch_jobs', jobs);
  renderJobs();
  closeWindow('jobSettingsWindow');
  closeWindow('jobWindow');
  deleteConfirmPending = false;
}

/* ── week / hours filters ── */
function setWeek(w) {
  activeWeek = w;
  activeHours = w === 'prev' ? 'worked' : 'scheduled';
  updateWeekUI();
}
function setHoursType(t) {
  if (activeWeek === 'next') return;
  activeHours = t;
  updateHoursUI();
}
function updateWeekUI() {
  ['fwPrev','fwThis','fwNext'].forEach(id => document.getElementById(id).classList.remove('active'));
  document.getElementById({ prev:'fwPrev', this:'fwThis', next:'fwNext' }[activeWeek]).classList.add('active');
  const fhWorked = document.getElementById('fhWorked');
  if (activeWeek === 'next') {
    fhWorked.style.display = 'none';
    document.getElementById('fhScheduled').style.borderRight = 'none';
  } else {
    fhWorked.style.display = '';
    document.getElementById('fhScheduled').style.borderRight = '';
  }
  updateHoursUI();
  updateDateRange();
}
function updateHoursUI() {
  document.getElementById('fhScheduled').classList.toggle('active', activeHours === 'scheduled');
  document.getElementById('fhWorked').classList.toggle('active',    activeHours === 'worked');
  renderDayCards();
}

/* ── date range ── */
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function getWeekRange(offset) {
  const now  = new Date();
  const diff = (now.getDay() - activeFirstDow + 7) % 7;
  const start = new Date(now);
  start.setDate(now.getDate() - diff + offset * 7);
  start.setHours(0,0,0,0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { mon: start, sun: end };
}
function fmtDate(d) { return `${MONTHS[d.getMonth()]} ${d.getDate()}`; }
function updateDateRange() {
  const offset = activeWeek === 'prev' ? -1 : activeWeek === 'next' ? 1 : 0;
  const { mon, sun } = getWeekRange(offset);
  document.getElementById('dateRangeCard').textContent = `${fmtDate(mon)}  —  ${fmtDate(sun)}`;
  renderDayCards();
}

/* ── duration / time helpers ── */
function parseTimeToMins(t) {
  if (!t || t === 'OFF' || t === 'NONE') return null;
  const m = t.match(/^(\d{2}):(\d{2}) (AM|PM)$/);
  if (!m) return null;
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  if (m[3] === 'AM' && h === 12) h = 0;
  if (m[3] === 'PM' && h !== 12) h += 12;
  return h * 60 + min;
}
function calcDuration(s, e) {
  const sm = parseTimeToMins(s), em = parseTimeToMins(e);
  if (sm === null || em === null) return '00.00';
  // HH.MM where .50 = 30min
  let diff = em - sm;
  if (diff <= 0) diff += 24 * 60;
  return `${String(Math.floor(diff/60)).padStart(2,'0')}.${String(Math.round(diff%60/60*100)).padStart(2,'0')}`;
}

/* ── schedule data helpers ── */
function schedKey(mode) { return mode === 'worked' ? 'worked' : 'schedule'; }
function getSchedObj(job, mode) { return job && job[schedKey(mode)]; }
function ensureSchedObj(job, mode, dateKey) {
  const k = schedKey(mode);
  if (!job[k]) job[k] = {};
  if (!job[k][dateKey]) job[k][dateKey] = {};
  return job[k][dateKey];
}

/* ── day cards ── */
const ALL_DAY_LETTERS = ['S','M','T','W','T','F','S'];
function renderDayCards() {
  const container = document.getElementById('dayCards');
  if (!container) return;
  const offset = activeWeek === 'prev' ? -1 : activeWeek === 'next' ? 1 : 0;
  const { mon: start } = getWeekRange(offset);
  container.innerHTML = '';
  const todayNow = new Date();
  let totalMins = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const letter   = ALL_DAY_LETTERS[d.getDay()];
    const dateNum  = String(d.getDate()).padStart(2,'0');
    const isToday  = d.getFullYear() === todayNow.getFullYear() &&
                     d.getMonth()    === todayNow.getMonth()    &&
                     d.getDate()     === todayNow.getDate();
    const todayCls = isToday ? ' day-sq-today' : '';
    const job      = jobs.find(j => j.id === activeJobId);
    const dateKey  = localDateKey(d);
    const dayData  = getSchedObj(job, activeHours);
    const daySched = dayData && dayData[dateKey];
    const startVal = daySched && daySched.start;
    const endVal   = daySched && daySched.end;
    const isOff    = startVal === 'OFF' || endVal === 'OFF';
    const startTxt = isOff ? 'OFF' : (startVal && startVal !== 'NONE' ? startVal : 'START');
    const endTxt   = isOff ? 'OFF' : (endVal   && endVal   !== 'NONE' ? endVal   : 'END');
    const startCls = isOff ? ' day-half-off' : '';
    const endCls   = isOff ? ' day-half-off' : '';
    const card = document.createElement('div');
    card.className = 'day-card';
    card.innerHTML =
      `<div class="day-letter${todayCls}">${letter}</div>` +
      `<div class="day-date${todayCls}">${dateNum}</div>` +
      `<div class="day-body">` +
        `<div class="day-body-half${startCls}" data-section="start">${startTxt}</div>` +
        `<div class="day-body-half${endCls}"   data-section="end">${endTxt}</div>` +
      `</div>` +
      `<div class="day-hours${todayCls}">${calcDuration(startVal, endVal)}</div>`;
    const capturedDate = new Date(d);
    card.querySelectorAll('.day-body-half').forEach(half => {
      half.style.cursor = 'pointer';
      half.addEventListener('click', () => openSchedModal(capturedDate, half.dataset.section));
    });
    container.appendChild(card);
    if (!isOff) {
      const s = parseTimeToMins(startVal), e = parseTimeToMins(endVal);
      if (s !== null && e !== null) {
        let diff = e - s;
        if (diff <= 0) diff += 24 * 60;
        totalMins += diff;
      }
    }
  }
  const totEl = document.getElementById('totalsValue');
  if (totEl) totEl.textContent =
    `${String(Math.floor(totalMins/60)).padStart(2,'0')} Hours  ${String(totalMins%60).padStart(2,'0')} Minutes`;
}

/* ── schedule modal ── */
const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
let tpDigits = [], tpAmPm = 'AM', tpSpecial = null, tpDate = null, tpSection = null, tpHoursMode = 'scheduled';
let tpSmartPresets = [];

function openSchedModal(dateObj, section) {
  tpDate = dateObj; tpSection = section; tpDigits = []; tpSpecial = null;
  tpHoursMode = activeHours;
  const job     = jobs.find(j => j.id === activeJobId);
  const dateKey = localDateKey(dateObj);
  const dayData = getSchedObj(job, tpHoursMode);
  const saved   = dayData && dayData[dateKey] && dayData[dateKey][section];
  if (saved && saved !== 'OFF' && saved !== 'NONE') {
    const parts = saved.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);
    if (parts) {
      const hh = parts[1].padStart(2,'0');
      tpDigits = [+hh[0], +hh[1], +parts[2][0], +parts[2][1]];
      tpAmPm   = parts[3];
    }
  } else if (saved === 'OFF' || saved === 'NONE') {
    tpSpecial = saved;
  } else { tpAmPm = 'AM'; }
  document.getElementById('schedModalTitle').textContent =
    `${DAY_NAMES[dateObj.getDay()]}  ${MONTHS[dateObj.getMonth()]} ${String(dateObj.getDate()).padStart(2,'0')}  ·  ${section === 'start' ? 'Start' : 'End'}`;
  renderTimePicker();
  document.getElementById('schedModal').classList.add('open');
}

function getSmartPresets(job) {
  if (!job || !job.schedule) return [];
  const counts = {};
  Object.values(job.schedule).forEach(day => {
    if (!day || !day.start || !day.end) return;
    if (day.start === 'OFF' || day.start === 'NONE') return;
    if (day.end   === 'OFF' || day.end   === 'NONE') return;
    const key = day.start + '|' + day.end;
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a,b) => b[1] - a[1]).slice(0,4)
    .map(([key]) => { const [s,e] = key.split('|'); return {start:s, end:e}; });
}

function tpLoadSmartRange(idx) {
  const p = tpSmartPresets[idx];
  if (!p) return;
  const job = jobs.find(j => j.id === activeJobId);
  if (!job) return;
  const dayObj = ensureSchedObj(job, 'scheduled', localDateKey(tpDate));
  if (dayObj.start === 'OFF') { dayObj.start = undefined; dayObj.end = undefined; }
  dayObj.start = p.start;
  dayObj.end   = p.end;
  lsSet('sch_jobs', jobs);
  renderDayCards();
  renderJobs();
  if (typeof renderQuickSchedule === 'function' && appSettings.showQuickSchedule) { buildQuickSchedule(); renderQuickSchedule(); }
  if (typeof renderHistory === 'function') { buildHistory(); renderHistory(); }
  closeSchedModal();
}

function renderTimePicker() {
  const job = jobs.find(j => j.id === activeJobId);
  tpSmartPresets = (tpHoursMode === 'scheduled') ? getSmartPresets(job) : [];
  const hasPresets = tpSmartPresets.length > 0;
  const rows = hasPresets ? 5 : 4;
  const presetsHtml = hasPresets
    ? tpSmartPresets.map((p,i) =>
        `<button class="tp-preset" onclick="tpLoadSmartRange(${i})" style="flex-direction:column;gap:2px;font-size:var(--text-xs);">` +
          `<span>${p.start}</span>` +
          `<span style="color:var(--text-mid);">—</span>` +
          `<span>${p.end}</span>` +
        `</button>`).join('')
    : '';
  document.getElementById('schedModalBody').innerHTML = `
    <div class="tp-wrap">
      <div class="tp-display" id="tpDisplay"></div>
      <div class="tp-grid" style="grid-template-rows:repeat(${rows},var(--card-height));">
        <button class="tp-btn tp-red"    onclick="tpBack()">&#9664;</button>
        <button class="tp-btn tp-blue"   onclick="tpSetSpecial('OFF')">OFF</button>
        <button class="tp-btn tp-purple" onclick="tpSetSpecial('NONE')">NONE</button>
        <button class="tp-btn tp-red"    onclick="tpClear()">C</button>
        <button class="tp-btn" onclick="tpDigit(1)">1</button>
        <button class="tp-btn" onclick="tpDigit(2)">2</button>
        <button class="tp-btn" onclick="tpDigit(3)">3</button>
        <button class="tp-btn tp-ampm" id="tpAM" onclick="tpSetAmPm('AM')">AM</button>
        <button class="tp-btn" onclick="tpDigit(4)">4</button>
        <button class="tp-btn" onclick="tpDigit(5)">5</button>
        <button class="tp-btn" onclick="tpDigit(6)">6</button>
        <button class="tp-btn tp-ampm" id="tpPM" onclick="tpSetAmPm('PM')">PM</button>
        <button class="tp-btn" onclick="tpDigit(7)">7</button>
        <button class="tp-btn" onclick="tpDigit(8)">8</button>
        <button class="tp-btn" onclick="tpDigit(9)">9</button>
        <button class="tp-btn" onclick="tpDigit(0)">0</button>
        ${presetsHtml}
      </div>
      <div class="tp-footer">
        <button class="tp-cancel" onclick="closeSchedModal()">Cancel</button>
        <button class="tp-set"    onclick="tpConfirm()">Set Time</button>
      </div>
    </div>`;
  tpRefreshDisplay();
}

function tpRefreshDisplay() {
  const el = document.getElementById('tpDisplay');
  if (!el) return;
  if (tpSpecial) { el.textContent = tpSpecial; el.classList.add('tp-special'); }
  else {
    el.classList.remove('tp-special');
    const d = tpDigits;
    el.textContent = `${d[0]??'-'}${d[1]??'-'} : ${d[2]??'-'}${d[3]??'-'}  ${tpAmPm}`;
  }
  const amEl = document.getElementById('tpAM');
  const pmEl = document.getElementById('tpPM');
  if (amEl) amEl.classList.toggle('active', tpAmPm === 'AM');
  if (pmEl) pmEl.classList.toggle('active', tpAmPm === 'PM');
}

function tpDigit(n) {
  if (tpSpecial) { tpSpecial = null; tpDigits = []; }
  if (tpDigits.length >= 4) tpDigits = [];
  const pos = tpDigits.length;
  if (pos === 0) {
    if (n >= 2) tpDigits.push(0, n);
    else        tpDigits.push(n);
  } else if (pos === 1) {
    if (tpDigits[0] === 0 && n === 0) return;
    if (tpDigits[0] === 1 && n > 2)   return;
    tpDigits.push(n);
  } else if (pos === 2) {
    if (n > 5) return;
    tpDigits.push(n);
  } else { tpDigits.push(n); }
  tpRefreshDisplay();
}
function tpBack()           { if (tpSpecial) { tpSpecial = null; tpRefreshDisplay(); return; } tpDigits.pop(); tpRefreshDisplay(); }
function tpClear()          { tpDigits = []; tpSpecial = null; tpRefreshDisplay(); }
function tpSetAmPm(ap)      { tpAmPm = ap; tpSpecial = null; tpRefreshDisplay(); }
function tpSetSpecial(s)    { tpSpecial = s; tpDigits = []; tpRefreshDisplay(); tpConfirm(); }

function tpConfirm() {
  const job = jobs.find(j => j.id === activeJobId);
  if (!job) { closeSchedModal(); return; }
  const dayObj = ensureSchedObj(job, tpHoursMode, localDateKey(tpDate));
  if (tpSpecial === 'OFF') {
    dayObj.start = 'OFF'; dayObj.end = 'OFF';
  } else if (tpSpecial === 'NONE') {
    delete dayObj[tpSection];
  } else if (tpDigits.length >= 1) {
    let d = [...tpDigits];
    if (d.length === 1) d = [0,d[0],0,0];
    else if (d.length === 2) d = [...d,0,0];
    else if (d.length === 3) d = [...d,0];
    const hh = d[0]*10+d[1], mm = d[2]*10+d[3];
    if (hh < 1 || hh > 12 || mm > 59) { tpRefreshDisplay(); return; }
    if (dayObj.start === 'OFF') { dayObj.start = undefined; dayObj.end = undefined; }
    dayObj[tpSection] = `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')} ${tpAmPm}`;
  } else { closeSchedModal(); return; }
  lsSet('sch_jobs', jobs);
  renderDayCards();
  renderJobs();
  if (typeof renderQuickSchedule === 'function' && appSettings.showQuickSchedule) { buildQuickSchedule(); renderQuickSchedule(); }
  if (typeof renderHistory === 'function') { buildHistory(); renderHistory(); }
  closeSchedModal();
}
function closeSchedModal() { document.getElementById('schedModal').classList.remove('open'); }

/* ── clear schedule ── */
let clearSchedPending = false, clearFullPending = false;

function clearCurrentSchedule() {
  const card = document.getElementById('clearSchedCard');
  if (!clearSchedPending) {
    clearSchedPending = true;
    card.classList.add('confirm'); card.textContent = 'Tap Again to Confirm';
    setTimeout(() => { clearSchedPending = false; card.classList.remove('confirm'); card.textContent = 'Clear Schedule'; }, 3000);
    return;
  }
  const job = jobs.find(j => j.id === activeJobId);
  const ck  = schedKey(activeHours);
  if (job && job[ck]) {
    const offset = activeWeek === 'prev' ? -1 : activeWeek === 'next' ? 1 : 0;
    const { mon: start } = getWeekRange(offset);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      delete job[ck][localDateKey(d)];
    }
    lsSet('sch_jobs', jobs); renderDayCards(); renderJobs();
  }
  clearSchedPending = false; card.classList.remove('confirm'); card.textContent = 'Clear Schedule';
}

function clearFullSchedule() {
  const card = document.getElementById('clearFullCard');
  if (!clearFullPending) {
    clearFullPending = true;
    card.classList.add('confirm'); card.textContent = 'Tap Again to Confirm';
    setTimeout(() => { clearFullPending = false; card.classList.remove('confirm'); card.textContent = 'Clear Full Schedule'; }, 3000);
    return;
  }
  const job = jobs.find(j => j.id === activeJobId);
  if (job) { job.schedule = {}; job.worked = {}; lsSet('sch_jobs', jobs); renderDayCards(); renderJobs(); }
  clearFullPending = false; card.classList.remove('confirm'); card.textContent = 'Clear Full Schedule';
}


/* ── notification test ── */
function testNotification() {
  const status = document.getElementById('notifStatus');
  if (!('Notification' in window)) {
    status.textContent = 'Notifications not supported';
    status.style.color = 'var(--color-1)';
    return;
  }
  if (Notification.permission === 'granted') {
    fireTestNotification();
  } else if (Notification.permission === 'denied') {
    status.textContent = 'Notifications blocked — enable in browser settings';
    status.style.color = 'var(--color-1)';
  } else {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') fireTestNotification();
      else {
        status.textContent = 'Permission denied';
        status.style.color = 'var(--color-1)';
      }
    });
  }
}

function fireTestNotification() {
  const status = document.getElementById('notifStatus');
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification('Shift Happens', {
        body: 'Your shift starts in 30 minutes',
        icon: 'icon-192.png',
        badge: 'icon-192.png',
        tag: 'shift-test',
        vibrate: [200, 100, 200]
      });
      status.textContent = 'Notification sent!';
      status.style.color = 'var(--primary)';
    });
  } else {
    // Fallback if SW not available
    new Notification('Shift Happens', {
      body: 'Your shift starts in 30 minutes',
      icon: 'icon-192.png'
    });
    status.textContent = 'Notification sent!';
    status.style.color = 'var(--primary)';
  }
}


/* ── emergency theme reset — tap 10x consecutively ── */
(function setupEmergencyReset() {
  let tapCount = 0;
  let tapTimer = null;
  document.addEventListener('touchend', function() {
    tapCount++;
    clearTimeout(tapTimer);
    if (tapCount >= 10) {
      tapCount = 0;
      if (typeof ThemeSystem !== 'undefined') {
        ThemeSystem.resetToDefaults();
      } else {
        // fallback: clear all inline CSS vars
        const root = document.documentElement;
        root.removeAttribute('style');
      }
      localStorage.removeItem('shift_current_theme');
    }
    tapTimer = setTimeout(() => { tapCount = 0; }, 1000);
  });
})();

/* ── init ── */
buildWindows();
applyTheme();
updateSettingsUI();
renderJobs();
setInterval(() => { renderJobs(); }, 60000);
