const STRENGTH_CATEGORIES = [
  { id: 'squat', label: 'Squat', exerciseIds: ['squat'] },
  { id: 'floor_pull', label: 'Floor Pull', exerciseIds: ['rdl'] },
  { id: 'horizontal_press', label: 'Horizontal Press', exerciseIds: ['db_incline', 'seated_cable_press'] },
  { id: 'vertical_press', label: 'Vertical Press', exerciseIds: ['ohp'] },
  { id: 'pullup', label: 'Pull-up', exerciseIds: ['ng_chinup'] }
];

// 5 thresholds per category — BW ratio boundaries
// Levels: Untrained | Beginner | Novice | Intermediate | Advanced | Elite
const STRENGTH_THRESHOLDS = {
  male: {
    squat:            [0.75, 1.25, 1.75, 2.25, 2.75],
    floor_pull:       [0.75, 1.25, 1.75, 2.25, 2.75],
    horizontal_press: [0.50, 0.75, 1.00, 1.50, 1.75],
    vertical_press:   [0.35, 0.55, 0.75, 1.00, 1.25],
    pullup:           [0.50, 0.75, 1.00, 1.25, 1.50]
  },
  female: {
    squat:            [0.50, 0.75, 1.00, 1.50, 1.75],
    floor_pull:       [0.50, 0.75, 1.00, 1.50, 1.75],
    horizontal_press: [0.30, 0.50, 0.65, 0.85, 1.10],
    vertical_press:   [0.20, 0.35, 0.50, 0.65, 0.80],
    pullup:           [0.30, 0.50, 0.65, 0.85, 1.00]
  }
};

const STRENGTH_LEVELS = ['Untrained', 'Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite'];
