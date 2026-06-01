function ls(k,d){ try{ const v=localStorage.getItem(k); return v!==null?JSON.parse(v):d; }catch(e){ return d; } }
function lsSet(k,v){ localStorage.setItem(k,JSON.stringify(v)); }

function localDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

let jobs            = ls('sch_jobs', []);
let nwSelectedColor = null;
let nwSelectedDow   = 1;
let activeWeek      = 'this';
let activeHours     = 'scheduled';
let activeFirstDow  = 1;
let activeJobId     = null;
let jsSelectedColor = null;
let tpShiftIndex = 0;
const _dcExpanded = {};

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

function buildDotGrid() {
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');
  svg.setAttribute('width','34');svg.setAttribute('height','34');svg.setAttribute('viewBox','0 0 34 34');
  const cx=17,cy=17,outerR=14,innerR=7,dotR=2.2,n7=12,n5=6;
  for(let i=0;i<n7;i++){const a=(2*Math.PI*i/n7)-Math.PI/2;const c=document.createElementNS(ns,'circle');c.setAttribute('cx',(cx+outerR*Math.cos(a)).toFixed(2));c.setAttribute('cy',(cy+outerR*Math.sin(a)).toFixed(2));c.setAttribute('r',dotR);c.style.fill=i%2===0?'var(--primary)':'var(--secondary)';svg.appendChild(c);}
  for(let i=0;i<n5;i++){const a=(2*Math.PI*i/n5)-Math.PI/2;const c=document.createElementNS(ns,'circle');c.setAttribute('cx',(cx+innerR*Math.cos(a)).toFixed(2));c.setAttribute('cy',(cy+innerR*Math.sin(a)).toFixed(2));c.setAttribute('r',dotR);c.style.fill='var(--accent)';svg.appendChild(c);}
  return svg;
}
function spinDotGrid(btn, cb) {
  if(btn._spinning) return;
  btn._spinning = true;
  const svg = btn.querySelector('svg'); if(!svg) return;
  const circles = Array.from(svg.querySelectorAll('circle'));
  const outer = circles.slice(0,12), inner = circles.slice(12);
  const cx=17,cy=17,outerR=14,innerR=7,n7=12,n5=6;
  const dur=1000; let start=null;
  function ease(t){return 1-Math.pow(1-t,3);}
  function step(ts){
    if(!start)start=ts;
    const t=Math.min((ts-start)/dur,1),e=ease(t);
    outer.forEach(function(c,i){const a=(2*Math.PI*i/n7-Math.PI/2)+e*Math.PI*2;c.setAttribute('cx',(cx+outerR*Math.cos(a)).toFixed(2));c.setAttribute('cy',(cy+outerR*Math.sin(a)).toFixed(2));});
    inner.forEach(function(c,i){const a=(2*Math.PI*i/n5-Math.PI/2)-e*Math.PI*2;c.setAttribute('cx',(cx+innerR*Math.cos(a)).toFixed(2));c.setAttribute('cy',(cy+innerR*Math.sin(a)).toFixed(2));});
    if(t<1)requestAnimationFrame(step);else{btn._spinning=false;if(cb)cb();}
  }
  requestAnimationFrame(step);
}
const DOT_GRID = '';

function buildWindows() {
  const html = `
    <!-- NEW JOB WINDOW -->
    <div class="data-window" id="newWindow">
      <div class="data-window-header">
        <button class="data-window-back" onclick="closeWindow('newWindow')" id="newWindowBack"></button>
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
        <button class="data-window-back" onclick="closeWindow('jobWindow')" id="jobWindowBack"></button>
        <div class="data-window-title" id="jobWindowTitle"></div>
        <button class="data-window-settings" onclick="spinDotGrid(this);setTimeout(openJobSettings,150)" id="jobSettingsBtn"></button>
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
        <button class="data-window-back" onclick="closeWindow('jobSettingsWindow')" id="jobSettingsWindowBack"></button>
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
        <div class="toggle-card" id="toggleSecondShift" onclick="settingToggle('showSecondShift')"><div class="toggle-check"><svg width="16" height="13" viewBox="0 0 16 13" fill="none"><path d="M1.5 6.5 L6 11 L14.5 1.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="toggle-content"><div class="toggle-label">Second Shift</div><div class="toggle-blurb">Show extra shift slot on each day card</div></div></div>
        <div class="clear-card" id="clearFullCard" onclick="clearFullSchedule()">Clear Full Schedule</div>
        <div class="delete-card" id="deleteCard" onclick="jsDeleteJob()">Delete Job</div>
      </div>
    </div>

    <!-- SETTINGS WINDOW -->
    <div class="data-window" id="settingsWindow">
      <div class="data-window-header">
        <button class="data-window-back" onclick="closeWindow('settingsWindow')" id="settingsWindowBack"></button>
        <div class="data-window-title">Settings</div>
      </div>
      <div class="filter-card" style="flex-shrink:0;border-radius:0;border-left:none;border-right:none;border-top:none;">
        <button class="filter-btn active" id="stab-display"  onclick="settingsTab('display')">Display</button>
        <button class="filter-btn"        id="stab-cards"    onclick="settingsTab('cards')">Cards</button>
        <button class="filter-btn"        id="stab-other"    onclick="settingsTab('other')">Other</button>
        <button class="filter-btn"        id="stab-theme"    onclick="settingsTab('theme')">Theme</button>
      </div>
      <div class="data-body" id="spanel-display">
        <div class="label-card">What shows in the main window</div>
        <div class="toggle-card" id="toggleJobCards" onclick="settingToggle('showJobCards')"><div class="toggle-check"><svg width="16" height="13" viewBox="0 0 16 13" fill="none"><path d="M1.5 6.5 L6 11 L14.5 1.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="toggle-content"><div class="toggle-label">Job Cards</div><div class="toggle-blurb">Shows each job as a card with your next shift countdown</div></div></div>
        <div id="quickScheduleToggleSlot"></div>
        <div id="historyToggleSlot"></div>
      </div>
      <div class="data-body" id="spanel-cards" style="display:none;">
        <div class="label-card">Job Card Sections</div>
        <div id="timerSectionsToggleSlot"></div>
        <div id="miniGraphToggleSlot"></div>
        <div id="miniGraphDaysSlot"></div>
        <div id="timeDotToggleSlot"></div>
      </div>
      <div class="data-body" id="spanel-theme" style="display:none;">
        <div class="label-card">Pick a Theme</div>
        <div id="settingsSavedThemesList"></div>
      </div>
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

const _settingsDefaults = { showJobCards: true, showQuickSchedule: true, showTimeDot: true, showHistory: true, showTimerSections: true, showMiniGraph: true, miniGraphDays: 3, theme: 'none', showSecondShift: true };
let appSettings = Object.assign({}, _settingsDefaults, ls('sch_settings', {}));

function updateDaySqVar() {
  if(appSettings.showSecondShift===false) {
    document.documentElement.style.setProperty('--day-sq','30px');
  } else {
    document.documentElement.style.removeProperty('--day-sq');
  }
}
function settingToggle(key) {
  appSettings[key] = !appSettings[key];
  lsSet('sch_settings', appSettings);
  updateSettingsUI();
  renderJobs();
  if(key==='showSecondShift'){updateDaySqVar();renderDayCards();}
}

function updateSettingsUI() {
  const CHK = `<svg width="16" height="13" viewBox="0 0 16 13" fill="none"><path d="M1.5 6.5 L6 11 L14.5 1.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  function makeToggle(id, onclick, label, blurb) {
    return `<div class="toggle-card" id="${id}" onclick="${onclick}"><div class="toggle-check">${CHK}</div><div class="toggle-content"><div class="toggle-label">${label}</div><div class="toggle-blurb">${blurb}</div></div></div>`;
  }
  const tsSlot = document.getElementById('timerSectionsToggleSlot');
  if (tsSlot) tsSlot.innerHTML = makeToggle('toggleTimerSections', "settingToggle('showTimerSections')", 'Quick Shift Timer', 'Timer button on the right side of each job card');
  const mgSlot = document.getElementById('miniGraphToggleSlot');
  if (mgSlot) mgSlot.innerHTML = makeToggle('toggleMiniGraph', "settingToggle('showMiniGraph')", 'Weekly Graph', 'Daily bars showing past worked and upcoming scheduled hours');
  const mgDays = document.getElementById('miniGraphDaysSlot');
  if (mgDays) {
    const cur = appSettings.miniGraphDays || 3;
    mgDays.innerHTML = `<div class="filter-card" style="flex-shrink:0;">
      <button class="filter-btn${cur===3?' active':''}" onclick="setMiniGraphDays(3)">3 Days</button>
      <button class="filter-btn${cur===5?' active':''}" onclick="setMiniGraphDays(5)">5 Days</button>
      <button class="filter-btn${cur===7?' active':''}" onclick="setMiniGraphDays(7)">7 Days</button>
    </div>`;
  }
  const qsSlot = document.getElementById('quickScheduleToggleSlot');
  if (qsSlot) {
    qsSlot.innerHTML = typeof renderQuickSchedule === 'function'
      ? makeToggle('toggleQuickSchedule', "settingToggle('showQuickSchedule')", 'Quick Schedule', '7-day shift timeline with hour markers across all jobs')
      : '';
  }
  const tdSlot = document.getElementById('timeDotToggleSlot');
  if (tdSlot) {
    tdSlot.innerHTML = typeof renderQuickSchedule === 'function'
      ? makeToggle('toggleTimeDot', "settingToggle('showTimeDot')", 'Current Time Indicator', 'Small diamond on the schedule marking where you are now')
      : '';
  }
  const slot = document.getElementById('historyToggleSlot');
  if (slot) {
    slot.innerHTML = typeof renderHistory === 'function'
      ? makeToggle('toggleHistory', "settingToggle('showHistory')", 'History', 'This week, next week and the last 10 weeks of hours')
      : '';
  }
  const stList = document.getElementById('settingsSavedThemesList');
  if (stList && typeof ThemeSystem !== 'undefined') {
    const themes = ThemeSystem.getSavedThemes();
    if (themes.length === 0) {
      stList.innerHTML = '<div style="font-size:var(--text-xs);color:var(--text-mid);padding:4px 8px;">No saved themes yet - use the Theme Builder to create one</div>';
    } else {
      stList.style.cssText = 'display:flex;flex-direction:column;gap:var(--margin);';
      stList.innerHTML = '';
      themes.forEach((theme, i) => {
        if (!theme?.baseColors) return;
        const pri = theme.baseColors.primary   || '#48a971';
        const sec = theme.baseColors.secondary || '#5A8DB8';
        const acc = theme.baseColors.accent    || '#8a7ca8';
        const bdr = theme.baseColors.border    || '#000000';
        const bw  = '3px';
        const card = document.createElement('div');
        card.style.cssText = `border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;cursor:pointer;display:flex;flex-direction:column;`;
        card.onclick = () => { ThemeSystem.loadTheme(i); if (typeof updateSettingsUI === 'function') updateSettingsUI(); };
        card.innerHTML =
          `<div style="display:flex;height:var(--qs-hdr);">
            <div style="flex:1;background:${pri};border-right:${bw} solid ${bdr};"></div>
            <div style="flex:1;background:${sec};border-right:${bw} solid ${bdr};"></div>
            <div style="flex:1;background:${acc};"></div>
          </div>` +
          `<div style="height:var(--job-half);background:var(--bg-2);border-top:${bw} solid ${bdr};display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:var(--fw-bold);letter-spacing:var(--ls-wide);text-transform:uppercase;color:var(--text-mid);">${theme.name}</div>`;
        stList.appendChild(card);
      });
    }
  }
  const toggleMap = {
    showJobCards: 'toggleJobCards', showQuickSchedule: 'toggleQuickSchedule',
    showTimeDot: 'toggleTimeDot', showHistory: 'toggleHistory',
    showTimerSections: 'toggleTimerSections', showMiniGraph: 'toggleMiniGraph',
    showSecondShift: 'toggleSecondShift',
  };
  Object.keys(toggleMap).forEach(k => {
    const card = document.getElementById(toggleMap[k]);
    if (card) card.classList.toggle('active', !!appSettings[k]);
  });
}

function openWindow(id) {
  if (id === 'newWindow') { refreshSwatchCards(); nwAutoSelect(); }
  const win = document.getElementById(id);
  win.style.opacity = '0';
  win.classList.add('open');
  if (id !== 'themeBuilderWindow') {
    injectWindowFx(id);
    if (getOverlayCfg().overlay === 'pxl') _pxlDoInject();
  }
  requestAnimationFrame(() => {
    win.style.transition = 'opacity 0.6s';
    win.style.opacity = '1';
    setTimeout(() => { win.style.transition = ''; }, 200);
  });
}

function closeWindow(id) {
  document.getElementById(id).classList.remove('open');
  removeWindowFx(id);
}
function nwAutoSelect() {
  const first = document.querySelector('#nwColorCard .nw-swatch');
  if (first) nwPickColor(first);
}
function nwPickColor(el) {
  document.querySelectorAll('#nwColorCard .nw-swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  nwSelectedColor = el.dataset.color;
  const activeDow = document.querySelector('#nwDowCard .dow-btn.active');
  if (activeDow && nwSelectedColor) { activeDow.style.background = nwSelectedColor; activeDow.style.color = 'var(--color-10)'; }
  const titleCard = document.querySelector('.nw-title-card');
  if (titleCard && nwSelectedColor) { titleCard.style.background = nwSelectedColor; requestAnimationFrame(() => pxlInjectSingle(titleCard)); }
  nwCheckReady();
}
function nwPickDow(el) {
  document.querySelectorAll('#nwDowCard .dow-btn').forEach(b => { b.classList.remove('active'); b.style.background = ''; b.style.color = ''; });
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

function formatCountdown(mins) {
  const h = Math.floor(mins / 60), m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
function getNextShiftCountdown(job) {
  if (!job.schedule) return null;
  const now = new Date();
  for (let d = 0; d < 14; d++) {
    const date = new Date(now); date.setDate(now.getDate() + d); date.setHours(0,0,0,0);
    const sched = job.schedule[localDateKey(date)];
    if (!sched || !sched.start || sched.start === 'OFF' || sched.start === 'NONE') continue;
    const startMins = parseTimeToMins(sched.start); if (startMins === null) continue;
    const shiftDate = new Date(date); shiftDate.setHours(Math.floor(startMins/60), startMins%60, 0, 0);
    const diffMs = shiftDate - now; if (diffMs > 0) return formatCountdown(Math.round(diffMs/60000));
  }
  return null;
}


function settingsTab(tab) {
  ['display','cards','other','theme'].forEach(t => {
    document.getElementById('spanel-' + t).style.display = t === tab ? 'flex' : 'none';
    document.getElementById('stab-'   + t).classList.toggle('active', t === tab);
  });
  if (getOverlayCfg().overlay === 'pxl') {
    const sw = document.getElementById('settingsWindow');
    if (sw) sw.querySelectorAll('.pxl-inner').forEach(el => {
      const p = el.parentElement; if (p) delete p.dataset.pxlDone; el.remove();
    });
    _pxlDoInject();
  }
}

function setMiniGraphDays(n) {
  appSettings.miniGraphDays = n; lsSet('sch_settings', appSettings); updateSettingsUI(); renderJobs();
}

function nowTimeStr() {
  const now = new Date(); let h = now.getHours(), m = now.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ' ' + ap;
}

function getTimerKey(job) {
  const today = localDateKey(new Date());
  if (job.worked && job.worked[today]) return today;
  // Check yesterday for a running overnight shift
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
  const yKey = localDateKey(yesterday);
  if (job.worked && job.worked[yKey] && job.worked[yKey].start && !job.worked[yKey].end) return yKey;
  return today;
}
function getTimerState(job) {
  const key = getTimerKey(job); const w = job.worked && job.worked[key];
  if (!w || !w.start) return 'idle'; if (w.start && !w.end) return 'running'; return 'done';
}

function timerIcon(state, job) {
  if (state === 'running') return '<div class="job-card-pause"><div class="job-card-pause-bar"></div><div class="job-card-pause-bar"></div></div>';
  else if (state === 'done') return '<div class="job-card-check"></div>';
  return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2 Q2 1 3 1.5 L13.5 7.5 Q15 8 13.5 8.5 L3 14.5 Q2 15 2 14 Z" fill="currentColor" style="color:var(--text-mid)" stroke="var(--muted)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>';
}

function getElapsedStr(job) {
  const key = getTimerKey(job); const w = job.worked && job.worked[key];
  if (!w || !w.start) return null;
  const startMins = parseTimeToMins(w.start); if (startMins === null) return null;
  const now = new Date(); const nowMins = now.getHours() * 60 + now.getMinutes();
  let diff = nowMins - startMins; if (diff < 0) diff += 24 * 60;
  return String(Math.floor(diff/60)).padStart(2,'0') + 'h ' + String(diff%60).padStart(2,'0') + 'm';
}

function timerTap(jobId, e) {
  e.stopPropagation(); const job = jobs.find(j => j.id === jobId); if (!job) return;
  const key = getTimerKey(job); if (!job.worked) job.worked = {};
  const state = getTimerState(job);
  if (state === 'idle') { job.worked[key] = { start: nowTimeStr(), end: null }; lsSet('sch_jobs', jobs); renderJobs(); }
  else if (state === 'running') { job.worked[key].end = nowTimeStr(); lsSet('sch_jobs', jobs); renderJobs(); if (typeof renderHistory === 'function') { buildHistory(); renderHistory(); } }
  else { showTimerResetModal(job, key); }
}

function showTimerResetModal(job, key) {
  let modal = document.getElementById('timerResetModal');
  if (!modal) {
    modal = document.createElement('div'); modal.id = 'timerResetModal'; modal.className = 'modal-blur-overlay';
    modal.innerHTML = '<div style="background:var(--bg-2);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);width:100%;max-width:320px;overflow:hidden;">'
      + '<div style="padding:16px;font-size:var(--text-sm);font-weight:var(--fw-bold);color:var(--text-light);text-align:center;letter-spacing:var(--ls-wider);text-transform:uppercase;">Shift Done</div>'
      + '<div style="display:flex;flex-direction:column;border-top:var(--border-width) solid var(--border-color);">'
      + '<div id="timerResetNew" style="flex:1;padding:12px;text-align:center;font-size:var(--text-sm);font-weight:var(--fw-bold);color:var(--text-light);cursor:pointer;border-bottom:var(--border-width) solid var(--border-color);background:var(--secondary);">Start New Shift</div>'
      + '<div style="display:flex;border-top:none;">'
      + '<div id="timerResetNo" style="flex:1;padding:12px;text-align:center;font-size:var(--text-sm);font-weight:var(--fw-bold);color:var(--text-mid);cursor:pointer;border-right:var(--border-width) solid var(--border-color);">Cancel</div>'
      + '<div id="timerResetYes" style="flex:1;padding:12px;text-align:center;font-size:var(--text-sm);font-weight:var(--fw-bold);color:var(--color-1);cursor:pointer;">Reset</div>'
      + '</div></div></div>';
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
  document.getElementById('timerResetNo').onclick = () => { modal.style.display = 'none'; };
  document.getElementById('timerResetNew').onclick = () => {
    // Start a new second shift — save current, open new entry on today's key
    const todayKey = localDateKey(new Date());
    if (!job.worked) job.worked = {};
    // Move completed shift to extra if it was yesterday
    if (key !== todayKey && job.worked[key]) {
      job.worked[todayKey] = { start: nowTimeStr(), end: null };
    } else {
      if (!job.worked[todayKey]) job.worked[todayKey] = {};
      if (!job.worked[todayKey].extra) job.worked[todayKey].extra = [];
      job.worked[todayKey].extra.push({ start: nowTimeStr(), end: null });
    }
    lsSet('sch_jobs', jobs);
    modal.style.display = 'none'; renderJobs();
  };
  document.getElementById('timerResetYes').onclick = () => {
    const key = getTimerKey(job);
    if (!job.worked) job.worked = {}; delete job.worked[key]; lsSet('sch_jobs', jobs);
    modal.style.display = 'none'; renderJobs();
    if (typeof renderHistory === 'function') { buildHistory(); renderHistory(); }
  };
}

let _graphAnimDone = false;

function buildMiniGraph(job, container) {
  const cs=getComputedStyle(document.documentElement);
  const green=cs.getPropertyValue('--primary').trim();
  const blue=cs.getPropertyValue('--secondary').trim();
  const acc=cs.getPropertyValue('--accent').trim();
  const n=appSettings.miniGraphDays||3; const today=new Date(); today.setHours(0,0,0,0); const days=[];
  for(let i=-n;i<=n;i++){
    const d=new Date(today); d.setDate(today.getDate()+i); const key=localDateKey(d);
    const when=i<0?'past':i===0?'today':'future'; const src=when==='past'?job.worked:job.schedule; const entry=src&&src[key];
    let hours=0,hasShift=false;
    if(entry&&entry.start&&entry.start!=='OFF'&&entry.start!=='NONE'&&entry.end){const s=parseTimeToMins(entry.start),e=parseTimeToMins(entry.end);if(s!==null&&e!==null){let diff=e-s;if(diff<=0)diff+=1440;hours=diff/60;hasShift=true;}}
    days.push({when,hasShift,hours});
  }
  container.style.gap='1px';
  const maxH=Math.max(...days.map(d=>d.hours),1);
  const barEls=[];
  days.forEach(d=>{
    const col=document.createElement('div');
    col.style.cssText='display:flex;flex-direction:column;align-items:center;justify-content:flex-end;flex:1;min-width:0;';
    const barColor=d.when==='past'?blue:d.when==='today'?green:acc;
    const el=document.createElement('div');
    el.style.width='100%';
    el.style.background=barColor;
    el.style.height='3px';
    el.style.borderRadius='2px';
    if(d.when==='today' && getOverlayCfg().overlay==='crt') {
      el.style.animation='crt-blink 1.8s ease-in-out infinite';
    }
    col.appendChild(el);
    container.appendChild(col);
    barEls.push({el,d,targetH:d.hasShift?Math.max(3,Math.round((d.hours/maxH)*30)):3,grows:d.hasShift});
  });
  if(!_graphAnimDone) {
    function easeInOut(t){return t<0.5?2*t*t:-1+(4-2*t)*t;}
    const configs=barEls.map(b=>({dur:1000+Math.random()*800,delay:Math.random()*250}));
    setTimeout(function(){
      barEls.forEach(function(b,i){if(b.grows)b.el.style.borderRadius='2px 2px 0 0';});
      const t0=performance.now();
      function step(ts){
        const el=ts-t0; let done=true;
        barEls.forEach(function(b,i){
          if(!b.grows)return;
          const t=Math.max(0,Math.min((el-configs[i].delay)/configs[i].dur,1));
          b.el.style.height=Math.max(3,Math.round(b.targetH*easeInOut(t)))+'px';
          if(t<1)done=false;
        });
        if(!done)requestAnimationFrame(step);
        else barEls.forEach(function(b){b.el.style.height=b.targetH+'px';});
      }
      requestAnimationFrame(step);
    },400);
  } else {
    barEls.forEach(function(b){
      b.el.style.height=b.targetH+'px';
      if(b.grows)b.el.style.borderRadius='2px 2px 0 0';
    });
  }
}

function renderJobs() {
  const app = document.getElementById('mainApp'); app.innerHTML = '';
  if (appSettings.showJobCards) {
    if (jobs.length === 0) {
      const placeholder = document.createElement('div'); placeholder.className = 'label-card';
      placeholder.textContent = 'Tap New to Add a Job'; placeholder.style.cursor = 'pointer';
      placeholder.onclick = () => openWindow('newWindow'); app.appendChild(placeholder);
    } else {
      const lbl = document.createElement('div'); lbl.className = 'label-card';
      lbl.textContent = 'Time Until Next Shift'; app.appendChild(lbl);
    }
  }
  if (appSettings.showJobCards) jobs.forEach(job => {
    const countdown = getNextShiftCountdown(job); const card = document.createElement('div'); card.className = 'job-card';
    const timerState = getTimerState(job);
    const bottomText = timerState === 'running' ? (getElapsedStr(job) || '00h 00m') : (countdown || '-- h -- m');
    const showTimer = appSettings.showTimerSections !== false; const showGraph = appSettings.showMiniGraph !== false;
    card.innerHTML =
      (showGraph ? `<div class="job-card-left" id="graph-${job.id}" style="display:flex;flex-direction:row;align-items:flex-end;padding:3px 4px;gap:1px;"></div>` : '') +
      `<div class="job-card-center"><div class="job-card-top" style="background:${job.color}"><span class="job-card-title">${job.title}</span></div><div class="job-card-bottom">${bottomText}</div></div>` +
      (showTimer ? `<div class="job-card-right" onclick="timerTap(${job.id}, event)">${timerIcon(timerState, job)}</div>` : '');
    if (showGraph) { const graphEl = card.querySelector('#graph-' + job.id); if (graphEl) buildMiniGraph(job, graphEl); }
    card.onclick = () => openJobWindow(job); app.appendChild(card);
  });
  if (typeof renderQuickSchedule === 'function' && appSettings.showQuickSchedule) { buildQuickSchedule(); renderQuickSchedule(); }
  if (typeof renderHistory === 'function') { buildHistory(); renderHistory(); }
  if (_appInitDone && getOverlayCfg().overlay === 'pxl') pxlReInject();
}

function refreshSwatchCards() {
  const nw = document.getElementById('nwColorCard'); const js = document.getElementById('jsColorCard');
  if (nw) nw.innerHTML = buildSwatches('nwPickColor'); if (js) js.innerHTML = buildSwatches('jsPickColor');
}

function openJobWindow(job) {
  for(const k in _dcExpanded)delete _dcExpanded[k];  refreshSwatchCards(); activeJobId = job.id; activeFirstDow = job.firstDow !== undefined ? job.firstDow : 1;
  const titleEl = document.getElementById('jobWindowTitle'); titleEl.textContent = job.title;
  titleEl.style.cssText = `background:${job.color};font-size:var(--text-md);font-weight:var(--fw-heavy);letter-spacing:var(--ls-wider);`;
  activeWeek = 'this'; activeHours = 'scheduled'; updateWeekUI();
  const jw = document.getElementById('jobWindow');
  jw.style.opacity = '0';
  jw.classList.add('open');
  injectWindowFx('jobWindow');
  if (getOverlayCfg().overlay === 'pxl') _pxlDoInject();
  requestAnimationFrame(() => {
    jw.style.transition = 'opacity 0.6s';
    jw.style.opacity = '1';
    setTimeout(() => { jw.style.transition = ''; }, 200);
  });
  const hoursCard = document.getElementById('hoursCard');
  if (hoursCard && !hoursCard._pxlObserver) {
    hoursCard._pxlObserver = new ResizeObserver(() => {
      if (getOverlayCfg().overlay !== 'pxl') return;
      const old = hoursCard.querySelector('.pxl-inner');
      if (old) { delete hoursCard.dataset.pxlDone; old.remove(); }
      const fxb = document.getElementById('fx-back');
      const BIG = fxb && fxb.querySelector('canvas');
      if (!BIG) return;
      const c = getOverlayCfg().pxl || {};
      const op = {light:.15,med:.3,heavy:.55}[c.intensity||'med'];
      const r = hoursCard.getBoundingClientRect();
      if (!r.width || !r.height) return;
      hoursCard.dataset.pxlDone = '1';
      const cv = document.createElement('canvas');
      cv.className = 'pxl-inner';
      cv.width = Math.round(r.width) - 6; cv.height = Math.round(r.height) - 6;
      cv.style.cssText = `position:absolute;top:3px;left:3px;opacity:${op};mix-blend-mode:overlay;pointer-events:none;z-index:1;`;
      try { cv.getContext('2d').drawImage(BIG, r.left+3, r.top+3, cv.width, cv.height, 0, 0, cv.width, cv.height); hoursCard.appendChild(cv); } catch(e) {}
    });
    hoursCard._pxlObserver.observe(hoursCard);
  }
}

function openJobSettings() {
  const job = jobs.find(j => j.id === activeJobId); if (!job) return;
  document.getElementById('jsTitleInput').value = job.title;
  document.querySelectorAll('#jsColorCard .nw-swatch').forEach(s => { s.classList.toggle('selected', s.dataset.color === job.color); });
  jsSelectedColor = job.color;
  const savedDow = job.firstDow !== undefined ? job.firstDow : 1;
  document.querySelectorAll('#dowCard .dow-btn').forEach(b => {
    const isActive = parseInt(b.dataset.dow) === savedDow;
    b.classList.toggle('active', isActive); b.style.background = isActive ? job.color : ''; b.style.color = isActive ? 'var(--color-10)' : '';
  });
  document.getElementById('deleteCard').classList.remove('confirm'); document.getElementById('deleteCard').textContent = 'Delete Job';
  openWindow('jobSettingsWindow');
  requestAnimationFrame(() => {
    const titleCard = document.getElementById('jobSettingsWindow') && document.getElementById('jobSettingsWindow').querySelector('.nw-title-card');
    if (titleCard && job) { titleCard.style.background = job.color; pxlInjectSingle(titleCard); }  // already in RAF
  });
}
function jsUpdateTitle() {
  const job = jobs.find(j => j.id === activeJobId); if (!job) return;
  const val = document.getElementById('jsTitleInput').value.trim(); if (!val) return;
  job.title = val; lsSet('sch_jobs', jobs); document.getElementById('jobWindowTitle').textContent = val; renderJobs();
}
function jsPickColor(el) {
  document.querySelectorAll('#jsColorCard .nw-swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected'); jsSelectedColor = el.dataset.color;
  const job = jobs.find(j => j.id === activeJobId);
  if (job) { job.color = jsSelectedColor; lsSet('sch_jobs', jobs); renderJobs(); const titleEl = document.getElementById('jobWindowTitle'); if (titleEl) titleEl.style.background = jsSelectedColor; }
  const titleCard = document.getElementById('jobSettingsWindow') && document.getElementById('jobSettingsWindow').querySelector('.nw-title-card');
  if (titleCard && jsSelectedColor) { titleCard.style.background = jsSelectedColor; requestAnimationFrame(() => pxlInjectSingle(titleCard)); }
}
function jsPickDow(el) {
  const job = jobs.find(j => j.id === activeJobId);
  document.querySelectorAll('#dowCard .dow-btn').forEach(b => { b.classList.remove('active'); b.style.background = ''; b.style.color = ''; });
  el.classList.add('active'); if (job) { el.style.background = job.color; el.style.color = 'var(--color-10)'; }
  activeFirstDow = parseInt(el.dataset.dow); if (job) { job.firstDow = activeFirstDow; lsSet('sch_jobs', jobs); } updateDateRange();
}
let deleteConfirmPending = false;
function jsDeleteJob() {
  const card = document.getElementById('deleteCard');
  if (!deleteConfirmPending) {
    deleteConfirmPending = true; card.classList.add('confirm'); card.textContent = 'Tap Again to Confirm Delete';
    setTimeout(() => { deleteConfirmPending = false; card.classList.remove('confirm'); card.textContent = 'Delete Job'; }, 3000); return;
  }
  jobs = jobs.filter(j => j.id !== activeJobId); lsSet('sch_jobs', jobs); renderJobs();
  closeWindow('jobSettingsWindow'); closeWindow('jobWindow'); deleteConfirmPending = false;
}

function setWeek(w) { activeWeek = w; activeHours = w === 'prev' ? 'worked' : 'scheduled'; updateWeekUI(); }
function setHoursType(t) { if (activeWeek === 'next') return; activeHours = t; updateHoursUI(); }
function updateWeekUI() {
  ['fwPrev','fwThis','fwNext'].forEach(id => document.getElementById(id).classList.remove('active'));
  document.getElementById({ prev:'fwPrev', this:'fwThis', next:'fwNext' }[activeWeek]).classList.add('active');
  const fhWorked = document.getElementById('fhWorked');
  if (activeWeek === 'next') {
    fhWorked.style.display = 'none';
  } else {
    fhWorked.style.display = '';
  }
  updateHoursUI(); updateDateRange();
}
function updateHoursUI() {
  document.getElementById('fhScheduled').classList.toggle('active', activeHours === 'scheduled');
  document.getElementById('fhWorked').classList.toggle('active', activeHours === 'worked');
  renderDayCards();
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function getWeekRange(offset) {
  const now = new Date(); const diff = (now.getDay() - activeFirstDow + 7) % 7;
  const start = new Date(now); start.setDate(now.getDate() - diff + offset * 7); start.setHours(0,0,0,0);
  const end = new Date(start); end.setDate(start.getDate() + 6); return { mon: start, sun: end };
}
function fmtDate(d) { return `${MONTHS[d.getMonth()]} ${d.getDate()}`; }
function updateDateRange() {
  const offset = activeWeek === 'prev' ? -1 : activeWeek === 'next' ? 1 : 0;
  const { mon, sun } = getWeekRange(offset);
  document.getElementById('dateRangeCard').textContent = `${fmtDate(mon)}  -  ${fmtDate(sun)}`;
  renderDayCards();
  requestAnimationFrame(() => {
    if (getOverlayCfg().overlay !== 'pxl') return;
    const el = document.getElementById('dateRangeCard');
    if (!el) return;
    el.querySelectorAll('.pxl-inner').forEach(c => { delete el.dataset.pxlDone; c.remove(); });
    const fxb = document.getElementById('fx-back');
    const BIG = fxb && fxb.querySelector('canvas');
    if (!BIG) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const cfg = getOverlayCfg(); const op = {light:.15,med:.3,heavy:.55}[(cfg.pxl||{}).intensity||'med'];
    el.dataset.pxlDone = '1';
    if (el.style.position === '' || el.style.position === 'static') el.style.position = 'relative';
    const cv = document.createElement('canvas');
    cv.className = 'pxl-inner';
    cv.width = Math.round(r.width); cv.height = Math.round(r.height);
    cv.style.cssText = `position:absolute;top:0;left:0;opacity:${op};mix-blend-mode:overlay;pointer-events:none;z-index:1;`;
    try { cv.getContext('2d').drawImage(BIG, r.left, r.top, r.width, r.height, 0, 0, cv.width, cv.height); el.appendChild(cv); } catch(e) {}
  });
}

function parseTimeToMins(t) {
  if (!t || t === 'OFF' || t === 'NONE') return null;
  const m = t.match(/^(\d{2}):(\d{2}) (AM|PM)$/); if (!m) return null;
  let h = parseInt(m[1]); const min = parseInt(m[2]);
  if (m[3] === 'AM' && h === 12) h = 0; if (m[3] === 'PM' && h !== 12) h += 12;
  return h * 60 + min;
}
function calcDuration(s, e) {
  const sm = parseTimeToMins(s), em = parseTimeToMins(e); if (sm === null || em === null) return '00.00';
  let diff = em - sm; if (diff <= 0) diff += 24 * 60;
  return `${String(Math.floor(diff/60)).padStart(2,'0')}.${String(Math.round(diff%60/60*100)).padStart(2,'00')}`;
}

function schedKey(mode) { return mode === 'worked' ? 'worked' : 'schedule'; }
function getSchedObj(job, mode) { return job && job[schedKey(mode)]; }
function ensureSchedObj(job, mode, dateKey) {
  const k = schedKey(mode); if (!job[k]) job[k] = {}; if (!job[k][dateKey]) job[k][dateKey] = {}; return job[k][dateKey];
}

function testNotification(){
  const status=document.getElementById('notifStatus');
  if(!('Notification' in window)){status.textContent='Notifications not supported';status.style.color='var(--color-1)';return;}
  if(Notification.permission==='granted'){fireTestNotification();}
  else if(Notification.permission==='denied'){status.textContent='Notifications blocked - enable in browser settings';status.style.color='var(--color-1)';}
  else{Notification.requestPermission().then(perm=>{if(perm==='granted')fireTestNotification();else{status.textContent='Permission denied';status.style.color='var(--color-1)';}});}
}
function fireTestNotification(){
  const status=document.getElementById('notifStatus');
  if('serviceWorker' in navigator&&navigator.serviceWorker.controller){navigator.serviceWorker.ready.then(reg=>{reg.showNotification('Shift Happens',{body:'Your shift starts in 30 minutes',icon:'icon-192.png',badge:'icon-192.png',tag:'shift-test',vibrate:[200,100,200]});status.textContent='Notification sent!';status.style.color='var(--primary)';});}
  else{new Notification('Shift Happens',{body:'Your shift starts in 30 minutes',icon:'icon-192.png'});status.textContent='Notification sent!';status.style.color='var(--primary)';}
}
