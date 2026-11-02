import {
  Exercise,
  ExerciseGoal,
  WorkoutExerciseLog,
  WorkoutSession,
  WeightUnit,
} from '../types';
import { formatWeight } from './units';

/**
 * Finds the most recent completed log for a given exercise across past sessions.
 */
export function getLastExercisePerformance(
  exerciseId: string,
  sessions: WorkoutSession[]
): { log: WorkoutExerciseLog; sessionDate: string } | null {
  // Sessions are sorted newest first
  for (const session of sessions) {
    const found = session.exercises.find(
      (ex) => ex.exerciseId === exerciseId && ex.sets.some((s) => s.completed)
    );
    if (found) {
      return { log: found, sessionDate: session.completedAt };
    }
  }
  return null;
}

/**
 * Generates a realistic, prudent automatic goal for the next session
 * based on the user's last performance and perceived difficulty.
 */
export function computeNextGoalForExercise(
  exercise: Exercise,
  lastLog: WorkoutExerciseLog,
  unit: WeightUnit = 'kg'
): ExerciseGoal {
  const completedSets = lastLog.sets.filter((s) => s.completed && s.reps > 0);
  if (completedSets.length === 0) {
    return {
      exerciseId: exercise.id,
      type: 'maintain_load',
      targetSets: 3,
      targetReps: 10,
      targetWeight: exercise.equipment === 'Poids du corps' ? 0 : 20,
      title: '3 × 10 répétitions',
      reason: 'Établis ta base de référence avec une exécution contrôlée.',
      badgeText: 'Base de départ',
    };
  }

  const numSets = completedSets.length;
  // Determine dominant / max weight and average reps
  const maxWeight = Math.max(...completedSets.map((s) => s.weight));
  const setsAtMaxWeight = completedSets.filter((s) => s.weight === maxWeight);
  const avgReps = Math.round(
    setsAtMaxWeight.reduce((acc, s) => acc + s.reps, 0) / setsAtMaxWeight.length
  );
  const minReps = Math.min(...setsAtMaxWeight.map((s) => s.reps));
  const maxReps = Math.max(...setsAtMaxWeight.map((s) => s.reps));

  // Determine overall difficulty from explicit rating or set-level RPE or rep drop-off
  const explicitDiff = lastLog.difficulty;
  const hasFailureSet = completedSets.some((s) => s.rpe === 'failure');
  const hasHardSets = completedSets.filter((s) => s.rpe === 'hard').length >= Math.ceil(numSets / 2);
  const repDropOff = maxReps - minReps >= 3; // e.g. 10, 8, 6 reps shows fatigue

  const effectiveDifficulty =
    explicitDiff ||
    (hasFailureSet ? 'failure' : hasHardSets || repDropOff ? 'hard' : 'good');

  const inc = exercise.defaultIncrementKg || (exercise.equipment === 'Poids du corps' ? 0 : 2.5);
  const isBodyweight = exercise.equipment === 'Poids du corps' && maxWeight === 0;

  // CASE 1: Very difficult or failure -> Prudent consolidation or slight deload
  if (effectiveDifficulty === 'failure') {
    if (repDropOff && minReps < avgReps) {
      // Aim to stabilize all sets at the average or slightly lower rep count cleanly
      const stabilizedReps = Math.max(5, minReps + 1);
      return {
        exerciseId: exercise.id,
        type: 'maintain_load',
        targetSets: numSets,
        targetReps: stabilizedReps,
        targetWeight: maxWeight,
        title: isBodyweight
          ? `${numSets} × ${stabilizedReps} rép (maîtrisées)`
          : `${numSets} × ${stabilizedReps} rép à ${formatWeight(maxWeight, unit)}`,
        reason:
          'Séance précédente très intense : on stabilise la charge sans aller à l’échec.',
        badgeText: 'Consolidation prudente',
      };
    }

    // Or slight deload if weight is heavy and reps dropped very low
    if (!isBodyweight && maxWeight > inc * 2 && avgReps < 6) {
      const reducedWeight = Math.max(0, maxWeight - inc);
      return {
        exerciseId: exercise.id,
        type: 'deload',
        targetSets: numSets,
        targetReps: avgReps + 1,
        targetWeight: reducedWeight,
        title: `${numSets} × ${avgReps + 1} rép à ${formatWeight(reducedWeight, unit)}`,
        reason:
          'Séance précédente à la limite : léger allègement pour relancer la progression proprement.',
        badgeText: 'Relance maîtrisée',
      };
    }

    return {
      exerciseId: exercise.id,
      type: 'maintain_form',
      targetSets: numSets,
      targetReps: avgReps,
      targetWeight: maxWeight,
      title: isBodyweight
        ? `${numSets} × ${avgReps} rép propres`
        : `${numSets} × ${avgReps} rép à ${formatWeight(maxWeight, unit)}`,
      reason:
        'Reproduis la même performance avec une exécution plus fluide avant d’augmenter.',
      badgeText: 'Meilleure exécution',
    };
  }

  // CASE 2: Hard session -> Maintain load or unify reps across sets
  if (effectiveDifficulty === 'hard') {
    if (minReps < maxReps) {
      // Bring all sets up to the same rep count
      return {
        exerciseId: exercise.id,
        type: 'maintain_form',
        targetSets: numSets,
        targetReps: maxReps,
        targetWeight: maxWeight,
        title: isBodyweight
          ? `${numSets} × ${maxReps} rép régulières`
          : `${numSets} × ${maxReps} rép à ${formatWeight(maxWeight, unit)}`,
        reason:
          'La charge était exigeante : vise le même nombre de répétitions sur toutes tes séries.',
        badgeText: 'Valider toutes les séries',
      };
    }

    return {
      exerciseId: exercise.id,
      type: 'maintain_load',
      targetSets: numSets,
      targetReps: avgReps,
      targetWeight: maxWeight,
      title: isBodyweight
        ? `Confirmer ${numSets} × ${avgReps} rép`
        : `Confirmer ${numSets} × ${avgReps} rép à ${formatWeight(maxWeight, unit)}`,
      reason:
        'Séance ressentie comme difficile : confirme cette charge avec une meilleure aisance.',
      badgeText: 'Maintien & exécution',
    };
  }

  // CASE 3: Only 1 or 2 sets performed -> Recommend adding 1 set
  if (numSets < 3 && avgReps >= 8) {
    return {
      exerciseId: exercise.id,
      type: 'add_set',
      targetSets: numSets + 1,
      targetReps: avgReps,
      targetWeight: maxWeight,
      title: isBodyweight
        ? `${numSets + 1} séries de ${avgReps} rép (+1 série)`
        : `${numSets + 1} × ${avgReps} rép à ${formatWeight(maxWeight, unit)}`,
      reason: 'Bonne maîtrise : ajoute 1 série supplémentaire pour augmenter le volume.',
      badgeText: '+1 série',
    };
  }

  // CASE 4: Good or Easy difficulty -> Double progression (reps first up to 10-12, then weight)
  const repCeiling = effectiveDifficulty === 'easy' ? 10 : 12;

  if (!isBodyweight && avgReps >= repCeiling && inc > 0) {
    const nextWeight = Math.round((maxWeight + inc) * 100) / 100;
    const resetReps = Math.max(8, avgReps - 2);
    return {
      exerciseId: exercise.id,
      type: 'add_weight',
      targetSets: numSets,
      targetReps: resetReps,
      targetWeight: nextWeight,
      title: `${numSets} × ${resetReps} rép à ${formatWeight(nextWeight, unit)}`,
      reason: `Tes ${avgReps} répétitions sont acquises : augmente légèrement la charge (+${formatWeight(inc, unit)}).`,
      badgeText: `+${formatWeight(inc, unit)}`,
    };
  }

  // Otherwise: +1 rep per set (the golden standard micro-progression)
  const nextReps = avgReps + 1;
  return {
    exerciseId: exercise.id,
    type: 'add_rep',
    targetSets: numSets,
    targetReps: nextReps,
    targetWeight: maxWeight,
    title: isBodyweight
      ? `${numSets} × ${nextReps} rép (+1 rép)`
      : `${numSets} × ${nextReps} rép à ${formatWeight(maxWeight, unit)}`,
    reason: 'Progression idéale : tente +1 répétition par série par rapport à la dernière fois.',
    badgeText: '+1 répétition',
  };
}

/**
 * Checks if a completed exercise log met or exceeded its suggested goal.
 */
export function evaluateGoalAchievement(
  log: WorkoutExerciseLog,
  goal?: ExerciseGoal
): boolean {
  if (!goal) return false;
  const completedSets = log.sets.filter((s) => s.completed && s.reps > 0);
  if (completedSets.length === 0) return false;

  // Check if at least one set met the target weight & reps, or total volume >= target volume
  const targetVolume =
    goal.targetSets * goal.targetReps * Math.max(1, goal.targetWeight);
  const actualVolume = completedSets.reduce(
    (sum, s) => sum + s.reps * Math.max(1, s.weight),
    0
  );

  const bestSetMetTarget = completedSets.some(
    (s) => s.weight >= goal.targetWeight && s.reps >= goal.targetReps
  );

  if (goal.type === 'add_set') {
    return completedSets.length >= goal.targetSets;
  }

  return bestSetMetTarget || actualVolume >= targetVolume * 0.98;
}
