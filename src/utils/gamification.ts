import {
  Exercise,
  MissionProgress,
  PRRecord,
  UserProfile,
  WorkoutExerciseLog,
  WorkoutSession,
} from '../types';
import { BADGES } from '../data/exercises';

export interface LevelInfo {
  level: number;
  title: string;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
}

const LEVEL_TITLES = [
  'Débutant Motivé',
  'Apprenti Régulier',
  'Pratiquant Assidu',
  'Athlète Constant',
  'Bâtisseur de Force',
  'Pilier de la Salle',
  'Maître de la Progression',
  'Légende du Temple',
];

export function getLevelInfo(xp: number): LevelInfo {
  // Progressive curve: Level 1 = 0..200 XP, Level 2 = 200..450 XP, etc.
  let level = 1;
  let threshold = 200;
  let remainingXp = xp;

  while (remainingXp >= threshold) {
    remainingXp -= threshold;
    level += 1;
    threshold = Math.round(200 + (level - 1) * 75);
  }

  const title =
    LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
  const progressPercent = Math.min(
    100,
    Math.round((remainingXp / threshold) * 100)
  );

  return {
    level,
    title,
    currentLevelXp: remainingXp,
    nextLevelXp: threshold,
    progressPercent,
  };
}

/**
 * Epley 1RM estimation formula: weight * (1 + reps / 30)
 */
export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/**
 * Detects Personal Records achieved in a new session compared against past sessions.
 */
export function detectSessionPRs(
  currentExercises: WorkoutExerciseLog[],
  pastSessions: WorkoutSession[],
  exercisesCatalog: Exercise[],
  sessionDate: string
): PRRecord[] {
  const prs: PRRecord[] = [];

  for (const exLog of currentExercises) {
    const completedSets = exLog.sets.filter((s) => s.completed && s.reps > 0);
    if (completedSets.length === 0) continue;

    const exercise = exercisesCatalog.find((e) => e.id === exLog.exerciseId);
    const exerciseName = exercise?.name || 'Exercice';

    // Historical max weight and max 1RM for this exercise
    let histMaxWeight = -1;
    let histMax1RM = -1;
    let histMaxReps = -1;
    let hadPreviousHistory = false;

    for (const session of pastSessions) {
      for (const pastEx of session.exercises) {
        if (pastEx.exerciseId !== exLog.exerciseId) continue;
        for (const s of pastEx.sets) {
          if (!s.completed || s.reps <= 0) continue;
          hadPreviousHistory = true;
          if (s.weight > histMaxWeight) histMaxWeight = s.weight;
          const e1rm = estimate1RM(s.weight, s.reps);
          if (e1rm > histMax1RM) histMax1RM = e1rm;
          if (s.reps > histMaxReps) histMaxReps = s.reps;
        }
      }
    }

    // Current session bests
    let bestSet = completedSets[0];
    let best1RM = estimate1RM(bestSet.weight, bestSet.reps);
    let maxWeightSet = completedSets[0];

    for (const s of completedSets) {
      const e1rm = estimate1RM(s.weight, s.reps);
      if (e1rm > best1RM) {
        best1RM = e1rm;
        bestSet = s;
      }
      if (
        s.weight > maxWeightSet.weight ||
        (s.weight === maxWeightSet.weight && s.reps > maxWeightSet.reps)
      ) {
        maxWeightSet = s;
      }
    }

    if (!hadPreviousHistory) {
      // First time doing this exercise establishes baseline, only mark as PR if pastSessions > 0 and weight > 0 or good reps
      continue;
    }

    if (maxWeightSet.weight > 0 && maxWeightSet.weight > histMaxWeight) {
      prs.push({
        id: `pr-${exLog.exerciseId}-${Date.now()}`,
        exerciseId: exLog.exerciseId,
        exerciseName,
        weight: maxWeightSet.weight,
        reps: maxWeightSet.reps,
        estimated1RM: estimate1RM(maxWeightSet.weight, maxWeightSet.reps),
        date: sessionDate,
        type: 'max_weight',
      });
    } else if (bestSet.weight > 0 && best1RM > histMax1RM + 0.2) {
      prs.push({
        id: `pr-${exLog.exerciseId}-${Date.now()}`,
        exerciseId: exLog.exerciseId,
        exerciseName,
        weight: bestSet.weight,
        reps: bestSet.reps,
        estimated1RM: best1RM,
        date: sessionDate,
        type: 'best_volume_set',
      });
    } else if (bestSet.weight === 0 && bestSet.reps > histMaxReps) {
      prs.push({
        id: `pr-${exLog.exerciseId}-${Date.now()}`,
        exerciseId: exLog.exerciseId,
        exerciseName,
        weight: 0,
        reps: bestSet.reps,
        estimated1RM: bestSet.reps,
        date: sessionDate,
        type: 'best_reps',
      });
    }
  }

  return prs;
}

/**
 * Returns start of current ISO week (Monday 00:00:00)
 */
export function getStartOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Computes weekly training metrics without any guilt-tripping.
 */
export function getWeeklyStats(
  sessions: WorkoutSession[],
  weeklyTarget: number
): {
  sessionsThisWeek: number;
  weeklyTarget: number;
  activeWeeksStreak: number;
  totalActiveWeeks: number;
  encouragementMessage: string;
} {
  const now = new Date();
  const startOfThisWeek = getStartOfWeek(now);

  const sessionsThisWeek = sessions.filter(
    (s) => new Date(s.completedAt) >= startOfThisWeek
  ).length;

  // Group sessions by week key YYYY-MM-DD (Monday date)
  const weekCounts = new Map<string, number>();
  for (const s of sessions) {
    const monday = getStartOfWeek(new Date(s.completedAt));
    const key = monday.toISOString().slice(0, 10);
    weekCounts.set(key, (weekCounts.get(key) || 0) + 1);
  }

  const totalActiveWeeks = weekCounts.size;

  // Count consecutive active weeks (either this week or starting from last week so a new week never resets to 0 on Monday!)
  let activeWeeksStreak = 0;
  const cursor = new Date(startOfThisWeek);
  const thisWeekKey = cursor.toISOString().slice(0, 10);

  if ((weekCounts.get(thisWeekKey) || 0) > 0) {
    while ((weekCounts.get(cursor.toISOString().slice(0, 10)) || 0) > 0) {
      activeWeeksStreak += 1;
      cursor.setDate(cursor.getDate() - 7);
    }
  } else {
    // Check starting from previous week so Monday morning doesn't punish the user
    cursor.setDate(cursor.getDate() - 7);
    while ((weekCounts.get(cursor.toISOString().slice(0, 10)) || 0) > 0) {
      activeWeeksStreak += 1;
      cursor.setDate(cursor.getDate() - 7);
    }
  }

  let encouragementMessage = 'Prêt à lancer ta semaine à ton rythme.';
  if (sessionsThisWeek >= weeklyTarget) {
    encouragementMessage = 'Objectif hebdomadaire atteint ! Bravo pour ta régularité.';
  } else if (sessionsThisWeek > 0) {
    const rem = weeklyTarget - sessionsThisWeek;
    encouragementMessage =
      rem === 1
        ? 'Plus qu’une séance pour valider ton objectif de la semaine !'
        : `Encore ${rem} séances pour compléter ta semaine.`;
  } else if (activeWeeksStreak > 0) {
    encouragementMessage = `Série de ${activeWeeksStreak} sem. active — démarre ta première séance quand tu veux.`;
  }

  return {
    sessionsThisWeek,
    weeklyTarget,
    activeWeeksStreak,
    totalActiveWeeks,
    encouragementMessage,
  };
}

/**
 * Generates positive weekly missions ("Petites missions").
 */
export function getActiveMissions(
  sessions: WorkoutSession[],
  profile: UserProfile
): MissionProgress[] {
  const startOfThisWeek = getStartOfWeek(new Date());
  const weekSessions = sessions.filter(
    (s) => new Date(s.completedAt) >= startOfThisWeek
  );

  const sessionsCount = weekSessions.length;
  const goalsAchievedThisWeek = weekSessions.reduce(
    (sum, s) => sum + (s.goalsAchievedCount || 0),
    0
  );
  const setsCompletedThisWeek = weekSessions.reduce(
    (sum, s) =>
      sum +
      s.exercises.reduce(
        (eSum, ex) => eSum + ex.sets.filter((st) => st.completed).length,
        0
      ),
    0
  );

  const targetSessions = Math.max(2, profile.weeklyTarget);

  return [
    {
      id: 'mission-weekly-sessions',
      title: `Faire ${targetSessions} séances cette semaine`,
      description: 'La régularité est la clé numéro 1 de la progression.',
      current: Math.min(targetSessions, sessionsCount),
      target: targetSessions,
      xpReward: 100,
      completed: sessionsCount >= targetSessions,
    },
    {
      id: 'mission-goals-progress',
      title: 'Progresser sur 3 exercices',
      description: 'Valider 3 objectifs automatiques recommandés cette semaine.',
      current: Math.min(3, goalsAchievedThisWeek),
      target: 3,
      xpReward: 90,
      completed: goalsAchievedThisWeek >= 3,
    },
    {
      id: 'mission-weekly-sets',
      title: 'Valider 12 séries de travail',
      description: 'Accumuler du volume de qualité sur la semaine.',
      current: Math.min(12, setsCompletedThisWeek),
      target: 12,
      xpReward: 60,
      completed: setsCompletedThisWeek >= 12,
    },
  ];
}

/**
 * Checks which new badges should be unlocked after a workout or action.
 */
export function checkNewBadges(
  profile: UserProfile,
  allSessions: WorkoutSession[],
  customExercisesCount: number
): { newlyUnlocked: string[]; bonusXp: number } {
  const unlocked = new Set(profile.unlockedBadges);
  const newlyUnlocked: string[] = [];

  const totalSessions = allSessions.length;
  const totalPRs = allSessions.reduce(
    (acc, s) => acc + (s.prsAchieved?.length || 0),
    0
  );
  const totalGoalsAchieved = allSessions.reduce(
    (acc, s) => acc + (s.goalsAchievedCount || 0),
    0
  );
  const weeklyStats = getWeeklyStats(allSessions, profile.weeklyTarget);

  const tryUnlock = (id: string, condition: boolean) => {
    if (condition && !unlocked.has(id)) {
      unlocked.add(id);
      newlyUnlocked.push(id);
    }
  };

  tryUnlock('first_session', totalSessions >= 1);
  tryUnlock('five_sessions', totalSessions >= 5);
  tryUnlock('ten_sessions', totalSessions >= 10);
  tryUnlock('first_pr', totalPRs >= 1);
  tryUnlock('goal_crusher', totalGoalsAchieved >= 1);
  tryUnlock(
    'week_goal',
    weeklyStats.sessionsThisWeek >= profile.weeklyTarget
  );
  tryUnlock('month_regular', weeklyStats.totalActiveWeeks >= 4);
  tryUnlock('custom_creator', customExercisesCount >= 1);

  const bonusXp = newlyUnlocked.reduce((sum, id) => {
    const b = BADGES.find((x) => x.id === id);
    return sum + (b?.xpBonus || 0);
  }, 0);

  return { newlyUnlocked, bonusXp };
}
