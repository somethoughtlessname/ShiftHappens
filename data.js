/* data.js — Data management (import / export)
   Requires: app.js globals — jobs, appSettings, ls, lsSet, renderJobs
*/

function buildDataWindow() {
  const existing = document.getElementById('dataWindow');
  if (existing) return;

  const win = document.createElement('div');
  win.className = 'data-window';
  win.id = 'dataWindow';
  win.innerHTML = `
    <div class="data-window-header">
      <button class="data-window-back" onclick="closeWindow('dataWindow')">&#9664;</button>
      <div class="data-window-title">Data</div>
    </div>
    <!-- tab bar -->
    <div class="filter-card" style="flex-shrink:0;border-radius:0;border-left:none;border-right:none;border-top:none;">
      <button class="filter-btn active" id="dataTabImport" onclick="dataShowTab('import')">Import</button>
      <button class="filter-btn" id="dataTabExport" onclick="dataShowTab('export')">Export</button>
    </div>

    <!-- import panel -->
    <div class="data-body" id="dataPanelImport">
      <div class="label-card" style="background:var(--bg-2);color:var(--muted);">Paste JSON data below</div>
      <textarea id="dataImportField"
        style="flex:1;background:var(--bg-2);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);
               color:var(--color-10);font-size:var(--text-sm);font-family:monospace;padding:8px;resize:none;
               outline:none;min-height:200px;"
        placeholder='{"jobs":[...]}'></textarea>
      <div class="clear-card" id="dataImportBtn" onclick="dataImport()" style="background:var(--color-4-2);">Import</div>
      <div id="dataImportStatus" style="font-size:var(--text-xs);font-weight:var(--fw-bold);text-align:center;color:var(--muted);padding:4px;"></div>
    </div>

    <!-- export panel -->
    <div class="data-body" id="dataPanelExport" style="display:none;">
      <div class="label-card" style="background:var(--bg-2);color:var(--muted);">Your data as JSON</div>
      <textarea id="dataExportField" readonly
        style="flex:1;background:var(--bg-2);border:var(--border-width) solid var(--border-color);border-radius:var(--radius);
               color:var(--color-10);font-size:var(--text-sm);font-family:monospace;padding:8px;resize:none;
               outline:none;min-height:200px;"></textarea>
      <div class="clear-card" onclick="dataCopyClipboard()" style="background:var(--color-4-2);">Copy to Clipboard</div>
      <div id="dataExportStatus" style="font-size:var(--text-xs);font-weight:var(--fw-bold);text-align:center;color:var(--muted);padding:4px;"></div>
    </div>
  `;
  document.body.appendChild(win);
}

function openDataWindow() {
  buildDataWindow();
  dataShowTab('import');
  document.getElementById('dataWindow').classList.add('open');
}

function dataShowTab(tab) {
  document.getElementById('dataPanelImport').style.display = tab === 'import' ? 'flex' : 'none';
  document.getElementById('dataPanelExport').style.display = tab === 'export' ? 'flex' : 'none';
  document.getElementById('dataTabImport').classList.toggle('active', tab === 'import');
  document.getElementById('dataTabExport').classList.toggle('active', tab === 'export');

  if (tab === 'export') {
    const data = { jobs: ls('sch_jobs', []), settings: ls('sch_settings', {}) };
    document.getElementById('dataExportField').value = JSON.stringify(data, null, 2);
  }
}

function dataImport() {
  const status = document.getElementById('dataImportStatus');
  const raw = document.getElementById('dataImportField').value.trim();
  if (!raw) { status.textContent = 'Nothing to import'; status.style.color = 'var(--color-1)'; return; }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed.jobs || !Array.isArray(parsed.jobs)) throw new Error('Invalid format — missing jobs array');

    lsSet('sch_jobs', parsed.jobs);
    if (parsed.settings) lsSet('sch_settings', parsed.settings);

    jobs = parsed.jobs;
    if (parsed.settings) Object.assign(appSettings, parsed.settings);

    renderJobs();
    if (typeof renderQuickSchedule === 'function') renderQuickSchedule();
    if (typeof renderHistory === 'function') { buildHistory(); renderHistory(); }
    if (typeof updateSettingsUI === 'function') updateSettingsUI();

    document.getElementById('dataImportField').value = '';
    status.textContent = `Imported ${parsed.jobs.length} job(s) successfully`;
    status.style.color = 'var(--color-4)';
  } catch (e) {
    status.textContent = 'Error: ' + e.message;
    status.style.color = 'var(--color-1)';
  }
}

function dataCopyClipboard() {
  const status = document.getElementById('dataExportStatus');
  const text = document.getElementById('dataExportField').value;
  if (!text) { status.textContent = 'Nothing to copy'; status.style.color = 'var(--color-1)'; return; }

  navigator.clipboard.writeText(text).then(() => {
    status.textContent = 'Copied to clipboard!';
    status.style.color = 'var(--color-4)';
    setTimeout(() => { status.textContent = ''; }, 3000);
  }).catch(() => {
    // Fallback for older browsers
    const ta = document.getElementById('dataExportField');
    ta.select();
    document.execCommand('copy');
    status.textContent = 'Copied!';
    status.style.color = 'var(--color-4)';
    setTimeout(() => { status.textContent = ''; }, 3000);
  });
}


