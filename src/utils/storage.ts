import {
  ActiveWorkoutDraft,
  Exercise,
  ExerciseGoal,
  UserProfile,
  WorkoutSession,
} from '../types';
import { DEFAULT_EXERCISES } from '../data/exercises';
import { computeNextGoalForExercise } from './goalsEngine';

const KEYS = {
  PROFILE: 'scugame_profile_v1',
  EXERCISES: 'scugame_custom_exercises_v1',
  SESSIONS: 'scugame_sessions_v1',
  GOALS: 'scugame_goals_v1',
  ACTIVE_DRAFT: 'scugame_active_draft_v1',
};

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Athlète',
  unit: 'kg',
  weeklyTarget: 3,
  restTimerSeconds: 90,
  xp: 0,
  level: 1,
  unlockedBadges: [],
  onboardingDone: false,
  createdAt: new Date().toISOString(),
};

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(KEYS.PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
}

export function loadCustomExercises(): Exercise[] {
  try {
    const raw = localStorage.getItem(KEYS.EXERCISES);
    if (!raw) return [];
    const parsed: any[] = JSON.parse(raw);
    return parsed.map((ex) => ({
      ...ex,
      category: ex.category === 'Abdos' ? 'Abdominaux' : ex.category,
      equipment:
        ex.equipment === 'Machine'
          ? 'Machines'
          : ex.equipment === 'Poulie'
          ? 'Poulies'
          : ex.equipment,
    }));
  } catch {
    return [];
  }
}

export function saveCustomExercises(customs: Exercise[]): void {
  localStorage.setItem(KEYS.EXERCISES, JSON.stringify(customs));
}

export function getAllExercises(customs: Exercise[]): Exercise[] {
  return [...DEFAULT_EXERCISES, ...customs];
}

export function loadSessions(): WorkoutSession[] {
  try {
    const raw = localStorage.getItem(KEYS.SESSIONS);
    if (!raw) return [];
    const parsed: WorkoutSession[] = JSON.parse(raw);
    return parsed.sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  } catch {
    return [];
  }
}

export function saveSessions(sessions: WorkoutSession[]): void {
  localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
}

export function loadGoals(): Record<string, ExerciseGoal> {
  try {
    const raw = localStorage.getItem(KEYS.GOALS);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveGoals(goals: Record<string, ExerciseGoal>): void {
  localStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
}

export function loadActiveDraft(): ActiveWorkoutDraft | null {
  try {
    const raw = localStorage.getItem(KEYS.ACTIVE_DRAFT);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveActiveDraft(draft: ActiveWorkoutDraft | null): void {
  if (!draft) {
    localStorage.removeItem(KEYS.ACTIVE_DRAFT);
  } else {
    localStorage.setItem(
      KEYS.ACTIVE_DRAFT,
      JSON.stringify({ ...draft, lastSavedAt: new Date().toISOString() })
    );
  }
}

/**
 * Generates realistic demo sessions over the past 3 weeks so the user can
 * immediately explore charts, automatic goals, PRs, and gamification.
 */
export function seedDemoData(userName = 'Alex'): {
  profile: UserProfile;
  sessions: WorkoutSession[];
  goals: Record<string, ExerciseGoal>;
} {
  const now = new Date();
  const daysAgo = (d: number) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() - d);
    return dt.toISOString();
  };

  const s1Date = daysAgo(14);
  const s2Date = daysAgo(11);
  const s3Date = daysAgo(7);
  const s4Date = daysAgo(4);
  const s5Date = daysAgo(2);

  const sessions: WorkoutSession[] = [
    {
      id: 'demo-s5',
      title: 'Haut du Corps (Push / Pull)',
      startedAt: s5Date,
      completedAt: s5Date,
      durationSeconds: 2580,
      xpEarned: 165,
      goalsAchievedCount: 2,
      synced: true,
      prsAchieved: [
        {
          id: 'pr-demo-1',
          exerciseId: 'bench-press',
          exerciseName: 'Développé couché barre',
          weight: 62.5,
          reps: 8,
          estimated1RM: 79.2,
          date: s5Date,
          type: 'max_weight',
        },
      ],
      exercises: [
        {
          id: 'log-s5-1',
          exerciseId: 'bench-press',
          difficulty: 'good',
          note: 'Bonne explosivité sur les 2 premières séries',
          goalAchieved: true,
          sets: [
            { id: 's5-1-1', setNumber: 1, weight: 62.5, reps: 8, completed: true, rpe: 'good' },
            { id: 's5-1-2', setNumber: 2, weight: 62.5, reps: 8, completed: true, rpe: 'good' },
            { id: 's5-1-3', setNumber: 3, weight: 62.5, reps: 8, completed: true, rpe: 'good' },
          ],
        },
        {
          id: 'log-s5-2',
          exerciseId: 'seated-cable-row',
          difficulty: 'hard',
          goalAchieved: true,
          sets: [
            { id: 's5-2-1', setNumber: 1, weight: 55, reps: 10, completed: true, rpe: 'good' },
            { id: 's5-2-2', setNumber: 2, weight: 55, reps: 10, completed: true, rpe: 'hard' },
            { id: 's5-2-3', setNumber: 3, weight: 55, reps: 8, completed: true, rpe: 'hard' },
          ],
        },
        {
          id: 'log-s5-3',
          exerciseId: 'overhead-press',
          difficulty: 'good',
          goalAchieved: false,
          sets: [
            { id: 's5-3-1', setNumber: 1, weight: 18, reps: 10, completed: true, rpe: 'good' },
            { id: 's5-3-2', setNumber: 2, weight: 18, reps: 10, completed: true, rpe: 'good' },
            { id: 's5-3-3', setNumber: 3, weight: 18, reps: 9, completed: true, rpe: 'good' },
          ],
        },
      ],
    },
    {
      id: 'demo-s4',
      title: 'Bas du Corps & Gainage',
      startedAt: s4Date,
      completedAt: s4Date,
      durationSeconds: 2700,
      xpEarned: 150,
      goalsAchievedCount: 2,
      synced: true,
      prsAchieved: [
        {
          id: 'pr-demo-2',
          exerciseId: 'barbell-squat',
          exerciseName: 'Squat barre',
          weight: 80,
          reps: 8,
          estimated1RM: 101.3,
          date: s4Date,
          type: 'max_weight',
        },
      ],
      exercises: [
        {
          id: 'log-s4-1',
          exerciseId: 'barbell-squat',
          difficulty: 'good',
          goalAchieved: true,
          sets: [
            { id: 's4-1-1', setNumber: 1, weight: 80, reps: 8, completed: true, rpe: 'good' },
            { id: 's4-1-2', setNumber: 2, weight: 80, reps: 8, completed: true, rpe: 'good' },
            { id: 's4-1-3', setNumber: 3, weight: 80, reps: 8, completed: true, rpe: 'good' },
          ],
        },
        {
          id: 'log-s4-2',
          exerciseId: 'leg-press',
          difficulty: 'easy',
          goalAchieved: true,
          sets: [
            { id: 's4-2-1', setNumber: 1, weight: 130, reps: 12, completed: true, rpe: 'easy' },
            { id: 's4-2-2', setNumber: 2, weight: 130, reps: 12, completed: true, rpe: 'easy' },
            { id: 's4-2-3', setNumber: 3, weight: 130, reps: 12, completed: true, rpe: 'good' },
          ],
        },
      ],
    },
    {
      id: 'demo-s3',
      title: 'Full Body Essentiel',
      startedAt: s3Date,
      completedAt: s3Date,
      durationSeconds: 2400,
      xpEarned: 140,
      goalsAchievedCount: 1,
      synced: true,
      prsAchieved: [],
      exercises: [
        {
          id: 'log-s3-1',
          exerciseId: 'bench-press',
          difficulty: 'good',
          goalAchieved: true,
          sets: [
            { id: 's3-1-1', setNumber: 1, weight: 60, reps: 10, completed: true },
            { id: 's3-1-2', setNumber: 2, weight: 60, reps: 10, completed: true },
            { id: 's3-1-3', setNumber: 3, weight: 60, reps: 10, completed: true },
          ],
        },
        {
          id: 'log-s3-2',
          exerciseId: 'lat-pulldown',
          difficulty: 'good',
          sets: [
            { id: 's3-2-1', setNumber: 1, weight: 50, reps: 10, completed: true },
            { id: 's3-2-2', setNumber: 2, weight: 50, reps: 10, completed: true },
            { id: 's3-2-3', setNumber: 3, weight: 50, reps: 10, completed: true },
          ],
        },
        {
          id: 'log-s3-3',
          exerciseId: 'barbell-squat',
          difficulty: 'good',
          sets: [
            { id: 's3-3-1', setNumber: 1, weight: 77.5, reps: 8, completed: true },
            { id: 's3-3-2', setNumber: 2, weight: 77.5, reps: 8, completed: true },
            { id: 's3-3-3', setNumber: 3, weight: 77.5, reps: 8, completed: true },
          ],
        },
      ],
    },
    {
      id: 'demo-s2',
      title: 'Haut du Corps (Push / Pull)',
      startedAt: s2Date,
      completedAt: s2Date,
      durationSeconds: 2350,
      xpEarned: 120,
      goalsAchievedCount: 1,
      synced: true,
      prsAchieved: [],
      exercises: [
        {
          id: 'log-s2-1',
          exerciseId: 'bench-press',
          difficulty: 'good',
          sets: [
            { id: 's2-1-1', setNumber: 1, weight: 60, reps: 9, completed: true },
            { id: 's2-1-2', setNumber: 2, weight: 60, reps: 9, completed: true },
            { id: 's2-1-3', setNumber: 3, weight: 60, reps: 9, completed: true },
          ],
        },
        {
          id: 'log-s2-2',
          exerciseId: 'seated-cable-row',
          difficulty: 'good',
          sets: [
            { id: 's2-2-1', setNumber: 1, weight: 52.5, reps: 10, completed: true },
            { id: 's2-2-2', setNumber: 2, weight: 52.5, reps: 10, completed: true },
            { id: 's2-2-3', setNumber: 3, weight: 52.5, reps: 10, completed: true },
          ],
        },
      ],
    },
    {
      id: 'demo-s1',
      title: 'Séance Découverte Full Body',
      startedAt: s1Date,
      completedAt: s1Date,
      durationSeconds: 2100,
      xpEarned: 110,
      goalsAchievedCount: 0,
      synced: true,
      prsAchieved: [],
      exercises: [
        {
          id: 'log-s1-1',
          exerciseId: 'bench-press',
          difficulty: 'good',
          sets: [
            { id: 's1-1-1', setNumber: 1, weight: 57.5, reps: 8, completed: true },
            { id: 's1-1-2', setNumber: 2, weight: 57.5, reps: 8, completed: true },
            { id: 's1-1-3', setNumber: 3, weight: 57.5, reps: 8, completed: true },
          ],
        },
        {
          id: 'log-s1-2',
          exerciseId: 'barbell-squat',
          difficulty: 'good',
          sets: [
            { id: 's1-2-1', setNumber: 1, weight: 72.5, reps: 8, completed: true },
            { id: 's1-2-2', setNumber: 2, weight: 72.5, reps: 8, completed: true },
            { id: 's1-2-3', setNumber: 3, weight: 72.5, reps: 8, completed: true },
          ],
        },
      ],
    },
  ];

  // Generate automatic goals from the latest performance of each exercise
  const goals: Record<string, ExerciseGoal> = {};
  for (const ex of DEFAULT_EXERCISES) {
    for (const s of sessions) {
      const found = s.exercises.find((e) => e.exerciseId === ex.id);
      if (found) {
        goals[ex.id] = computeNextGoalForExercise(ex, found, 'kg');
        break;
      }
    }
  }

  const profile: UserProfile = {
    name: userName,
    unit: 'kg',
    weeklyTarget: 3,
    restTimerSeconds: 90,
    xp: 785,
    level: 4,
    unlockedBadges: ['first_session', 'five_sessions', 'first_pr', 'goal_crusher'],
    onboardingDone: true,
    createdAt: s1Date,
  };

  saveProfile(profile);
  saveSessions(sessions);
  saveGoals(goals);

  return { profile, sessions, goals };
}
