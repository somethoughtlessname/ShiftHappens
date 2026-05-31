let fxIntervals = [];
let fxRAFs = [];
let fxGen = 0;

const OVERLAY_CFG_DEFAULTS = {
  overlay:'none',
  grn:{layer:'over',intensity:'med',size:'med'},
  crt:{layer:'under',color:'green',lines:'med'},
  stt:{layer:'over',intensity:'med',speed:'med'},
  glc:{speed:'med',intensity:'med'},
  prx:{layer:'mixed',speed:'med',density:'med'},
  dtr:{layer:'over',intensity:'med',size:'med'},
  pxl:{layer:'over',size:'med',intensity:'med'},
  vgn:{layer:'over',strength:'med',spread:'med'},
  gls:{layer:'under',size:'med',opacity:'med'},
  crs:{layer:'under',spacing:'med',opacity:'med'},
};

const LAYER_FILTERS_APP=['grn','crt','stt','dtr','pxl','vgn','gls','crs'];
const LAYER_MIXED_APP=['prx'];

const OVERLAY_SETTINGS_DEF = {
  non: [],
  grn: [{key:'intensity',lbl:'Intensity',opts:[{v:'low',l:'Low'},{v:'med',l:'Med'},{v:'high',l:'High'}]},{key:'size',lbl:'Grain',opts:[{v:'fine',l:'Fine'},{v:'med',l:'Med'},{v:'coarse',l:'Coarse'}]}],
  crt: [{key:'color',lbl:'Color',opts:[{v:'green',col:'#00ff60'},{v:'amber',col:'#ffaa22'},{v:'blue',col:'#2266ff'},{v:'white',col:'#ffffff'},{v:'red',col:'#ff3322'},{v:'purple',col:'#bb33ff'},{v:'cyan',col:'#00ffdd'},{v:'orange',col:'#ff8822'}],isColor:true},{key:'lines',lbl:'Lines',opts:[{v:'light',l:'Light'},{v:'med',l:'Med'},{v:'heavy',l:'Heavy'}]}],
  stt: [{key:'intensity',lbl:'Intensity',opts:[{v:'low',l:'Low'},{v:'med',l:'Med'},{v:'high',l:'High'}]},{key:'speed',lbl:'Speed',opts:[{v:'slow',l:'Slow'},{v:'med',l:'Med'},{v:'fast',l:'Fast'}]}],
  glc: [{key:'speed',lbl:'Speed',opts:[{v:'slow',l:'Slow'},{v:'med',l:'Med'},{v:'fast',l:'Fast'}]},{key:'intensity',lbl:'Intensity',opts:[{v:'low',l:'Low'},{v:'med',l:'Med'},{v:'high',l:'High'}]}],
  prx: [{key:'speed',lbl:'Speed',opts:[{v:'slow',l:'Slow'},{v:'med',l:'Med'},{v:'fast',l:'Fast'}]},{key:'density',lbl:'Density',opts:[{v:'sparse',l:'Sparse'},{v:'med',l:'Med'},{v:'dense',l:'Dense'}]}],
  dtr: [{key:'intensity',lbl:'Intensity',opts:[{v:'light',l:'Light'},{v:'med',l:'Med'},{v:'heavy',l:'Heavy'}]},{key:'size',lbl:'Pattern',opts:[{v:'fine',l:'Fine'},{v:'med',l:'Med'},{v:'coarse',l:'Coarse'}]}],
  pxl: [{key:'size',lbl:'Size',opts:[{v:'small',l:'Small'},{v:'med',l:'Med'},{v:'large',l:'Large'}]},{key:'intensity',lbl:'Intensity',opts:[{v:'light',l:'Light'},{v:'med',l:'Med'},{v:'heavy',l:'Heavy'}]}],
  vgn: [{key:'strength',lbl:'Strength',opts:[{v:'light',l:'Light'},{v:'med',l:'Med'},{v:'heavy',l:'Heavy'}]},{key:'spread',lbl:'Spread',opts:[{v:'tight',l:'Tight'},{v:'med',l:'Med'},{v:'wide',l:'Wide'}]}],
  gls: [{key:'size',lbl:'Cells',opts:[{v:'small',l:'Small'},{v:'med',l:'Med'},{v:'large',l:'Large'}]},{key:'opacity',lbl:'Opacity',opts:[{v:'light',l:'Light'},{v:'med',l:'Med'},{v:'heavy',l:'Heavy'}]}],
  crs: [{key:'spacing',lbl:'Spacing',opts:[{v:'tight',l:'Tight'},{v:'med',l:'Med'},{v:'wide',l:'Wide'}]},{key:'opacity',lbl:'Opacity',opts:[{v:'light',l:'Light'},{v:'med',l:'Med'},{v:'heavy',l:'Heavy'}]}],
};

function getOverlayCfg() {
  if (!appSettings.overlayCfg) appSettings.overlayCfg = JSON.parse(JSON.stringify(OVERLAY_CFG_DEFAULTS));
  return appSettings.overlayCfg;
}

function clearThemeFx() {
  fxGen++;
  fxIntervals.forEach(id => { clearInterval(id); clearTimeout(id); });
  fxIntervals = []; fxRAFs.forEach(cancelAnimationFrame); fxRAFs = [];
  const tbOpen = document.getElementById('themeBuilderWindow') &&
                 document.getElementById('themeBuilderWindow').classList.contains('open');
  const fxb = document.getElementById('fx-back');
  const fxf = document.getElementById('fx-fore');
  if (!tbOpen) {
    if (fxb) { fxb.innerHTML = ''; fxb.style.zIndex = '1'; }
    if (fxf) { fxf.innerHTML = ''; fxf.style.zIndex = '1'; }
  }
  const pback = document.getElementById('tbPreviewFxBack'); if (pback) pback.innerHTML = '';
  const pfore = document.getElementById('tbPreviewFxFore'); if (pfore) pfore.innerHTML = '';
  if (!(document.getElementById('themeBuilderWindow')&&document.getElementById('themeBuilderWindow').classList.contains('open'))) document.body.style.filter = '';
  const demoEl = document.querySelector('.tb-demo-section'); if (demoEl) demoEl.style.filter = '';
  document.querySelectorAll('[data-pxl-done]').forEach(el => delete el.dataset.pxlDone);
  document.querySelectorAll('.pxl-inner').forEach(el => {
    const parent = el.parentElement;
    if (parent) delete parent.dataset.pxlDone;
    el.remove();
    if (parent) { parent.style.position = ''; parent.style.zIndex = ''; }
  });
}

function setOverlay(id) {
  const cfg = getOverlayCfg();
  cfg.overlay = id;
  appSettings.overlay = id;
  lsSet('sch_settings', appSettings);
  applyOverlay();
  const slot = document.getElementById('themePickerSlot');
  if (slot) slot.querySelectorAll('.filter-btn').forEach(btn => {
    const m = btn.getAttribute('onclick').match(/setOverlay\('(.*?)'\)/);
    if (m) btn.classList.toggle('active', m[1] === id);
  });
  buildOverlaySettings(id);
}

function buildOverlaySettings(id) {
  const nameEl = document.getElementById('overlaySettingsName');
  if (nameEl) nameEl.textContent = id === 'none' ? '-' : id.toUpperCase();
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
        b.onclick = () => { if (cfg[id]) cfg[id].layer = v; lsSet('sch_settings', appSettings); applyOverlay(); buildOverlaySettings(id); };
        layerWrap.appendChild(b);
      });
    }
  }
  const body = document.getElementById('tbOverlaySettings') || document.getElementById('overlaySettingsBody');
  if (!body) return;
  body.innerHTML = '';
  body.style.background = 'var(--bg-2)';
  const defs = OVERLAY_SETTINGS_DEF[id] || [];
  if (!defs.length) {
    body.innerHTML =
      `<div style="height:var(--job-half);display:flex;align-items:stretch;pointer-events:none;">
        <div style="width:64px;flex-shrink:0;border-right:var(--border-width) solid transparent;background:var(--bg-3);"></div>
        <div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);color:var(--muted);letter-spacing:var(--ls-wide);">${id === 'none' ? 'SELECT AN OVERLAY' : ''}</div>
      </div>
      <div style="height:var(--job-half);display:flex;align-items:stretch;pointer-events:none;border-top:var(--border-width) solid var(--border-color);">
        <div style="width:64px;flex-shrink:0;border-right:var(--border-width) solid transparent;background:var(--bg-3);"></div>
        <div style="flex:1;"></div>
      </div>`;
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
      b.onclick = () => { if (cfg[id]) cfg[id][def.key] = opt.v; lsSet('sch_settings', appSettings); buildOverlaySettings(id); applyOverlay(); if (typeof applyOverlayToPreview === 'function') applyOverlayToPreview(id); };
      opts.appendChild(b);
    });
    row.append(lbl, opts);
    body.appendChild(row);
  });
}

function injectWindowFx(windowId) {
  const win = document.getElementById(windowId);
  if (!win) return;
  removeWindowFx(windowId);
  const cfg = getOverlayCfg();
  const id = cfg.overlay || 'none';
  if (id === 'none') return;
  const c = cfg[id] || {};
  const layer = c.layer || 'under';
  const wb = document.createElement('div');
  wb.className = 'win-fx-back';
  wb.style.cssText = `position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:${layer==='over'?'9999':'0'};`;
  const wf = document.createElement('div');
  wf.className = 'win-fx-fore';
  wf.style.cssText = `position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:${layer==='over'?'10000':'0'};`;
  win.style.position = 'fixed';
  win.appendChild(wb);
  win.appendChild(wf);
  applyOverlayInWindow(id, c, wb, wf);
}

function removeWindowFx(windowId) {
  const win = document.getElementById(windowId);
  if (!win) return;
  win.querySelectorAll('.win-fx-back,.win-fx-fore').forEach(el => el.remove());
  if (win._winFxGen !== undefined) win._winFxGen++;
  const body = win.querySelector('.data-body, .data-window-body');
  if (body) body.style.position = '';
}

function applyOverlayInWindow(id, c, backEl, foreEl) {
  const win = backEl.closest('.data-window');
  if (!win) return;
  if (win._winFxGen === undefined) win._winFxGen = 0;
  win._winFxGen++;
  const myGen = win._winFxGen;
  const layer = c.layer || 'under';
  const target = layer === 'over' ? foreEl : backEl;
  function mkWinC(el, op, blend) {
    const c2 = document.createElement('canvas');
    const r = el.getBoundingClientRect();
    c2.width = r.width || 300; c2.height = r.height || window.innerHeight;
    let s = 'position:absolute;inset:0;width:100%;height:100%;';
    if (op != null) s += `opacity:${op};`;
    if (blend) s += `mix-blend-mode:${blend};`;
    c2.style.cssText = s;
    el.appendChild(c2);
    return c2;
  }
  const rgbs = getThemeRGBs();
  if (id === 'grn') {
    const op={low:.12,med:.22,high:.38}[c.intensity||'med']; const ps={fine:1,med:2,coarse:4}[c.size||'med'];
    const cv=mkWinC(target,op,null); const ctx=cv.getContext('2d');
    function d(){if(win._winFxGen!==myGen)return;const img=ctx.createImageData(cv.width,cv.height);for(let y=0;y<cv.height;y+=ps)for(let x=0;x<cv.width;x+=ps){const v=Math.random()*255;for(let dy=0;dy<ps;dy++)for(let dx=0;dx<ps;dx++){const i=((y+dy)*cv.width+(x+dx))*4;if(i<img.data.length-3){img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=Math.random()*65;}}}ctx.putImageData(img,0,0);requestAnimationFrame(d);}
    d();
  } else if (id === 'crt') {
    const colMap=_crtColMap,tintMap=_crtTintMap;
    const col=c.color||'green'; const sp={light:4,med:3,heavy:2}[c.lines||'med'];
    win.style.filter=colMap[col];
    const sl=document.createElement('div'); sl.style.cssText=`position:absolute;inset:0;background:repeating-linear-gradient(to bottom,transparent 0,transparent ${sp}px,rgba(0,0,0,0.45) ${sp}px,rgba(0,0,0,0.45) ${sp+1}px);`; target.appendChild(sl);
    const gt=document.createElement('div'); gt.style.cssText=`position:absolute;inset:0;background:${tintMap[col]};mix-blend-mode:screen;`; foreEl.appendChild(gt);
    const wave=document.createElement('div'); wave.style.cssText=`position:absolute;left:0;right:0;height:45px;background:linear-gradient(to bottom,transparent,${tintMap[col]},transparent);`; foreEl.appendChild(wave);
    let wy=0; const iv=setInterval(()=>{if(win._winFxGen!==myGen){clearInterval(iv);win.style.filter='';return;}wy=(wy+2)%(win.offsetHeight||800);wave.style.top=wy+'px';},16);
  } else if (id === 'stt') {
    const op={low:.12,med:.2,high:.35}[c.intensity||'med']; const cv=mkWinC(target,op,null); const ctx=cv.getContext('2d');
    function d(){if(win._winFxGen!==myGen)return;const img=ctx.createImageData(cv.width,cv.height);for(let i=0;i<img.data.length;i+=4){const v=Math.random()*255;img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=175;}ctx.putImageData(img,0,0);requestAnimationFrame(d);}
    d();
  } else if (id === 'glc') {
    const body2=win.querySelector('.data-body')||win; const kids=()=>Array.from(body2.children).filter(el=>!el.classList.contains('win-fx-back')&&!el.classList.contains('win-fx-fore'));
    const delay=()=>Math.round({slow:600,med:280,fast:80}[c.speed||'med']+Math.random()*300); const maxSh={low:10,med:22,high:40}[c.intensity||'med'];
    function spawn(){if(win._winFxGen!==myGen)return;const r=Math.random();const els=kids();
      if(r<.5&&els.length){const el=els[Math.floor(Math.random()*els.length)];el.style.transform=`translateX(${(Math.random()-.5)*maxSh*2}px)`;setTimeout(()=>{if(el)el.style.transform='';},25+Math.random()*60);}
      else if(els.length){els.forEach(el=>{el.style.transform=`translateX(${(Math.random()-.5)*maxSh}px)`;});setTimeout(()=>els.forEach(el=>{if(el)el.style.transform='';}),20);}
      setTimeout(spawn,delay());}
    spawn();
  } else if (id === 'dtr') {
    const opMap={light:.2,med:.35,heavy:.55}; const M8=[[0,48,12,60,3,51,15,63],[32,16,44,28,35,19,47,31],[8,56,4,52,11,59,7,55],[40,24,36,20,43,27,39,23],[2,50,14,62,1,49,13,61],[34,18,46,30,33,17,45,29],[10,58,6,54,9,57,5,53],[42,26,38,22,41,25,37,21]];
    const M4=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]]; const M2=[[0,2],[3,1]];
    const Msel={fine:M8,med:M4,coarse:M2}[c.size||'med']||M8; const Msz=Msel.length;
    const cv=mkWinC(target,opMap[c.intensity||'med'],null); const ctx=cv.getContext('2d');
    const img=ctx.createImageData(cv.width,cv.height);
    for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++){const t=Msel[y%Msz][x%Msz]/(Msz*Msz);const v=t>.5?255:0;const i=(y*cv.width+x)*4;img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=80;}
    ctx.putImageData(img,0,0);
  } else if (id === 'pxl') {
    const ps={small:3,med:5,large:8}[c.size||'med']; const op={light:.15,med:.3,heavy:.55}[c.intensity||'med'];
    const cv=mkWinC(target,op,null); const ctx=cv.getContext('2d');
    cv.style.mixBlendMode='overlay';
    if(!cv.width||!cv.height)return;
    for(let y=0;y<cv.height;y+=ps)for(let x=0;x<cv.width;x+=ps){const v=Math.floor(Math.random()*256);ctx.fillStyle=`rgb(${v},${v},${v})`;ctx.fillRect(x,y,ps,ps);}
  } else if (id === 'vgn') {
    const str={light:.5,med:.72,heavy:.9}[c.strength||'med']; const sp2={tight:.12,med:.22,wide:.35}[c.spread||'med'];
    const cv=mkWinC(foreEl,1,null); const ctx=cv.getContext('2d');
    const g=ctx.createRadialGradient(cv.width/2,cv.height/2,cv.height*sp2,cv.width/2,cv.height/2,cv.height*.92);
    g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,`rgba(0,0,0,${str})`);
    ctx.fillStyle=g; ctx.fillRect(0,0,cv.width,cv.height);
  } else if (id === 'gls') {
    const cellSize={small:25,med:45,large:80}[c.size||'med']; const op={light:.3,med:.5,heavy:.72}[c.opacity||'med'];
    const cv=mkWinC(target,op,'screen'); const ctx=cv.getContext('2d');
    const cs2=getComputedStyle(document.documentElement);
    const baseHues=['--primary','--secondary','--accent'].map(v=>{const hex=cs2.getPropertyValue(v).trim().replace('#','');const r=parseInt(hex.slice(0,2),16)/255,g2=parseInt(hex.slice(2,4),16)/255,b=parseInt(hex.slice(4,6),16)/255;const mx=Math.max(r,g2,b),mn=Math.min(r,g2,b),d=mx-mn;if(d===0)return 120;let hh=0;if(mx===r)hh=((g2-b)/d+(g2<b?6:0))/6;else if(mx===g2)hh=((b-r)/d+2)/6;else hh=((r-g2)/d+4)/6;return Math.round(hh*360);});
    const cols=Math.ceil(cv.width/cellSize)+1; const rows=Math.ceil(cv.height/cellSize)+1;
    const cw=cv.width/cols; const ch=cv.height/rows; const jit=0.42;
    const pts=[]; for(let row=0;row<=rows;row++) for(let col=0;col<=cols;col++) pts.push({x:col*cw+(Math.random()-.5)*cw*jit*2,y:row*ch+(Math.random()-.5)*ch*jit*2});
    for(let row=0;row<rows;row++) for(let col=0;col<cols;col++){const i=row*(cols+1)+col;const tl=pts[i],tr=pts[i+1],bl=pts[i+(cols+1)],br=pts[i+(cols+2)];if(!tl||!tr||!bl||!br)continue;const hue=(baseHues[Math.floor(Math.random()*baseHues.length)]+(Math.random()-.5)*90+360)%360;const sat=35+Math.random()*50,lit=25+Math.random()*42,alpha=.5+Math.random()*.2;ctx.fillStyle=`hsla(${hue},${sat}%,${lit}%,${alpha.toFixed(2)})`;ctx.beginPath();ctx.moveTo(tl.x,tl.y);ctx.lineTo(tr.x,tr.y);ctx.lineTo(br.x,br.y);ctx.lineTo(bl.x,bl.y);ctx.closePath();ctx.fill();}
  } else if (id === 'crs') {
    const sp3={tight:4,med:7,wide:13}[c.spacing||'med']; const op2={light:.12,med:.22,heavy:.4}[c.opacity||'med'];
    const cv=mkWinC(target,op2,null); const ctx=cv.getContext('2d'); const ang=Math.PI/4;
    ctx.strokeStyle='rgba(0,0,0,0.9)'; ctx.lineWidth=.6;
    for(let d=-cv.height*2;d<cv.width*2;d+=sp3){ctx.save();ctx.translate(cv.width/2,cv.height/2);ctx.rotate(ang);ctx.beginPath();ctx.moveTo(d,-cv.height*2);ctx.lineTo(d,cv.height*2);ctx.stroke();ctx.restore();}
    ctx.strokeStyle='rgba(0,0,0,0.5)';
    for(let d=-cv.height*2;d<cv.width*2;d+=sp3){ctx.save();ctx.translate(cv.width/2,cv.height/2);ctx.rotate(-ang);ctx.beginPath();ctx.moveTo(d,-cv.height*2);ctx.lineTo(d,cv.height*2);ctx.stroke();ctx.restore();}
  } else if (id === 'prx') {
    const spd={slow:.12,med:.35,fast:.85}[c.speed||'med']; const n={sparse:30,med:70,dense:140}[c.density||'med'];
    [{el:backEl,n,minSz:.5,maxSz:2,sp:spd*.2,op:.18},{el:foreEl,n:Math.round(n*.15),minSz:4,maxSz:9,sp:spd*1.3,op:.4}].forEach(({el,n:cn,minSz,maxSz,sp,op})=>{
      const cv2=mkWinC(el,op,null); const ctx2=cv2.getContext('2d');
      const pts=Array.from({length:cn},()=>({x:Math.random()*cv2.width,y:Math.random()*cv2.height,spd:sp*(0.8+Math.random()*.4),sz:minSz+Math.random()*(maxSz-minSz)}));
      function d(){if(win._winFxGen!==myGen)return;ctx2.clearRect(0,0,cv2.width,cv2.height);ctx2.fillStyle='#fff';pts.forEach(p=>{p.y+=p.spd;if(p.y>cv2.height)p.y=-p.sz;ctx2.beginPath();ctx2.arc(p.x,p.y,p.sz,0,Math.PI*2);ctx2.fill();});requestAnimationFrame(d);}
      d();});
  }
}

function applyOverlayToPreview(id) {
  if (window._previewGen === undefined) window._previewGen = 0;
  window._previewGen++;
  const myPreviewGen = window._previewGen;
  const pback = document.getElementById('tbPreviewFxBack');
  const pfore = document.getElementById('tbPreviewFxFore');
  if (pback) pback.innerHTML = '';
  if (pfore) pfore.innerHTML = '';
  const demoEl = document.querySelector('.tb-demo-section');
  if (demoEl) demoEl.style.filter = '';
  if (!id || id === 'none') return;
  const cfg = getOverlayCfg();
  const c = cfg[id] || {};
  const layer = c.layer || 'under';
  if (pback) pback.style.zIndex = layer === 'over' ? '20' : '0';
  if (pfore) pfore.style.zIndex = (layer === 'over' || layer === 'mixed') ? '30' : '0';
  function mkPreviewC(target, op, blend) {
    const el = target === 'fx-back' ? pback : pfore;
    if (!el) return document.createElement('canvas');
    const rect = el.getBoundingClientRect();
    const w = rect.width > 0 ? Math.round(rect.width) : 300;
    const hh = rect.height > 0 ? Math.round(rect.height) : 200;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = hh;
    let s = 'position:absolute;inset:0;width:100%;height:100%;';
    if (op != null) s += `opacity:${op};`;
    if (blend) s += `mix-blend-mode:${blend};`;
    cv.style.cssText = s;
    el.appendChild(cv);
    return cv;
  }
  const rgbs = getThemeRGBs();
  if (id === 'grn') {
    const op={low:.12,med:.22,high:.38}[c.intensity||'med']; const ps={fine:1,med:2,coarse:4}[c.size||'med'];
    const cv=mkPreviewC('fx-back',op,null); const ctx=cv.getContext('2d');
    function drawGrn(){if(window._previewGen!==myPreviewGen)return;const img=ctx.createImageData(cv.width,cv.height);for(let y=0;y<cv.height;y+=ps)for(let x=0;x<cv.width;x+=ps){const v=Math.random()*255;for(let dy=0;dy<ps;dy++)for(let dx=0;dx<ps;dx++){const i=((y+dy)*cv.width+(x+dx))*4;if(i<img.data.length-3){img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=Math.random()*65;}}}ctx.putImageData(img,0,0);requestAnimationFrame(drawGrn);}
    drawGrn();
  } else if (id === 'crt') {
    const colMap=_crtColMap,tintMap=_crtTintMap;
    const col=c.color||'green'; const sp={light:4,med:3,heavy:2}[c.lines||'med'];
    if (demoEl) demoEl.style.filter=colMap[col];
    const tgtEl=layer==='over'?pfore:pback;
    if(tgtEl){const sl=document.createElement('div');sl.style.cssText=`position:absolute;inset:0;background:repeating-linear-gradient(to bottom,transparent 0,transparent ${sp}px,rgba(0,0,0,0.45) ${sp}px,rgba(0,0,0,0.45) ${sp+1}px);`;tgtEl.appendChild(sl);}
    if(pfore){const vg=document.createElement('div');vg.style.cssText='position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 38%,rgba(0,0,0,0.92) 100%);';pfore.appendChild(vg);
      const gt=document.createElement('div');gt.style.cssText=`position:absolute;inset:0;background:${tintMap[col]};mix-blend-mode:screen;`;pfore.appendChild(gt);
      const wave=document.createElement('div');wave.style.cssText=`position:absolute;left:0;right:0;height:30px;background:linear-gradient(to bottom,transparent,${tintMap[col]},transparent);`;pfore.appendChild(wave);
      let wy=0;
      function animCRTWave(){if(window._previewGen!==myPreviewGen)return;const h2=pfore.offsetHeight||200;wy=(wy+2)%h2;wave.style.top=wy+'px';requestAnimationFrame(animCRTWave);}
      animCRTWave();}
  } else if (id === 'stt') {
    const op={low:.12,med:.2,high:.35}[c.intensity||'med']; const cv=mkPreviewC('fx-back',op,null); const ctx=cv.getContext('2d');
    function drawStt(){if(window._previewGen!==myPreviewGen)return;const img=ctx.createImageData(cv.width,cv.height);for(let i=0;i<img.data.length;i+=4){const v=Math.random()*255;img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=175;}ctx.putImageData(img,0,0);requestAnimationFrame(drawStt);}
    drawStt();
  } else if (id === 'glc') {
    const appEl=demoEl; if(!appEl)return;
    const kids=()=>Array.from(appEl.querySelectorAll('[style],.label-card,.day-card,.job-card-top,.job-card-bottom'));
    const delay=()=>Math.round({slow:600,med:280,fast:80}[c.speed||'med']+Math.random()*300); const maxSh={low:8,med:18,high:30}[c.intensity||'med'];
    function spawnGlc(){if(window._previewGen!==myPreviewGen)return;const r=Math.random();const els=kids();
      if(r<0.5&&els.length){const el=els[Math.floor(Math.random()*els.length)];const sh=(Math.random()-.5)*maxSh*2;el.style.transform=`translateX(${sh}px)`;setTimeout(()=>{if(el)el.style.transform='';},20+Math.random()*60);}
      else if(els.length){els.forEach(el=>{el.style.transform=`translateX(${(Math.random()-.5)*maxSh}px)`;});setTimeout(()=>els.forEach(el=>{if(el)el.style.transform='';}),15+Math.random()*40);}
      setTimeout(spawnGlc,delay());}
    spawnGlc();
  } else if (id === 'prx') {
    const spd={slow:.12,med:.35,fast:.85}[c.speed||'med']; const n={sparse:20,med:40,dense:70}[c.density||'med'];
    [{target:'fx-back',n,minSz:.5,maxSz:2,sp:spd*.3,op:.25},{target:'fx-fore',n:Math.round(n*.2),minSz:3,maxSz:6,sp:spd*1.2,op:.4}].forEach(({target,n:cn,minSz,maxSz,sp,op})=>{
      const cv=mkPreviewC(target,op,null); const ctx=cv.getContext('2d');
      const pts=Array.from({length:cn},()=>({x:Math.random()*cv.width,y:Math.random()*cv.height,spd:sp*(0.8+Math.random()*.4),sz:minSz+Math.random()*(maxSz-minSz)}));
      function drawPrx(){if(window._previewGen!==myPreviewGen)return;ctx.clearRect(0,0,cv.width,cv.height);ctx.fillStyle='#fff';pts.forEach(p=>{p.y+=p.spd;if(p.y>cv.height)p.y=-p.sz;ctx.beginPath();ctx.arc(p.x,p.y,p.sz,0,Math.PI*2);ctx.fill();});requestAnimationFrame(drawPrx);}
      drawPrx();});
  } else if (id === 'dtr') {
    const opMap={light:.2,med:.35,heavy:.55}; const M8=[[0,48,12,60,3,51,15,63],[32,16,44,28,35,19,47,31],[8,56,4,52,11,59,7,55],[40,24,36,20,43,27,39,23],[2,50,14,62,1,49,13,61],[34,18,46,30,33,17,45,29],[10,58,6,54,9,57,5,53],[42,26,38,22,41,25,37,21]];
    const M4=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]]; const M2=[[0,2],[3,1]];
    const Msel={fine:M8,med:M4,coarse:M2}[c.size||'med']||M8; const Msz=Msel.length;
    const cv=mkPreviewC('fx-back',opMap[c.intensity||'med'],null); const ctx=cv.getContext('2d');
    const img=ctx.createImageData(cv.width,cv.height);
    for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++){const t=Msel[y%Msz][x%Msz]/(Msz*Msz);const v=t>.5?255:0;const i=(y*cv.width+x)*4;img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=80;}
    ctx.putImageData(img,0,0);
  } else if (id === 'pxl') {
    const ps={small:3,med:5,large:8}[c.size||'med']; const op={light:.15,med:.3,heavy:.55}[c.intensity||'med'];
    const target=layer==='over'?'fx-fore':'fx-back'; const cv=mkPreviewC(target,op,null);
    cv.style.mixBlendMode='overlay'; const ctx=cv.getContext('2d');
    if(!cv.width||!cv.height)return;
    for(let y=0;y<cv.height;y+=ps)for(let x=0;x<cv.width;x+=ps){const v=Math.floor(Math.random()*256);ctx.fillStyle=`rgb(${v},${v},${v})`;ctx.fillRect(x,y,ps,ps);}
  } else if (id === 'vgn') {
    const str={light:.5,med:.72,heavy:.9}[c.strength||'med']; const sp2={tight:.12,med:.22,wide:.35}[c.spread||'med'];
    const cv=mkPreviewC(layer==='under'?'fx-back':'fx-fore',1,null); const ctx=cv.getContext('2d');
    const g=ctx.createRadialGradient(cv.width/2,cv.height/2,cv.height*sp2,cv.width/2,cv.height/2,cv.height*.92);
    g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,`rgba(0,0,0,${str})`);
    ctx.fillStyle=g; ctx.fillRect(0,0,cv.width,cv.height);
  } else if (id === 'gls') {
    const cellSize={small:25,med:45,large:80}[c.size||'med']; const op={light:.3,med:.5,heavy:.72}[c.opacity||'med'];
    const cv=mkPreviewC('fx-back',op,'screen'); const ctx=cv.getContext('2d');
    const cs2=getComputedStyle(document.documentElement);
    const baseHues=['--primary','--secondary','--accent'].map(v=>{const hex=cs2.getPropertyValue(v).trim().replace('#','');const r=parseInt(hex.slice(0,2),16)/255,g2=parseInt(hex.slice(2,4),16)/255,b=parseInt(hex.slice(4,6),16)/255;const mx=Math.max(r,g2,b),mn=Math.min(r,g2,b),d=mx-mn;if(d===0)return 120;let h=0;if(mx===r)h=((g2-b)/d+(g2<b?6:0))/6;else if(mx===g2)h=((b-r)/d+2)/6;else h=((r-g2)/d+4)/6;return Math.round(h*360);});
    const cols=Math.ceil(cv.width/cellSize)+1; const rows=Math.ceil(cv.height/cellSize)+1;
    const cw=cv.width/cols; const ch=cv.height/rows; const jit=0.42;
    const pts=[]; for(let row=0;row<=rows;row++) for(let col=0;col<=cols;col++) pts.push({x:col*cw+(Math.random()-.5)*cw*jit*2,y:row*ch+(Math.random()-.5)*ch*jit*2});
    for(let row=0;row<rows;row++) for(let col=0;col<cols;col++){const i=row*(cols+1)+col;const tl=pts[i],tr=pts[i+1],bl=pts[i+(cols+1)],br=pts[i+(cols+2)];if(!tl||!tr||!bl||!br)continue;const hue=(baseHues[Math.floor(Math.random()*baseHues.length)]+(Math.random()-.5)*90+360)%360;const sat=35+Math.random()*50,lit=25+Math.random()*42,alpha=.5+Math.random()*.2;ctx.fillStyle=`hsla(${hue},${sat}%,${lit}%,${alpha.toFixed(2)})`;ctx.beginPath();ctx.moveTo(tl.x,tl.y);ctx.lineTo(tr.x,tr.y);ctx.lineTo(br.x,br.y);ctx.lineTo(bl.x,bl.y);ctx.closePath();ctx.fill();}
  } else if (id === 'crs') {
    const sp3={tight:4,med:7,wide:13}[c.spacing||'med']; const op2={light:.12,med:.22,heavy:.4}[c.opacity||'med'];
    const cv=mkPreviewC('fx-back',op2,null); const ctx=cv.getContext('2d'); const ang=Math.PI/4;
    ctx.strokeStyle='rgba(0,0,0,0.9)'; ctx.lineWidth=.6;
    for(let d=-cv.height*2;d<cv.width*2;d+=sp3){ctx.save();ctx.translate(cv.width/2,cv.height/2);ctx.rotate(ang);ctx.beginPath();ctx.moveTo(d,-cv.height*2);ctx.lineTo(d,cv.height*2);ctx.stroke();ctx.restore();}
    ctx.strokeStyle='rgba(0,0,0,0.5)';
    for(let d=-cv.height*2;d<cv.width*2;d+=sp3){ctx.save();ctx.translate(cv.width/2,cv.height/2);ctx.rotate(-ang);ctx.beginPath();ctx.moveTo(d,-cv.height*2);ctx.lineTo(d,cv.height*2);ctx.stroke();ctx.restore();}
  }
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
      if (fxb) fxb.style.zIndex = '9999';
      if (fxf) fxf.style.zIndex = '9999';
      if (pback) pback.style.zIndex = '20';
      if (pfore) pfore.style.zIndex = '25';
    } else if (layer === 'under') {
      if (fxb) fxb.style.zIndex = '1';
      if (fxf) fxf.style.zIndex = '1';
      if (pback) pback.style.zIndex = '0';
      if (pfore) pfore.style.zIndex = '0';
    } else {
      if (fxb) fxb.style.zIndex = '1';
      if (fxf) fxf.style.zIndex = '9999';
      if (pback) pback.style.zIndex = '0';
      if (pfore) pfore.style.zIndex = '25';
    }
  }
  const OVERLAYS = getOverlayFns();
  if (OVERLAYS[id]) OVERLAYS[id](cfg[id]||{});
}

function overlayTarget(layer) { return layer === 'over' ? 'fx-fore' : 'fx-back'; }

function mkFxC(target, op, blend) {
  const tbOpen = document.getElementById('themeBuilderWindow') &&
                 document.getElementById('themeBuilderWindow').classList.contains('open');
  function makeCanvas(parent, w, h) {
    if (!parent) return document.createElement('canvas');
    const c = document.createElement('canvas');
    c.width = w || window.innerWidth; c.height = h || window.innerHeight;
    let s = 'position:absolute;inset:0;width:100%;height:100%;';
    if (op != null) s += `opacity:${op};`; if (blend) s += `mix-blend-mode:${blend};`;
    c.style.cssText = s; parent.appendChild(c); return c;
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

function pxlInjectSingle(el) {
  if (getOverlayCfg().overlay !== 'pxl') return;
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  const old = el.querySelector('.pxl-inner'); if (old) { delete el.dataset.pxlDone; old.remove(); }
  const fxb = document.getElementById('fx-back'); const BIG = fxb && fxb.querySelector('canvas'); if (!BIG) return;
  const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
  const op = {light:.15,med:.3,heavy:.55}[(getOverlayCfg().pxl||{}).intensity||'med'];
  const bg = el.style.background || el.style.backgroundColor || getComputedStyle(el).backgroundColor;
  const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  const lum = m ? (parseInt(m[1])*0.299+parseInt(m[2])*0.587+parseInt(m[3])*0.114) : 128;
  const blend = lum > 180 ? 'multiply' : 'overlay';
  el.dataset.pxlDone = '1';
  const cv = document.createElement('canvas'); cv.className = 'pxl-inner';
  cv.width = Math.round(r.width); cv.height = Math.round(r.height);
  cv.style.cssText = `position:absolute;top:0;left:0;opacity:${op};mix-blend-mode:${blend};pointer-events:none;z-index:1;`;
  try { cv.getContext('2d').drawImage(BIG,r.left,r.top,r.width,r.height,0,0,cv.width,cv.height); el.appendChild(cv); } catch(e) {}
}

let _pxlPending = false;
function pxlReInject() {
  if (getOverlayCfg().overlay !== 'pxl') return;
  if (_pxlPending) return; // already queued
  _pxlPending = true;
  requestAnimationFrame(() => {
    _pxlPending = false;
    _pxlDoInject();
  });
}
function _pxlDoInject() {
  if (getOverlayCfg().overlay !== 'pxl') return;
  const cfg = getOverlayCfg();
  const c = cfg.pxl || {};
  if ((c.layer || 'under') !== 'over') return; // under mode has no per-element canvases
  const fxb = document.getElementById('fx-back');
  const existingBig = fxb && fxb.querySelector('canvas');
  if (!existingBig) { applyOverlay(); return; }
  const ps = {small:3,med:5,large:8}[c.size||'med'];
  const op = {light:.15,med:.3,heavy:.55}[c.intensity||'med'];
  document.querySelectorAll('.pxl-inner').forEach(el => {
    const parent = el.parentElement;
    if (parent) delete parent.dataset.pxlDone;
    el.remove();
  });
  const roots = [document.getElementById('mainApp')];
  document.querySelectorAll('.data-window.open').forEach(w => roots.push(w));
  const headerTab = document.querySelector('.header-tab');
  if (headerTab) roots.push(headerTab);
  roots.forEach(root => { if (root) pxlInjectRoot(root, existingBig, ps, op); });
}

function pxlInjectRoot(root, BIG, ps, op) {
  const SKIP_TAGS = new Set(['input','select','textarea','img','svg','canvas','script','style','a']);
  const CONTAINER_EXCEPTIONS = new Set([
    'day-body','filter-card','label-card','header-tab',
    'nw-title-card','nw-color-card','dow-card','nw-footer',
    'totals-card','toggle-card','date-range-card','clear-card',
    'delete-card','clear-card-wrap','data-window-header'
  ]);
  Array.from(root.querySelectorAll('*')).forEach(el => {
    if (el.classList.contains('pxl-inner')) return;
    if (SKIP_TAGS.has(el.tagName.toLowerCase())) return;
    if (el.classList.contains('day-body-half')) return;
    if (el.classList.contains('filter-btn')) return;
    if (el.classList.contains('toggle-check')) return;
    if (el.dataset.dcRow) return;
    if (el.dataset.pxlDone) return;
    const cs = getComputedStyle(el);
    const bg = cs.backgroundColor;
    if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || r.width < 4 || r.height < 4) return;
    const isException = Array.from(el.classList).some(c => CONTAINER_EXCEPTIONS.has(c));
    if (!isException) {
      const hasChildBg = Array.from(el.children).some(child => {
        if (child.classList.contains('pxl-inner')) return false;
        if (child.classList.contains('day-body-half')) return false;
        const cbg = getComputedStyle(child).backgroundColor;
        return cbg && cbg !== 'rgba(0, 0, 0, 0)' && cbg !== 'transparent';
      });
      if (hasChildBg) return;
    }
    if (cs.position === 'static') el.style.position = 'relative';
    el.dataset.pxlDone = '1';
    const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    const lum = m ? (parseInt(m[1])*0.299 + parseInt(m[2])*0.587 + parseInt(m[3])*0.114) : 128;
    const blend = lum > 180 ? 'multiply' : 'overlay';
    const cv = document.createElement('canvas');
    cv.className = 'pxl-inner';
    cv.width  = Math.max(1, Math.round(r.width));
    cv.height = Math.max(1, Math.round(r.height));
    cv.style.cssText = `position:absolute;top:0;left:0;opacity:${op};mix-blend-mode:${blend};pointer-events:none;z-index:1;`;
    try { cv.getContext('2d').drawImage(BIG, r.left, r.top, r.width, r.height, 0, 0, cv.width, cv.height); } catch(e) { return; }
    el.appendChild(cv);
  });
}

const _crtColMap={green:'brightness(0.78) contrast(1.4) saturate(0) sepia(1) hue-rotate(80deg) brightness(1.1)',amber:'brightness(0.75) contrast(1.3) saturate(0) sepia(1) brightness(0.95)',blue:'brightness(0.82) contrast(1.35) saturate(0) sepia(1) hue-rotate(165deg) saturate(2) brightness(0.9)',white:'brightness(0.9) contrast(1.15) saturate(0) brightness(1.05)',red:'brightness(0.78) contrast(1.4) saturate(0) sepia(1) hue-rotate(320deg) saturate(1.5)',purple:'brightness(0.78) contrast(1.4) saturate(0) sepia(1) hue-rotate(250deg) saturate(1.8)',cyan:'brightness(0.8) contrast(1.35) saturate(0) sepia(1) hue-rotate(130deg) saturate(2.5)',orange:'brightness(0.78) contrast(1.3) saturate(0) sepia(1) hue-rotate(355deg) saturate(1.8)'};
const _crtTintMap={green:'rgba(0,255,60,0.10)',amber:'rgba(255,160,0,0.12)',blue:'rgba(0,140,255,0.14)',white:'rgba(255,255,255,0.06)',red:'rgba(255,40,0,0.14)',purple:'rgba(160,0,255,0.14)',cyan:'rgba(0,255,220,0.14)',orange:'rgba(255,120,0,0.14)'};
function getOverlayFns() { return {
  non: () => {},
  grn: (c) => {
    const op={low:.12,med:.22,high:.38}[c.intensity||'med']; const ps={fine:1,med:2,coarse:4}[c.size||'med'];
    const cv=mkFxC(overlayTarget(c.layer||'under'),op,null); const ctx=cv.getContext('2d'); const myGen=fxGen;
    function d(){if(fxGen!==myGen)return;const img=ctx.createImageData(cv.width,cv.height);for(let y=0;y<cv.height;y+=ps)for(let x=0;x<cv.width;x+=ps){const v=Math.random()*255;for(let dy=0;dy<ps;dy++)for(let dx=0;dx<ps;dx++){const i=((y+dy)*cv.width+(x+dx))*4;if(i<img.data.length-3){img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=Math.random()*65;}}}ctx.putImageData(img,0,0);requestAnimationFrame(d);}
    d();
  },
  crt: (c) => {
    const colMap=_crtColMap,tintMap=_crtTintMap;
    const col=c.color||'green'; const sp={light:4,med:3,heavy:2}[c.lines||'med'];
    const tbOpenNow=document.getElementById('themeBuilderWindow')&&document.getElementById('themeBuilderWindow').classList.contains('open');
    if(!tbOpenNow) document.body.style.filter=colMap[col];
    else{const demoEl=document.querySelector('.tb-demo-section');if(demoEl)demoEl.style.filter=colMap[col];}
    const tgt=overlayTarget(c.layer||'under');
    const realTgt=tbOpenNow?(tgt==='fx-back'?'tbPreviewFxBack':'tbPreviewFxFore'):tgt;
    const realFore=tbOpenNow?'tbPreviewFxFore':'fx-fore';
    const sl=document.createElement('div'); sl.style.cssText=`position:absolute;inset:0;background:repeating-linear-gradient(to bottom,transparent 0,transparent ${sp}px,rgba(0,0,0,0.45) ${sp}px,rgba(0,0,0,0.45) ${sp+1}px);`;
    const rtEl=document.getElementById(realTgt); if(rtEl)rtEl.appendChild(sl);
    const vg=document.createElement('div'); vg.style.cssText='position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 38%,rgba(0,0,0,0.92) 100%);';
    const rfEl=document.getElementById(realFore); if(rfEl)rfEl.appendChild(vg);
    const gt=document.createElement('div'); gt.style.cssText=`position:absolute;inset:0;background:${tintMap[col]};mix-blend-mode:screen;`; if(rfEl)rfEl.appendChild(gt);
    const wave=document.createElement('div'); wave.style.cssText=`position:absolute;left:0;right:0;height:45px;background:linear-gradient(to bottom,transparent,${tintMap[col]},transparent);`; if(rfEl)rfEl.appendChild(wave);
    const wrapH=tbOpenNow?(document.getElementById('tbPreviewFxBack')||{}).offsetHeight||200:window.innerHeight;
    let wy=0,b=0.78,bt=0.78; const crtGen=fxGen;
    fxIntervals.push(setInterval(()=>{if(fxGen!==crtGen)return;wy=(wy+2)%wrapH;wave.style.top=wy+'px';},16));
    fxIntervals.push(setInterval(()=>{if(fxGen!==crtGen)return;if(Math.random()<0.04)bt=0.68+Math.random()*0.18;b+=(bt-b)*0.06;if(!tbOpenNow)document.body.style.filter=colMap[col].replace(/brightness\([^)]+\)/,`brightness(${b.toFixed(3)})`);},16));
  },
  stt: (c) => {
    const op={low:.12,med:.2,high:.35}[c.intensity||'med']; const cv=mkFxC(overlayTarget(c.layer||'under'),op,null); const ctx=cv.getContext('2d'); const myGen=fxGen;
    function d(){if(fxGen!==myGen)return;const img=ctx.createImageData(cv.width,cv.height);for(let i=0;i<img.data.length;i+=4){const v=Math.random()*255;img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=175;}ctx.putImageData(img,0,0);requestAnimationFrame(d);}
    d();
    const delay={slow:1400,med:900,fast:350}[c.speed||'med'];
    fxIntervals.push(setInterval(()=>{if(fxGen!==myGen)return;if(Math.random()<0.06){cv.style.transition='opacity 0.25s';cv.style.opacity=''+(.35+Math.random()*.35);setTimeout(()=>cv.style.opacity=''+op,300+Math.random()*600);}},delay));
  },
  glc: (c) => {
    const tbOpenNow=document.getElementById('themeBuilderWindow')&&document.getElementById('themeBuilderWindow').classList.contains('open');
    const glitchTarget=tbOpenNow?document.querySelector('.tb-demo-section'):document.getElementById('mainApp');
    const appEl=glitchTarget; if(!appEl)return;
    const kids=()=>Array.from(appEl.children);
    const baseDelay=()=>Math.round({slow:600,med:280,fast:80}[c.speed||'med']+Math.random()*300);
    const maxSh={low:18,med:40,high:70}[c.intensity||'med']; const myGen=fxGen;
    function spawn(){if(fxGen!==myGen)return;const r=Math.random();
      if(r<.38){const els=kids();const start=Math.floor(Math.random()*els.length);const targets=els.slice(start,start+1+Math.floor(Math.random()*3));const sh=(Math.random()-.5)*maxSh*2;targets.forEach(el=>{el.style.transition='none';el.style.transform=`translateX(${sh}px)`;});setTimeout(()=>targets.forEach(el=>el.style.transform=''),20+Math.random()*60);}
      else if(r<.62){kids().forEach(el=>{el.style.transition='none';el.style.transform=`translateX(${(Math.random()-.5)*maxSh}px)`;});setTimeout(()=>kids().forEach(el=>el.style.transform=''),15+Math.random()*40);}
      else if(r<.8){const els=kids();const el=els[Math.floor(Math.random()*els.length)];if(el){el.style.filter='drop-shadow(3px 0 rgba(255,0,60,0.75)) drop-shadow(-3px 0 rgba(0,255,240,0.75))';setTimeout(()=>el.style.filter='',35+Math.random()*70);}}
      else{appEl.style.transition='none';appEl.style.transform=`translateY(${(Math.random()-.5)*maxSh*.18}px) translateX(${(Math.random()-.5)*maxSh*.12}px)`;setTimeout(()=>appEl.style.transform='',25);}
      fxIntervals.push(setTimeout(spawn,baseDelay()));}
    spawn();
  },
  prx: (c) => {
    const spd={slow:.12,med:.35,fast:.85}[c.speed||'med']; const n={sparse:30,med:70,dense:140}[c.density||'med'];
    const layer=c.layer||'mixed'; const t1=layer==='over'?'fx-fore':'fx-back'; const t3=layer==='under'?'fx-back':'fx-fore';
    [{t:t1,n,minSz:.5,maxSz:2,sp:spd*.2,op:.18},{t:t1,n:Math.round(n*.45),minSz:2,maxSz:4,sp:spd*.5,op:.28},{t:t3,n:Math.round(n*.15),minSz:4,maxSz:9,sp:spd*1.3,op:.4}].forEach(({t,n:cn,minSz,maxSz,sp,op})=>{
      const cv=mkFxC(t,op,null); const ctx=cv.getContext('2d');
      const pts=Array.from({length:cn},()=>({x:Math.random()*cv.width,y:Math.random()*cv.height,spd:sp*(0.8+Math.random()*.4),sz:minSz+Math.random()*(maxSz-minSz)}));
      const myGen=fxGen;
      function d(){if(fxGen!==myGen)return;ctx.clearRect(0,0,cv.width,cv.height);ctx.fillStyle='#fff';pts.forEach(p=>{p.y+=p.spd;if(p.y>cv.height)p.y=-p.sz;ctx.beginPath();ctx.arc(p.x,p.y,p.sz,0,Math.PI*2);ctx.fill();});requestAnimationFrame(d);}
      d();
    });
  },
  dtr: (c) => {
    const opMap={light:.2,med:.35,heavy:.55};
    const M8=[[0,48,12,60,3,51,15,63],[32,16,44,28,35,19,47,31],[8,56,4,52,11,59,7,55],[40,24,36,20,43,27,39,23],[2,50,14,62,1,49,13,61],[34,18,46,30,33,17,45,29],[10,58,6,54,9,57,5,53],[42,26,38,22,41,25,37,21]];
    const M4=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]]; const M2=[[0,2],[3,1]];
    const Msel={fine:M8,med:M4,coarse:M2}[c.size||'med']||M8; const Msz=Msel.length;
    const cv=mkFxC(overlayTarget(c.layer||'under'),opMap[c.intensity||'med'],null); const ctx=cv.getContext('2d');
    const img=ctx.createImageData(cv.width,cv.height);
    for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++){const t=Msel[y%Msz][x%Msz]/(Msz*Msz);const v=t>.5?255:0;const i=(y*cv.width+x)*4;img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=80;}
    ctx.putImageData(img,0,0);
  },
  pxl: (c) => {
    const ps={small:3,med:5,large:8}[c.size||'med']; const op={light:.15,med:.3,heavy:.55}[c.intensity||'med'];
    const layer = c.layer || 'under';
    const BIG=document.createElement('canvas'); BIG.width=window.screen.width; BIG.height=window.screen.height;
    const bctx=BIG.getContext('2d');
    for(let y=0;y<BIG.height;y+=ps)for(let x=0;x<BIG.width;x+=ps){const v=Math.floor(Math.random()*256);bctx.fillStyle=`rgb(${v},${v},${v})`;bctx.fillRect(x,y,ps,ps);}

    if (layer === 'over') {
      const roots=[document.getElementById('mainApp')];
      document.querySelectorAll('.data-window.open').forEach(w=>roots.push(w));
      const headerTab=document.querySelector('.header-tab'); if(headerTab)roots.push(headerTab);
      roots.forEach(root=>{if(!root)return;pxlInjectRoot(root,BIG,ps,op);});
    } else {
      const fxb=document.getElementById('fx-back');
      if(fxb){const bgCv=document.createElement('canvas');bgCv.width=BIG.width;bgCv.height=BIG.height;bgCv.style.cssText=`position:absolute;top:0;left:0;opacity:${op};mix-blend-mode:overlay;`;bgCv.getContext('2d').drawImage(BIG,0,0);fxb.appendChild(bgCv);}
    }
  },
  vgn: (c) => {
    const str={light:.5,med:.72,heavy:.9}[c.strength||'med']; const sp={tight:.12,med:.22,wide:.35}[c.spread||'med'];
    const cv=mkFxC(overlayTarget(c.layer||'over'),1,null); const ctx=cv.getContext('2d');
    const g=ctx.createRadialGradient(cv.width/2,cv.height/2,cv.height*sp,cv.width/2,cv.height/2,cv.height*.92);
    g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,`rgba(0,0,0,${str})`);
    ctx.fillStyle=g; ctx.fillRect(0,0,cv.width,cv.height);
  },
  gls: (c) => {
    const cellSize={small:25,med:45,large:80}[c.size||'med']; const op={light:.3,med:.5,heavy:.72}[c.opacity||'med'];
    const cv=mkFxC(overlayTarget(c.layer||'under'),op,'screen'); const ctx=cv.getContext('2d');
    const cs2=getComputedStyle(document.documentElement);
    const baseHues=['--primary','--secondary','--accent'].map(v=>{const hex=cs2.getPropertyValue(v).trim().replace('#','');const r=parseInt(hex.slice(0,2),16)/255,g=parseInt(hex.slice(2,4),16)/255,b=parseInt(hex.slice(4,6),16)/255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;if(d===0)return 120;let h=0;if(max===r)h=((g-b)/d+(g<b?6:0))/6;else if(max===g)h=((b-r)/d+2)/6;else h=((r-g)/d+4)/6;return Math.round(h*360);});
    const cols=Math.ceil(cv.width/cellSize)+1; const rows=Math.ceil(cv.height/cellSize)+1;
    const cw=cv.width/cols; const ch=cv.height/rows; const jit=0.42;
    const pts=[]; for(let row=0;row<=rows;row++) for(let col=0;col<=cols;col++) pts.push({x:col*cw+(Math.random()-.5)*cw*jit*2,y:row*ch+(Math.random()-.5)*ch*jit*2});
    for(let row=0;row<rows;row++) for(let col=0;col<cols;col++){const i=row*(cols+1)+col;const tl=pts[i],tr=pts[i+1],bl=pts[i+(cols+1)],br=pts[i+(cols+2)];if(!tl||!tr||!bl||!br)continue;const hue=(baseHues[Math.floor(Math.random()*baseHues.length)]+(Math.random()-.5)*90+360)%360;const sat=35+Math.random()*50,lit=25+Math.random()*42,alpha=.5+Math.random()*.2;ctx.fillStyle=`hsla(${hue},${sat}%,${lit}%,${alpha.toFixed(2)})`;ctx.beginPath();ctx.moveTo(tl.x,tl.y);ctx.lineTo(tr.x,tr.y);ctx.lineTo(br.x,br.y);ctx.lineTo(bl.x,bl.y);ctx.closePath();ctx.fill();}
  },
  crs: (c) => {
    const sp={tight:4,med:7,wide:13}[c.spacing||'med']; const op={light:.12,med:.22,heavy:.4}[c.opacity||'med'];
    const cv=mkFxC(overlayTarget(c.layer||'under'),op,null); const ctx=cv.getContext('2d'); const ang=Math.PI/4;
    ctx.strokeStyle='rgba(0,0,0,0.9)'; ctx.lineWidth=.6;
    for(let d=-cv.height*2;d<cv.width*2;d+=sp){ctx.save();ctx.translate(cv.width/2,cv.height/2);ctx.rotate(ang);ctx.beginPath();ctx.moveTo(d,-cv.height*2);ctx.lineTo(d,cv.height*2);ctx.stroke();ctx.restore();}
    ctx.strokeStyle='rgba(0,0,0,0.5)';
    for(let d=-cv.height*2;d<cv.width*2;d+=sp){ctx.save();ctx.translate(cv.width/2,cv.height/2);ctx.rotate(-ang);ctx.beginPath();ctx.moveTo(d,-cv.height*2);ctx.lineTo(d,cv.height*2);ctx.stroke();ctx.restore();}
  },
}; }

function setTheme(id) { setOverlay(id); }
function applyTheme() { applyOverlay(); }
