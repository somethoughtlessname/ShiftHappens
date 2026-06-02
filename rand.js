// rand.js -- Randomize Tab for Theme Builder
// Loaded separately to keep theme.js under 100KB

// -- INJECT CSS ---------------------------------------------------------------
(function () {
  var s = document.createElement('style');
  s.textContent = `
  .tb-rand-chip {
    flex: 1; cursor: pointer; position: relative;
    border-right: var(--border-width) solid var(--border-color);
    display: flex; align-items: center; justify-content: center;
    height: var(--job-half); font-size: 8px; font-weight: 900;
    color: var(--text-mid); background: var(--bg-2);
    letter-spacing: 0.06em; text-transform: uppercase;
  }
  .tb-rand-chip:last-child { border-right: none; }
  .tb-rc-hdr {
    display: flex; align-items: center; justify-content: space-between;
    background: var(--bg-3);
    border-bottom: var(--border-width) solid var(--border-color);
    height: var(--job-half); padding: 0 8px;
  }
  .tb-rc-lbl {
    font-size: var(--text-xs); font-weight: 900;
    letter-spacing: var(--ls-wider); text-transform: uppercase;
    color: var(--text-mid);
  }
  .tb-rc-val {
    font-size: var(--text-xs); font-weight: 700;
    text-transform: uppercase; color: var(--text-mid);
  }
  .tb-rc-card {
    border: var(--border-width) solid var(--border-color);
    border-radius: var(--radius); overflow: hidden;
  }
  .tb-rc-chips { display: flex; flex-wrap: wrap; }
  .tb-rslider {
    flex: 1; min-width: 0; height: 100%;
    appearance: none; -webkit-appearance: none;
    outline: none; border: none; cursor: pointer; padding: 0 6px;
  }
  .tb-rc-primary {
    height: var(--job-half);
    display: flex; align-items: center; justify-content: center;
    font-size: var(--text-xs); font-weight: 900;
    letter-spacing: var(--ls-wider); text-transform: uppercase;
  }
  .tb-rc-btns {
    display: flex;
    border: var(--border-width) solid var(--border-color);
    border-radius: var(--radius); overflow: hidden;
  }
  .tb-rc-btn {
    flex: 1;
    height: calc(var(--job-half) + var(--border-width) * 2);
    display: flex; align-items: center; justify-content: center;
    font-size: var(--text-xs); font-weight: 900;
    letter-spacing: var(--ls-wider); text-transform: uppercase;
    cursor: pointer;
  }
  .tb-rc-slider-wrap {
    border: var(--border-width) solid var(--border-color);
    border-radius: var(--radius); overflow: hidden; display: flex;
    height: calc(var(--job-half) + var(--border-width) * 2);
  }
  `;
  document.head.appendChild(s);
})();


// -- COLOR MATH ---------------------------------------------------------------
function _rHsl(h, s, l) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r, g, b;
  if      (h < 60)  { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  return '#' + [r, g, b].map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
}

function _rHexToHsl(hex) {
  const r = parseInt(hex.slice(1,3), 16) / 255;
  const g = parseInt(hex.slice(3,5), 16) / 255;
  const b = parseInt(hex.slice(5,7), 16) / 255;
  const mx = Math.max(r,g,b), mn = Math.min(r,g,b);
  const l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, Math.round(l * 100)];
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let hh = mx === r ? (g - b) / d + (g < b ? 6 : 0)
         : mx === g ? (b - r) / d + 2
         : (r - g) / d + 4;
  return [Math.round(hh / 6 * 360), Math.round(s * 100), Math.round(l * 100)];
}

function _rLum(hex) {
  const cv = (o) => {
    const v = parseInt(hex.slice(o, o+2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * cv(1) + 0.7152 * cv(3) + 0.0722 * cv(5);
}

function _rRatio(a, b) {
  const la = _rLum(a), lb = _rLum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function _rRnd(a, b)  { return a + Math.random() * (b - a); }
function _rPick(arr)  { return arr[Math.floor(Math.random() * arr.length)]; }
function _rGv(id, df) { return +((document.getElementById(id) || { value: df }).value); }
function _rClamp(v)   { return Math.max(5, Math.min(95, v)); }


// -- STATE --------------------------------------------------------------------
var _rBgSel   = 'random';
var _rHarmSel = 'random';
var _rSurfSel = 'random';
var _rToneSel = 'mix';

window._rBgDescs = {
  'random':        'Picks a background strategy randomly each time',
  'primary-dark':  'Background uses a dark shade of the primary hue',
  'complement':    'Background hue sits opposite primary on the wheel',
  'analogous':     'Background hue sits adjacent to primary, harmonious',
  'contrast90':    'Background hue is 90 degrees away from primary',
  'warm-neutral':  'Background is a warm neutral tone, unrelated to primary',
  'cool-neutral':  'Background is a cool neutral tone, unrelated to primary',
  'true-grey':     'Background is a near-zero saturation grey tone',
  'earthy':        'Background uses a warm earthy brown-orange hue',
  'triadic-bg':    'Background hue is the triadic partner of primary',
  'split-bg':      'Background uses the split complement of primary hue',
  'secondary-bg':  'Background hue sits close to secondary action color',
};
window._rHarmDescs = {
  'random':        'Picks a color harmony scheme randomly each time',
  'complementary': 'Secondary and accent are opposite primary on the wheel',
  'analogous':     'Colors sit adjacent to each other, calm and cohesive',
  'triadic':       'Three colors equally spaced, vibrant and balanced',
  'tetradic':      'Four colors in a rectangle, rich color variety',
  'split':         'Primary plus two colors flanking its complement',
  'accented':      'Analogous pair with a distant accent for contrast',
  'fibonacci':     'Colors spaced by the golden angle, naturally varied',
  'monochromatic': 'Single hue at different lightness and saturation',
  'double-comp':   'Two complementary pairs, maximum contrast variety',
  'near-comp':     'Colors near the complement, softer than full opposite',
  'rectangle':     'Four colors at 60 and 180 degree intervals',
};
window._rSurfDescs = {
  'random':           'Picks a surface color strategy randomly each time',
  'white':            'Pure white surface for maximum contrast and clarity',
  'off-white':        'Slightly tinted white, softer than pure white',
  'light primary':    'Washed-out tint of primary hue, light and subtle',
  'dark primary':     'Deep shade of primary hue, bold surface contrast',
  'light secondary':  'Washed-out tint of secondary hue for soft variety',
  'dark secondary':   'Deep shade of secondary hue, rich surface tone',
  'light accent':     'Washed-out tint of accent hue, gentle highlight',
  'dark accent':      'Deep shade of accent hue for bold surface tone',
  'tinted neutral':   'Neutral bg hue at medium-light lightness, subtle',
  'light complement': 'Washed complement hue, contrasts primary gently',
  'pure grey':        'Zero saturation grey surface, completely neutral',
  '4th harmony':      'A fourth color stepped further around the wheel',
};
window._rToneDescs = {
  'mix':   'Picks dark, mid, or light tone randomly each time',
  'dark':  'Deep dark backgrounds, vivid action colors stand out',
  'mid':   'Medium depth backgrounds, balanced contrast throughout',
  'light': 'Pale light backgrounds, action colors provide contrast',
};


// -- CHIP SELECTION -----------------------------------------------------------
function _rSelectChip(groupId, el, labelId) {
  document.querySelectorAll('#' + groupId + ' .tb-rand-chip').forEach(c => {
    c.style.background = '';
    c.style.color = '';
  });
  el.style.background = 'var(--primary)';
  el.style.color = 'var(--text-light)';
  const lbl = document.getElementById(labelId);
  if (lbl) lbl.textContent = el.dataset.val;
}

window.tbRandSetBg = (v, el) => {
  _rBgSel = v;
  _rSelectChip('tbRandBgChips', el, 'tbRandBgLabel');
  const desc = document.getElementById('tbRandBgDesc');
  if (desc && window._rBgDescs) desc.textContent = window._rBgDescs[v] || '';
};
window.tbRandSetHarm = (v, el) => {
  _rHarmSel = v; _rSelectChip('tbRandHarmChips', el, 'tbRandHarmLabel');
  const d = document.getElementById('tbRandHarmDesc');
  if (d && window._rHarmDescs) d.textContent = window._rHarmDescs[v] || '';
};
window.tbRandSetSurf = (v, el) => {
  _rSurfSel = v; _rSelectChip('tbRandSurfChips', el, 'tbRandSurfLabel');
  const d = document.getElementById('tbRandSurfDesc');
  if (d && window._rSurfDescs) d.textContent = window._rSurfDescs[v] || '';
};
window.tbRandSetTone = (v, el) => {
  _rToneSel = v; _rSelectChip('tbRandToneChips', el, 'tbRandToneLabel');
  const d = document.getElementById('tbRandToneDesc');
  if (d && window._rToneDescs) d.textContent = window._rToneDescs[v] || '';
};


// -- PRIMARY CARD -------------------------------------------------------------
function _rGetPrimary() {
  return _rHsl(_rGv('tbHueS', 140), _rGv('tbSatS', 65) || 1, _rGv('tbBriS', 48) || 1);
}

function _rUpdatePrimaryCard() {
  const hex = _rGetPrimary();
  const el  = document.getElementById('tbRandPrimary');
  if (!el) return;
  el.style.background = hex;
  el.style.color = _rLum(hex) > 0.25 ? '#111' : '#f2f2f2';
  el.textContent = hex.toUpperCase();
}


// -- HARMONY OFFSETS ----------------------------------------------------------
// Each scheme is a function so mini branches can randomize within the scheme's spirit
function _rHarmOffsets(scheme) {
  switch (scheme) {
    case 'complementary': {
      // Mini branch: pure opposite + near-opposite, or opposite + split near
      const v = _rPick(['classic','near-split','wide-split']);
      return v === 'classic'     ? [180, 210]
           : v === 'near-split'  ? [180, 155]
           :                       [180, 140];
    }
    case 'analogous': {
      // Mini branch: tight (20/40), standard (30/60), wide (45/75)
      const v = _rPick(['tight','standard','wide']);
      return v === 'tight'    ? [20,  40]
           : v === 'standard' ? [30,  60]
           :                    [45,  75];
    }
    case 'triadic': {
      // Mini branch: equal triangle (120/240) or shifted triadic
      const v = _rPick(['equal','warm-shift','cool-shift']);
      return v === 'equal'      ? [120, 240]
           : v === 'warm-shift' ? [110, 230]
           :                      [130, 250];
    }
    case 'tetradic': {
      // Mini branch: square (90/270), wide rectangle (60/240), narrow rectangle (30/210)
      const v = _rPick(['square','wide-rect','narrow-rect']);
      return v === 'square'      ? [90,  270]
           : v === 'wide-rect'   ? [60,  240]
           :                       [30,  210];
    }
    case 'split': {
      // Mini branch: standard split (150/210), tight split (160/200), wide split (140/220)
      const v = _rPick(['standard','tight','wide']);
      return v === 'standard' ? [150, 210]
           : v === 'tight'    ? [160, 200]
           :                    [140, 220];
    }
    case 'accented': {
      // Mini branch: accent far (20/150), accent very far (15/180), accent close (25/120)
      const v = _rPick(['far','very-far','close']);
      return v === 'far'      ? [20,  150]
           : v === 'very-far' ? [15,  180]
           :                    [25,  120];
    }
    case 'fibonacci': {
      // Mini branch: forward spiral, reverse spiral, double step
      const v = _rPick(['forward','reverse','double']);
      return v === 'forward' ? [137.508, 275.016]
           : v === 'reverse' ? [222.492, 84.984]
           :                   [137.508, 137.508 * 3 % 360];
    }
    case 'monochromatic': {
      // Mini branch: same hue (pure mono), very slight warm drift, very slight cool drift
      const v = _rPick(['pure','warm-drift','cool-drift']);
      return v === 'pure'       ? [0,   0]
           : v === 'warm-drift' ? [8,   15]
           :                      [-8, -15];
    }
    case 'double-comp': {
      // Mini branch: 180+90, 180+60, 180+120
      const v = _rPick(['square','close','far']);
      return v === 'square' ? [180, 90]
           : v === 'close'  ? [180, 60]
           :                  [180, 120];
    }
    case 'near-comp': {
      // Mini branch: slight offset from complement (160/200), medium (150/210), large (140/220)
      const v = _rPick(['slight','medium','large']);
      return v === 'slight' ? [160, 200]
           : v === 'medium' ? [150, 210]
           :                  [140, 220];
    }
    case 'rectangle': {
      // Mini branch: standard (60/180), wide (80/180), narrow (40/180)
      const v = _rPick(['standard','wide','narrow']);
      return v === 'standard' ? [60,  180]
           : v === 'wide'     ? [80,  180]
           :                    [40,  180];
    }
    default: return [180, 150];
  }
}

const _rBgStrategies = {
  // Primary hue darkened  - mini branch: lighter dark, medium dark, very dark
  'primary-dark': h => {
    const shade = _rPick(['light-dark','mid-dark','deep-dark']);
    const bgS = shade === 'light-dark' ? _rRnd(10,18) : shade === 'mid-dark' ? _rRnd(18,28) : _rRnd(28,40);
    return { bgH: h, bgS };
  },

  // Complement  - mini branch: exact opposite, slightly warm offset, slightly cool offset
  'complement': h => {
    const variant = _rPick(['exact','warm-shift','cool-shift']);
    const offset  = variant === 'exact' ? 180 : variant === 'warm-shift' ? 170 : 190;
    return { bgH: (h + offset + _rRnd(-6, 6)) % 360, bgS: _rRnd(7, 16) };
  },

  // Analogous  - mini branch: warm side (+), cool side (-), wide angle (+-45)
  'analogous': h => {
    const side = _rPick(['warm','cool','wide-warm','wide-cool']);
    const angle = side === 'warm' ? 30 : side === 'cool' ? -30 : side === 'wide-warm' ? 45 : -45;
    return { bgH: (h + angle + _rRnd(-6, 6) + 360) % 360, bgS: _rRnd(7, 16) };
  },

  // 90deg contrast  - mini branch: clockwise 90, counter 90, or 270 (same as -90)
  'contrast90': h => {
    const dir = _rPick(['cw90','ccw90','cw270']);
    const angle = dir === 'cw90' ? 90 : dir === 'ccw90' ? -90 : 270;
    return { bgH: (h + angle + _rRnd(-8, 8) + 360) % 360, bgS: _rRnd(5, 14) };
  },

  // Warm neutral  - fixed hue family, no primary dependency
  'warm-neutral': h => ({ bgH: _rPick([20, 25, 30, 35, 38]), bgS: _rRnd(7, 16) }),

  // Cool neutral  - fixed hue family, no primary dependency
  'cool-neutral': h => ({ bgH: _rPick([195, 200, 205, 210, 220]), bgS: _rRnd(7, 16) }),

  // True grey  - mini branch: pure zero sat, or barely warm, or barely cool tint
  'true-grey': h => {
    const tint = _rPick(['pure','warm-tint','cool-tint']);
    return { bgH: tint === 'warm-tint' ? 30 : tint === 'cool-tint' ? 210 : 0, bgS: tint === 'pure' ? 0 : _rRnd(1, 4) };
  },

  // Earthy  - mini branch: red-earthy, orange-earthy, yellow-earthy
  'earthy': h => {
    const tone = _rPick(['red-earth','orange-earth','yellow-earth']);
    const bgH  = tone === 'red-earth' ? _rPick([10, 15, 18]) : tone === 'orange-earth' ? _rPick([22, 28, 32]) : _rPick([35, 40, 45]);
    return { bgH, bgS: _rRnd(10, 22) };
  },

  // Triadic bg  - mini branch: first triadic (+120) or second triadic (+240)
  'triadic-bg': h => {
    const which = _rPick(['first','second']);
    const angle = which === 'first' ? 120 : 240;
    return { bgH: (h + angle + _rRnd(-8, 8)) % 360, bgS: _rRnd(8, 16) };
  },

  // Split bg  - mini branch: left split (+150) or right split (+210)
  'split-bg': h => {
    const which = _rPick(['left','right']);
    const angle = which === 'left' ? 150 : 210;
    return { bgH: (h + angle + _rRnd(-8, 8)) % 360, bgS: _rRnd(8, 16) };
  },

  // Secondary bg  - mini branch: close neighbor (+30 to +45) or far neighbor (+315 to +330)
  'secondary-bg': h => {
    const which = _rPick(['near-warm','near-cool','far-warm','far-cool']);
    const angle = which === 'near-warm' ? _rRnd(25,45) : which === 'near-cool' ? _rRnd(-45,-25) : which === 'far-warm' ? _rRnd(315,335) : _rRnd(25,55);
    return { bgH: (h + angle + 360) % 360, bgS: _rRnd(10, 18) };
  },
};


// -- THEME ENGINE -------------------------------------------------------------
function _rMakeTheme(primaryHex, fixedPrimary) {
  const [h, s] = _rHexToHsl(primaryHex);
  const bri = fixedPrimary ? _rGv('tbBriS', 48) : Math.round(_rRnd(8, 60));
  const sat = fixedPrimary ? _rGv('tbSatS', 65) : Math.round(_rRnd(12, 88));
  const pS  = Math.min(sat, 95);

  // Tone
  const tone = _rToneSel === 'mix' ? _rPick(['dark', 'mid', 'light']) : _rToneSel;

  // Harmony
  const harmKeys   = Object.keys({complementary:1,analogous:1,triadic:1,tetradic:1,split:1,accented:1,fibonacci:1,monochromatic:1,'double-comp':1,'near-comp':1,rectangle:1});
  const schemeName = _rHarmSel === 'random' ? _rPick(harmKeys) : _rHarmSel;
  const offsets    = _rHarmOffsets(schemeName);
  const secH = (h + offsets[0] + _rRnd(-8, 8) + 360) % 360;
  const accH = schemeName === 'monochromatic' ? h : (h + offsets[1] + _rRnd(-8, 8) + 360) % 360;

  // Action colors
  const pri = fixedPrimary ? primaryHex : _rHsl(h, pS, _rClamp(bri));
  const sec = _rHsl(secH, Math.min(pS * 0.9, 88), _rClamp(bri));
  const acc = _rHsl(accH, Math.min(pS * 0.8, 80), _rClamp(bri));
  const c1  = _rHsl(355, 65, tone === 'dark' ? 48 : 44);

  // Background
  const bgKeys = Object.keys(_rBgStrategies);
  const bgKey  = _rBgSel === 'random' ? _rPick(bgKeys) : _rBgSel;
  const bgPick = (_rBgStrategies[bgKey] || _rBgStrategies.complement)(h);
  const bH     = bgKey === 'primary-dark' ? h : bgPick.bgH;
  const bS     = bgPick.bgS;
  const w      = () => _rRnd(-2, 2);

  let bg1, bg2, bg3;
  if (tone === 'dark') {
    bg1 = _rHsl(bH, bS, 12 + w()); bg2 = _rHsl(bH, bS, 20 + w()); bg3 = _rHsl(bH, bS, 7 + w());
  } else if (tone === 'mid') {
    bg1 = _rHsl(bH, bS, 26 + w()); bg2 = _rHsl(bH, bS, 34 + w()); bg3 = _rHsl(bH, bS, 18 + w());
  } else {
    bg1 = _rHsl(bH, bS, 93 + w()); bg2 = _rHsl(bH, bS, 85 + w()); bg3 = _rHsl(bH, bS, 77 + w());
  }

  // Text - find which candidate works best across action colors and bg surfaces
  const WHITE = '#f2f2f2', BLACK = '#111111';
  const actions = [pri, sec, acc];
  const surfaces = [bg1, bg2, bg3];
  const worstW_actions = Math.min(...actions.map(c => _rRatio(WHITE, c)));
  const worstB_actions = Math.min(...actions.map(c => _rRatio(BLACK, c)));
  const worstW_bg      = Math.min(...surfaces.map(c => _rRatio(WHITE, c)));
  const worstB_bg      = Math.min(...surfaces.map(c => _rRatio(BLACK, c)));
  // Score = min(action_contrast, bg_contrast)  - pick whichever has higher floor
  const scoreW = Math.min(worstW_actions, worstW_bg);
  const scoreB = Math.min(worstB_actions, worstB_bg);
  let tl = scoreW >= scoreB ? WHITE : BLACK;
  // bg3 is used directly as header/tab background with text-light  - must contrast
  if (_rRatio(tl, bg3) < 3) {
    tl = _rLum(bg3) > 0.3 ? BLACK : WHITE;
  }
  const tm = _rLum(bg2) > 0.3 ? _rHsl(bH, 20, 35) : _rHsl(bH, 12, 65);

  // Border
  const border = tone === 'light'
    ? _rPick(['#000000', _rHsl(bH, 15, 20), _rHsl(bH, 12, 28)])
    : _rPick([_rHsl(bH, Math.max(bS, 5), 4), '#000000']);

  // Surface (bg4)
  const surfaceNames = [
    'white', 'off-white', 'light primary', 'dark primary',
    'light secondary', 'dark secondary', 'light accent', 'tinted neutral',
    'light complement', 'pure grey', '4th harmony', 'dark accent',
  ];
  const surfaceFns = [
    // white - pure or near-pure
    () => ({ bg4: '#ffffff', td4: _rHsl(bH, bS + 4, 5) }),

    // off-white - mini branch: warm tint, cool tint, or neutral
    () => {
      const v = _rPick(['warm','cool','neutral']);
      const tH = v === 'warm' ? 30 : v === 'cool' ? 210 : bH;
      return { bg4: _rHsl(tH, v === 'neutral' ? bS + 4 : _rRnd(6, 12), _rRnd(93, 98)), td4: _rHsl(tH, 8, 5) };
    },

    // light primary - mini branch: very washed, moderately washed, or hinted
    () => {
      const v = _rPick(['very-washed','moderate','hinted']);
      const sat2 = v === 'very-washed' ? Math.min(pS * 0.3, 25) : v === 'moderate' ? Math.min(pS * 0.5, 40) : Math.min(pS * 0.15, 15);
      const lgt  = v === 'very-washed' ? _rRnd(91, 96) : v === 'moderate' ? _rRnd(87, 93) : _rRnd(93, 97);
      return { bg4: _rHsl(h, sat2, lgt), td4: _rHsl(h, pS * 0.6, 8) };
    },

    // dark primary - mini branch: deep, medium-deep, very deep
    () => {
      const v = _rPick(['deep','medium','very-deep']);
      const lgt = v === 'deep' ? _rRnd(22, 30) : v === 'medium' ? _rRnd(30, 40) : _rRnd(12, 22);
      return { bg4: _rHsl(h, Math.min(pS * 0.7, 60), lgt), td4: _rHsl(bH, 6, 92) };
    },

    // light secondary - mini branch: washed or hinted
    () => {
      const v = _rPick(['washed','hinted']);
      const sat2 = v === 'washed' ? Math.min(pS * 0.5, 40) : Math.min(pS * 0.2, 18);
      return { bg4: _rHsl(secH, sat2, _rRnd(86, 94)), td4: _rHsl(secH, pS * 0.5, 8) };
    },

    // dark secondary - mini branch: deep or medium
    () => {
      const v = _rPick(['deep','medium']);
      const lgt = v === 'deep' ? _rRnd(16, 26) : _rRnd(26, 36);
      return { bg4: _rHsl(secH, Math.min(pS * 0.7, 60), lgt), td4: _rHsl(bH, 6, 92) };
    },

    // light accent - mini branch: washed or hinted
    () => {
      const v = _rPick(['washed','hinted']);
      const sat2 = v === 'washed' ? Math.min(pS * 0.4, 35) : Math.min(pS * 0.18, 15);
      return { bg4: _rHsl(accH, sat2, _rRnd(88, 95)), td4: _rHsl(accH, pS * 0.5, 8) };
    },

    // tinted neutral - mini branch: bg hue tint, primary hue tint, or complement tint
    () => {
      const v = _rPick(['bg-tint','primary-tint','complement-tint']);
      const tH = v === 'primary-tint' ? h : v === 'complement-tint' ? (h + 180) % 360 : bH;
      return { bg4: _rHsl(tH, _rRnd(6, 14), _rRnd(78, 88)), td4: _rHsl(tH, bS, 8) };
    },

    // light complement - mini branch: washed, hinted, or medium
    () => {
      const v = _rPick(['washed','hinted','medium']);
      const sat2 = v === 'washed' ? Math.min(pS * 0.4, 35) : v === 'hinted' ? Math.min(pS * 0.2, 18) : Math.min(pS * 0.55, 48);
      const lgt  = v === 'medium' ? _rRnd(80, 88) : _rRnd(86, 94);
      return { bg4: _rHsl((h + 180) % 360, sat2, lgt), td4: _rHsl((h + 180) % 360, pS * 0.5, 8) };
    },

    // pure grey - mini branch: true zero, barely warm, barely cool (no primary influence)
    () => {
      const v = _rPick(['pure','warm-ghost','cool-ghost']);
      return { bg4: _rHsl(v === 'warm-ghost' ? 28 : v === 'cool-ghost' ? 208 : 0, v === 'pure' ? 0 : _rRnd(1, 3), _rRnd(90, 96)), td4: _rHsl(0, 0, 8) };
    },

    // 4th harmony - uses next step around wheel from accent
    () => {
      const q = (h + offsets[1] * 1.5 + 360) % 360;
      const c = _rHsl(q, Math.min(pS * 0.55, 50), 48);
      return { bg4: c, td4: _rLum(c) > 0.35 ? _rHsl(q, 20, 8) : _rHsl(q, 8, 94) };
    },

    // dark accent - mini branch: deep or medium
    () => {
      const v = _rPick(['deep','medium']);
      const lgt = v === 'deep' ? _rRnd(16, 26) : _rRnd(26, 36);
      return { bg4: _rHsl(accH, Math.min(pS * 0.7, 60), lgt), td4: _rHsl(bH, 6, 92) };
    },
  ];

  const surfIdx = _rSurfSel === 'random'
    ? Math.floor(Math.random() * surfaceFns.length) % surfaceFns.length
    : Math.max(0, Math.min(surfaceNames.indexOf(_rSurfSel), surfaceFns.length - 1));
  let { bg4, td4 } = surfaceFns[surfIdx]();
  if (!bg4) { bg4 = '#ffffff'; td4 = '#000000'; } // safety fallback
  if (_rRatio(td4, bg4) < 4) td4 = _rLum(bg4) > 0.5 ? _rHsl(bH, bS, 4) : _rHsl(bH, 6, 92);

  // Swatches
  const sw = [0, ...offsets, 60, 90, 120, 150, 180, 210, 270]
    .slice(0, 10)
    .map(o => _rHsl((h + o + 360) % 360, Math.min(sat * 0.9, 82), bri));

  return {
    bg1, bg2, bg3, bg4, pri, sec, acc, c1,
    border, tl, tm, td: td4, sw,
    _schemeName: schemeName,
    _bgKey:      bgKey,
    _surfName:   surfaceNames[surfIdx],
    _tone:       tone,
  };
}


// -- APPLY THEME --------------------------------------------------------------
function _rApplyTheme(t) {
  const bc = {
    bg1: t.bg1, bg2: t.bg2, bg3: t.bg3, bg4: t.bg4,
    primary: t.pri, secondary: t.sec, accent: t.acc, color1: t.c1,
    muted: t.tm, border: t.border,
    textLight: t.tl, textMid: t.tm,
    textDark: _rLum(t.bg4) > 0.35 ? '#0a0a0a' : '#f0f0f0',
  };
  const jc = {};
  t.sw.forEach((c, i) => { jc['swatch' + (i + 1)] = c; });

  ThemeSystem.baseColors = Object.assign({}, ThemeSystem.baseColors, bc);
  ThemeSystem.jobColors  = Object.assign({}, ThemeSystem.jobColors, jc);
  tbApplyCssVars(ThemeSystem.baseColors, ThemeSystem.jobColors);
  ThemeSystem.renderBaseSwatches();
  ThemeSystem.renderJobSwatches();

  // Highlight used/selected choices in each chip group
  const pairs = [
    { group: 'tbRandBgChips',   sel: _rBgSel,   used: t._bgKey,      lbl: 'tbRandBgLabel'   },
    { group: 'tbRandHarmChips', sel: _rHarmSel,  used: t._schemeName, lbl: 'tbRandHarmLabel' },
    { group: 'tbRandSurfChips', sel: _rSurfSel,  used: t._surfName,   lbl: 'tbRandSurfLabel' },
    { group: 'tbRandToneChips', sel: _rToneSel,  used: t._tone,       lbl: 'tbRandToneLabel' },
  ];
  // Update bg footer to show used strategy description
  [
    ['tbRandBgDesc',   window._rBgDescs,   _rBgSel,   t._bgKey],
    ['tbRandHarmDesc', window._rHarmDescs, _rHarmSel, t._schemeName],
    ['tbRandSurfDesc', window._rSurfDescs, _rSurfSel, t._surfName],
    ['tbRandToneDesc', window._rToneDescs, _rToneSel, t._tone],
  ].forEach(([elId, descs, sel, used]) => {
    const el = document.getElementById(elId);
    if (!el || !descs) return;
    const key = (sel === 'random' || sel === 'mix') ? used : sel;
    el.textContent = descs[key] || '';
  });
  pairs.forEach(({ group, sel, used, lbl }) => {
    const isRandom = sel === 'random' || sel === 'mix';
    document.querySelectorAll('#' + group + ' .tb-rand-chip').forEach(c => {
      c.style.background = '';
      c.style.color = '';
      const val = c.dataset.val;
      const isRndChip = val === 'random' || val === 'mix';
      if (isRandom) {
        if (isRndChip) {
          // RND chip always stays primary when random mode is active
          c.style.background = t.pri;
          c.style.color = t.tl;
        } else if (used && val === used) {
          // actually chosen option highlighted in secondary
          c.style.background = t.sec;
          c.style.color = t.tl;
        }
      } else if (!isRandom && sel && val === sel) {
        c.style.background = t.pri;
        c.style.color = t.tl;
      }
    });
  });
}


// -- PUBLIC ACTIONS -----------------------------------------------------------
window.tbRandRandom = function () {
  const randHue = Math.floor(Math.random() * 360);
  const randBri = Math.round(_rRnd(8, 60));
  const randSat = Math.round(_rRnd(12, 88));
  const hu = document.getElementById('tbHueS');
  const br = document.getElementById('tbBriS');
  const sa = document.getElementById('tbSatS');
  if (hu) hu.value = randHue;
  if (br) br.value = randBri;
  if (sa) sa.value = randSat;
  _rUpdatePrimaryCard();
  const t = _rMakeTheme(_rHsl(randHue, randSat, randBri), true);
  _rApplyTheme(t);
};

window.tbRandApply = function () {
  const t = _rMakeTheme(_rGetPrimary(), true);
  _rApplyTheme(t);
};


// -- SETTINGS TAB ACTIONS -----------------------------------------------------
var _rPreRandColors = null; // snapshot of theme before first random

window.tbRandFromSettings = function () {
  // Enable reset button on first call
  if (!_rPreRandColors) {
    _rPreRandColors = true; // just a flag — reset reads from localStorage
    const btn = document.getElementById('tbRandResetBtn');
    if (btn) {
      btn.style.pointerEvents = 'auto';
    }
  }
  tbRandRandom();
};

window.tbRandReset = function () {
  if (!_rPreRandColors) return;
  // Reload the last properly saved/loaded theme from localStorage
  const savedName = localStorage.getItem('shift_current_theme');
  if (savedName) {
    const themes = JSON.parse(localStorage.getItem('shift_themes') || '[]');
    const theme  = themes.find(t => t.name === savedName);
    if (theme) {
      ThemeSystem.baseColors = Object.assign({}, TB_DEFAULTS.baseColors, theme.baseColors);
      ThemeSystem.jobColors  = Object.assign({}, TB_DEFAULTS.jobColors,  theme.jobColors);
      tbApplyCssVars(ThemeSystem.baseColors, ThemeSystem.jobColors);
      tbRerender();
    }
  }
  // Lock reset again
  _rPreRandColors = null;
  const btn = document.getElementById('tbRandResetBtn');
  if (btn) {
    btn.style.pointerEvents = 'none';
  }
};


function _rInitChips() {
  ['tbRandBgChips', 'tbRandHarmChips', 'tbRandSurfChips', 'tbRandToneChips'].forEach(id => {
    const chips = document.querySelectorAll('#' + id + ' .tb-rand-chip');
    chips.forEach(c => { c.style.background = ''; c.style.color = ''; });
    if (chips[0]) {
      chips[0].style.background = 'var(--primary)';
      chips[0].style.color = 'var(--text-light)';
    }
  });
}


// -- INJECT PANEL HTML --------------------------------------------------------
window.addEventListener('load', function () {
  setTimeout(function () {
    const slot = document.getElementById('tbRandPanelSlot');
    if (!slot) return;

    const BD = 'var(--border-width) solid var(--border-color)';
    const R  = 'var(--radius)';

    function chipRow(id, labelText, labelId, fn, items) {
      const chips = items.map(([val, txt]) =>
        `<div class="tb-rand-chip" onclick="${fn}('${val}',this)" data-val="${val}">${txt}</div>`
      ).join('');
      return `<div class="tb-rc-card">
        <div class="tb-rc-hdr">
          <div class="tb-rc-lbl">${labelText}</div>
          <div class="tb-rc-val" id="${labelId}">Random</div>
        </div>
        <div class="tb-rc-chips" id="${id}">${chips}</div>
      </div>`;
    }

    const sliders = `<div class="tb-rc-slider-wrap">
      <input type="range" id="tbHueS" min="0" max="359" value="140" class="tb-rslider"
        style="background:linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00);border-right:${BD}">
      <input type="range" id="tbBriS" min="0" max="100" value="48" class="tb-rslider"
        style="background:linear-gradient(to right,#000,#fff);border-right:${BD}">
      <input type="range" id="tbSatS" min="0" max="100" value="65" class="tb-rslider"
        style="background:linear-gradient(to right,#888,#f4f)">
    </div>`;

    const primaryCard = `<div class="tb-rc-card" onclick="tbRandApply()" style="cursor:pointer">
      <div id="tbRandPrimary" class="tb-rc-primary">#48A971</div>
      <div style="background:var(--primary);border-top:var(--border-width) solid var(--border-color);padding:8px;text-align:center;font-size:var(--text-xs);font-weight:900;letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--text-light)">
        Tap to Randomize Using This as the Primary Color
      </div>
    </div>`;

    function chipRowWithFooter(id, labelText, labelId, fn, items, footerId, descObj) {
      const chips = items.map(([val, txt]) =>
        `<div class="tb-rand-chip" onclick="${fn}('${val}',this)" data-val="${val}">${txt}</div>`
      ).join('');
      return `<div class="tb-rc-card">
        <div class="tb-rc-hdr">
          <div class="tb-rc-lbl">${labelText}</div>
          <div class="tb-rc-val" id="${labelId}">Random</div>
        </div>
        <div class="tb-rc-chips" id="${id}">${chips}</div>
        <div id="${footerId}" style="background:var(--bg-3);border-top:var(--border-width) solid var(--border-color);padding:4px 8px;font-size:var(--text-xs);font-weight:700;letter-spacing:0.04em;color:var(--text-mid);min-height:var(--job-half);display:flex;align-items:center;justify-content:center;text-align:center">${(descObj && descObj['random']) || ''}</div>
      </div>`;
    }

    const bgChips = chipRowWithFooter('tbRandBgChips', 'Background', 'tbRandBgLabel', 'tbRandSetBg', [
      ['random','RND'], ['primary-dark','PRI'], ['complement','COM'], ['analogous','ANA'],
      ['contrast90','90D'], ['warm-neutral','WRM'], ['cool-neutral','COL'], ['true-grey','GRY'],
      ['earthy','ETH'], ['triadic-bg','TRI'], ['split-bg','SPL'], ['secondary-bg','SEC'],
    ], 'tbRandBgDesc', window._rBgDescs);

    const harmChips = chipRowWithFooter('tbRandHarmChips', 'Harmony', 'tbRandHarmLabel', 'tbRandSetHarm', [
      ['random','RND'], ['complementary','COM'], ['analogous','ANA'], ['triadic','TRI'],
      ['tetradic','TET'], ['split','SPL'], ['accented','ACC'], ['fibonacci','FIB'],
      ['monochromatic','MON'], ['double-comp','DBL'], ['near-comp','NRC'], ['rectangle','RCT'],
    ], 'tbRandHarmDesc', window._rHarmDescs);

    const surfChips = chipRowWithFooter('tbRandSurfChips', 'Surface', 'tbRandSurfLabel', 'tbRandSetSurf', [
      ['random','RND'], ['white','WHT'], ['off-white','OFW'], ['light primary','LPR'],
      ['dark primary','DPR'], ['light secondary','LSC'], ['dark secondary','DSC'],
      ['light accent','LAC'], ['dark accent','DAC'], ['tinted neutral','TND'],
      ['light complement','LCM'], ['pure grey','GRY'], ['4th harmony','4TH'],
    ], 'tbRandSurfDesc', window._rSurfDescs);

    const toneChips = chipRowWithFooter('tbRandToneChips', 'Tone', 'tbRandToneLabel', 'tbRandSetTone', [
      ['mix','RND'], ['dark','DRK'], ['mid','MID'], ['light','LGT'],
    ], 'tbRandToneDesc', window._rToneDescs);

    const preview = `<div style="flex-shrink:0;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden">
      <div class="tb-card-hdr" style="color:var(--text-light)">Preview</div>
      <div style="background:var(--bg-1);padding:var(--margin);display:flex;flex-direction:column;gap:var(--margin);border-radius:calc(var(--radius) - 1px)">
        <div style="display:flex;gap:var(--margin)">
          <div class="label-card" style="flex:1;background:var(--bg-4);color:var(--text-dark)">Quick Schedule</div>
          <div style="flex:1;display:flex;border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden">
            <div style="flex:1;display:flex;align-items:center;justify-content:center;background:var(--bg-3);border-right:var(--border-width) solid var(--border-color);font-size:var(--text-xs);font-weight:var(--fw-heavy);letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--text-light)">Tab 1</div>
            <div style="flex:1;display:flex;align-items:center;justify-content:center;background:var(--bg-3);font-size:var(--text-xs);font-weight:var(--fw-heavy);letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--text-mid)">Tab A</div>
          </div>
        </div>
        <div class="day-card" style="height:var(--job-half)">
          <div class="day-letter" style="font-size:var(--text-xs)">M</div>
          <div class="day-date"   style="font-size:var(--text-xs)">27</div>
          <div class="day-body">
            <div class="day-body-half day-half-off" style="font-size:var(--text-xs)">OFF</div>
            <div class="day-body-half"              style="font-size:var(--text-xs)">9:00 AM</div>
          </div>
          <div class="day-hours" style="font-size:var(--text-xs)">08.00</div>
        </div>
        <div style="display:flex;gap:var(--margin);height:72px">

          <!-- Primary: Job card -->
          <div style="flex:1;border:${BD};border-radius:${R};overflow:hidden;display:flex;flex-direction:column">
            <div style="height:var(--qs-hdr);flex-shrink:0;background:var(--primary);border-bottom:${BD};display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:900;letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--text-light)">JOB</div>
            <div style="flex:1;background:var(--bg-2);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:900;color:var(--text-mid)">19H 55M</div>
            <div style="height:var(--qs-hdr);flex-shrink:0;background:var(--bg-2);border-top:${BD};display:flex;align-items:center;justify-content:center;gap:8px">
              <svg width="9" height="10" viewBox="0 0 16 16" fill="none"><path d="M2 2 Q2 1 3 1.5 L13.5 7.5 Q15 8 13.5 8.5 L3 14.5 Q2 15 2 14 Z" fill="var(--text-mid)" stroke="var(--muted)" stroke-width="1.5" stroke-linejoin="round"/></svg>
              <div style="display:flex;gap:3px;align-items:center"><div style="width:3px;height:10px;background:var(--color-1);border-radius:2px"></div><div style="width:3px;height:10px;background:var(--color-1);border-radius:2px"></div></div>
              <div style="width:9px;height:7px;border-left:2.5px solid var(--primary);border-bottom:2.5px solid var(--primary);border-radius:1px;transform:rotate(-45deg) translate(1px,-1px)"></div>
            </div>
          </div>

          <!-- Secondary: History card -->
          <div style="flex:1;border:${BD};border-radius:${R};overflow:hidden;display:flex;flex-direction:column">
            <div style="height:var(--qs-hdr);flex-shrink:0;background:var(--secondary);border-bottom:${BD};display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:900;letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--text-light)">Week</div>
            <div style="flex:1;background:var(--bg-2);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:900;color:var(--text-mid)">38.50</div>
            <div style="height:var(--qs-hdr);flex-shrink:0;background:var(--secondary);border-top:${BD};display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:900;color:var(--text-light)">HRS</div>
          </div>

          <!-- Accent: Quick Schedule card with hour lines and shift bar -->
          <div style="flex:1;border:${BD};border-radius:${R};overflow:hidden;display:flex;flex-direction:column">
            <div style="height:var(--qs-hdr);flex-shrink:0;background:var(--accent);border-bottom:${BD};display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:900;letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--text-light)">Today</div>
            <div style="flex:1;background:var(--bg-2);position:relative;overflow:hidden">
              <div style="position:absolute;inset:0;display:flex">
                <div style="flex:1;border-right:1px solid rgba(128,128,128,0.2)"></div>
                <div style="flex:1;border-right:1px solid rgba(128,128,128,0.2)"></div>
                <div style="flex:1;border-right:1px solid rgba(128,128,128,0.2)"></div>
                <div style="flex:1"></div>
              </div>
              <div style="position:absolute;top:50%;left:10%;width:58%;transform:translateY(-50%);height:11px;background:var(--bg-4);border:2px solid var(--secondary);border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:6px;font-weight:900;color:var(--text-dark)">9AM-5PM</div>
            </div>
            <div style="height:var(--qs-hdr);flex-shrink:0;background:var(--accent);border-top:${BD};display:flex;align-items:center;justify-content:space-around;padding:0 4px">
              <span style="font-size:8px;font-weight:900;color:var(--text-light)">9</span>
              <span style="font-size:8px;font-weight:900;color:var(--text-light)">12</span>
              <span style="font-size:8px;font-weight:900;color:var(--text-light)">3</span>
              <span style="font-size:8px;font-weight:900;color:var(--text-light)">6</span>
            </div>
          </div>

        </div>
      </div>
    </div>`;

    const btns = `<div onclick="tbRandRandom()"
      style="border:var(--border-width) solid var(--border-color);border-radius:var(--radius);overflow:hidden;background:var(--bg-2);color:var(--text-mid);font-size:var(--text-xs);font-weight:900;letter-spacing:var(--ls-wider);text-transform:uppercase;cursor:pointer;padding:10px;text-align:center">
      Tap to Randomize
    </div>`;

    const panel = document.createElement('div');
    panel.className = 'tb-tab-panel tb-body';
    panel.id        = 'tbPanel-randomize';
    panel.style.gap = 'var(--margin)';
    panel.innerHTML = sliders + primaryCard + bgChips + harmChips + surfChips + toneChips + preview + btns;
    slot.replaceWith(panel);

    // Wire sliders
    ['tbHueS', 'tbBriS', 'tbSatS'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', _rUpdatePrimaryCard);
    });
    _rUpdatePrimaryCard();
    _rInitChips();
  }, 200);
});
