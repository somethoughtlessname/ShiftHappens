(function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `

/* ═══════════════════════════════════════════════════════
   RESET
═══════════════════════════════════════════════════════ */
*, *::before, *::after {
  box-sizing: border-box; margin: 0; padding: 0;
  -webkit-tap-highlight-color: transparent;
}
button, input { outline: none; -webkit-tap-highlight-color: transparent; }


/* ═══════════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════════ */
:root {

  /* ── Spacing & Geometry ── */
  --margin:        4px;
  --card-height:   45px;
  --drop-height:   32px;
  --border-width:  3px;
  --border-color:  #000;
  --radius:        8px;
  --day-sq:        30px;
  --job-half:      calc((var(--card-height) - var(--border-width)) / 2);

  /* ── Backgrounds ── */
  --bg-1:   #233040;  /* page background */
  --bg-2:   #4d5f72;  /* card / panel background */
  --bg-3:   #1e2d3f;  /* header / dark panel */
  --bg-4:   #828c98;  /* inactive control */

  /* ── Text ── */
  --color-10:  #ffffff;  /* white — primary text on dark */
  --text-dark: #000000;  /* black — text on white surfaces */
  --muted:     #b4bcc8;  /* muted — secondary / placeholder text */
  --modal-btn: #738494;  /* number pad button background */

  /* ── Semantic Colors ── */
  --color-1:    #e07878;  /* red — error / delete / timer running */
  --primary:    #48a971;  /* green — main action, confirm, success */
  --secondary:  #5A8DB8;  /* blue — secondary action, active filter tabs, off days */
  --accent:     #8a7ca8;  /* purple — quick schedule headers, accent */

  /* ── Job Color Swatches (color picker) ── */
  --swatch-1:   #C85A5A;  /* red     */
  --swatch-2:   #C7824A;  /* orange  */
  --swatch-3:   #B8B85A;  /* gold    */
  --swatch-4:   #48a971;  /* green   */
  --swatch-5:   #5AB8A8;  /* teal    */
  --swatch-6:   #5A8DB8;  /* blue    */
  --swatch-7:   #8a7ca8;  /* purple  */
  --swatch-8:   #B87390;  /* brown   */
  --swatch-9:   #a06090;  /* rose    */
  --swatch-10:  #7a9070;  /* sage    */

  /* ── Typography ── */
  --text-xs:   10px;
  --text-sm:   12px;
  --text-md:   14px;
  --text-lg:   38px;
  --fw-semi:   600;
  --fw-bold:   800;
  --fw-heavy:  900;

  /* ── Letter Spacing ── */
  --ls-tight:   0.02em;
  --ls-normal:  0.04em;
  --ls-wide:    0.08em;
  --ls-wider:   0.1em;
  --ls-widest:  0.12em;

  /* ── Quick Schedule ── */
  --qs-row:     18px;  /* timeline row and axis height */
  --qs-hdr:     18px;  /* day header height */
  --qs-job-bdr: var(--border-width);  /* job card border width */
  --qs-grid:    rgba(255,255,255,0.18);  /* vertical grid line color */
}


/* ═══════════════════════════════════════════════════════
   BASE
═══════════════════════════════════════════════════════ */
html, body {
  width: 100%; min-height: 100vh;
  background: var(--bg-1); color: var(--color-10);
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-size: var(--text-md);
}
body {
  display: flex; flex-direction: column; align-items: center;
  padding: calc(var(--card-height) + var(--margin)) var(--margin) var(--margin);
}


/* ═══════════════════════════════════════════════════════
   MAIN HEADER
═══════════════════════════════════════════════════════ */
.header-tab {
  position: fixed; top: 0; left: 0; right: 0;
  height: var(--card-height);
  display: flex;
  border-bottom: var(--border-width) solid var(--border-color);
  background: var(--bg-3);
  z-index: 100;
}
.header-action-btn {
  flex: 1;
  background: var(--bg-3); border: none;
  border-right: var(--border-width) solid var(--border-color);
  color: var(--primary);
  font-size: var(--text-sm); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wide); text-transform: uppercase;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.header-action-btn:last-child { border-right: none; color: var(--muted); }


/* ═══════════════════════════════════════════════════════
   APP SHELL
═══════════════════════════════════════════════════════ */
.app {
  width: 100%; max-width: 540px;
  display: flex; flex-direction: column; gap: var(--margin);
}


/* ═══════════════════════════════════════════════════════
   LABEL CARD  (white section header)
═══════════════════════════════════════════════════════ */
.label-card {
  height: calc(var(--job-half) + var(--border-width) * 2);
  display: flex; align-items: center; justify-content: center;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); overflow: hidden; flex-shrink: 0;
  background: #fff;
  font-size: var(--text-sm); font-weight: var(--fw-heavy);
  letter-spacing: var(--ls-wider); text-transform: uppercase;
  color: var(--text-dark);
}


/* ═══════════════════════════════════════════════════════
   JOB CARD  (main window)
═══════════════════════════════════════════════════════ */
.job-card {
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); overflow: hidden; flex-shrink: 0;
  display: flex; flex-direction: row; align-items: stretch;
  cursor: pointer;
}
.job-card-left {
  width: var(--card-height); flex-shrink: 0;
  background: var(--bg-2);
  border-right: var(--border-width) solid var(--border-color);
}
.job-card-center {
  flex: 1; display: flex; flex-direction: column; min-width: 0;
}
.job-card-right {
  width: var(--card-height); flex-shrink: 0;
  background: var(--bg-2);
  border-left: var(--border-width) solid var(--border-color);
  display: flex; align-items: center; justify-content: center;
}
.job-card-top {
  height: var(--job-half);
  display: flex; align-items: center; justify-content: center;
}
.job-card-title {
  font-size: var(--text-sm); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wider); text-transform: uppercase;
  color: var(--color-10);
}
.job-card-bottom {
  height: calc(var(--job-half) - var(--border-width));
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-2);
  border-top: var(--border-width) solid var(--border-color);
  font-size: var(--text-sm); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wide);
  color: var(--muted);
}

/* ── Timer button — right section states ── */
.job-card-arrow { display: flex; align-items: center; justify-content: center; }

.job-card-pause { display: flex; gap: 4px; align-items: center; }
.job-card-pause-bar {
  width: 4px; height: 14px;
  background: var(--color-1);
  border-radius: 2px;
  animation: timerBlink 1.4s ease-in-out infinite;
}
.job-card-pause-bar:nth-child(2) { animation-delay: 0.2s; }

.job-card-check {
  width: 14px; height: 10px;
  border-left: 3px solid var(--primary);
  border-bottom: 3px solid var(--primary);
  border-radius: 1px;
  transform: rotate(-45deg) translate(2px, -2px);
}

@keyframes timerBlink {
  0%, 100% { filter: brightness(1); }
  50%       { filter: brightness(0.4); }
}


/* ═══════════════════════════════════════════════════════
   DATA WINDOW  (full-screen overlay panel)
═══════════════════════════════════════════════════════ */
.data-window {
  display: none; position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: var(--bg-1);
  z-index: 200; flex-direction: column;
}
.data-window.open { display: flex; }

.data-window-header {
  height: var(--card-height); flex-shrink: 0;
  display: flex; align-items: stretch; position: relative;
  background: var(--bg-3);
  border-bottom: var(--border-width) solid var(--border-color);
}
.data-window-back {
  width: var(--card-height); min-width: var(--card-height);
  background: var(--bg-3); border: none;
  border-right: var(--border-width) solid var(--border-color);
  display: flex; align-items: center; justify-content: center;
  font-size: var(--text-md); font-weight: var(--fw-heavy);
  color: var(--muted); cursor: pointer; flex-shrink: 0; z-index: 1;
}
.data-window-back:active { background: var(--bg-2); color: var(--color-10); }

.data-window-title {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: var(--text-sm); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wider); text-transform: uppercase;
  color: var(--color-10); pointer-events: none;
}
.data-window-settings {
  width: var(--card-height); min-width: var(--card-height);
  background: var(--bg-3); border: none;
  border-left: var(--border-width) solid var(--border-color);
  margin-left: auto;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0; z-index: 1;
}
.data-window-settings:active { background: var(--bg-2); }

.data-body {
  flex: 1; overflow-y: auto;
  padding: var(--margin);
  display: flex; flex-direction: column; gap: var(--margin);
}


/* ═══════════════════════════════════════════════════════
   MODAL OVERLAY  (blur backdrop)
═══════════════════════════════════════════════════════ */
.modal-blur-overlay {
  position: fixed; inset: 0; z-index: 300;
  display: flex; align-items: center; justify-content: center;
  padding: var(--margin);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  background: rgba(0,0,0,0.3);
}


/* ═══════════════════════════════════════════════════════
   FORM ELEMENTS
═══════════════════════════════════════════════════════ */

/* Title input */
.nw-title-card {
  height: var(--card-height);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); overflow: hidden; flex-shrink: 0;
}
.nw-title-input {
  width: 100%; height: 100%;
  background: var(--bg-2); border: none;
  color: var(--color-10);
  font-size: var(--text-sm); font-weight: var(--fw-semi);
  letter-spacing: var(--ls-normal); padding: 0 12px;
}
.nw-title-input::placeholder { color: var(--muted); }

/* Color swatch picker */
.nw-color-card {
  height: var(--card-height);
  display: flex; align-items: stretch;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); overflow: hidden; flex-shrink: 0;
}
.nw-swatch {
  flex: 1; border: none; cursor: pointer;
  border-right: var(--border-width) solid var(--border-color);
  position: relative;
}
.nw-swatch:last-child { border-right: none; }
.nw-swatch:active { filter: none; }
.nw-swatch::after {
  content: '';
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%) scale(0);
  width: 14px; height: 14px; border-radius: 50%;
  background: var(--color-10);
  transition: transform 0.12s;
}
.nw-swatch.selected::after { transform: translate(-50%, -50%) scale(1); }

/* New/edit window footer */
.nw-footer {
  height: var(--card-height); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-3);
  border-top: var(--border-width) solid var(--border-color);
  font-size: var(--text-sm); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wider); text-transform: uppercase;
  color: var(--muted); cursor: default; user-select: none;
  transition: background 0.15s, color 0.15s;
}
.nw-footer.ready { background: var(--primary); color: var(--color-10); cursor: pointer; }
.nw-footer.ready:active { filter: none; }

/* Day of week picker */
.dow-card {
  height: var(--card-height);
  display: flex; align-items: stretch;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); overflow: hidden; flex-shrink: 0;
}
.dow-btn {
  flex: 1; border: none; cursor: pointer;
  background: var(--bg-2);
  border-right: var(--border-width) solid var(--border-color);
  color: var(--muted);
  font-size: var(--text-md); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-normal); text-transform: uppercase;
  display: flex; align-items: center; justify-content: center;
}
.dow-btn:last-child { border-right: none; }
.dow-btn.active { color: var(--color-10); }  /* background set inline via job color */
.dow-btn:active { filter: none; }


/* ═══════════════════════════════════════════════════════
   FILTER / TAB CARDS
═══════════════════════════════════════════════════════ */
.filter-card {
  height: var(--card-height);
  display: flex; align-items: stretch;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); overflow: hidden; flex-shrink: 0;
}
.filter-btn {
  flex: 1; border: none; cursor: pointer;
  background: var(--bg-2);
  border-right: var(--border-width) solid var(--border-color);
  color: var(--muted);
  font-size: var(--text-sm); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wide); text-transform: uppercase;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.1s, color 0.1s;
}
.filter-btn:last-child { border-right: none; }
.filter-btn.active          { background: var(--primary);   color: var(--color-10); }
.filter-btn.active.secondary { background: var(--secondary);  color: var(--color-10); }
.filter-btn:active { filter: none; }


/* ═══════════════════════════════════════════════════════
   JOB WINDOW — DAY CARDS
═══════════════════════════════════════════════════════ */
.date-range-card {
  height: var(--card-height);
  display: flex; align-items: center; justify-content: center;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); overflow: hidden; flex-shrink: 0;
  background: var(--accent);
  font-size: var(--text-md); font-weight: var(--fw-heavy);
  letter-spacing: var(--ls-wider); text-transform: uppercase;
  color: var(--color-10);
}
.day-card {
  height: var(--card-height);
  display: flex; align-items: stretch;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); overflow: hidden; flex-shrink: 0;
  background: var(--bg-2);
}
.day-letter {
  width: var(--day-sq); min-width: var(--day-sq); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: #fff;
  border-right: var(--border-width) solid var(--border-color);
  font-size: var(--text-md); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-normal); text-transform: uppercase;
  color: var(--text-dark);
}
.day-date {
  width: var(--day-sq); min-width: var(--day-sq); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: #fff;
  border-right: var(--border-width) solid var(--border-color);
  font-size: var(--text-md); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-normal);
  color: var(--text-dark);
}
.day-body {
  flex: 1; display: flex; align-items: stretch;
  background: var(--bg-2);
}
.day-body-half {
  flex: 1; display: flex; align-items: center; justify-content: center;
  font-size: var(--text-md); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-normal); color: var(--color-10);
  border-right: var(--border-width) solid var(--border-color);
}
.day-body-half:last-child { border-right: none; }
.day-half-off {
  background: var(--secondary) !important;  /* OFF day — blue */
  color: var(--color-10) !important;
}
.day-hours {
  width: calc(var(--day-sq) * 2 + var(--border-width));
  min-width: calc(var(--day-sq) * 2 + var(--border-width));
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: #fff;
  border-left: var(--border-width) solid var(--border-color);
  font-size: var(--text-md); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-normal); color: var(--text-dark);
}
.day-sq-today {
  background: var(--primary) !important;  /* today highlight — dark green */
  color: var(--color-10) !important;
}


/* ═══════════════════════════════════════════════════════
   TOTALS CARD
═══════════════════════════════════════════════════════ */
.totals-card {
  height: var(--card-height);
  display: flex; align-items: stretch;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); overflow: hidden; flex-shrink: 0;
}
.totals-label {
  flex: 1; display: flex; align-items: center; justify-content: center;
  background: var(--secondary);
  border-right: var(--border-width) solid var(--border-color);
  font-size: var(--text-md); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-normal); text-transform: uppercase;
  color: var(--color-10);
}
.totals-value {
  flex: 1; display: flex; align-items: center; justify-content: center;
  background: var(--primary);
  font-size: var(--text-md); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-normal); text-transform: uppercase;
  color: var(--color-10);
}


/* ═══════════════════════════════════════════════════════
   ACTION CARDS  (delete / clear)
═══════════════════════════════════════════════════════ */
.delete-card {
  height: var(--card-height); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--color-1);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); overflow: hidden;
  font-size: var(--text-sm); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wider); text-transform: uppercase;
  color: var(--color-10); cursor: pointer; user-select: none;
}
.delete-card:active { filter: none; }
.delete-card.confirm { background: #fff; color: var(--color-1); }

.clear-card {
  height: var(--card-height); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--color-1);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); overflow: hidden;
  font-size: var(--text-sm); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wider); text-transform: uppercase;
  color: var(--color-10); cursor: pointer; user-select: none; flex-shrink: 0;
}
.clear-card:active { filter: none; }
.clear-card.confirm { background: #fff; color: var(--color-1); }
.clear-card-wrap { padding: var(--margin); flex-shrink: 0; }


/* ═══════════════════════════════════════════════════════
   SCHEDULE MODAL
═══════════════════════════════════════════════════════ */
.sched-modal-overlay {
  display: none; position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);
  z-index: 600;
  align-items: center; justify-content: center;
  padding: 15px; overflow-y: auto;
}
.sched-modal-overlay.open { display: flex; }
.sched-modal {
  width: 100%; height: auto;
  background: var(--bg-1);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius);
  display: flex; flex-direction: column; overflow: hidden;
}
.sched-modal-header {
  height: var(--card-height); flex-shrink: 0;
  display: flex; align-items: stretch; position: relative;
  background: var(--bg-3);
  border-bottom: var(--border-width) solid var(--border-color);
}
.sched-modal-back {
  width: var(--card-height); min-width: var(--card-height);
  background: var(--bg-3); border: none;
  border-right: var(--border-width) solid var(--border-color);
  display: flex; align-items: center; justify-content: center;
  font-size: var(--text-md); font-weight: var(--fw-heavy);
  color: var(--muted); cursor: pointer; flex-shrink: 0; z-index: 1;
}
.sched-modal-back:active { background: var(--bg-2); color: var(--color-10); }
.sched-modal-title {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: var(--text-sm); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wider); text-transform: uppercase;
  color: var(--color-10); pointer-events: none;
}
.sched-modal-body {
  padding: var(--margin);
  display: flex; flex-direction: column; gap: var(--margin);
}


/* ═══════════════════════════════════════════════════════
   TIME PICKER
═══════════════════════════════════════════════════════ */
.tp-wrap { display: flex; flex-direction: column; gap: var(--margin); padding: var(--margin); }

.tp-display {
  background: var(--bg-2);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius);
  display: flex; align-items: center; justify-content: center;
  font-size: var(--text-lg); font-weight: var(--fw-heavy);
  letter-spacing: var(--ls-wide); color: var(--color-10);
  flex-shrink: 0; height: 72px;
}
.tp-display.tp-special { font-size: var(--text-md); color: var(--muted); }

.tp-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(5, var(--card-height));
  gap: var(--margin);
}
.tp-btn {
  background: var(--modal-btn);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); color: var(--color-10);
  font-size: var(--text-md); font-weight: var(--fw-bold);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.tp-btn:active { filter: none; }
.tp-btn.tp-red    { background: var(--color-1); }
.tp-btn.tp-blue   { background: var(--secondary); font-size: var(--text-sm); letter-spacing: var(--ls-wide); }
.tp-btn.tp-purple { background: var(--accent);    font-size: var(--text-sm); letter-spacing: var(--ls-wide); }
.tp-btn.tp-ampm   { background: var(--bg-4); font-size: var(--text-md); }
.tp-btn.tp-ampm.active { background: var(--primary); }

.tp-preset {
  background: var(--bg-3);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); color: var(--color-10);
  font-size: var(--text-sm); font-weight: var(--fw-bold);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.tp-preset:active { filter: none; }

.tp-footer { display: flex; gap: var(--margin); height: var(--card-height); flex-shrink: 0; }
.tp-cancel {
  flex: 1; background: var(--bg-2);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); color: var(--muted);
  font-size: var(--text-sm); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wide); text-transform: uppercase; cursor: pointer;
}
.tp-set {
  flex: 1; background: var(--primary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); color: var(--color-10);
  font-size: var(--text-sm); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wide); text-transform: uppercase; cursor: pointer;
}
.tp-cancel:active, .tp-set:active { filter: none; }


/* ═══════════════════════════════════════════════════════
   DOT GRID  (settings icon)
═══════════════════════════════════════════════════════ */
.dot-grid {
  display: grid;
  grid-template-columns: repeat(3, 5px);
  grid-template-rows: repeat(3, 5px);
  gap: 3px;
}
.dot { width: 5px; height: 5px; border-radius: 50%; background: var(--color-10); }
.dot.green { background: var(--primary); }


/* ═══════════════════════════════════════════════════════
   QUICK SCHEDULE
═══════════════════════════════════════════════════════ */
.qs-wrap {
  width: 100%; max-width: 540px;
  display: flex; flex-direction: column; gap: var(--margin);
}
.qs-card {
  width: 100%;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius);
  background: var(--accent);  /* card bg = accent purple (fills corner gaps) */
  display: flex; flex-direction: column;
}
.qs-day-hdr {
  /* height set inline per day — QS_HDR_PX or QS_ROW_PX for today */
  display: flex; align-items: center; justify-content: center;
  background: var(--accent);
  border-top: var(--border-width) solid var(--border-color);
  border-bottom: var(--border-width) solid var(--border-color);
  font-size: var(--text-xs); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wider); text-transform: uppercase;
  color: var(--color-10);
}
.qs-day-hdr.qs-first {
  border-top: none;
  border-radius: calc(var(--radius) - var(--border-width)) calc(var(--radius) - var(--border-width)) 0 0;
  overflow: hidden;
}
.qs-job-row {
  position: relative;
  height: var(--qs-row);
  background: var(--bg-2);
}
.qs-row-off {
  display: flex; align-items: center; justify-content: center;
  font-size: var(--text-xs); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wider); text-transform: uppercase;
  color: var(--muted);
}
.qs-grid-line {
  position: absolute;
  top: 0; bottom: 0; width: 1px;
  background: var(--qs-grid);
  transform: translateX(-50%);
  pointer-events: none;
}
.qs-job-card {
  position: absolute;
  top: 0; height: var(--qs-row);
  display: flex; align-items: center; justify-content: center;
  border: var(--qs-job-bdr) solid;
  border-radius: var(--radius);
  background: #fff;
  font-size: var(--text-xs); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-normal); text-transform: uppercase;
  color: var(--text-dark);
  cursor: pointer; overflow: hidden;
  white-space: nowrap; text-overflow: ellipsis;
  padding: 0 4px; box-sizing: border-box;
}
.qs-job-card:active { filter: none; }
.qs-axis {
  position: relative;
  height: var(--qs-row);
  border-top: var(--border-width) solid var(--border-color);
  border-radius: 0 0 calc(var(--radius) - var(--border-width)) calc(var(--radius) - var(--border-width));
  overflow: hidden;
}
.qs-tick-label {
  position: absolute;
  top: 50%; transform: translate(-50%, -50%);
  font-size: var(--text-xs); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-normal);
  color: var(--color-10);
}


/* ═══════════════════════════════════════════════════════
   SETTINGS TOGGLE CARD
═══════════════════════════════════════════════════════ */
.toggle-card {
  display: flex; flex-direction: column;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius); overflow: hidden; flex-shrink: 0;
  background: var(--bg-2); cursor: pointer;
}
.toggle-card-top {
  height: var(--card-height);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 12px; flex-shrink: 0;
}
.toggle-card-blurb {
  font-size: var(--text-xs); font-weight: var(--fw-semi);
  color: var(--muted);
  padding: var(--margin) 12px calc(var(--margin) * 2);
  line-height: 1.5;
  border-top: var(--border-width) solid var(--border-color);
}
.toggle-label {
  font-size: var(--text-sm); font-weight: var(--fw-bold);
  letter-spacing: var(--ls-wider); text-transform: uppercase;
  color: var(--muted);
}
.toggle-card.active .toggle-label { color: var(--color-10); }
.toggle-pill {
  width: 42px; height: 24px; border-radius: 12px;
  background: var(--bg-4);
  border: var(--border-width) solid var(--border-color);
  position: relative; flex-shrink: 0;
  transition: background 0.15s;
}
.toggle-pill::after {
  content: '';
  position: absolute; top: 2px; left: 2px;
  width: 16px; height: 16px; border-radius: 50%;
  background: var(--muted);
  transition: transform 0.15s, background 0.15s;
}
.toggle-pill.on { background: var(--primary); }
.toggle-pill.on::after { transform: translateX(18px); background: var(--color-10); }



/* ═══════════════════════════════════════════════════════
   THEME OVERLAYS
═══════════════════════════════════════════════════════ */

/* CRT scanline overlay */
body.theme-crt::after {
  content: '';
  position: fixed; inset: 0; z-index: 9999;
  pointer-events: none;
  background: repeating-linear-gradient(
    to bottom,
    rgba(0,0,0,0) 0px,
    rgba(0,0,0,0) 2px,
    rgba(0,0,0,0.25) 2px,
    rgba(0,0,0,0.25) 4px
  );
  animation: crtFlicker 0.15s infinite;
}
body.theme-crt { filter: brightness(0.9) contrast(1.1); }
@keyframes crtFlicker {
  0%   { opacity: 1; }
  92%  { opacity: 1; }
  93%  { opacity: 0.85; }
  94%  { opacity: 1; }
  98%  { opacity: 1; }
  99%  { opacity: 0.9; }
  100% { opacity: 1; }
}

/* Black & white */
body.theme-bw { filter: grayscale(1) contrast(1.1); }

/* Sepia */
body.theme-sepia { filter: sepia(0.85) contrast(1.05) brightness(0.95); }

/* Neon — high contrast glow */
body.theme-neon { filter: brightness(1.1) saturate(2) contrast(1.2); }
body.theme-neon::after {
  content: '';
  position: fixed; inset: 0; z-index: 9999;
  pointer-events: none;
  background: rgba(0,255,180,0.04);
  mix-blend-mode: screen;
}

/* Dusk — warm amber tint */
body.theme-dusk::after {
  content: '';
  position: fixed; inset: 0; z-index: 9999;
  pointer-events: none;
  background: rgba(255, 160, 40, 0.18);
  mix-blend-mode: multiply;
}
body.theme-dusk { filter: brightness(0.95) contrast(0.95) saturate(0.8); }

  `;
  document.head.appendChild(style);
})();
