function renderTemplateBuilder(editId) {
  const app = document.getElementById('app');
  let template = null;

  if (editId) {
    template = Storage.getCustomTemplates().find(t => t.id === editId);
    if (!template) { window.location.hash = ''; return; }
  }

  let name = template ? template.name : '';
  let exercises = template ? JSON.parse(JSON.stringify(template.exercises)) : [];

  function render() {
    let html = `
      <div class="header">
        <div class="header-row">
          <button class="back-btn" id="back-btn">← Back</button>
        </div>
        <h1>${editId ? 'Edit' : 'Create'} Workout</h1>
      </div>

      <div class="settings-card">
        <div class="settings-row">
          <label class="settings-label" for="template-name">Workout Name</label>
          <input type="text" id="template-name" class="settings-input" value="${name}" placeholder="e.g. Push Day">
        </div>
      </div>

      <div class="section-title">Exercises</div>
    `;

    exercises.forEach((ex, i) => {
      const exerciseDef = EXERCISES[ex.exerciseId];
      const exName = exerciseDef ? exerciseDef.name : ex.exerciseId;
      html += `
        <div class="card template-exercise-card">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div class="card-title">${exName}</div>
              <div class="card-meta">${ex.sets}×${ex.reps} · Group ${ex.group}</div>
            </div>
            <button class="icon-btn remove-exercise-btn" data-index="${i}" title="Remove">✕</button>
          </div>
        </div>
      `;
    });

    html += `
      <div class="section-title">Add Exercise</div>
      <input type="text" id="exercise-search" class="settings-input" placeholder="Search exercises..." style="margin-bottom:12px;width:100%">
      <div id="exercise-search-results"></div>

      <div class="mt-16" style="display:flex;gap:8px">
        <button class="btn btn-primary" id="save-template-btn" style="flex:1">Save</button>
        ${editId ? '<button class="btn btn-secondary" id="delete-template-btn" style="flex:1;color:#ef4444">Delete</button>' : ''}
      </div>
      <div class="pb-32"></div>
    `;

    app.innerHTML = html;

    // Name input
    document.getElementById('template-name').addEventListener('input', (e) => {
      name = e.target.value;
    });

    // Search
    const searchInput = document.getElementById('exercise-search');
    const searchResults = document.getElementById('exercise-search-results');

    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase().trim();
      if (!query) { searchResults.innerHTML = ''; return; }

      const matches = Object.values(EXERCISES).filter(ex =>
        ex.name.toLowerCase().includes(query) || ex.id.toLowerCase().includes(query)
      ).slice(0, 6);

      searchResults.innerHTML = matches.map(ex =>
        `<div class="card exercise-search-result" data-exercise-id="${ex.id}">
          <div class="card-title">${ex.name}</div>
          <div class="card-meta">${ex.equipment}</div>
        </div>`
      ).join('');

      searchResults.querySelectorAll('.exercise-search-result').forEach(card => {
        card.addEventListener('click', () => {
          const exId = card.dataset.exerciseId;
          const group = String.fromCharCode(65 + exercises.length); // A, B, C...
          exercises.push({ exerciseId: exId, sets: 3, reps: '8-12', rpe: null, group });
          searchInput.value = '';
          render();
        });
      });
    });

    // Remove exercise buttons
    app.querySelectorAll('.remove-exercise-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.index);
        exercises.splice(idx, 1);
        render();
      });
    });

    // Back
    document.getElementById('back-btn').addEventListener('click', () => {
      window.location.hash = '';
    });

    // Save
    document.getElementById('save-template-btn').addEventListener('click', () => {
      if (!name.trim()) { alert('Please enter a workout name'); return; }
      if (exercises.length === 0) { alert('Please add at least one exercise'); return; }

      const tmpl = {
        id: editId || ('custom_' + Date.now()),
        name: name.trim(),
        exercises: exercises
      };
      Storage.saveCustomTemplate(tmpl);
      window.location.hash = '';
    });

    // Delete
    const deleteBtn = document.getElementById('delete-template-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (confirm('Delete this workout template?')) {
          Storage.deleteCustomTemplate(editId);
          window.location.hash = '';
        }
      });
    }
  }

  render();
}
