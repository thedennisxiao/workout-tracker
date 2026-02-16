const Storage = {
  _get(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  },

  _set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  // Get all completed workout logs
  getLogs() {
    return this._get('workout_logs') || [];
  },

  // Save a completed workout
  saveLog(log) {
    const logs = this.getLogs();
    logs.push(log);
    this._set('workout_logs', logs);
  },

  // Get the most recent log for a given template
  getLastLog(templateId) {
    const logs = this.getLogs();
    for (let i = logs.length - 1; i >= 0; i--) {
      if (logs[i].templateId === templateId) return logs[i];
    }
    return null;
  },

  // Get last logged exercise entry (sets + note) for a specific exercise within a template
  getLastExerciseEntry(templateId, exerciseId) {
    const log = this.getLastLog(templateId);
    if (!log) return null;
    return log.exercises.find(e => e.exerciseId === exerciseId) || null;
  },

  // Get last logged sets for a specific exercise within a template
  getLastExerciseSets(templateId, exerciseId) {
    const entry = this.getLastExerciseEntry(templateId, exerciseId);
    return entry ? entry.sets : null;
  },

  // Get last completed date for a template
  getLastDate(templateId) {
    const log = this.getLastLog(templateId);
    return log ? log.date : null;
  },

  // Active session management (survives page refresh)
  saveActiveSession(session) {
    this._set('active_session', session);
  },

  getActiveSession() {
    return this._get('active_session');
  },

  clearActiveSession() {
    localStorage.removeItem('active_session');
  },

  getRestTime(exerciseId) {
    const overrides = this._get('rest_times') || {};
    if (overrides[exerciseId] != null) return overrides[exerciseId];
    return EXERCISES[exerciseId]?.restSeconds || 90;
  },

  setRestTime(exerciseId, seconds) {
    const overrides = this._get('rest_times') || {};
    overrides[exerciseId] = seconds;
    this._set('rest_times', overrides);
  },

  getLogById(logId) {
    return this.getLogs().find(l => l.id === logId) || null;
  },

  deleteLog(logId) {
    const logs = this.getLogs().filter(l => l.id !== logId);
    this._set('workout_logs', logs);
  },

  getBodyweight() {
    return this._get('bodyweight') || null;
  },

  setBodyweight(lbs) {
    this._set('bodyweight', lbs);
  },

  getGender() {
    return this._get('gender') || 'male';
  },

  setGender(gender) {
    this._set('gender', gender);
  },

  getCustomTemplates() {
    return this._get('custom_templates') || [];
  },

  saveCustomTemplate(template) {
    const templates = this.getCustomTemplates();
    const idx = templates.findIndex(t => t.id === template.id);
    if (idx >= 0) {
      templates[idx] = template;
    } else {
      templates.push(template);
    }
    this._set('custom_templates', templates);
  },

  deleteCustomTemplate(id) {
    const templates = this.getCustomTemplates().filter(t => t.id !== id);
    this._set('custom_templates', templates);
  },

  exportAll() {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      workout_logs: this.getLogs(),
      rest_times: this._get('rest_times') || {},
      bodyweight: this.getBodyweight(),
      gender: this.getGender(),
      custom_templates: this.getCustomTemplates()
    };
  },

  getLogsByMonth(year, month) {
    return this.getLogs().filter(log => {
      const d = new Date(log.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  },

  getLogsByDate(dateStr) {
    return this.getLogs().filter(log => {
      const d = new Date(log.date);
      const local = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
      return local === dateStr;
    });
  },

  getExerciseHistory(exerciseId) {
    const logs = this.getLogs().sort((a, b) => new Date(a.date) - new Date(b.date));
    const results = [];
    logs.forEach(log => {
      const ex = log.exercises.find(e => e.exerciseId === exerciseId);
      if (!ex || ex.sets.length === 0) return;
      let maxWeight = 0;
      let totalVolume = 0;
      let maxReps = 0;
      ex.sets.forEach(s => {
        const w = Number(s.weight) || 0;
        const r = Number(s.reps) || 0;
        if (w > maxWeight) maxWeight = w;
        if (r > maxReps) maxReps = r;
        totalVolume += r * w;
      });
      results.push({ date: log.date, sets: ex.sets, maxWeight, totalVolume, maxReps });
    });
    return results;
  },

  importData(data, mode) {
    if (mode === 'replace') {
      this._set('workout_logs', data.workout_logs || []);
      if (data.rest_times) this._set('rest_times', data.rest_times);
      if (data.bodyweight != null) this.setBodyweight(data.bodyweight);
      if (data.gender) this.setGender(data.gender);
      if (data.custom_templates) this._set('custom_templates', data.custom_templates);
    } else {
      // merge mode
      const existing = this.getLogs();
      const existingIds = new Set(existing.map(l => l.id));
      const newLogs = (data.workout_logs || []).filter(l => !existingIds.has(l.id));
      this._set('workout_logs', [...existing, ...newLogs]);
      if (data.rest_times) {
        const currentRest = this._get('rest_times') || {};
        this._set('rest_times', { ...currentRest, ...data.rest_times });
      }
      if (data.bodyweight != null && !this.getBodyweight()) this.setBodyweight(data.bodyweight);
      if (data.gender && !this._get('gender')) this.setGender(data.gender);
      if (data.custom_templates) {
        const existing = this.getCustomTemplates();
        const existingIds = new Set(existing.map(t => t.id));
        const newTemplates = data.custom_templates.filter(t => !existingIds.has(t.id));
        this._set('custom_templates', [...existing, ...newTemplates]);
      }
    }
  }
};
