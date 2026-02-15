function showDataModal() {
  // Remove existing modal if any
  const existing = document.getElementById('data-modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'data-modal-overlay';
  overlay.className = 'modal-overlay';

  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-header">
        <h2>Data Management</h2>
        <button class="modal-close" id="modal-close">✕</button>
      </div>

      <div class="modal-section">
        <button class="btn btn-primary" id="export-btn">Export All Data</button>
        <div class="modal-hint">Download a JSON backup of all workouts and settings</div>
      </div>

      <div class="modal-divider"></div>

      <div class="modal-section">
        <label class="btn btn-secondary" id="import-label">
          Import Data
          <input type="file" accept=".json" id="import-file" style="display:none">
        </label>
        <div class="modal-hint">Restore from a previously exported JSON file</div>
        <div id="import-preview" style="display:none">
          <div class="import-summary" id="import-summary"></div>
          <div class="import-mode-toggle">
            <button class="import-mode-btn active" data-mode="merge" id="mode-merge">Merge</button>
            <button class="import-mode-btn" data-mode="replace" id="mode-replace">Replace</button>
          </div>
          <div class="modal-hint" id="mode-hint">Adds new workouts without removing existing data</div>
          <button class="btn btn-primary mt-12" id="import-confirm">Confirm Import</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  let importMode = 'merge';
  let pendingData = null;

  // Close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  document.getElementById('modal-close').addEventListener('click', () => overlay.remove());

  // Export
  document.getElementById('export-btn').addEventListener('click', () => {
    const data = Storage.exportAll();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];
    const a = document.createElement('a');
    a.href = url;
    a.download = `workout_data_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Import file selection
  document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (!Array.isArray(data.workout_logs)) {
          alert('Invalid file: missing workout_logs array');
          return;
        }
        pendingData = data;
        const count = data.workout_logs.length;
        document.getElementById('import-summary').textContent = `${count} workout${count !== 1 ? 's' : ''} found`;
        document.getElementById('import-preview').style.display = '';
      } catch {
        alert('Could not parse JSON file');
      }
    };
    reader.readAsText(file);
  });

  // Mode toggle
  document.getElementById('mode-merge').addEventListener('click', () => {
    importMode = 'merge';
    document.getElementById('mode-merge').classList.add('active');
    document.getElementById('mode-replace').classList.remove('active');
    document.getElementById('mode-hint').textContent = 'Adds new workouts without removing existing data';
  });
  document.getElementById('mode-replace').addEventListener('click', () => {
    importMode = 'replace';
    document.getElementById('mode-replace').classList.add('active');
    document.getElementById('mode-merge').classList.remove('active');
    document.getElementById('mode-hint').textContent = 'Replaces all existing data with imported data';
  });

  // Confirm import
  document.getElementById('import-confirm').addEventListener('click', () => {
    if (!pendingData) return;
    if (importMode === 'replace' && !confirm('This will replace all existing data. Continue?')) return;
    Storage.importData(pendingData, importMode);
    overlay.remove();
    // Refresh home view if we're on it
    if (!window.location.hash || window.location.hash === '#') {
      renderHome();
    }
  });
}
