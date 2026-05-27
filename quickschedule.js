/* quickschedule.js — Quick Schedule feature
   Requires: app.js globals — jobs, parseTimeToMins, localDateKey, MONTHS, DAY_NAMES, openJobWindow
*/

const QS_DAYS    = 7;
const QS_ROW_PX  = 18;  // matches --qs-row
const QS_HDR_PX  = 18;  // matches --qs-hdr
const QS_BDR_PX  = 3;    // matches --border-width
const QS_RADIUS  = '8px'; // matches --radius

function darkenColor(hex, factor) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  const d = v => Math.round(v * factor).toString(16).padStart(2,'0');
  return '#' + d(r) + d(g) + d(b);
}

function buildQuickSchedule() {
  const mainApp = document.getElementById('mainApp');
  if (!mainApp) return;
  let wrap = document.getElementById('quickSchedule');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'quickSchedule';
    wrap.className = 'qs-wrap';
    mainApp.appendChild(wrap);
  } else if (!wrap.parentNode || wrap.parentNode !== mainApp) {
    mainApp.appendChild(wrap);
  }
}

function renderQuickSchedule() {
  let wrap = document.getElementById('quickSchedule');
  if (!wrap) {
    buildQuickSchedule();
    wrap = document.getElementById('quickSchedule');
    if (!wrap) return;
  }
  wrap.innerHTML = '';
  if (!jobs || jobs.length === 0) return;

  /* ── collect days ── */
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = [];

  for (let di = 0; di < QS_DAYS; di++) {
    const date = new Date(today);
    date.setDate(today.getDate() + di);
    const key = localDateKey(date);
    const shifts = [];
    jobs.forEach(job => {
      if (!job.schedule || !job.schedule[key]) return;
      const s    = job.schedule[key];
      const isOff = s.start === 'OFF';
      const startMins = (!isOff && s.start && s.start !== 'NONE') ? parseTimeToMins(s.start) : null;
      const endMins   = (!isOff && s.end   && s.end   !== 'NONE') ? parseTimeToMins(s.end)   : null;
      // normalise overnight: if end < start, add 24hrs
      const normEnd = (endMins !== null && startMins !== null && endMins < startMins)
        ? endMins + 1440 : endMins;
      shifts.push({ job, startMins, endMins: normEnd, isOff });
    });
    days.push({ date, shifts });
  }

  /* ── axis range ── */
  let axisMin = Infinity, axisMax = -Infinity;
  days.forEach(({ shifts }) => shifts.forEach(s => {
    if (s.isOff || s.startMins === null || s.endMins === null) return;
    axisMin = Math.min(axisMin, s.startMins);
    axisMax = Math.max(axisMax, s.endMins);
  }));
  if (axisMin === Infinity) {
    axisMin = 12 * 60;      // default: 12PM
    axisMax = 24 * 60;      // default: 12AM midnight
  }
  const axisLeft  = Math.floor(axisMin / 60) * 60;
  const axisRight = Math.ceil(axisMax  / 60) * 60;
  const bufLeft   = axisLeft;
  const bufRight  = axisRight;
  const totalSpan = bufRight - bufLeft;

  const ticks = [];
  for (let m = axisLeft; m <= axisRight; m += 60) ticks.push(m);


  function pct(m) { return ((m - bufLeft) / totalSpan) * 100; }
  function hr12(m) { const h = Math.floor(m / 60) % 24; return h > 12 ? h - 12 : (h === 0 ? 12 : h); }


  /* ── night overlay helper (6PM–6AM = 1080–1800 normalised) ── */
  const NIGHT_START = 18 * 60;       // 6PM in mins
  const NIGHT_END   = 6 * 60 + 1440; // 6AM next day in mins

  const cs = getComputedStyle(document.documentElement);
  const QS_PURPLE    = cs.getPropertyValue('--accent').trim();
  // darken accent by 20% for night sections
  const QS_PURPLE_DK = darkenColor(QS_PURPLE, 0.8);

  function addNightOverlay(container, color) {
    const oLeft  = Math.max(NIGHT_START, bufLeft);
    const oRight = Math.min(NIGHT_END,   bufRight);
    if (oLeft >= oRight) return;
    const ol = pct(oLeft);
    const ow = pct(oRight) - ol;
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:absolute;top:0;left:${ol}%;width:${ow}%;height:100%;`
      + `background:${color};pointer-events:none;z-index:1;`;
    container.appendChild(overlay);
  }

  /* ── title ── */
  const title = document.createElement('div');
  title.className = 'label-card';
  title.textContent = 'Quick Schedule';
  wrap.appendChild(title);

  /* ── unified card ── */
  const card = document.createElement('div');
  card.className = 'qs-card';
  wrap.appendChild(card);

  let todayHasShifts = false;
  days.forEach(({ date, shifts }, idx) => {
    const isToday     = date.getTime() === today.getTime();
    const validShifts = shifts.filter(s => !s.isOff && s.startMins !== null && s.endMins !== null);
    const allOff      = shifts.length > 0 && shifts.every(s => s.isOff);
    const hasShifts   = validShifts.length > 0;
    if (isToday && hasShifts && !allOff) todayHasShifts = true;

    const dayLabel = isToday
      ? 'TODAY'
      : `${DAY_NAMES[date.getDay()].toUpperCase()}  ${MONTHS[date.getMonth()].toUpperCase()} ${date.getDate()}`;

    /* day header — inline height to guarantee render */
    const hdrHeight = isToday ? QS_ROW_PX : QS_HDR_PX;
    const hdr = document.createElement('div');
    hdr.className = 'qs-day-hdr' + (idx === 0 ? ' qs-first' : '');
    hdr.style.cssText = `background:${QS_PURPLE};height:${hdrHeight}px;position:relative;overflow:visible;`;

    const hdrText = document.createElement('span');
    hdrText.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);white-space:nowrap;';
    hdrText.textContent = dayLabel;
    hdr.appendChild(hdrText);

    card.appendChild(hdr);

    if (hasShifts) {
      const rows = qsAssignRows(validShifts);
      rows.forEach((row, rowIdx) => {
        const rowHeight = QS_ROW_PX;
        const rowEl = document.createElement('div');
        rowEl.className      = 'qs-job-row';
        rowEl.style.height   = rowHeight + 'px';
        rowEl.style.position = 'relative';
        rowEl.style.borderTop = 'none';

        /* inner container with QS_ROW_PX margin each side */
        const rowInner = document.createElement('div');
        rowInner.style.cssText = `position:absolute;top:0;height:${rowHeight}px;left:${QS_ROW_PX}px;right:${QS_ROW_PX}px;`;

        /* grid lines */
        ticks.forEach(tick => {
          const line = document.createElement('div');
          line.style.cssText = `position:absolute;top:0;height:${rowHeight}px;width:1px;background:rgba(255,255,255,0.25);left:${pct(tick)}%;transform:translateX(-50%);pointer-events:none;`;
          rowInner.appendChild(line);
        });

        /* job cards */
        row.forEach(shift => {
          const jc = document.createElement('div');
          const l  = pct(shift.startMins);
          const w  = pct(shift.endMins) - l;
          jc.style.cssText = `position:absolute;top:0;height:${rowHeight}px;left:${l}%;width:${w}%;z-index:2;`
            + `border:${QS_BDR_PX}px solid ${shift.job.color};border-radius:${QS_RADIUS};`
            + `background:#fff;color:#000;font-size:10px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;`
            + `display:flex;align-items:center;justify-content:center;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;`
            + `padding:0 4px;box-sizing:border-box;cursor:pointer;`;
          jc.textContent = shift.job.title;
          jc.onclick = () => openJobWindow(shift.job);
          rowInner.appendChild(jc);
        });

        rowEl.appendChild(rowInner);
        card.appendChild(rowEl);
      });


    } else {
      /* empty row */
      const emptyRow = document.createElement('div');
      emptyRow.className    = 'qs-job-row qs-row-off';
      emptyRow.style.height = QS_ROW_PX + 'px';
      if (allOff) {
        emptyRow.textContent = 'YOU HAVE THE DAY OFF!';
        emptyRow.style.color = 'var(--color-10)';
      } else {
        emptyRow.textContent = 'NO SHIFTS SCHEDULED YET';
      }
      card.appendChild(emptyRow);

    }
  });

  /* ── today time dot — on border between today header and today row ── */
  if (typeof appSettings !== "undefined" && appSettings.showTimeDot && todayHasShifts) {
    const nowMins2 = new Date().getHours() * 60 + new Date().getMinutes();
    // Three zones: left margin (fixed 1hr = QS_ROW_PX px), content (flex), right margin (fixed 1hr = QS_ROW_PX px)
    let dotLeft;
    if (nowMins2 <= axisLeft) {
      // in left margin — map axisLeft-60..axisLeft to 0..QS_ROW_PX px
      const px = QS_ROW_PX * Math.max(0, (nowMins2 - (axisLeft - 60)) / 60);
      dotLeft = px.toFixed(2) + 'px';
    } else if (nowMins2 >= axisRight) {
      // in right margin — map axisRight..axisRight+60 to calc(100% - QS_ROW_PX)..calc(100%)
      const px = QS_ROW_PX * Math.min(1, (nowMins2 - axisRight) / 60);
      dotLeft = 'calc(100% - ' + (QS_ROW_PX - px).toFixed(2) + 'px)';
    } else {
      // in content — pct() maps axisLeft..axisRight to 0..100% of content area
      const cp = pct(nowMins2);
      dotLeft = 'calc(' + QS_ROW_PX + 'px + ' + cp.toFixed(2) + '% - ' + (cp / 100 * QS_ROW_PX * 2).toFixed(2) + 'px)';
    }
    // today is always first day (di=0), border is at bottom of today header = QS_ROW_PX from card top
    const dotTop = QS_ROW_PX;
    card.style.position = 'relative';
    const dot = document.createElement('div');
    dot.id = 'qsTimeDot';
    dot.style.cssText = 'position:absolute;pointer-events:none;z-index:20;'
      + 'width:4px;height:4px;background:#fff;border-radius:1px;'
      + 'left:' + dotLeft + ';'
      + 'top:' + dotTop + 'px;transform:translate(-50%,-50%) rotate(45deg);';
    card.appendChild(dot);
  }

  /* ── axis ── */
  const axis = document.createElement('div');
  axis.className    = 'qs-axis';
  axis.style.height = QS_ROW_PX + 'px';

  function isNight(m) { const t = m % 1440; return t >= 1080 || t < 360; }

  /* single gradient background — margins always light, night center darkens */
  function toFullPct(cp) {
    return `calc(${(QS_ROW_PX*(1-2*cp/100)).toFixed(2)}px + ${cp.toFixed(2)}%)`;
  }
  const M  = QS_ROW_PX;
  const nL = Math.max(NIGHT_START, bufLeft);
  const nR = Math.min(NIGHT_END,   bufRight);
  const hasNight = nL < nR;
  const lmColor = isNight(axisLeft)  ? QS_PURPLE_DK : QS_PURPLE;
  const rmColor = isNight(axisRight) ? QS_PURPLE_DK : QS_PURPLE;
  let bg;
  if (!hasNight) {
    bg = `linear-gradient(to right,`
       + `${lmColor} 0,${lmColor} ${M}px,`
       + `${QS_PURPLE} ${M}px,${QS_PURPLE} calc(100% - ${M}px),`
       + `${rmColor} calc(100% - ${M}px),${rmColor} 100%)`;
  } else {
    const nlPos = toFullPct(pct(nL));
    const nrPos = toFullPct(pct(nR));
    bg = `linear-gradient(to right,`
       + `${lmColor} 0,${lmColor} ${M}px,`
       + `${QS_PURPLE} ${M}px,${QS_PURPLE} ${nlPos},`
       + `${QS_PURPLE_DK} ${nlPos},${QS_PURPLE_DK} ${nrPos},`
       + `${QS_PURPLE} ${nrPos},${QS_PURPLE} calc(100% - ${M}px),`
       + `${rmColor} calc(100% - ${M}px),${rmColor} 100%)`;
  }

  const axisBg = document.createElement('div');
  axisBg.style.cssText = `position:absolute;inset:0;background:${bg};`;
  axis.appendChild(axisBg);

  /* tick labels */
  const axisInner = document.createElement('div');
  axisInner.style.cssText = `position:absolute;top:0;bottom:0;left:${M}px;right:${M}px;overflow:visible;`;
  ticks.forEach(tick => {
    const lbl = document.createElement('div');
    lbl.style.cssText = `position:absolute;left:${pct(tick)}%;top:50%;transform:translate(-50%,-50%);`
      + `font-size:10px;font-weight:800;color:#ffffff;letter-spacing:0.04em;z-index:1;`;
    lbl.textContent = hr12(tick);
    axisInner.appendChild(lbl);
  });
  axis.appendChild(axisInner);

  card.appendChild(axis);
}

function qsAssignRows(shifts) {
  const sorted = [...shifts].sort((a, b) => a.startMins - b.startMins);
  const rows = [];
  sorted.forEach(shift => {
    let placed = false;
    for (const row of rows) {
      if (row[row.length - 1].endMins <= shift.startMins) {
        row.push(shift); placed = true; break;
      }
    }
    if (!placed) rows.push([shift]);
  });
  return rows;
}

/* ── init ── */
window.addEventListener('load', function() {
  buildQuickSchedule();
  renderQuickSchedule();
  if (typeof updateSettingsUI === 'function') updateSettingsUI();
});
