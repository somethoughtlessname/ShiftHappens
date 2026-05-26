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
          <button class="filter-btn active" id="fhScheduled" onclick="setHoursType('scheduled')">Scheduled Hours</button>
          <button class="filter-btn" id="fhWorked" onclick="setHoursType('worked')">Worked Hours</button>
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
      <div class="data-body">
        <div class="toggle-card" id="toggleJobCards" onclick="settingToggle('showJobCards')">
          <span class="toggle-label">Job Cards</span>
          <span class="toggle-pill" id="pillJobCards"></span>
        </div>
        <div class="toggle-card" id="toggleQuickSchedule" onclick="settingToggle('showQuickSchedule')">
          <span class="toggle-label">Quick Schedule</span>
          <span class="toggle-pill" id="pillQuickSchedule"></span>
        </div>
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
let appSettings = ls('sch_settings', { showJobCards: true, showQuickSchedule: true });

function settingToggle(key) {
  appSettings[key] = !appSettings[key];
  lsSet('sch_settings', appSettings);
  updateSettingsUI();
  renderJobs();
}

function updateSettingsUI() {
  const keys = ['showJobCards', 'showQuickSchedule'];
  const pills = { showJobCards: 'pillJobCards', showQuickSchedule: 'pillQuickSchedule' };
  const cards = { showJobCards: 'toggleJobCards', showQuickSchedule: 'toggleQuickSchedule' };
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
  nwCheckReady();
}
function nwPickDow(el) {
  document.querySelectorAll('#nwDowCard .dow-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
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
  if (typeof renderQuickSchedule === 'function' && appSettings.showQuickSchedule) renderQuickSchedule();
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

/* ── render jobs ── */
function renderJobs() {
  const app = document.getElementById('mainApp');
  app.innerHTML = '';
  if (appSettings.showJobCards && jobs.length > 0) {
    const lbl = document.createElement('div');
    lbl.className = 'label-card';
    lbl.textContent = 'Time Until Next Shift';
    app.appendChild(lbl);
  }
  if (appSettings.showJobCards) jobs.forEach(job => {
    const countdown = getNextShiftCountdown(job);
    const card = document.createElement('div');
    card.className = 'job-card';
    card.innerHTML =
      `<div class="job-card-top" style="background:${job.color}">` +
        `<span class="job-card-title">${job.title}</span>` +
      `</div>` +
      `<div class="job-card-bottom">${countdown || '-- h -- m'}</div>`;
    card.onclick = () => openJobWindow(job);
    app.appendChild(card);
  });
  // re-render quick schedule below job cards
  if (typeof renderQuickSchedule === 'function' && appSettings.showQuickSchedule) renderQuickSchedule();
}

/* ── job window ── */
function openJobWindow(job) {
  activeJobId    = job.id;
  activeFirstDow = job.firstDow !== undefined ? job.firstDow : 1;
  document.getElementById('jobWindowTitle').textContent = job.title;
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
    b.classList.toggle('active', parseInt(b.dataset.dow) === savedDow);
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
  if (job) { job.color = jsSelectedColor; lsSet('sch_jobs', jobs); renderJobs(); }
}
function jsPickDow(el) {
  document.querySelectorAll('#dowCard .dow-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  activeFirstDow = parseInt(el.dataset.dow);
  const job = jobs.find(j => j.id === activeJobId);
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
  let diff = em - sm;
  if (diff <= 0) diff += 24 * 60;
  return `${String(Math.floor(diff/60)).padStart(2,'0')}.${String(diff%60).padStart(2,'0')}`;
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
  if (typeof renderQuickSchedule === 'function' && appSettings.showQuickSchedule) renderQuickSchedule();
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
  if (typeof renderQuickSchedule === 'function' && appSettings.showQuickSchedule) renderQuickSchedule();
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

/* ── init ── */
buildWindows();
updateSettingsUI();
renderJobs();
setInterval(() => { renderJobs(); }, 60000);
