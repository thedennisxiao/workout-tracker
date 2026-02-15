const EXERCISES = {
  squat: { id: 'squat', name: 'Back Squat', equipment: 'Barbell', restSeconds: 180 },
  rdl: { id: 'rdl', name: 'Romanian Deadlift', equipment: 'Barbell', restSeconds: 180 },
  db_lateral_raise: { id: 'db_lateral_raise', name: 'Dumbbell Lateral Raises', equipment: 'Dumbbell', restSeconds: 90 },
  sa_cable_row: { id: 'sa_cable_row', name: 'Single Arm Cable Row', equipment: 'Cable', unilateral: true, restSeconds: 120 },
  rear_delt_fly: { id: 'rear_delt_fly', name: 'Rear Delt Flyes', equipment: 'Dumbbell', restSeconds: 90 },
  cable_crunch: { id: 'cable_crunch', name: 'Cable Crunch', equipment: 'Cable', restSeconds: 90 },
  face_pull: { id: 'face_pull', name: 'Face Pulls', equipment: 'Cable', restSeconds: 90 },
  ohp: { id: 'ohp', name: 'Barbell OHP', equipment: 'Barbell', restSeconds: 180 },
  ng_chinup: { id: 'ng_chinup', name: 'Neutral Grip Chin-ups', equipment: 'Bodyweight', restSeconds: 120 },
  db_incline: { id: 'db_incline', name: 'Incline DB Press', equipment: 'Dumbbell', restSeconds: 120 },
  seal_row: { id: 'seal_row', name: 'Seal Row', equipment: 'Barbell', restSeconds: 120 },
  seated_cable_press: { id: 'seated_cable_press', name: 'Seated Cable Press', equipment: 'Cable', restSeconds: 120 },
  incline_db_curl: { id: 'incline_db_curl', name: 'Incline DB Curls', equipment: 'Dumbbell', unilateral: true, restSeconds: 90 },
  tricep_pushdown: { id: 'tricep_pushdown', name: 'Tricep Pushdowns', equipment: 'Cable', restSeconds: 90 },
  ff_split_squat: { id: 'ff_split_squat', name: 'Front Foot Elevated Split Squat', equipment: 'Dumbbell', unilateral: true, restSeconds: 120 },
  seated_ham_curl: { id: 'seated_ham_curl', name: 'Seated Hamstring Curls', equipment: 'Machine', restSeconds: 120 },
  seated_cable_fly: { id: 'seated_cable_fly', name: 'Seated Cable Fly', equipment: 'Cable', restSeconds: 120 },
  box_jump: { id: 'box_jump', name: 'Box Jumps', equipment: 'Box', restSeconds: 120 },
  db_skullcrusher: { id: 'db_skullcrusher', name: 'Dumbbell Skullcrushers', equipment: 'Dumbbell', restSeconds: 90 },
  hang_power_clean: { id: 'hang_power_clean', name: 'Hang Power Clean', equipment: 'Barbell', restSeconds: 180 },
};

const WORKOUT_TEMPLATES = [
  {
    id: 'day1',
    name: 'Day 1 - Lower Emphasis',
    exercises: [
      { exerciseId: 'squat', sets: 3, reps: '6-8', rpe: '7-8', group: 'A' },
      { exerciseId: 'rdl', sets: 3, reps: '8-10', rpe: null, group: 'B1' },
      { exerciseId: 'db_lateral_raise', sets: 3, reps: '12-15', rpe: null, group: 'B2' },
      { exerciseId: 'sa_cable_row', sets: 3, reps: '8-12', rpe: null, group: 'C1' },
      { exerciseId: 'rear_delt_fly', sets: 3, reps: '15-20', rpe: null, group: 'C2' },
      { exerciseId: 'cable_crunch', sets: 3, reps: '12-16', rpe: null, group: 'D1' },
      { exerciseId: 'face_pull', sets: 3, reps: '15-20', rpe: null, group: 'D2' },
    ]
  },
  {
    id: 'day2',
    name: 'Day 2 - Upper Push Emphasis',
    exercises: [
      { exerciseId: 'ohp', sets: 3, reps: '6-8', rpe: '7-8', group: 'A1' },
      { exerciseId: 'ng_chinup', sets: 3, reps: '6-10', rpe: null, group: 'A2' },
      { exerciseId: 'db_incline', sets: 3, reps: '8-12', rpe: null, group: 'B1' },
      { exerciseId: 'seal_row', sets: 3, reps: '8-12', rpe: null, group: 'B2' },
      { exerciseId: 'seated_cable_press', sets: 3, reps: '8-12', rpe: null, group: 'C1' },
      { exerciseId: 'incline_db_curl', sets: 3, reps: '8-12', rpe: null, group: 'C2' },
      { exerciseId: 'tricep_pushdown', sets: 3, reps: '12-15', rpe: null, group: 'D1' },
      { exerciseId: 'db_lateral_raise', sets: 3, reps: '12-15', rpe: null, group: 'D2' },
    ]
  },
  {
    id: 'day3',
    name: 'Day 3 - Lower Emphasis',
    exercises: [
      { exerciseId: 'rdl', sets: 3, reps: '6-8', rpe: '8', group: 'A' },
      { exerciseId: 'ff_split_squat', sets: 3, reps: '8-10', rpe: null, group: 'B1' },
      { exerciseId: 'seated_ham_curl', sets: 3, reps: '8-12', rpe: null, group: 'B2' },
      { exerciseId: 'seated_cable_fly', sets: 3, reps: '12-15', rpe: null, group: 'C1' },
      { exerciseId: 'db_lateral_raise', sets: 3, reps: '12-15', rpe: null, group: 'C2' },
      { exerciseId: 'cable_crunch', sets: 3, reps: '12-16', rpe: null, group: 'D1' },
      { exerciseId: 'face_pull', sets: 3, reps: '15-20', rpe: null, group: 'D2' },
    ]
  },
  {
    id: 'day4',
    name: 'Day 4 - Athletic/Upper Volume',
    exercises: [
      { exerciseId: 'hang_power_clean', sets: 5, reps: '2-3', rpe: null, group: 'A' },
      { exerciseId: 'box_jump', sets: 4, reps: '3-5', rpe: null, group: 'B' },
      { exerciseId: 'squat', sets: 3, reps: '6-8', rpe: '7', group: 'C' },
      { exerciseId: 'db_incline', sets: 3, reps: '8-12', rpe: null, group: 'D1' },
      { exerciseId: 'ng_chinup', sets: 3, reps: 'AMRAP-2', rpe: null, group: 'D2' },
      { exerciseId: 'db_skullcrusher', sets: 3, reps: '8-12', rpe: null, group: 'E1' },
      { exerciseId: 'incline_db_curl', sets: 3, reps: '8-12', rpe: null, group: 'E2' },
      { exerciseId: 'face_pull', sets: 3, reps: '15-20', rpe: null, group: 'F1' },
      { exerciseId: 'tricep_pushdown', sets: 3, reps: '12-15', rpe: null, group: 'F2' },
    ]
  }
];
