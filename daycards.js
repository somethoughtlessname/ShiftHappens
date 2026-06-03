const ALL_DAY_LETTERS = ['S','M','T','W','T','F','S'];
function dcDelExtra(dk) {
  const job = jobs.find(j => j.id === activeJobId);
  if(job && job.schedule && job.schedule[dk]) {
    job.schedule[dk].extra = [];
    lsSet('sch_jobs', jobs);
  }
  delete _dcExpanded[dk];
  renderDayCards();
  if(typeof renderQuickSchedule==='function'&&appSettings.showQuickSchedule){buildQuickSchedule();renderQuickSchedule();}
}
function renderDayCards() {
  updateDaySqVar();
  const container = document.getElementById('dayCards'); if (!container) return;
  const offset = activeWeek === 'prev' ? -1 : activeWeek === 'next' ? 1 : 0;
  const { mon: start } = getWeekRange(offset); container.innerHTML = '';
  const todayNow = new Date(); let totalMins = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const letter = ALL_DAY_LETTERS[d.getDay()]; const dateNum = String(d.getDate()).padStart(2,'0');
    const isToday = d.getFullYear()===todayNow.getFullYear()&&d.getMonth()===todayNow.getMonth()&&d.getDate()===todayNow.getDate();
    const todayCls = isToday ? ' day-sq-today' : '';
    const job = jobs.find(j => j.id === activeJobId); const dateKey = localDateKey(d);
    const dayData = getSchedObj(job, activeHours); const daySched = dayData && dayData[dateKey];
    const startVal = daySched && daySched.start; const endVal = daySched && daySched.end;
    const isOff = startVal === 'OFF' || endVal === 'OFF';
    const startTxt = isOff ? 'OFF' : (startVal && startVal !== 'NONE' ? startVal : 'START');
    const endTxt   = isOff ? 'OFF' : (endVal   && endVal   !== 'NONE' ? endVal   : 'END');
    const startCls = isOff ? ' day-half-off' : ''; const endCls = isOff ? ' day-half-off' : '';
    const ex0=(daySched&&daySched.extra&&daySched.extra[0])||{};
    const hasExtra=!!(ex0.start||ex0.end);
    // If day is OFF but has second shift data, migrate it into primary slot
    if(isOff && hasExtra) {
      const job2 = jobs.find(j => j.id === activeJobId);
      if(job2 && job2.schedule && job2.schedule[dateKey]) {
        const slot = job2.schedule[dateKey];
        slot.start = ex0.start; slot.end = ex0.end;
        slot.extra = [];
        lsSet('sch_jobs', jobs);
        // refresh local refs
        daySched.start = slot.start; daySched.end = slot.end;
        ex0.start = null; ex0.end = null;
      }
    }
    const showSplit = appSettings.showSecondShift===false && hasExtra;
    const hoursHtml = showSplit
      ? `<div class="day-hours${todayCls}" style="flex-direction:column;align-items:stretch;padding:0;">` +
        `<div style="flex:1;display:flex;align-items:center;justify-content:center;border-bottom:var(--border-width) solid var(--border-color);">${calcDuration(startVal,endVal)}</div>` +
        `<div style="flex:1;display:flex;align-items:center;justify-content:center;">${calcDuration(ex0.start,ex0.end)}</div></div>`
      : `<div class="day-hours${todayCls}">${calcDuration(startVal, endVal)}</div>`;
    const card = document.createElement('div'); card.className = 'day-card';
    card.innerHTML =
      `<div class="day-letter${todayCls}">${letter}</div>` +
      `<div class="day-date${todayCls}">${dateNum}</div>` +
      `<div class="day-body"><div class="day-body-half${startCls}" data-section="start">${startTxt}</div><div class="day-body-half${endCls}" data-section="end">${endTxt}</div></div>` +
      hoursHtml;
    const capturedDate = new Date(d);
    card.querySelectorAll('.day-body-half').forEach(half => {
      half.style.cursor = 'pointer';
      half.addEventListener('click', () => openSchedModal(capturedDate, half.dataset.section));
    });
    if(!isOff){const s=parseTimeToMins(startVal),e=parseTimeToMins(endVal);if(s!==null&&e!==null){let diff=e-s;if(diff<=0)diff+=24*60;totalMins+=diff;}}
    if(hasExtra&&ex0.start&&ex0.end){const s=parseTimeToMins(ex0.start),e=parseTimeToMins(ex0.end);if(s!==null&&e!==null){let diff=e-s;if(diff<=0)diff+=24*60;totalMins+=diff;}}
    if(appSettings.showSecondShift !== false) {
    const gap = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--margin')) || 4;
    const sqW = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--card-height')) || 45;
    const rowW = container.clientWidth > 10 ? container.clientWidth : (window.innerWidth - gap*2);
    // cardW: card fills row minus plusBtn, gap between them, and 4px right margin
    const cardW  = rowW - sqW - gap - 4;
    // card2W: same but minus two squares
    const card2W = rowW - sqW*2 - gap*2 - 4;
    // tx: how far track slides = card width + gap after it
    const tx = cardW + gap;
    // total track width = view1 + view2 (each = rowW - 4)
    const trackW = cardW + gap + sqW + gap + card2W + gap + sqW;
    const dcRow = document.createElement('div');
    dcRow.className = 'dc-row'; dcRow.dataset.dcRow = '1';
    const dcTrack = document.createElement('div');
    dcTrack.style.cssText = 'display:flex;align-items:stretch;gap:'+gap+'px;height:var(--card-height);transition:none;width:'+trackW+'px;';
    card.style.cssText += ';flex-shrink:0;flex:none;width:'+cardW+'px;';
    dcTrack.appendChild(card);

    // Plus button
    const ex0s2 = ex0.start&&ex0.start!=='NONE'?ex0.start:'START';
    const ex0e2 = ex0.end&&ex0.end!=='NONE'?ex0.end:'END';
    const _svgNS='http://www.w3.org/2000/svg';
    const _svg=document.createElementNS(_svgNS,'svg');
    _svg.setAttribute('width','26');_svg.setAttribute('height','26');_svg.setAttribute('viewBox','0 0 50 50');
    const _pl1=document.createElementNS(_svgNS,'line');
    const _pl2=document.createElementNS(_svgNS,'line');
    [_pl1,_pl2].forEach(function(l){l.style.stroke='white';l.setAttribute('stroke-width','5');l.setAttribute('stroke-linecap','round');});
    const _pStates={plus:{l1:[25,8,25,42],l2:[8,25,42,25]},back:{l1:[8,25,42,10],l2:[8,25,42,40]},fwd:{l1:[8,10,42,25],l2:[8,40,42,25]}};
    function _pSet(s){var st=_pStates[s];_pl1.setAttribute('x1',st.l1[0]);_pl1.setAttribute('y1',st.l1[1]);_pl1.setAttribute('x2',st.l1[2]);_pl1.setAttribute('y2',st.l1[3]);_pl2.setAttribute('x1',st.l2[0]);_pl2.setAttribute('y1',st.l2[1]);_pl2.setAttribute('x2',st.l2[2]);_pl2.setAttribute('y2',st.l2[3]);}
    function _pMorph(fromS,toS,dur,fromCol,toCol){var from=_pStates[fromS],to=_pStates[toS],start=null;function ease(t){return t<0.5?2*t*t:-1+(4-2*t)*t;}function hx(c){return parseInt(c,16);}function parseCol(v){var m=v.replace('#','');return[hx(m.slice(0,2)),hx(m.slice(2,4)),hx(m.slice(4,6))];}function step(ts){if(!start)start=ts;var t=Math.min((ts-start)/dur,1),e=ease(t);function lp(a,b){return a+(b-a)*e;}_pl1.setAttribute('x1',lp(from.l1[0],to.l1[0]));_pl1.setAttribute('y1',lp(from.l1[1],to.l1[1]));_pl1.setAttribute('x2',lp(from.l1[2],to.l1[2]));_pl1.setAttribute('y2',lp(from.l1[3],to.l1[3]));_pl2.setAttribute('x1',lp(from.l2[0],to.l2[0]));_pl2.setAttribute('y1',lp(from.l2[1],to.l2[1]));_pl2.setAttribute('x2',lp(from.l2[2],to.l2[2]));_pl2.setAttribute('y2',lp(from.l2[3],to.l2[3]));if(fromCol&&toCol){var fc=parseCol(fromCol),tc=parseCol(toCol);plusBtn.style.background='rgb('+Math.round(lp(fc[0],tc[0]))+','+Math.round(lp(fc[1],tc[1]))+','+Math.round(lp(fc[2],tc[2]))+')'}if(t<1)requestAnimationFrame(step);else if(toCol)plusBtn.style.background='rgb('+tc[0]+','+tc[1]+','+tc[2]+')';}requestAnimationFrame(step);}
    _pSet(hasExtra?'fwd':'plus');
    _svg.appendChild(_pl1);_svg.appendChild(_pl2);
    const plusBtn = document.createElement('div');
    plusBtn.className = 'day-card-plus';
    if(hasExtra)plusBtn.style.background='var(--accent)';
    plusBtn.appendChild(_svg);
    dcTrack.appendChild(plusBtn);

    // Card 2
    const card2 = document.createElement('div');
    card2.className = 'day-card';
    card2.style.cssText = 'flex-shrink:0;width:'+card2W+'px;overflow:hidden;';
    card2.innerHTML = '<div class="day-body" style="flex:1"><div class="day-body-half" data-section="start" style="max-width:calc(50% - 1px)">'+ex0s2+'</div><div class="day-body-half" data-section="end">'+ex0e2+'</div></div><div class="day-hours'+todayCls+'">'+calcDuration(ex0.start,ex0.end)+'</div>';
    card2.querySelectorAll('.day-body-half').forEach(function(b){b.style.cursor='pointer';b.onclick=function(){openSchedModal(capturedDate,b.dataset.section,1);};});
    dcTrack.appendChild(card2);

    // Close button
    const closeBtn = document.createElement('div');
    closeBtn.style.cssText = 'flex-shrink:0;width:var(--card-height);height:var(--card-height);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);background:var(--color-1);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:var(--text-light);cursor:pointer;';
    const _xsvg=document.createElementNS(_svgNS,'svg');
    _xsvg.setAttribute('width','26');_xsvg.setAttribute('height','26');_xsvg.setAttribute('viewBox','0 0 50 50');
    const _xl1=document.createElementNS(_svgNS,'line');const _xl2=document.createElementNS(_svgNS,'line');
    [_xl1,_xl2].forEach(function(l){l.style.stroke='white';l.setAttribute('stroke-width','5');l.setAttribute('stroke-linecap','round');});
    _xl1.setAttribute('x1','12');_xl1.setAttribute('y1','12');_xl1.setAttribute('x2','38');_xl1.setAttribute('y2','38');
    _xl2.setAttribute('x1','38');_xl2.setAttribute('y1','12');_xl2.setAttribute('x2','12');_xl2.setAttribute('y2','38');
    _xsvg.appendChild(_xl1);_xsvg.appendChild(_xl2);closeBtn.appendChild(_xsvg);
    dcTrack.appendChild(closeBtn);
    dcRow.appendChild(dcTrack);
    container.appendChild(dcRow);

    // Color morph for close button
    function _cMorph(toSwap, dur) {
      var cs = getComputedStyle(document.documentElement);
      function ph(v){var m=v.replace('#','');return[parseInt(m.slice(0,2),16),parseInt(m.slice(2,4),16),parseInt(m.slice(4,6),16)];}
      var c1=ph(cs.getPropertyValue('--color-1').trim());
      var tl=ph(cs.getPropertyValue('--text-light').trim());
      var fbg=toSwap?c1:tl, tbg=toSwap?tl:c1;
      var fst=toSwap?tl:c1, tst=toSwap?c1:tl;
      var s=null;
      function ease(t){return t<0.5?2*t*t:-1+(4-2*t)*t;}
      function step(ts){
        if(!s)s=ts;
        var t=Math.min((ts-s)/dur,1),e=ease(t);
        function lp(a,b){return Math.round(a+(b-a)*e);}
        closeBtn.style.background='rgb('+lp(fbg[0],tbg[0])+','+lp(fbg[1],tbg[1])+','+lp(fbg[2],tbg[2])+')';
        var sc='rgb('+lp(fst[0],tst[0])+','+lp(fst[1],tst[1])+','+lp(fst[2],tst[2])+')';
        _xl1.style.stroke=sc;_xl2.style.stroke=sc;
        if(t<1)requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    // Slide helpers
    const T = 'transform 1.12s cubic-bezier(0.4,0,0.2,1)';
    function dcOpen() {
      dcTrack.style.transition = T;
      dcTrack.style.transform = 'translateX(-'+tx+'px)';
    }
    function dcClose(then) {
      dcTrack.style.transition = T;
      dcTrack.style.transform = '';
      dcTrack.addEventListener('transitionend', function h(){ dcTrack.removeEventListener('transitionend',h); if(then)then(); });
    }

    // Plus button click
    plusBtn.onclick = function() {
      if(isOff) {
        var cs2=getComputedStyle(document.documentElement);
        function ph2(v){var m=v.replace('#','');return[parseInt(m.slice(0,2),16),parseInt(m.slice(2,4),16),parseInt(m.slice(4,6),16)];}
        var cur=ph2(cs2.getPropertyValue(hasExtra?'--accent':'--secondary').trim());
        var grey=ph2(cs2.getPropertyValue('--muted').trim());
        function flash(fc,tc,dur,then){var s=null;function ease(t){return t<0.5?2*t*t:-1+(4-2*t)*t;}function step(ts){if(!s)s=ts;var t=Math.min((ts-s)/dur,1),e=ease(t);function lp(a,b){return Math.round(a+(b-a)*e);}plusBtn.style.background='rgb('+lp(fc[0],tc[0])+','+lp(fc[1],tc[1])+','+lp(fc[2],tc[2])+')';if(t<1)requestAnimationFrame(step);else if(then)then();}requestAnimationFrame(step);}
        flash(cur,grey,200,function(){setTimeout(function(){flash(grey,cur,300,null);},2500);});
        return;
      }
      const open = plusBtn._dcOpen === true;
      plusBtn._dcOpen = !open;
      _dcExpanded[dateKey] = !open;
      var forceplus = !!(open && plusBtn._forceplus);
      if(forceplus) delete plusBtn._forceplus;
      if(hasExtra && !forceplus){
        var cs=getComputedStyle(document.documentElement);
        var sec=cs.getPropertyValue('--secondary').trim();
        var acc=cs.getPropertyValue('--accent').trim();
        var fromCol=open?sec:acc;
        var toCol=open?(forceplus?sec:acc):sec;
        _pMorph(open?'back':'fwd',open?(forceplus?'plus':'fwd'):'back',1120,fromCol,toCol);
      } else {
        _pMorph(open?'back':'plus',open?'plus':'back',1120);
        plusBtn.style.background='';
      }
      if(open) {
        dcClose(null);
      } else {
        dcOpen();
      }
    };

    // Close button click
    closeBtn.dataset.dk = dateKey;
    closeBtn.onclick = function() {
      if(closeBtn.dataset.confirm==='1') {
        closeBtn.dataset.confirm='';
        plusBtn._forceplus = true;
        plusBtn.onclick();
        dcTrack.addEventListener('transitionend', function h(){
          dcTrack.removeEventListener('transitionend', h);
          setTimeout(function(){ dcDelExtra(closeBtn.dataset.dk); }, 50);
        });
      } else {
        closeBtn.dataset.confirm='1';
        closeBtn.style.background='var(--color-1)';
        _xl1.style.stroke='white';_xl2.style.stroke='white';
        _cMorph(true, 300);
        setTimeout(function(){
          if(closeBtn.dataset.confirm==='1'){
            closeBtn.dataset.confirm='';
            _cMorph(false, 300);
          }
        },2500);
      }
    };

    // Restore expanded state instantly
    if(_dcExpanded[dateKey]){
      if(hasExtra){
        plusBtn._dcOpen = true;
        _pSet('back');
        plusBtn.style.background = 'var(--secondary)';
        dcTrack.style.transition = 'none';
        dcTrack.style.transform = 'translateX(-'+tx+'px)';
      } else {
        delete _dcExpanded[dateKey];
        plusBtn.style.background='';
        _pSet('plus');
      }
    }
    } else {
      container.appendChild(card);
    } // end showSecondShift
  }
  const totEl = document.getElementById('totalsValue');
  if (totEl) totEl.textContent = `${String(Math.floor(totalMins/60)).padStart(2,'0')} Hours  ${String(totalMins%60).padStart(2,'0')} Minutes`;
}

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
let tpDigits=[],tpAmPm='AM',tpSpecial=null,tpDate=null,tpSection=null,tpHoursMode='scheduled',tpSmartPresets=[];

function openSchedModal(dateObj, section, si) {
  tpDate=dateObj; tpSection=section; tpShiftIndex=si||0; tpDigits=[]; tpSpecial=null; tpHoursMode=activeHours;
  const job=jobs.find(j=>j.id===activeJobId); const dateKey=localDateKey(dateObj);
  const dayData=getSchedObj(job,tpHoursMode); const dayEntry=dayData&&dayData[dateKey];
  const slot=tpShiftIndex===0?dayEntry:(dayEntry&&dayEntry.extra?dayEntry.extra[tpShiftIndex-1]:null);
  const saved=slot&&slot[section];
  if(saved&&saved!=='OFF'&&saved!=='NONE'){const parts=saved.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);if(parts){const hh=parts[1].padStart(2,'0');tpDigits=[+hh[0],+hh[1],+parts[2][0],+parts[2][1]];tpAmPm=parts[3];}}
  else if(saved==='OFF'||saved==='NONE'){tpSpecial=saved;}
  else{tpAmPm='AM';}
  document.getElementById('schedModalTitle').textContent = `${DAY_NAMES[dateObj.getDay()]}  ${MONTHS[dateObj.getMonth()]} ${String(dateObj.getDate()).padStart(2,'0')}  -  ${section==='start'?'Start':'End'}`;
  renderTimePicker(); document.getElementById('schedModal').classList.add('open');
}

function getSmartPresets(job) {
  if(!job||!job.schedule)return[]; const counts={};
  Object.values(job.schedule).forEach(day=>{if(!day||!day.start||!day.end)return;if(day.start==='OFF'||day.start==='NONE')return;if(day.end==='OFF'||day.end==='NONE')return;const key=day.start+'|'+day.end;counts[key]=(counts[key]||0)+1;});
  return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([key])=>{const[s,e]=key.split('|');return{start:s,end:e};});
}

function tpLoadSmartRange(idx) {
  const p=tpSmartPresets[idx]; if(!p)return; const job=jobs.find(j=>j.id===activeJobId); if(!job)return;
  const dayObj=ensureSchedObj(job,'scheduled',localDateKey(tpDate)); if(dayObj.start==='OFF'){dayObj.start=undefined;dayObj.end=undefined;}
  dayObj.start=p.start; dayObj.end=p.end; lsSet('sch_jobs',jobs); renderDayCards(); renderJobs();
  if(typeof renderQuickSchedule==='function'&&appSettings.showQuickSchedule){buildQuickSchedule();renderQuickSchedule();}
  if(typeof renderHistory==='function'){buildHistory();renderHistory();}
  closeSchedModal();
}

function renderTimePicker() {
  const job=jobs.find(j=>j.id===activeJobId); tpSmartPresets=(tpHoursMode==='scheduled')?getSmartPresets(job):[];
  const hasPresets=tpSmartPresets.length>0; const rows=hasPresets?5:4;
  const presetsHtml=hasPresets?tpSmartPresets.map((p,i)=>`<button class="tp-preset" onclick="tpLoadSmartRange(${i})" style="flex-direction:column;gap:2px;font-size:var(--text-xs);"><span>${p.start}</span><span style="color:var(--text-mid);">-</span><span>${p.end}</span></button>`).join(''):'';
  document.getElementById('schedModalBody').innerHTML = `
    <div class="tp-wrap">
      <div class="tp-display" id="tpDisplay"></div>
      <div class="tp-grid" style="grid-template-rows:repeat(${rows},var(--card-height));">
        <button class="tp-btn tp-red" onclick="tpBack()">&#9664;</button>
        <button class="tp-btn tp-blue" onclick="tpSetSpecial('OFF')">OFF</button>
        <button class="tp-btn tp-purple" onclick="tpSetSpecial('NONE')">NONE</button>
        <button class="tp-btn tp-red" onclick="tpClear()">C</button>
        <button class="tp-btn" onclick="tpDigit(1)">1</button><button class="tp-btn" onclick="tpDigit(2)">2</button><button class="tp-btn" onclick="tpDigit(3)">3</button>
        <button class="tp-btn tp-ampm" id="tpAM" onclick="tpSetAmPm('AM')">AM</button>
        <button class="tp-btn" onclick="tpDigit(4)">4</button><button class="tp-btn" onclick="tpDigit(5)">5</button><button class="tp-btn" onclick="tpDigit(6)">6</button>
        <button class="tp-btn tp-ampm" id="tpPM" onclick="tpSetAmPm('PM')">PM</button>
        <button class="tp-btn" onclick="tpDigit(7)">7</button><button class="tp-btn" onclick="tpDigit(8)">8</button><button class="tp-btn" onclick="tpDigit(9)">9</button><button class="tp-btn" onclick="tpDigit(0)">0</button>
        ${presetsHtml}
      </div>
      <div class="tp-footer">
        <button class="tp-cancel" onclick="closeSchedModal()">Cancel</button>
        <button class="tp-set" onclick="tpConfirm()">Set Time</button>
      </div>
    </div>`;
  tpRefreshDisplay();
}

function tpRefreshDisplay() {
  const el=document.getElementById('tpDisplay'); if(!el)return;
  if(tpSpecial){el.textContent=tpSpecial;el.classList.add('tp-special');}
  else{el.classList.remove('tp-special');const d=tpDigits;el.textContent=`${d[0]??'-'}${d[1]??'-'} : ${d[2]??'-'}${d[3]??'-'}  ${tpAmPm}`;}
  const amEl=document.getElementById('tpAM'); const pmEl=document.getElementById('tpPM');
  if(amEl)amEl.classList.toggle('active',tpAmPm==='AM'); if(pmEl)pmEl.classList.toggle('active',tpAmPm==='PM');
}

function tpDigit(n){
  if(tpSpecial){tpSpecial=null;tpDigits=[];} if(tpDigits.length>=4)tpDigits=[];
  const pos=tpDigits.length;
  if(pos===0){if(n>=2)tpDigits.push(0,n);else tpDigits.push(n);}
  else if(pos===1){if(tpDigits[0]===0&&n===0)return;if(tpDigits[0]===1&&n>2)return;tpDigits.push(n);}
  else if(pos===2){if(n>5)return;tpDigits.push(n);}
  else{tpDigits.push(n);}
  tpRefreshDisplay();
}
function tpBack(){if(tpSpecial){tpSpecial=null;tpRefreshDisplay();return;}tpDigits.pop();tpRefreshDisplay();}
function tpClear(){tpDigits=[];tpSpecial=null;tpRefreshDisplay();}
function tpSetAmPm(ap){tpAmPm=ap;tpSpecial=null;tpRefreshDisplay();}
function tpSetSpecial(s){tpSpecial=s;tpDigits=[];tpRefreshDisplay();tpConfirm();}

function tpConfirm() {
  const job=jobs.find(j=>j.id===activeJobId); if(!job){closeSchedModal();return;}
  const dayObj=ensureSchedObj(job,tpHoursMode,localDateKey(tpDate));
  let slot;
  if(tpShiftIndex===0){slot=dayObj;}else{if(!dayObj.extra)dayObj.extra=[];while(dayObj.extra.length<tpShiftIndex)dayObj.extra.push({});slot=dayObj.extra[tpShiftIndex-1];}
  if(tpSpecial==='OFF'){slot.start='OFF';slot.end='OFF';}
  else if(tpSpecial==='NONE'){delete slot[tpSection];}
  else if(tpDigits.length>=1){
    let d=[...tpDigits];
    if(d.length===1)d=[0,d[0],0,0];else if(d.length===2)d=[...d,0,0];else if(d.length===3)d=[...d,0];
    const hh=d[0]*10+d[1],mm=d[2]*10+d[3];
    if(hh<1||hh>12||mm>59){tpRefreshDisplay();return;}
    if(tpShiftIndex===0&&slot.start==='OFF'){slot.start=undefined;slot.end=undefined;}
    slot[tpSection]=`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')} ${tpAmPm}`;
  } else{closeSchedModal();return;}
  lsSet('sch_jobs',jobs); renderDayCards(); renderJobs();
  if(typeof renderQuickSchedule==='function'&&appSettings.showQuickSchedule){buildQuickSchedule();renderQuickSchedule();}
  if(typeof renderHistory==='function'){buildHistory();renderHistory();}
  closeSchedModal();
}
function closeSchedModal(){document.getElementById('schedModal').classList.remove('open');}

let _appInitDone = false;
document.getElementById('mainApp').style.opacity = '0';
buildWindows();
document.getElementById('jobSettingsBtn').appendChild(buildDotGrid());
(function(){
  const ns='http://www.w3.org/2000/svg';
  function makeBackArrow(){
    const svg=document.createElementNS(ns,'svg');
    svg.setAttribute('width','22');svg.setAttribute('height','22');svg.setAttribute('viewBox','0 0 50 50');
    const l1=document.createElementNS(ns,'line');const l2=document.createElementNS(ns,'line');
    [l1,l2].forEach(function(l){l.style.stroke='var(--text-light)';l.setAttribute('stroke-width','5');l.setAttribute('stroke-linecap','round');});
    l1.setAttribute('x1','42');l1.setAttribute('y1','10');l1.setAttribute('x2','8');l1.setAttribute('y2','25');
    l2.setAttribute('x1','42');l2.setAttribute('y1','40');l2.setAttribute('x2','8');l2.setAttribute('y2','25');
    svg.appendChild(l1);svg.appendChild(l2);
    return svg;
  }
  ['jobWindowBack','newWindowBack','jobSettingsWindowBack','settingsWindowBack'].forEach(function(id){
    var el=document.getElementById(id);
    if(el)el.appendChild(makeBackArrow());
  });
})();
updateSettingsUI();
renderJobs();
applyTheme();
if (typeof applyCustomFont === 'function') applyCustomFont(appSettings.customFont);
requestAnimationFrame(() => {
  document.getElementById('mainApp').style.transition = 'opacity 0.15s';
  document.getElementById('mainApp').style.opacity = '1';
  _appInitDone = true;
  setTimeout(function(){ _graphAnimDone = true; }, 2000);
});
setInterval(() => { renderJobs(); }, 60000);
