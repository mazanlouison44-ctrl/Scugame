export type WeightUnit = 'kg' | 'lbs';

export type MuscleCategory =
  | 'Pectoraux'
  | 'Dos'
  | 'Jambes'
  | 'Fessiers'
  | 'Mollets'
  | 'Épaules'
  | 'Bras'
  | 'Avant-bras'
  | 'Abdominaux'
  | 'Full Body';

export type EquipmentType =
  | 'Barre'
  | 'Haltères'
  | 'Machines'
  | 'Poulies'
  | 'Poids du corps'
  | 'Kettlebell'
  | 'Élastiques'
  | 'TRX';

export type DifficultyLevel = 'easy' | 'good' | 'hard' | 'failure';

export interface Exercise {
  id: string;
  name: string;
  category: MuscleCategory;
  equipment: EquipmentType;
  defaultIncrementKg: number;
  isCustom?: boolean;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  weight: number; // stored in kg internally
  reps: number;
  completed: boolean;
  rpe?: DifficultyLevel;
}

export type GoalType =
  | 'add_rep'
  | 'add_weight'
  | 'add_set'
  | 'maintain_form'
  | 'maintain_load'
  | 'deload';

export interface ExerciseGoal {
  exerciseId: string;
  type: GoalType;
  targetSets: number;
  targetReps: number;
  targetWeight: number; // in kg
  title: string;
  reason: string;
  badgeText: string;
}

export interface WorkoutExerciseLog {
  id: string;
  exerciseId: string;
  sets: WorkoutSet[];
  difficulty?: DifficultyLevel;
  note?: string;
  goalAtStart?: ExerciseGoal;
  goalStatus?: 'accepted' | 'modified' | 'ignored';
  goalAchieved?: boolean;
}

export interface PRRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  weight: number; // in kg
  reps: number;
  estimated1RM: number; // Epley formula in kg
  date: string;
  type: 'max_weight' | 'best_volume_set' | 'best_reps';
}

export interface WorkoutSession {
  id: string;
  title: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  exercises: WorkoutExerciseLog[];
  xpEarned: number;
  prsAchieved: PRRecord[];
  goalsAchievedCount: number;
  synced?: boolean;
}

export interface ActiveWorkoutDraft {
  id: string;
  title: string;
  startedAt: string;
  exercises: WorkoutExerciseLog[];
  lastSavedAt: string;
}

export interface BadgeDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpBonus: number;
}

export interface MissionProgress {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  xpReward: number;
  completed: boolean;
}

export interface UserProfile {
  name: string;
  unit: WeightUnit;
  weeklyTarget: number; // 2 to 5 sessions per week
  restTimerSeconds: number;
  xp: number;
  level: number;
  unlockedBadges: string[];
  onboardingDone: boolean;
  createdAt: string;
}
