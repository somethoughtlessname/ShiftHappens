// ── LCARS Interface for Shift Happens ────────────────────────────────────────
// Renders the main window in LCARS style when appSettings.lcarsMode is true.
// All data read from the same jobs/schedule structures used by the regular UI.

(function () {

// ── CSS ──────────────────────────────────────────────────────────────────────
const LCARS_CSS = `
#lcarsRoot {
  display:none;
  flex-direction:column;
  width:100%;
}
#lcarsRoot.active { display:flex; }
#lcarsRoot .frame { margin-bottom:0.8rem; }

/* hide entire regular app when LCARS active */
body.lcars-mode { background:#000 !important; }
body.lcars-mode .header-tab {
  background:#000 !important;
  border:none !important;
  gap:5px !important;
  padding:0 5px 5px !important;
}
body.lcars-mode .header-action-btn {
  color:#000 !important;
  border:none !important;
  border-radius:0 0 1.2em 1.2em !important;
  font-family:'Antonio','Arial Narrow',sans-serif !important;
  font-weight:700 !important;
  text-transform:uppercase !important;
  letter-spacing:0.08em !important;
  flex:1 !important;
}
body.lcars-mode .header-action-btn:nth-child(1) { background:#ffce63 !important; }
body.lcars-mode .header-action-btn:nth-child(2) { background:#ce9cce !important; }
body.lcars-mode .header-action-btn:nth-child(3) { background:#9c639c !important; }
body.lcars-mode .app { display:none !important; }
body.lcars-mode #mainApp { display:none !important; }

/* ---- LCARS base tokens ---- */
#lcarsRoot, #lcarsRoot * {
  font-family:'Antonio','Arial Narrow',sans-serif !important;
}
#lcarsRoot {
  --lo:  #ff9c00;
  --ly:  #ffce63;
  --lpa: #f6ef95;
  --lpu: #9c639c;
  --lpk: #ce9cce;
  --lrd: #ce6363;
  --lgr: #848484;
  --lbk: #000;
  --lgap: 0.35rem;
  font-family: 'Antonio','Arial Narrow',sans-serif;
  color: var(--lo);
  background: #000;
  padding: 0.6rem;
  width: 100%;
}

/* ---- elbow shapes ---- */
#lcarsRoot .e,
#lcarsRoot .et {
  --ext-h:0rem; --ext-v:0rem;
  position:relative; flex-shrink:0;
  height:calc(4.5rem + var(--ext-v)); min-height:4.5rem;
}
#lcarsRoot .e  { width:calc(9.5rem + var(--ext-h)); min-width:9.5rem; }
#lcarsRoot .et { width:calc(3.75rem + var(--ext-h)); min-width:3.75rem; }
#lcarsRoot .e.fl, #lcarsRoot .et.fl { width:auto; }
#lcarsRoot .e::after, #lcarsRoot .et::after {
  content:''; position:absolute;
  height:calc(100% - 1.5rem + 1px); background:#000;
}
#lcarsRoot .e::after  { width:calc(100% - 7.5rem + 1px); }
#lcarsRoot .et::after { width:calc(100% - 1.75rem + 1px); }
#lcarsRoot .lb  { border-top-left-radius:3.75rem; }
#lcarsRoot .lb::after { right:-1px; top:1.5rem; border-top-left-radius:1.875rem; }
#lcarsRoot .lt  { border-bottom-left-radius:3.75rem; }
#lcarsRoot .lt::after { right:-1px; bottom:1.5rem; border-bottom-left-radius:1.875rem; }
#lcarsRoot .rb  { border-top-right-radius:3.75rem; }
#lcarsRoot .rb::after { left:-1px; top:1.5rem; border-top-right-radius:1.875rem; }
#lcarsRoot .rt  { border-bottom-right-radius:3.75rem; }
#lcarsRoot .rt::after { left:-1px; bottom:1.5rem; border-bottom-right-radius:1.875rem; }

/* ---- frame rows ---- */
#lcarsRoot .frame { width:100%; }
#lcarsRoot .hrow  { display:flex; gap:var(--lgap); align-items:flex-start; }
#lcarsRoot .hrow.bot { align-items:flex-end; }
#lcarsRoot .hrow .seg { height:1.5rem; min-width:1.5rem; }
#lcarsRoot .mid   { display:flex; gap:var(--lgap); align-items:stretch; margin:var(--lgap) 0; }
#lcarsRoot .pcol  { display:flex; flex-direction:column; gap:var(--lgap); width:7.5rem; }
#lcarsRoot .pcol .blk { width:100%; }
#lcarsRoot .blk.fill  { min-height:1.5rem; }
#lcarsRoot .blk.sq    { height:3rem; }
#lcarsRoot .screen { flex:1; min-width:0; padding:0.6rem 0.4rem; overflow:visible; }
#lcarsRoot .rcol  { display:flex; flex-direction:column; gap:var(--lgap); width:1.75rem; }
#lcarsRoot .rcol .blk { width:100%; }

#lcarsRoot .bar-title {
  height:1.5rem; display:flex; align-items:center; padding:0 0.8rem;
  background:#000; flex-shrink:1; min-width:0; overflow:hidden;
  font-size:2rem; font-weight:700;
  letter-spacing:0.06em; text-transform:uppercase; line-height:1; white-space:nowrap;
}

/* ---- colours ---- */
#lcarsRoot .bo { background:var(--lo); }
#lcarsRoot .by { background:var(--ly); }
#lcarsRoot .bpa{ background:var(--lpa); }
#lcarsRoot .bpu{ background:var(--lpu); }
#lcarsRoot .bpk{ background:var(--lpk); }
#lcarsRoot .brd{ background:var(--lrd); }
#lcarsRoot .bgr{ background:var(--lgr); }

/* ---- FRAME 1: NEXT SHIFT ---- */
#lcarsRoot .sn-who {
  height:3rem; display:flex; align-items:flex-end; justify-content:flex-end;
  padding:0 0.8rem 0.3rem; font-size:1.6rem; font-weight:700;
  letter-spacing:0.08em; text-transform:uppercase; color:#000;
}
#lcarsRoot .sn-when { display:flex; align-items:center; gap:var(--lgap); }
#lcarsRoot .sn-num  {
  font-size:4.6rem; font-weight:700; line-height:1;
  color:var(--ly); letter-spacing:0.06em;
  font-variant-numeric:tabular-nums;
}
#lcarsRoot .sn-half { width:2rem; height:3.6rem; border-radius:0 1.8rem 1.8rem 0; }
#lcarsRoot .sn-row { display:flex; align-items:center; gap:var(--lgap); }
#lcarsRoot .sn-btn {
  margin-left:auto; height:3rem; padding:0 1.4rem;
  border-radius:1.5rem; display:flex; align-items:center; justify-content:center;
  font-size:1.25rem; font-weight:700; letter-spacing:0.08em;
  text-transform:uppercase; color:#000; cursor:pointer; white-space:nowrap;
}
#lcarsRoot .sn-btn.idle    { background:var(--ly); }
#lcarsRoot .sn-btn.running { background:var(--lrd); color:#000; animation:lcarsPulse 1.6s ease-in-out infinite; }
#lcarsRoot .sn-btn.done    { background:var(--lgr); }
@keyframes lcarsPulse { 0%,100%{opacity:1;} 50%{opacity:0.55;} }

/* timeline */
#lcarsRoot .tl-track {
  position:relative; height:1.5rem; background:#222;
  border-radius:0.3rem; overflow:hidden;
}
#lcarsRoot .tl-hl { position:absolute; top:0; bottom:0; width:1px; background:#000; }
#lcarsRoot .tl-hours { position:relative; height:1.4rem; margin-top:0.3rem; }
#lcarsRoot .tl-hours span { position:absolute; transform:translateX(-50%); font-size:1.1rem; font-weight:700; color:var(--lgr); }
#lcarsRoot .tl-span { position:absolute; top:0; height:100%; border-radius:0.75rem; }
#lcarsRoot .tl-now  { position:absolute; top:-0.4rem; width:0.25rem; height:2.3rem; background:var(--lrd); }


/* ---- FRAME 2: QUICK SCHEDULE ---- */
#lcarsRoot .qs-day {
  height:1.9rem; display:flex; align-items:center; padding:0 0.8rem;
  font-size:1.3rem; font-weight:700; letter-spacing:0.06em;
  text-transform:uppercase; color:#000; margin-top:0.7rem;
}
#lcarsRoot .qs-day:first-child { margin-top:0; }
#lcarsRoot .qs-row {
  position:relative; height:2.2rem; margin-top:var(--lgap);
  background:#0c0c0c;
}
#lcarsRoot .qs-hl { position:absolute; top:0; bottom:0; width:1px; background:#222; }
#lcarsRoot .qs-pill {
  position:absolute; top:0; height:100%; border-radius:1.1rem;
  display:flex; align-items:center; justify-content:center;
  font-size:1.2rem; font-weight:700; letter-spacing:0.06em;
  text-transform:uppercase; color:#000; white-space:nowrap; overflow:hidden;
}
#lcarsRoot .qs-off {
  height:2.2rem; margin-top:var(--lgap); display:flex; align-items:center;
  font-size:1.2rem; font-weight:500; letter-spacing:0.06em;
  text-transform:uppercase; color:var(--lgr);
}
#lcarsRoot .qs-axis {
  position:relative; height:1.8rem; margin-top:0.4rem; overflow:visible;
}
#lcarsRoot .qs-axis span {
  position:absolute; top:0; transform:translateX(-50%);
  font-size:1.1rem; font-weight:700; color:var(--lgr);
  line-height:1.8rem; white-space:nowrap;
}

/* ---- FRAME 3: HISTORY — kit trend columns ---- */
#lcarsRoot .trend { display:flex; gap:var(--lgap); }
#lcarsRoot .trend .wk { flex:1; min-width:0; display:flex; flex-direction:column; }
#lcarsRoot .trend .wk.now { flex:1.6; }
#lcarsRoot .trend .hd, #lcarsRoot .trend .ft {
  height:2.8rem; display:flex; align-items:center; justify-content:center;
  padding:0 0.5rem; white-space:nowrap; overflow:hidden;
  font-size:1.7rem; font-weight:800; letter-spacing:0.06em;
  text-transform:uppercase; color:#000;
}
#lcarsRoot .trend .ft { margin-top:auto; font-variant-numeric:tabular-nums; }
#lcarsRoot .trend .val {
  font-weight:400; line-height:1; letter-spacing:0.06em;
  text-align:center; padding:0.2rem;
  font-size:1.7rem; min-height:2.8rem;
  color:var(--lgr); white-space:nowrap;
  display:flex; align-items:center; justify-content:center; flex:1;
  font-variant-numeric:tabular-nums;
}
#lcarsRoot .trend .wk.now .val { color:var(--ly); }
#lcarsRoot .logbar { display:flex; align-items:center; gap:0.8rem; margin-top:1.4rem; }
#lcarsRoot .logbar .lbl { font-size:1.3rem; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:var(--lpa); white-space:nowrap; }
#lcarsRoot .logbar .trk { position:relative; flex:1; height:1.8rem; background:#222; border-radius:0.3rem; overflow:hidden; }
#lcarsRoot .logbar .fill { position:absolute; inset:0 auto 0 0; background:repeating-linear-gradient(90deg,var(--lo) 0,var(--lo) 3px,#222 3px,#222 6px); }
#lcarsRoot .logbar .val  { font-size:1.3rem; font-weight:700; letter-spacing:0.08em; font-variant-numeric:tabular-nums; text-transform:uppercase; color:var(--lpa); white-space:nowrap; }
`;

// ── HELPERS ──────────────────────────────────────────────────────────────────
const MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW_S = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DOW_L = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function _ldk(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function _ptm(t) {
  if (!t || t==='OFF' || t==='NONE') return null;
  const m = t.match(/^(\d{2}):(\d{2}) (AM|PM)$/); if (!m) return null;
  let h = parseInt(m[1]); const min = parseInt(m[2]);
  if (m[3]==='AM' && h===12) h=0; if (m[3]==='PM' && h!==12) h+=12;
  return h*60+min;
}
function _dur(s, e) {
  const sm=_ptm(s), em=_ptm(e); if (sm===null||em===null) return null;
  let d=em-sm; if (d<=0) d+=1440; return d;
}
function _fmtHH(mins) {
  if (mins===null||mins===undefined) return '00.00';
  return String(Math.floor(mins/60)).padStart(2,'0')+'.'+String(Math.round(mins%60/60*100)).padStart(2,'0');
}
function _fmtCD(totalMins) {
  if (!totalMins||totalMins<=0) return '-- --';
  const h=Math.floor(totalMins/60), m=totalMins%60;
  return `${String(h).padStart(2,'0')}H ${String(m).padStart(2,'0')}M`;
}
function _weekMins(job, offset, mode) {
  // mode: 'scheduled' or 'worked'
  const now=new Date();
  const fdow = (job.firstDow!==undefined) ? job.firstDow : (typeof activeFirstDow!=='undefined' ? activeFirstDow : 1);
  const diff=(now.getDay()-fdow+7)%7;
  const start=new Date(now); start.setDate(now.getDate()-diff+offset*7); start.setHours(0,0,0,0);
  let total=0;
  const src = mode==='worked' ? job.worked : job.schedule;
  if (!src) return 0;
  for (let i=0;i<7;i++) {
    const d=new Date(start); d.setDate(start.getDate()+i);
    const entry=src[_ldk(d)];
    if (!entry||!entry.start||!entry.end) continue;
    const dur=_dur(entry.start,entry.end);
    if (dur) total+=dur;
  }
  return total;
}
function _shiftPct(timeStr, rangeStart, rangeEnd) {
  // convert a time string to % position within [rangeStart, rangeEnd] hours (0-24)
  const m=_ptm(timeStr); if (m===null) return null;
  const h=m/60;
  return Math.max(0, Math.min(1, (h-rangeStart)/(rangeEnd-rangeStart)));
}
function _weekRange(offset) {
  const now=new Date();
  const fdow=typeof activeFirstDow!=='undefined'?activeFirstDow:1;
  const diff=(now.getDay()-fdow+7)%7;
  const s=new Date(now); s.setDate(now.getDate()-diff+offset*7); s.setHours(0,0,0,0);
  const e=new Date(s); e.setDate(s.getDate()+6);
  return {s,e};
}
function _fmtRange(offset) {
  const {s,e}=_weekRange(offset);
  return `${MO[s.getMonth()]} ${s.getDate()}–${e.getDate()}`;
}
function _fmtRangeNum(offset) {
  const {s,e}=_weekRange(offset);
  const p=n=>String(n).padStart(2,'0');
  return `${p(s.getMonth()+1)}/${p(s.getDate())}-${p(e.getMonth()+1)}/${p(e.getDate())}`;
}

// Per-job LCARS colors (cycled by index)
const JOB_COLS=['bpk','by','bpa','bpu','brd','bgr'];
function jobCol(i){ return JOB_COLS[i % JOB_COLS.length]; }

// ── BUILD HTML ────────────────────────────────────────────────────────────────

function buildFrame1(job) {
  // --- per-job countdowns, sorted soonest first ---
  const entries=[];
  if (typeof jobs!=='undefined') {
    const now=new Date();
    jobs.forEach(function(j, idx){
      let diff=Infinity;
      if (j.schedule) {
        for (let d=0;d<14;d++) {
          const date=new Date(now); date.setDate(now.getDate()+d); date.setHours(0,0,0,0);
          const sched=j.schedule[_ldk(date)];
          if (!sched||!sched.start||sched.start==='OFF'||sched.start==='NONE') continue;
          const sm=_ptm(sched.start); if (sm===null) continue;
          const sd=new Date(date); sd.setHours(Math.floor(sm/60),sm%60,0,0);
          const df=sd-now;
          if (df>0){ diff=df; break; }
        }
      }
      entries.push({ idx, title:j.title, diff });
    });
    entries.sort((a,b)=>a.diff-b.diff);
  }
  window._lcarsNextJobIdx = entries.length ? entries[0].idx : 0;

  let jobBlocks='';
  if (!entries.length) {
    jobBlocks=`<div class="sn-who bpk">No Job</div>
      <div class="sn-when"><div class="sn-num">-- --</div><div class="sn-half by"></div></div>`;
  } else {
    entries.forEach(function(en, i){
      const cd=en.diff<Infinity?_fmtCD(Math.round(en.diff/60000)):'-- --';
      const mt=i>0?'margin-top:1.2rem;':'';
      const j=jobs[en.idx];
      const st=(typeof getTimerState==='function')?getTimerState(j):'idle';
      const btnLbl=st==='running'?'On Shift':st==='done'?'Complete':'Start Shift';
      jobBlocks+=`<div class="sn-who ${jobCol(en.idx)}" style="cursor:pointer;${mt}" onclick="lcarsOpenJobIdx(${en.idx})">${en.title}</div>
        <div class="sn-row">
          <div class="sn-when"><div class="sn-num">${cd}</div><div class="sn-half ${jobCol(en.idx)}"></div></div>
          <div class="sn-btn ${st}" onclick="lcarsTimerTap(${j.id}, event)">${btnLbl}</div>
        </div>`;
    });
  }

  // --- timeline: -1h to 25h scale (1h gap each end), hour lines, all jobs worked-first ---
  const now=new Date(), todayKey=_ldk(now);
  const TL_START=-1, TL_END=25, TL_RANGE=TL_END-TL_START; // 26h
  function tlPct(h){ return (h-TL_START)/TL_RANGE*100; }
  const nowPct=tlPct(now.getHours()+now.getMinutes()/60);
  let spans='';
  // hour lines every hour 0..24
  for (let h=0; h<=24; h++) {
    spans+=`<div class="tl-hl" style="left:${tlPct(h).toFixed(2)}%;"></div>`;
  }
  function addSpan(sm, em, col) {
    if (sm===null||em===null) return;
    if (em<=sm) em+=1440;
    const sp=tlPct(sm/60), ep=tlPct(Math.min(em,1500)/60);
    const w=Math.max(0.5,ep-sp);
    spans+=`<div class="tl-span ${col}" style="left:${sp.toFixed(1)}%;width:${w.toFixed(1)}%;"></div>`;
  }
  function collectEntry(entry, col) {
    if (entry&&entry.start&&entry.start!=='OFF'&&entry.start!=='NONE'&&entry.end) {
      addSpan(_ptm(entry.start), _ptm(entry.end), col);
    }
    const ex=entry&&entry.extra&&entry.extra[0];
    if (ex&&ex.start&&ex.start!=='NONE'&&ex.end) {
      addSpan(_ptm(ex.start), _ptm(ex.end), col);
    }
  }
  if (typeof jobs!=='undefined') {
    jobs.forEach(function(j, idx){
      const src=j.worked&&j.worked[todayKey]?j.worked:j.schedule;
      collectEntry(src&&src[todayKey], jobCol(idx));
    });
    // yesterday's overnight shifts spilling past midnight into today (-24h offset)
    const yest=new Date(); yest.setDate(yest.getDate()-1);
    const yKey=_ldk(yest);
    function spill(sm, em, col) {
      if (sm===null||em===null) return;
      if (em<=sm) em+=1440;
      if (em<=1440) return; // didn't cross midnight
      const sp=tlPct((sm-1440)/60), ep=tlPct((em-1440)/60);
      spans+=`<div class="tl-span ${col}" style="left:${sp.toFixed(1)}%;width:${Math.max(0.5,ep-sp).toFixed(1)}%;"></div>`;
    }
    jobs.forEach(function(j, idx){
      const ySrc=j.worked&&j.worked[yKey]?j.worked:j.schedule;
      const yEntry=ySrc&&ySrc[yKey];
      if (yEntry&&yEntry.start&&yEntry.start!=='OFF'&&yEntry.start!=='NONE'&&yEntry.end) {
        spill(_ptm(yEntry.start), _ptm(yEntry.end), jobCol(idx));
      }
      const yex=yEntry&&yEntry.extra&&yEntry.extra[0];
      if (yex&&yex.start&&yex.start!=='NONE'&&yex.end) {
        spill(_ptm(yex.start), _ptm(yex.end), jobCol(idx));
      }
    });
  }

  return `
<div class="frame">
  <div class="hrow">
    <div class="e lb fl bo" style="flex:1;"></div>
    <div class="bar-title" style="color:var(--lo);">Time Until Next Shift</div>
    <div class="et rb bo"></div>
  </div>
  <div class="mid" style="min-height:14rem;">
    <div class="pcol">
      <div class="blk sq by"></div>
      <div class="blk sq bpk"></div>
      <div class="blk sq bgr"></div>
      <div class="blk fill bo" style="flex:1;"></div>
    </div>
    <div class="screen">
      ${jobBlocks}
      <div style="margin-top:1rem;">
        <div class="tl-track">
          ${spans}
          <div class="tl-now" style="left:${nowPct.toFixed(1)}%;"></div>
        </div>
        <div class="tl-hours">
          ${[0,3,6,9,12,15,18,21,24].map(h=>`<span style="left:${((h+1)/26*100).toFixed(2)}%;">${h}</span>`).join('')}
        </div>
      </div>
    </div>
    <div class="rcol">
      <div class="blk fill bo" style="flex:1;"></div>
      <div class="blk brd" style="height:3rem;"></div>
    </div>
  </div>
  <div class="hrow bot">
    <div class="e lt fl bo" style="flex:1;"></div>
    <div class="seg by" style="width:4rem;"></div>
    <div class="et rt bo"></div>
  </div>
</div>`;
}

function buildFrame2(job) {
  const now=new Date();
  // QS range: derive from actual shifts across next 7 days
  let minH=24, maxH=0;
  const allJobs=(typeof jobs!=='undefined')?jobs:(job?[job]:[]);
  for (let d=0;d<7;d++) {
    const date=new Date(now); date.setDate(now.getDate()+d);
    const key=_ldk(date);
    allJobs.forEach(function(j){
      const entry=j.schedule&&j.schedule[key];
      if (entry&&entry.start&&entry.start!=='OFF'&&entry.start!=='NONE'&&entry.end) {
        const s=_ptm(entry.start), e=_ptm(entry.end);
        if (s!==null) minH=Math.min(minH, s/60);
        if (e!==null&&s!==null) {
          let eh=e/60; if (eh<=s/60) eh+=24;
          maxH=Math.max(maxH, eh);
        }
      }
    });
  }
  if (minH>=maxH) { minH=8; maxH=20; } // no shifts — fallback
  minH=Math.floor(minH)-1; maxH=Math.ceil(maxH)+1; // 1h gap both ends
  const qsRange=maxH-minH;
  function qsPct(h){ return (h-minH)/qsRange*100; }
  // hour gridlines for each row — line at every whole hour
  let qsLines='';
  for (let h=Math.ceil(minH); h<=Math.floor(maxH); h++) {
    qsLines+=`<div class="qs-hl" style="left:${qsPct(h).toFixed(2)}%;"></div>`;
  }
  let dayRows='';
  for (let d=0;d<7;d++) {
    const date=new Date(now); date.setDate(now.getDate()+d); date.setHours(0,0,0,0);
    const key=_ldk(date);
    const isToday=d===0;
    const label=isToday?`Today · ${DOW_S[date.getDay()]} ${MO[date.getMonth()]} ${date.getDate()}`
                       :`${DOW_L[date.getDay()]} ${MO[date.getMonth()]} ${date.getDate()}`;
    const hdrCls=isToday?'bpk':'bpu';
    dayRows+=`<div class="qs-day ${hdrCls}">${label}</div>`;
    let anyShift=false, anyOff=false;
    allJobs.forEach(function(j, idx){
      const entry=j.schedule&&j.schedule[key];
      if (entry&&entry.start&&entry.start!=='OFF'&&entry.start!=='NONE'&&entry.end) {
        const sm=_ptm(entry.start), em=_ptm(entry.end);
        if (sm===null||em===null) return;
        let sh=sm/60, eh=em/60; if (eh<=sh) eh+=24;
        const left=qsPct(sh).toFixed(1)+'%';
        const width=Math.max(0,qsPct(eh)-qsPct(sh)).toFixed(1)+'%';
        const lbl=allJobs.length>1?j.title:`${entry.start} – ${entry.end}`;
        dayRows+=`<div class="qs-row">${qsLines}<div class="qs-pill ${jobCol(idx)}" style="left:${left};width:${width};">${lbl}</div></div>`;
        anyShift=true;
      } else if (entry&&(entry.start==='OFF'||entry.start==='NONE')) {
        anyOff=true;
      }
    });
    if (!anyShift) {
      const txt=anyOff?'Day off':'No shift scheduled';
      dayRows+=`<div class="qs-row">${qsLines}<div class="qs-off" style="position:absolute;left:0.8rem;top:0;bottom:0;display:flex;align-items:center;">${txt}</div></div>`;
    }
  }
  // axis labels: every hour EXCEPT the 1h gap ends
  let axisLabels='';
  for (let h=minH+1; h<=maxH-1; h++) {
    let hh=((h%24)+24)%24;
    const lbl=hh===0?12:(hh>12?hh-12:hh);
    axisLabels+=`<span style="left:${qsPct(h).toFixed(2)}%;">${lbl}</span>`;
  }

  return `
<div class="frame">
  <div class="hrow">
    <div class="e lb fl bpu" style="flex:1;"></div>
    <div class="bar-title" style="color:var(--lpk);">Quick Schedule</div>
    <div class="et rb bpu"></div>
  </div>
  <div class="mid">
    <div class="pcol">
      <div class="blk bpk" style="height:3rem;"></div>
      <div class="blk sq bpk"></div>
      <div class="blk sq bgr"></div>
      <div class="blk fill bpu" style="flex:1;"></div>
      <div class="blk bgr" style="height:2rem;"></div>
    </div>
    <div class="screen">
      ${dayRows}
      <div class="qs-axis">${axisLabels}</div>
    </div>
    <div class="rcol">
      <div class="blk bpk" style="height:4rem;"></div>
      <div class="blk fill bpu" style="flex:1;"></div>
      <div class="blk bgr" style="height:2.5rem;"></div>
    </div>
  </div>
  <div class="hrow bot">
    <div class="e lt fl bpu" style="flex:1;"></div>
    <div class="seg bpk" style="width:3rem;"></div>
    <div class="et rt bpu"></div>
  </div>
</div>`;
}

function buildFrame3(job) {
  const allJobs=(typeof jobs!=='undefined')?jobs:(job?[job]:[]);
  let lastMins=0, thisSched=0, thisWorked=0, nextMins=0, projMins=0;
  const _now=new Date(); _now.setHours(0,0,0,0);
  allJobs.forEach(function(j){
    lastMins  += _weekMins(j,-1,'worked');
    thisSched += _weekMins(j, 0,'scheduled');
    thisWorked+= _weekMins(j, 0,'worked');
    nextMins  += _weekMins(j, 1,'scheduled');
    // projection: worked entries where present, else scheduled for today/future
    const fdow=(j.firstDow!==undefined)?j.firstDow:(typeof activeFirstDow!=='undefined'?activeFirstDow:1);
    const diff=(_now.getDay()-fdow+7)%7;
    const ws=new Date(_now); ws.setDate(_now.getDate()-diff);
    for (let i=0;i<7;i++) {
      const d=new Date(ws); d.setDate(ws.getDate()+i);
      const key=_ldk(d);
      const w=j.worked&&j.worked[key];
      if (w&&w.start&&w.end) { const du=_dur(w.start,w.end); if(du) projMins+=du; }
      else if (d>=_now) {
        const s=j.schedule&&j.schedule[key];
        if (s&&s.start&&s.start!=='OFF'&&s.start!=='NONE'&&s.end) { const du=_dur(s.start,s.end); if(du) projMins+=du; }
      }
    }
  });

  return `
<div class="frame">
  <div class="hrow">
    <div class="e lb fl by" style="flex:1;"></div>
    <div class="bar-title" style="color:var(--ly);">History · Hours</div>
    <div class="et rb by"></div>
  </div>
  <div class="mid">
    <div class="pcol">
      <div class="blk sq bo"></div>
      <div class="blk fill by" style="flex:1;"></div>
      <div class="blk brd" style="height:2rem;"></div>
    </div>
    <div class="screen">
      <div class="trend">
        <div class="wk">
          <div class="hd bpu">Last</div>
          <div class="val">${_fmtHH(lastMins)}</div>
          <div class="ft bpu">${_fmtRangeNum(-1)}</div>
        </div>
        <div class="wk now">
          <div class="hd bo">This Week</div>
          <div class="val">${_fmtHH(thisWorked)}/${_fmtHH(thisSched)} (${_fmtHH(projMins)})</div>
          <div class="ft bo">${_fmtRangeNum(0)}</div>
        </div>
        <div class="wk">
          <div class="hd bpu">Next</div>
          <div class="val">${_fmtHH(nextMins)}</div>
          <div class="ft bpu">${_fmtRangeNum(1)}</div>
        </div>
      </div>

    </div>
    <div class="rcol">
      <div class="blk fill by" style="flex:1;"></div>
      <div class="blk bo" style="height:3rem;"></div>
    </div>
  </div>
  <div class="hrow bot">
    <div class="e lt fl by" style="flex:1;"></div>
    <div class="seg bgr" style="width:2.5rem;"></div>
    <div class="seg brd" style="width:2.5rem;"></div>
    <div class="et rt by"></div>
  </div>
</div>`;
}

// ── INIT & RENDER ─────────────────────────────────────────────────────────────

function injectCSS() {
  if (document.getElementById('lcars-style')) return;
  const s=document.createElement('style'); s.id='lcars-style'; s.textContent=LCARS_CSS;
  document.head.appendChild(s);
}

function getActiveJob() {
  if (typeof jobs==='undefined'||!jobs.length) return null;
  // prefer the job that has a shift today or soonest
  return jobs[0];
}

window.lcarsTimerTap = function(jobId, e) {
  if (e) e.stopPropagation();
  if (typeof timerTap==='function') timerTap(jobId, e);
  setTimeout(lcarsRender, 50);
};

window.lcarsOpenJobIdx = function(idx) {
  if (typeof jobs!=='undefined' && jobs[idx] && typeof openJobWindow==='function') openJobWindow(jobs[idx]);
};

window.lcarsOpenJob = function() {
  const idx=window._lcarsNextJobIdx||0;
  const job=(typeof jobs!=='undefined'&&jobs[idx])?jobs[idx]:getActiveJob();
  if (job && typeof openJobWindow==='function') openJobWindow(job);
};

window.lcarsRender = function() {
  const root=document.getElementById('lcarsRoot');
  if (!root) return;
  const job=getActiveJob();
  root.innerHTML = buildFrame1(job) + buildFrame2(job) + buildFrame3(job);
};

window.lcarsSetMode = function(on) {
  injectCSS();
  const root=document.getElementById('lcarsRoot');
  if (!root) return;
  if (on) {
    // rem units scale from html font-size — save original and shrink
    if (!window._lcarsPrevHtmlFs) window._lcarsPrevHtmlFs = document.documentElement.style.fontSize || '';
    document.documentElement.style.fontSize = (window.innerWidth <= 380) ? '6.5px' : '7px';
    root.classList.add('active');
    document.body.classList.add('lcars-mode');
    lcarsRender();
    if (window._lcarsInterval) clearInterval(window._lcarsInterval);
    window._lcarsInterval = setInterval(lcarsRender, 60000); // refresh every minute
  } else {
    document.documentElement.style.fontSize = window._lcarsPrevHtmlFs || '';
    window._lcarsPrevHtmlFs = null;
    root.classList.remove('active');
    document.body.classList.remove('lcars-mode');
    if (window._lcarsInterval) { clearInterval(window._lcarsInterval); window._lcarsInterval=null; }
  }
};

// ── SETUP ──────────────────────────────────────────────────────────────────────
window.addEventListener('load', function() {
  injectCSS();

  // Inject root container after the main content div
  if (!document.getElementById('lcarsRoot')) {
    const root=document.createElement('div');
    root.id='lcarsRoot';
    // Insert after main app content
    const ref=document.getElementById('mainApp')||document.querySelector('.app')||document.body.firstElementChild;
    if (ref&&ref.parentNode) ref.parentNode.insertBefore(root, ref.nextSibling);
    else document.body.appendChild(root);
  }

  // Activate if setting is already on
  if (typeof appSettings!=='undefined' && appSettings.lcarsMode) {
    lcarsSetMode(true);
  }
});

})();
