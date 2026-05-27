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
const SWATCH_COLORS = getSwatchColors();

function buildSwatches(onclickFn) {
  return SWATCH_COLORS.map(c =>
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

        <div class="toggle-card" id="toggleJobCards" onclick="settingToggle('showJobCards')"><div class="toggle-card-top"><span class="toggle-label">Job Cards</span><span class="toggle-pill" id="pillJobCards"></span></div><div class="toggle-card-blurb">Shows each job as a card with time until next shift</div></div>

        <div id="quickScheduleToggleSlot"></div>

        <div id="historyToggleSlot"></div>
      </div>

      <!-- CARDS TAB -->
      <div class="data-body" id="spanel-cards" style="display:none;">
        <div class="label-card">Left &amp; right sections on each job card</div>

        <div id="timerSectionsToggleSlot"></div>

        <div id="miniGraphToggleSlot"></div>

        <div id="miniGraphDaysSlot"></div>

        <div id="timeDotToggleSlot"></div>
      </div>

      <!-- THEME TAB -->
      <div class="data-body" id="spanel-theme" style="display:none;">
        <div class="label-card">Display Theme</div>
        <div id="themePickerSlot"></div>
      </div>

      <!-- OTHER TAB -->
      <div class="data-body" id="spanel-other" style="display:none;">
        <div class="label-card">Notifications</div>
        <div style="font-size:var(--text-xs);color:var(--muted);padding:2px 4px 6px;">Test that push notifications are working on your device</div>
        <div class="toggle-card" id="notifTestBtn" onclick="testNotification()" style="cursor:pointer;">
          <div class="toggle-card-top">
            <span class="toggle-label" style="color:var(--primary);">Send Test Notification</span>
            <span style="font-size:var(--text-xs);color:var(--muted);">&#9654;</span>
          </div>
          <div class="toggle-card-blurb">Sends a test push notification to confirm permissions are set up correctly on this device</div>
        </div>
        <div id="notifStatus" style="font-size:var(--text-xs);font-weight:var(--fw-bold);text-align:center;color:var(--muted);padding:4px;min-height:18px;"></div>
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
  const themeSlot = document.getElementById('themePickerSlot');
  if (themeSlot) {
    const cur = appSettings.theme || 'none';
    const themes = [
      { id: 'none',  label: 'Off' },
      { id: 'crt',   label: 'CRT' },
      { id: 'bw',    label: 'B&W' },
      { id: 'sepia', label: 'Sepia' },
      { id: 'neon',  label: 'Neon' },
      { id: 'dusk',  label: 'Dusk' },
    ];
    themeSlot.innerHTML = `<div class="filter-card" style="flex-shrink:0;">${
      themes.map(t => `<button class="filter-btn${cur===t.id?' active':''}" onclick="setTheme('${t.id}')">${t.label}</button>`).join('')
    }</div>`;
  }
  const tsSlot = document.getElementById('timerSectionsToggleSlot');
  if (tsSlot) {
    tsSlot.innerHTML = `<div class="toggle-card" id="toggleTimerSections" onclick="settingToggle('showTimerSections')"><span class="toggle-label">Left & Right Sections</span><span class="toggle-pill" id="pillTimerSections"></span></div>`;
  }
  const mgSlot = document.getElementById('miniGraphToggleSlot');
  if (mgSlot) {
    mgSlot.innerHTML = `<div class=\"toggle-card\" id=\"toggleMiniGraph\" onclick=\"settingToggle(&apos;showMiniGraph&apos;)\"><div class=\"toggle-card-top\"><span class=\"toggle-label\">Weekly Graph</span><span class=\"toggle-pill\" id=\"pillMiniGraph\"></span></div><div class=\"toggle-card-blurb\">Bar graph on the left panel showing hours per day. Green = past worked, blue = today, white = future scheduled</div></div>`;
  }
  const mgDays = document.getElementById('miniGraphDaysSlot');
  if (mgDays) {
    const cur = appSettings.miniGraphDays || 3;
    mgDays.innerHTML = `<div class="filter-card" style="flex-shrink:0;border-radius:var(--radius);">
      <button class="filter-btn${cur===3?' active':''}" onclick="setMiniGraphDays(3)">3 Days</button>
      <button class="filter-btn${cur===5?' active':''}" onclick="setMiniGraphDays(5)">5 Days</button>
      <button class="filter-btn${cur===7?' active':''}" onclick="setMiniGraphDays(7)">7 Days</button>
    </div>`;
  }
  // inject quickschedule toggles only if quickschedule.js loaded
  const qsSlot = document.getElementById('quickScheduleToggleSlot');
  if (qsSlot) {
    if (typeof renderQuickSchedule === 'function') {
      qsSlot.innerHTML = `<div class=\"toggle-card\" id=\"toggleQuickSchedule\" onclick=\"settingToggle(&apos;showQuickSchedule&apos;)\"><div class=\"toggle-card-top\"><span class=\"toggle-label\">Quick Schedule</span><span class=\"toggle-pill\" id=\"pillQuickSchedule\"></span></div><div class=\"toggle-card-blurb\">7-day timeline of all scheduled shifts with hour markers and current time indicator</div></div>`;

    } else { qsSlot.innerHTML = ''; }
  }
  const tdSlot = document.getElementById('timeDotToggleSlot');
  if (tdSlot) {
    if (typeof renderQuickSchedule === 'function') {
      tdSlot.innerHTML = `<div class="toggle-card" id="toggleTimeDot" onclick="settingToggle('showTimeDot')"><span class="toggle-label">Current Time Indicator</span><span class="toggle-pill" id="pillTimeDot"></span></div>`;

    } else { tdSlot.innerHTML = ''; }
  }
  // inject history toggle only if history.js loaded
  const slot = document.getElementById('historyToggleSlot');
  if (slot) {
    if (typeof renderHistory === 'function') {
      slot.innerHTML = `<div class=\"toggle-card\" id=\"toggleHistory\" onclick=\"settingToggle(&apos;showHistory&apos;)\"><div class=\"toggle-card-top\"><span class=\"toggle-label\">History</span><span class=\"toggle-pill\" id=\"pillHistory\"></span></div><div class=\"toggle-card-blurb\">This week, next week, and last 10 weeks of worked and scheduled hours</div></div>`;

    } else {
      slot.innerHTML = '';
    }
  }
  const keys = ['showJobCards', 'showQuickSchedule', 'showTimeDot', 'showHistory', 'showTimerSections', 'showMiniGraph'];
  const pills = { showJobCards: 'pillJobCards', showQuickSchedule: 'pillQuickSchedule', showTimeDot: 'pillTimeDot', showHistory: 'pillHistory', showTimerSections: 'pillTimerSections', showMiniGraph: 'pillMiniGraph' };
  const cards = { showJobCards: 'toggleJobCards', showQuickSchedule: 'toggleQuickSchedule', showTimeDot: 'toggleTimeDot', showHistory: 'toggleHistory', showTimerSections: 'toggleTimerSections', showMiniGraph: 'toggleMiniGraph' };
  keys.forEach(k => {
    const on = appSettings[k];
    const pill = document.getElementById(pills[k]);
    const card = document.getElementById(cards[k]);
    if (pill) pill.classList.toggle('on', on);
    if (card) card.classList.toggle('active', on);
  });
}

/* ── window helpers ── */
function openWindow(id) {
  document.getElementById(id).classList.add('open');
  if (id === 'newWindow') nwAutoSelect();
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


/* ── shift timer ── */
/* ── theme engine ── */
let fxIntervals = [];
let fxRAFs = [];
let currentTheme = 'none';

function clearThemeFx() {
  fxIntervals.forEach(id => { clearInterval(id); clearTimeout(id); });
  fxIntervals = [];
  fxRAFs.forEach(cancelAnimationFrame);
  fxRAFs = [];
  const fx = document.getElementById('fx');
  if (fx) fx.innerHTML = '';
  document.body.style.filter = '';
  document.querySelectorAll('.job-card-top,.job-card-bottom,.label-card').forEach(el => {
    el.style.opacity = ''; el.style.transition = '';
  });
}

function setTheme(id) {
  appSettings.theme = id;
  lsSet('sch_settings', appSettings);
  clearThemeFx();
  currentTheme = id;
  if (id === 'crt')        startCRT();
  else if (id === 'sepia') startSepia();
  else if (id === 'neon')  startNeon();
  else if (id === 'bw')    startBW();
  else if (id === 'dusk')  startDusk();
  // only refresh the theme picker buttons, not full updateSettingsUI
  const themeSlot = document.getElementById('themePickerSlot');
  if (themeSlot) {
    themeSlot.querySelectorAll('.filter-btn').forEach(btn => {
      const t = btn.getAttribute('onclick').match(/setTheme\('(.*?)'\)/);
      if (t) btn.classList.toggle('active', t[1] === id);
    });
  }
}

function applyTheme() {
  const t = appSettings.theme || 'none';
  currentTheme = t;
  clearThemeFx();
  if (t === 'crt')   startCRT();
  else if (t === 'sepia') startSepia();
  else if (t === 'neon')  startNeon();
  else if (t === 'bw')    startBW();
  else if (t === 'dusk')  startDusk();
}

/* ── CRT — Fallout Pip-Boy terminal ── */
function startCRT() {
  const fx = document.getElementById('fx');
  if (!fx) return;
  document.body.style.filter = 'brightness(0.75) contrast(1.4) saturate(0) sepia(1) hue-rotate(80deg) brightness(1.1)';
  const sl = document.createElement('div');
  sl.style.cssText = 'position:absolute;inset:0;background:repeating-linear-gradient(to bottom,transparent 0px,transparent 2px,rgba(0,0,0,0.4) 2px,rgba(0,0,0,0.4) 3px);';
  fx.appendChild(sl);
  const vg = document.createElement('div');
  vg.style.cssText = 'position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 45%,rgba(0,0,0,0.92) 100%);';
  fx.appendChild(vg);
  const glow = document.createElement('div');
  glow.style.cssText = 'position:absolute;inset:0;background:rgba(0,255,60,0.18);mix-blend-mode:screen;';
  fx.appendChild(glow);
  let waveY = 0;
  const wave = document.createElement('div');
  wave.style.cssText = 'position:absolute;left:0;right:0;height:40px;background:linear-gradient(to bottom,transparent,rgba(0,255,60,0.06),transparent);top:0;pointer-events:none;';
  fx.appendChild(wave);
  fxIntervals.push(setInterval(() => { waveY = (waveY + 2) % window.innerHeight; wave.style.top = waveY + 'px'; }, 16));
  function spawnGlitch() {
    if (currentTheme !== 'crt') return;
    const type = Math.random();
    if (type < 0.4) {
      const count = Math.floor(Math.random() * 6) + 2;
      for (let i = 0; i < count; i++) {
        const g = document.createElement('div');
        const top = Math.random() * 98, ht = Math.random() * 4 + 1, shift = (Math.random() - 0.5) * 60;
        g.style.cssText = `position:absolute;top:${top}%;left:0;right:0;height:${ht}px;background:rgba(0,255,60,${0.15+Math.random()*0.25});transform:translateX(${shift}px);`;
        fx.appendChild(g);
        setTimeout(() => g && g.remove(), 20 + Math.random() * 80);
      }
    } else if (type < 0.6) {
      const b = 1.2 + Math.random() * 0.3;
      document.body.style.filter = `brightness(${b}) contrast(1.4) saturate(0) sepia(1) hue-rotate(80deg) brightness(1.1)`;
      setTimeout(() => { if (currentTheme === 'crt') document.body.style.filter = 'brightness(0.75) contrast(1.4) saturate(0) sepia(1) hue-rotate(80deg) brightness(1.1)'; }, 20 + Math.random() * 60);
    } else if (type < 0.75) {
      const g = document.createElement('div');
      const left = Math.random() * 70, w = Math.random() * 30 + 5, top = Math.random() * 85, ht = Math.random() * 20 + 4;
      g.style.cssText = `position:absolute;top:${top}%;left:${left}%;width:${w}%;height:${ht}px;background:rgba(0,0,0,0.85);`;
      fx.appendChild(g);
      setTimeout(() => g && g.remove(), 30 + Math.random() * 120);
    } else if (type < 0.88) {
      const smear = document.createElement('div');
      const top = Math.random() * 95;
      smear.style.cssText = `position:absolute;top:${top}%;left:0;right:0;height:${Math.random()*8+1}px;background:linear-gradient(to right,transparent,rgba(0,255,60,0.5),rgba(0,255,60,0.3),transparent);`;
      fx.appendChild(smear);
      setTimeout(() => smear && smear.remove(), 40 + Math.random() * 100);
    } else {
      const roll = Math.random() * 12 - 6;
      const app = document.getElementById('mainApp');
      if (app) { app.style.transform = `translateY(${roll}px)`; setTimeout(() => app.style.transform = '', 40 + Math.random() * 60); }
    }
    fxIntervals.push(setTimeout(spawnGlitch, Math.random() < 0.25 ? 80 + Math.random() * 200 : 600 + Math.random() * 2500));
  }
  let crtB = 0.75, crtTarget = 0.75;
  fxIntervals.push(setInterval(() => {
    if (currentTheme !== 'crt') return;
    if (Math.random() < 0.04) crtTarget = 0.68 + Math.random() * 0.14;
    crtB += (crtTarget - crtB) * 0.06;
    document.body.style.filter = `brightness(${crtB.toFixed(3)}) contrast(1.4) saturate(0) sepia(1) hue-rotate(80deg) brightness(1.1)`;
  }, 16));
  spawnGlitch();
}

/* ── Sepia — film accurate ── */
function startSepia() {
  const fx = document.getElementById('fx');
  if (!fx) return;
  document.body.style.filter = 'sepia(0.95) contrast(1.08) brightness(0.9) saturate(0.8)';
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0.28;';
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  fx.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  function drawGrain() {
    if (currentTheme !== 'sepia') return;
    const img = ctx.createImageData(canvas.width, canvas.height);
    for (let y = 0; y < canvas.height; y += 4) for (let x = 0; x < canvas.width; x += 4) {
      const v = Math.random() * 255;
      for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 4; dx++) {
        const i = ((y+dy)*canvas.width+(x+dx))*4;
        if (i < img.data.length-3) { const j=(Math.random()-0.5)*60; img.data[i]=img.data[i+1]=img.data[i+2]=Math.max(0,Math.min(255,v+j)); img.data[i+3]=Math.random()*60; }
      }
    }
    ctx.putImageData(img, 0, 0);
    fxRAFs.push(requestAnimationFrame(drawGrain));
  }
  drawGrain();
  const vg = document.createElement('div');
  vg.style.cssText = 'position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 40%,rgba(40,15,0,0.75) 100%);';
  fx.appendChild(vg);
  function spawnBurn() {
    if (currentTheme !== 'sepia') return;
    const burn = document.createElement('div');
    const size = 30 + Math.random() * 80;
    burn.style.cssText = `position:absolute;width:${size}px;height:${size}px;left:${Math.random()*100}%;top:${Math.random()*100}%;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(ellipse,rgba(255,240,180,0.6) 0%,rgba(255,220,120,0.3) 40%,transparent 70%);filter:blur(${size*0.15}px);opacity:0;`;
    fx.appendChild(burn);
    let op = 0;
    const gi = setInterval(() => { op = Math.min(1, op + 0.08); burn.style.opacity = op; if (op >= 1) { clearInterval(gi); setTimeout(() => { const si = setInterval(() => { op = Math.max(0, op - 0.06); burn.style.opacity = op; if (op <= 0) { clearInterval(si); burn.remove(); } }, 30); fxIntervals.push(si); }, 200 + Math.random() * 600); } }, 30);
    fxIntervals.push(gi);
    fxIntervals.push(setTimeout(spawnBurn, 1500 + Math.random() * 3000));
  }
  spawnBurn();
  fxIntervals.push(setInterval(() => {
    if (Math.random() < 0.08) { const s = document.createElement('div'); const x=10+Math.random()*80,gap=Math.random()*20; s.style.cssText=`position:absolute;top:${gap}%;bottom:${gap}%;left:${x}%;width:${Math.random()<0.5?1:2}px;background:rgba(255,230,160,${0.3+Math.random()*0.4});`; fx.appendChild(s); setTimeout(()=>s.remove(),80+Math.random()*300); }
  }, 1200));
  fxIntervals.push(setInterval(() => {
    const count = Math.floor(Math.random()*5)+1;
    for (let i=0;i<count;i++) { const d=document.createElement('div'); const sz=Math.random()*4+1; d.style.cssText=`position:absolute;width:${sz}px;height:${sz*0.6}px;border-radius:50%;top:${Math.random()*100}%;left:${Math.random()*100}%;background:rgba(255,220,140,${0.5+Math.random()*0.5});transform:rotate(${Math.random()*360}deg);`; fx.appendChild(d); setTimeout(()=>d.remove(),30+Math.random()*80); }
  }, 80));
  fxIntervals.push(setInterval(() => {
    if (Math.random() < 0.07) { const b=0.78+Math.random()*0.2; document.body.style.filter=`sepia(0.95) contrast(1.08) brightness(${b}) saturate(0.8)`; setTimeout(()=>{ if(currentTheme==='sepia') document.body.style.filter='sepia(0.95) contrast(1.08) brightness(0.9) saturate(0.8)'; },40+Math.random()*60); }
  }, 150));
}

/* ── Neon — chaotic glow ── */
function startNeon() {
  const fx = document.getElementById('fx');
  if (!fx) return;
  document.body.style.filter = 'brightness(1.05) saturate(2) contrast(1.2)';
  const gl = document.createElement('div');
  gl.style.cssText = 'position:absolute;inset:0;background:rgba(0,255,180,0.04);mix-blend-mode:screen;';
  fx.appendChild(gl);
  function spawnBurst() {
    if (currentTheme !== 'neon') return;
    const burst = document.createElement('div');
    const size = 40 + Math.random() * 120;
    const colors = ['rgba(0,255,180,0.35)','rgba(180,0,255,0.3)','rgba(0,180,255,0.3)','rgba(255,0,180,0.25)'];
    burst.style.cssText = `position:absolute;width:${size}px;height:${size}px;left:${Math.random()*100}%;top:${Math.random()*100}%;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(ellipse,${colors[Math.floor(Math.random()*4)]} 0%,transparent 70%);filter:blur(${size*0.3}px);opacity:0;`;
    fx.appendChild(burst);
    setTimeout(() => { burst.style.transition='opacity 0.05s'; burst.style.opacity='1'; }, 10);
    setTimeout(() => { burst.style.opacity='0'; setTimeout(()=>burst.remove(),100); }, 50+Math.random()*150);
    fxIntervals.push(setTimeout(spawnBurst, 200+Math.random()*800));
  }
  spawnBurst();
  fxIntervals.push(setInterval(() => {
    if (Math.random() < 0.15) {
      const els = document.querySelectorAll('.job-card-top,.job-card-bottom,.label-card');
      const target = els[Math.floor(Math.random()*els.length)];
      if (target) { target.style.transition='opacity 0.02s'; target.style.opacity=0.1+Math.random()*0.5; setTimeout(()=>{ target.style.opacity=''; setTimeout(()=>target.style.transition='',100); },20+Math.random()*120); }
    }
  }, 200));
  fxIntervals.push(setInterval(() => {
    if (currentTheme !== 'neon') return;
    const b = 0.9 + Math.random() * 0.25;
    document.body.style.filter = `brightness(${b}) saturate(2) contrast(1.2)`;
  }, 120));
}

/* ── B&W — noisy SD TV ── */
function startBW() {
  const fx = document.getElementById('fx');
  if (!fx) return;
  document.body.style.filter = 'grayscale(1) contrast(1.1) brightness(0.9)';
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0.22;';
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  fx.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  function drawNoise() {
    if (currentTheme !== 'bw') return;
    const img = ctx.createImageData(canvas.width, canvas.height);
    for (let i=0;i<img.data.length;i+=4) { const v=Math.random()*255; img.data[i]=img.data[i+1]=img.data[i+2]=v; img.data[i+3]=180; }
    ctx.putImageData(img, 0, 0);
    fxRAFs.push(requestAnimationFrame(drawNoise));
  }
  drawNoise();
  let bwBrightness=0.9, bwTarget=0.9, bwFading=false;
  fxIntervals.push(setInterval(() => {
    if (currentTheme !== 'bw') return;
    if (!bwFading && Math.random()<0.06) { bwFading=true; bwTarget=0.45+Math.random()*0.35; canvas.style.transition=`opacity ${300+Math.random()*400}ms ease`; canvas.style.opacity=0.45+Math.random()*0.35; setTimeout(()=>{ if(currentTheme==='bw'){ bwTarget=0.9; canvas.style.transition=`opacity ${400+Math.random()*500}ms ease`; canvas.style.opacity='0.22'; setTimeout(()=>{bwFading=false;},600); } },300+Math.random()*800); }
  }, 800));
  fxIntervals.push(setInterval(() => { if(currentTheme!=='bw')return; bwBrightness+=(bwTarget-bwBrightness)*0.08; document.body.style.filter=`grayscale(1) contrast(1.1) brightness(${bwBrightness.toFixed(3)})`; }, 16));
  fxIntervals.push(setInterval(() => {
    if (Math.random()<0.15) { const band=document.createElement('div'); band.style.cssText=`position:absolute;top:${Math.random()*90}%;left:0;right:0;height:${Math.random()*15+3}px;background:rgba(${Math.random()>0.5?255:0},${Math.random()>0.5?255:0},${Math.random()>0.5?255:0},${0.1+Math.random()*0.2});`; fx.appendChild(band); setTimeout(()=>band.remove(),30+Math.random()*100); }
  }, 150));
}

/* ── Dusk — indie film ── */
function startDusk() {
  const fx = document.getElementById('fx');
  if (!fx) return;
  document.body.style.filter = 'brightness(0.88) saturate(0.75) contrast(1.05) sepia(0.2)';
  const warm = document.createElement('div');
  warm.style.cssText = 'position:absolute;inset:0;background:rgba(255,130,20,0.12);mix-blend-mode:multiply;';
  fx.appendChild(warm);
  const vg = document.createElement('div');
  vg.style.cssText = 'position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 35%,rgba(100,40,0,0.5) 100%);';
  fx.appendChild(vg);
  function spawnFlare() {
    if (currentTheme !== 'dusk') return;
    const flare = document.createElement('div');
    const x=10+Math.random()*80, y=Math.random()*50, size=60+Math.random()*140;
    flare.style.cssText = `position:absolute;left:${x}%;top:${y}%;transform:translate(-50%,-50%);pointer-events:none;width:${size}px;height:${size*0.4}px;opacity:0;`;
    flare.innerHTML = `<div style="position:absolute;width:${size*0.4}px;height:${size*0.4}px;border-radius:50%;top:50%;left:50%;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(255,220,120,0.9) 0%,rgba(255,180,60,0.4) 40%,transparent 70%);filter:blur(${size*0.05}px);"></div><div style="position:absolute;width:${size}px;height:${size*0.15}px;top:50%;left:0;transform:translateY(-50%);background:linear-gradient(to right,transparent,rgba(255,200,80,0.35),rgba(255,255,200,0.6),rgba(255,200,80,0.35),transparent);filter:blur(2px);"></div>`;
    fx.appendChild(flare);
    setTimeout(()=>{ flare.style.transition='opacity 0.15s'; flare.style.opacity=0.7+Math.random()*0.3; },10);
    setTimeout(()=>{ flare.style.opacity='0'; setTimeout(()=>flare.remove(),200); },300+Math.random()*800);
    fxIntervals.push(setTimeout(spawnFlare, 2000+Math.random()*5000));
  }
  spawnFlare();
  fxIntervals.push(setInterval(() => {
    if (Math.random()<0.08) { const b=0.78+Math.random()*0.18; document.body.style.filter=`brightness(${b}) saturate(0.75) contrast(1.05) sepia(0.2)`; setTimeout(()=>{ if(currentTheme==='dusk') document.body.style.filter='brightness(0.88) saturate(0.75) contrast(1.05) sepia(0.2)'; },40+Math.random()*80); }
  }, 200));
  const grain = document.createElement('canvas');
  grain.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0.1;';
  grain.width=window.innerWidth; grain.height=window.innerHeight;
  fx.appendChild(grain);
  const gctx = grain.getContext('2d');
  function drawDuskGrain() {
    if (currentTheme !== 'dusk') return;
    const img = gctx.createImageData(grain.width, grain.height);
    for (let y=0;y<grain.height;y+=3) for (let x=0;x<grain.width;x+=3) { const v=Math.random()*255; for(let dy=0;dy<3;dy++) for(let dx=0;dx<3;dx++){const i=((y+dy)*grain.width+(x+dx))*4; if(i<img.data.length-3){img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=30;}} }
    gctx.putImageData(img, 0, 0);
    fxRAFs.push(requestAnimationFrame(drawDuskGrain));
  }
  drawDuskGrain();
}


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
  return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2 Q2 1 3 1.5 L13.5 7.5 Q15 8 13.5 8.5 L3 14.5 Q2 15 2 14 Z" fill="currentColor" style="color:var(--muted)" stroke="var(--muted)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>';
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
      + '<div style="padding:16px;font-size:var(--text-sm);font-weight:var(--fw-bold);color:var(--color-10);text-align:center;letter-spacing:var(--ls-wider);text-transform:uppercase;">Reset Today&#39;s Shift?</div>'
      + '<div style="display:flex;border-top:var(--border-width) solid var(--border-color);">'
      + '<div id="timerResetNo" style="flex:1;padding:12px;text-align:center;font-size:var(--text-sm);font-weight:var(--fw-bold);color:var(--muted);cursor:pointer;border-right:var(--border-width) solid var(--border-color);">Cancel</div>'
      + '<div id="timerResetYes" style="flex:1;padding:12px;text-align:center;font-size:var(--text-sm);font-weight:var(--fw-bold);color:var(--color-1);cursor:pointer;">Reset</div>'
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
  const white    = cs.getPropertyValue('--color-10').trim();
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
    const showSides   = appSettings.showTimerSections !== false;
    const showGraph   = appSettings.showMiniGraph !== false;
    card.innerHTML =
      (showSides && showGraph ? `<div class="job-card-left" id="graph-${job.id}" style="display:flex;flex-direction:row;align-items:flex-end;padding:3px 4px;gap:1px;"></div>` : '') +
      `<div class="job-card-center">` +
        `<div class="job-card-top" style="background:${job.color}">` +
          `<span class="job-card-title">${job.title}</span>` +
        `</div>` +
        `<div class="job-card-bottom">${bottomText}</div>` +
      `</div>` +
      (showSides ? `<div class="job-card-right" onclick="timerTap(${job.id}, event)">${timerIcon(timerState, job)}</div>` : '');
    if (showSides && showGraph) {
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
function openJobWindow(job) {
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
          `<span style="color:var(--muted);">—</span>` +
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

/* ── init ── */
buildWindows();
applyTheme();
updateSettingsUI();
renderJobs();
setInterval(() => { renderJobs(); }, 60000);
