function createSetTable(sets, onUpdate, onSetDone) {
  const container = document.createElement('div');
  container.className = 'set-table';

  container.innerHTML = `
    <div class="set-table-header">
      <span style="text-align:center">Set</span>
      <span style="text-align:center">Reps</span>
      <span style="text-align:center">Weight</span>
      <span></span>
    </div>
  `;

  function renderRows() {
    // Remove existing rows
    container.querySelectorAll('.set-row').forEach(r => r.remove());

    sets.forEach((set, i) => {
      const row = document.createElement('div');
      row.className = 'set-row';
      row.innerHTML = `
        <span class="set-number" data-index="${i}">${i + 1}</span>
        <input class="set-input" type="number" inputmode="numeric" value="${set.reps || ''}" data-index="${i}" data-field="reps" placeholder="—">
        <input class="set-input" type="number" inputmode="decimal" value="${set.weight || ''}" data-index="${i}" data-field="weight" placeholder="—">
        <button class="set-check ${set.done ? 'checked' : ''}" data-index="${i}">✓</button>
      `;
      container.appendChild(row);
    });

    // Delete set on tap set number
    container.querySelectorAll('.set-number').forEach(num => {
      num.addEventListener('click', (e) => {
        if (sets.length <= 1) return;
        const idx = parseInt(e.target.dataset.index);
        e.target.classList.add('deleting');
        e.target.textContent = '✕';
        setTimeout(() => {
          sets.splice(idx, 1);
          renderRows();
          onUpdate(sets);
        }, 200);
      });
    });

    // Event listeners
    container.querySelectorAll('.set-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.index);
        const field = e.target.dataset.field;
        sets[idx][field] = e.target.value ? parseFloat(e.target.value) : null;
        onUpdate(sets);
      });
      // Select all on focus for easy overwriting
      input.addEventListener('focus', (e) => e.target.select());
    });

    container.querySelectorAll('.set-check').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        sets[idx].done = !sets[idx].done;
        e.target.classList.toggle('checked');
        onUpdate(sets);
        if (sets[idx].done && onSetDone) {
          onSetDone(idx);
        }
      });
    });
  }

  renderRows();

  container.addSet = function(defaultReps) {
    sets.push({ reps: defaultReps, weight: null, done: false });
    renderRows();
    onUpdate(sets);
  };

  container.getSets = () => sets;

  return container;
}
