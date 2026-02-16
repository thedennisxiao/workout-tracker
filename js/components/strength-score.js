function wathanEstimate1RM(weight, reps) {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  return (weight * 100) / (48.8 + 53.8 * Math.exp(-0.075 * reps));
}

function computeStrengthScore() {
  const bodyweight = Storage.getBodyweight();
  const gender = Storage.getGender();

  if (!bodyweight || bodyweight <= 0) {
    return { bodyweight: null, gender, categories: [], overallScore: 0, overallLevel: STRENGTH_LEVELS[0], hasData: false };
  }

  const thresholds = STRENGTH_THRESHOLDS[gender] || STRENGTH_THRESHOLDS.male;
  const categories = [];

  STRENGTH_CATEGORIES.forEach(cat => {
    let max1RM = 0;
    let bestExerciseId = cat.exerciseIds[0];

    cat.exerciseIds.forEach(exId => {
      const history = Storage.getExerciseHistory(exId);
      history.forEach(session => {
        session.sets.forEach(set => {
          const reps = Number(set.reps) || 0;
          const weight = Number(set.weight) || 0;
          let est;
          if (weight === 0) {
            // Bodyweight exercise
            est = wathanEstimate1RM(bodyweight, reps);
          } else {
            est = wathanEstimate1RM(weight, reps);
          }
          if (est > max1RM) {
            max1RM = est;
            bestExerciseId = exId;
          }
        });
      });
    });

    const bwRatio = max1RM / bodyweight;
    const catThresholds = thresholds[cat.id] || [0.5, 0.75, 1.0, 1.5, 2.0];
    let levelIndex = 0;
    for (let i = 0; i < catThresholds.length; i++) {
      if (bwRatio >= catThresholds[i]) levelIndex = i + 1;
    }

    // Score 0-100: interpolate within level
    let score = 0;
    const levelWidth = 100 / STRENGTH_LEVELS.length; // ~16.67
    if (levelIndex === 0) {
      const pct = catThresholds[0] > 0 ? Math.min(bwRatio / catThresholds[0], 1) : 0;
      score = pct * levelWidth;
    } else if (levelIndex >= catThresholds.length) {
      // At or above last threshold
      score = levelIndex * levelWidth;
      const excess = bwRatio - catThresholds[catThresholds.length - 1];
      score = Math.min(score + excess * 5, 100);
    } else {
      const lower = catThresholds[levelIndex - 1];
      const upper = catThresholds[levelIndex];
      const pct = upper > lower ? (bwRatio - lower) / (upper - lower) : 0;
      score = (levelIndex + pct) * levelWidth;
    }
    score = Math.min(Math.round(score), 100);

    categories.push({
      id: cat.id,
      label: cat.label,
      exerciseId: bestExerciseId,
      estimated1RM: Math.round(max1RM),
      bwRatio: Math.round(bwRatio * 100) / 100,
      level: STRENGTH_LEVELS[levelIndex],
      levelIndex,
      score
    });
  });

  const hasAnyData = categories.some(c => c.estimated1RM > 0);
  const scored = categories.filter(c => c.estimated1RM > 0);
  const overallScore = scored.length > 0
    ? Math.round(scored.reduce((sum, c) => sum + c.score, 0) / scored.length)
    : 0;
  const avgLevelIndex = scored.length > 0
    ? Math.round(scored.reduce((sum, c) => sum + c.levelIndex, 0) / scored.length)
    : 0;

  return {
    bodyweight,
    gender,
    categories,
    overallScore,
    overallLevel: STRENGTH_LEVELS[avgLevelIndex],
    hasData: hasAnyData
  };
}

const LEVEL_COLORS = ['#888888', '#22c55e', '#3b82f6', '#8B5CF6', '#f59e0b', '#ef4444'];

function createStrengthScoreCard(data, compact) {
  const card = document.createElement('div');

  if (!data || !data.hasData) {
    if (compact) {
      card.className = 'card strength-card-compact';
      card.innerHTML = `
        <div class="strength-compact-inner">
          <div class="strength-score-circle" style="border-color: #888">
            <span class="strength-score-number">--</span>
          </div>
          <div class="strength-compact-text">
            <div class="strength-compact-label">Strength Score</div>
            <div class="strength-compact-sublabel">Set bodyweight in settings</div>
          </div>
        </div>
      `;
      return card;
    }
    card.className = 'strength-detail-empty';
    card.innerHTML = '<div class="empty-state">Set your bodyweight above to see strength scores</div>';
    return card;
  }

  if (compact) {
    card.className = 'card strength-card-compact';
    const color = LEVEL_COLORS[Math.min(Math.floor(data.overallScore / 16.67), 5)];
    card.innerHTML = `
      <div class="strength-compact-inner">
        <div class="strength-score-circle" style="border-color: ${color}">
          <span class="strength-score-number">${data.overallScore}</span>
        </div>
        <div class="strength-compact-text">
          <div class="strength-compact-label">Strength Score</div>
          <div class="strength-compact-sublabel">${data.overallLevel}</div>
        </div>
        <span class="strength-compact-arrow">›</span>
      </div>
    `;
    return card;
  }

  // Full detail view
  card.className = 'strength-detail';
  let barsHtml = '';
  data.categories.forEach(cat => {
    const exercise = EXERCISES[cat.exerciseId];
    const exName = exercise ? exercise.name : cat.exerciseId;
    const color = LEVEL_COLORS[cat.levelIndex];
    const pct = Math.max(cat.score, 2);
    barsHtml += `
      <div class="strength-bar-row">
        <div class="strength-bar-header">
          <span class="strength-bar-label">${cat.label}</span>
          <span class="strength-bar-detail">${cat.estimated1RM > 0 ? cat.estimated1RM + ' lbs · ' + cat.bwRatio + 'x BW · ' + cat.level : 'No data'}</span>
        </div>
        <div class="strength-bar-track">
          <div class="strength-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
        <div class="strength-bar-exercise">${cat.estimated1RM > 0 ? exName : ''}</div>
      </div>
    `;
  });

  card.innerHTML = `
    <div class="strength-detail-header">
      <div class="strength-score-circle strength-score-circle-lg" style="border-color: ${LEVEL_COLORS[Math.min(Math.floor(data.overallScore / 16.67), 5)]}">
        <span class="strength-score-number strength-score-number-lg">${data.overallScore}</span>
      </div>
      <div>
        <div class="strength-detail-level">${data.overallLevel}</div>
        <div class="strength-detail-meta">${data.bodyweight} lbs · ${data.gender}</div>
      </div>
    </div>
    <div class="strength-bars">${barsHtml}</div>
  `;

  return card;
}
