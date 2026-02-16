function renderSettings() {
  const app = document.getElementById('app');
  const bodyweight = Storage.getBodyweight() || '';
  const gender = Storage.getGender();

  let html = `
    <div class="header">
      <div class="header-row">
        <button class="back-btn" id="back-btn">← Back</button>
      </div>
      <h1>Settings</h1>
    </div>

    <div class="section-title">Profile</div>
    <div class="settings-card">
      <div class="settings-row">
        <label class="settings-label" for="bodyweight-input">Bodyweight (lbs)</label>
        <input type="number" id="bodyweight-input" class="settings-input" value="${bodyweight}" placeholder="e.g. 180" inputmode="decimal">
      </div>
      <div class="settings-row">
        <label class="settings-label">Gender</label>
        <div class="import-mode-toggle">
          <button class="import-mode-btn ${gender === 'male' ? 'active' : ''}" id="gender-male" data-gender="male">Male</button>
          <button class="import-mode-btn ${gender === 'female' ? 'active' : ''}" id="gender-female" data-gender="female">Female</button>
        </div>
      </div>
    </div>

    <div class="section-title">Strength Score</div>
    <div id="strength-detail-container"></div>

    <div class="section-title">Data Management</div>
    <div class="settings-card">
      <button class="btn btn-primary" id="export-btn">Export All Data</button>
      <div class="modal-hint">Download a JSON backup of all workouts and settings</div>
      <div style="margin-top:12px">
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

    <div class="pb-32"></div>
  `;

  app.innerHTML = html;

  // Render strength score detail
  function refreshStrengthScore() {
    const data = computeStrengthScore();
    const container = document.getElementById('strength-detail-container');
    container.innerHTML = '';
    container.appendChild(createStrengthScoreCard(data, false));
  }
  refreshStrengthScore();

  // Bodyweight input
  document.getElementById('bodyweight-input').addEventListener('change', (e) => {
    const val = parseFloat(e.target.value);
    if (val > 0) {
      Storage.setBodyweight(val);
    } else {
      localStorage.removeItem('bodyweight');
    }
    refreshStrengthScore();
  });

  // Gender toggle
  document.getElementById('gender-male').addEventListener('click', () => {
    Storage.setGender('male');
    document.getElementById('gender-male').classList.add('active');
    document.getElementById('gender-female').classList.remove('active');
    refreshStrengthScore();
  });
  document.getElementById('gender-female').addEventListener('click', () => {
    Storage.setGender('female');
    document.getElementById('gender-female').classList.add('active');
    document.getElementById('gender-male').classList.remove('active');
    refreshStrengthScore();
  });

  // Back button
  document.getElementById('back-btn').addEventListener('click', () => {
    window.location.hash = '';
  });

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

  // Import
  let importMode = 'merge';
  let pendingData = null;

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

  document.getElementById('import-confirm').addEventListener('click', () => {
    if (!pendingData) return;
    if (importMode === 'replace' && !confirm('This will replace all existing data. Continue?')) return;
    Storage.importData(pendingData, importMode);
    renderSettings();
  });
}
