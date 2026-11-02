import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Minus,
  Check,
  Trash2,
  Timer,
  Target,
  History,
  MessageSquare,
  X,
  Dumbbell,
  Search,
  Sparkles,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ActiveWorkoutDraft,
  DifficultyLevel,
  EquipmentType,
  Exercise,
  ExerciseGoal,
  MuscleCategory,
  UserProfile,
  WorkoutExerciseLog,
  WorkoutSession,
  WorkoutSet,
} from '../types';
import {
  displayWeight,
  formatDuration,
  formatWeight,
  getStepIncrement,
  toInternalKg,
} from '../utils/units';
import { getLastExercisePerformance } from '../utils/goalsEngine';
import { MUSCLE_CATEGORIES, EQUIPMENT_TYPES } from '../data/exercises';

interface WorkoutViewProps {
  draft: ActiveWorkoutDraft;
  profile: UserProfile;
  exercises: Exercise[];
  sessions: WorkoutSession[];
  goals: Record<string, ExerciseGoal>;
  onUpdateDraft: (updated: ActiveWorkoutDraft) => void;
  onAddCustomExercise: (ex: Exercise) => void;
  onFinishWorkout: (finalDraft: ActiveWorkoutDraft, elapsedSeconds: number) => void;
  onCancelWorkout: () => void;
}

const DIFFICULTY_OPTIONS: {
  value: DifficultyLevel;
  label: string;
  color: string;
}[] = [
  {
    value: 'easy',
    label: 'Facile',
    color: 'border-teal-500/50 bg-teal-500/15 text-teal-300',
  },
  {
    value: 'good',
    label: 'Maîtrisé',
    color: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300',
  },
  {
    value: 'hard',
    label: 'Difficile',
    color: 'border-amber-500/50 bg-amber-500/15 text-amber-300',
  },
  {
    value: 'failure',
    label: 'Limite / Échec',
    color: 'border-rose-500/50 bg-rose-500/15 text-rose-300',
  },
];

function normalizeSearch(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isZeroWeightEquipment(eq: EquipmentType): boolean {
  return (
    eq === 'Poids du corps' || eq === 'Élastiques' || eq === 'TRX'
  );
}

export const WorkoutView: React.FC<WorkoutViewProps> = ({
  draft,
  profile,
  exercises,
  sessions,
  goals,
  onUpdateDraft,
  onAddCustomExercise,
  onFinishWorkout,
  onCancelWorkout,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    const startMs = new Date(draft.startedAt).getTime();
    return Math.max(0, Math.floor((Date.now() - startMs) / 1000));
  });

  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const [autoStartRest, setAutoStartRest] = useState<boolean>(true);

  const [showExercisePicker, setShowExercisePicker] = useState<boolean>(
    draft.exercises.length === 0
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('Tous');

  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] =
    useState<MuscleCategory>('Pectoraux');
  const [customEquipment, setCustomEquipment] =
    useState<EquipmentType>('Haltères');

  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({});
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const startMs = new Date(draft.startedAt).getTime();
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [draft.startedAt]);

  useEffect(() => {
    if (restRemaining === null) return;
    if (restRemaining <= 0) {
      setRestRemaining(null);
      return;
    }
    const timer = setTimeout(() => {
      setRestRemaining((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [restRemaining]);

  const handleAddExerciseToWorkout = (ex: Exercise) => {
    const lastPerf = getLastExercisePerformance(ex.id, sessions);
    const goal = goals[ex.id];

    let initialSets: WorkoutSet[] = [];
    if (goal) {
      initialSets = Array.from({ length: goal.targetSets }).map((_, idx) => ({
        id: `set-${Date.now()}-${idx}`,
        setNumber: idx + 1,
        weight: goal.targetWeight,
        reps: goal.targetReps,
        completed: false,
      }));
    } else if (lastPerf && lastPerf.log.sets.length > 0) {
      initialSets = lastPerf.log.sets.map((s, idx) => ({
        id: `set-${Date.now()}-${idx}`,
        setNumber: idx + 1,
        weight: s.weight,
        reps: s.reps,
        completed: false,
      }));
    } else {
      const defaultW = isZeroWeightEquipment(ex.equipment) ? 0 : 20;
      initialSets = [1, 2, 3].map((num) => ({
        id: `set-${Date.now()}-${num}`,
        setNumber: num,
        weight: defaultW,
        reps: 10,
        completed: false,
      }));
    }

    const newLog: WorkoutExerciseLog = {
      id: `exlog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      exerciseId: ex.id,
      sets: initialSets,
      difficulty: 'good',
      goalAtStart: goal,
      goalStatus: goal ? 'accepted' : undefined,
    };

    onUpdateDraft({
      ...draft,
      exercises: [...draft.exercises, newLog],
    });
    setShowExercisePicker(false);
  };

  const handleCreateCustomExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const newEx: Exercise = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      category: customCategory,
      equipment: customEquipment,
      defaultIncrementKg: isZeroWeightEquipment(customEquipment)
        ? 0
        : customEquipment === 'Haltères' || customEquipment === 'Kettlebell'
        ? 2
        : 2.5,
      isCustom: true,
    };
    onAddCustomExercise(newEx);
    setCustomName('');
    setIsCreatingCustom(false);
    handleAddExerciseToWorkout(newEx);
  };

  const updateExerciseLog = (
    logId: string,
    updater: (log: WorkoutExerciseLog) => WorkoutExerciseLog
  ) => {
    onUpdateDraft({
      ...draft,
      exercises: draft.exercises.map((l) => (l.id === logId ? updater(l) : l)),
    });
  };

  const removeExerciseLog = (logId: string) => {
    onUpdateDraft({
      ...draft,
      exercises: draft.exercises.filter((l) => l.id !== logId),
    });
  };

  const handleApplyGoal = (logId: string, goal: ExerciseGoal) => {
    updateExerciseLog(logId, (log) => {
      const newSets: WorkoutSet[] = Array.from({
        length: goal.targetSets,
      }).map((_, idx) => {
        const existing = log.sets[idx];
        return {
          id: existing?.id || `set-${Date.now()}-${idx}`,
          setNumber: idx + 1,
          weight: goal.targetWeight,
          reps: goal.targetReps,
          completed: existing?.completed || false,
        };
      });
      return {
        ...log,
        sets: newSets,
        goalStatus: 'accepted',
      };
    });
  };

  const handleIgnoreGoal = (logId: string, lastLog?: WorkoutExerciseLog) => {
    updateExerciseLog(logId, (log) => {
      if (lastLog && lastLog.sets.length > 0) {
        return {
          ...log,
          goalStatus: 'ignored',
          sets: lastLog.sets.map((s, idx) => ({
            id: log.sets[idx]?.id || `set-${Date.now()}-${idx}`,
            setNumber: idx + 1,
            weight: s.weight,
            reps: s.reps,
            completed: log.sets[idx]?.completed || false,
          })),
        };
      }
      return {
        ...log,
        goalStatus: 'ignored',
      };
    });
  };

  const handleAdjustSet = (
    logId: string,
    setId: string,
    field: 'weight' | 'reps',
    deltaDisplay: number
  ) => {
    updateExerciseLog(logId, (log) => ({
      ...log,
      goalStatus: log.goalStatus === 'accepted' ? 'modified' : log.goalStatus,
      sets: log.sets.map((s) => {
        if (s.id !== setId) return s;
        if (field === 'reps') {
          return { ...s, reps: Math.max(1, s.reps + deltaDisplay) };
        } else {
          const currentDisp = displayWeight(s.weight, profile.unit);
          const nextDisp = Math.max(0, currentDisp + deltaDisplay);
          return { ...s, weight: toInternalKg(nextDisp, profile.unit) };
        }
      }),
    }));
  };

  const handleDirectInputSet = (
    logId: string,
    setId: string,
    field: 'weight' | 'reps',
    rawValue: string
  ) => {
    const num = parseFloat(rawValue);
    const val = isNaN(num) ? 0 : Math.max(0, num);
    updateExerciseLog(logId, (log) => ({
      ...log,
      sets: log.sets.map((s) => {
        if (s.id !== setId) return s;
        if (field === 'reps') {
          return { ...s, reps: Math.round(val) };
        }
        return { ...s, weight: toInternalKg(val, profile.unit) };
      }),
    }));
  };

  const handleToggleSetCompleted = (logId: string, setId: string) => {
    let becameCompleted = false;
    updateExerciseLog(logId, (log) => ({
      ...log,
      sets: log.sets.map((s) => {
        if (s.id !== setId) return s;
        becameCompleted = !s.completed;
        return { ...s, completed: !s.completed };
      }),
    }));

    if (becameCompleted && autoStartRest) {
      setRestRemaining(profile.restTimerSeconds);
    }
  };

  const handleAddSet = (logId: string) => {
    updateExerciseLog(logId, (log) => {
      const lastSet = log.sets[log.sets.length - 1];
      const newSet: WorkoutSet = {
        id: `set-${Date.now()}-${log.sets.length + 1}`,
        setNumber: log.sets.length + 1,
        weight: lastSet ? lastSet.weight : 20,
        reps: lastSet ? lastSet.reps : 10,
        completed: false,
      };
      return { ...log, sets: [...log.sets, newSet] };
    });
  };

  const handleRemoveSet = (logId: string, setId: string) => {
    updateExerciseLog(logId, (log) => {
      const filtered = log.sets
        .filter((s) => s.id !== setId)
        .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
      return { ...log, sets: filtered };
    });
  };

  const totalCompletedSets = draft.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0
  );

  const filteredExercises = useMemo(() => {
    const q = normalizeSearch(searchQuery.trim());
    return exercises.filter((ex) => {
      const matchesCat =
        selectedCategory === 'Tous' || ex.category === selectedCategory;
      const matchesEq =
        selectedEquipment === 'Tous' || ex.equipment === selectedEquipment;
      if (!matchesCat || !matchesEq) return false;
      if (!q) return true;
      const haystack = normalizeSearch(
        `${ex.name} ${ex.category} ${ex.equipment}`
      );
      return haystack.includes(q);
    });
  }, [exercises, searchQuery, selectedCategory, selectedEquipment]);

  return (
    <div className="w-full max-w-full space-y-4 pb-36 animate-pop">
      {/* Sticky Top Session Header */}
      <div className="sticky top-0 z-30 bg-[#0b0f19]/95 backdrop-blur-md border-b border-slate-800/90 py-2.5 flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={draft.title}
            onChange={(e) =>
              onUpdateDraft({ ...draft, title: e.target.value })
            }
            className="bg-transparent font-extrabold text-white focus:outline-none focus:border-b border-emerald-500 truncate w-full"
          />
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span className="font-mono font-semibold text-emerald-400">
              {formatDuration(elapsedSeconds)}
            </span>
            <span>•</span>
            <span className="truncate">{totalCompletedSets} série(s)</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() =>
              setRestRemaining(
                restRemaining !== null ? null : profile.restTimerSeconds
              )
            }
            className={`p-2.5 rounded-xl border transition flex items-center gap-1 text-xs font-bold ${
              restRemaining !== null
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
            title="Chronomètre de repos"
          >
            <Timer className="w-4 h-4 shrink-0" />
            {restRemaining !== null && <span>{restRemaining}s</span>}
          </button>

          <button
            type="button"
            onClick={() => onFinishWorkout(draft, elapsedSeconds)}
            disabled={totalCompletedSets === 0}
            className={`px-3.5 py-2.5 rounded-xl font-extrabold text-xs transition ${
              totalCompletedSets > 0
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Terminer
          </button>
        </div>
      </div>

      {/* Floating Rest Timer Bar if active */}
      {restRemaining !== null && (
        <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-lg animate-pop">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300 shrink-0">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                Repos
              </div>
              <div className="text-base font-mono font-extrabold text-white leading-tight">
                {Math.floor(restRemaining / 60)}:
                {(restRemaining % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                setRestRemaining((r) => Math.max(5, (r || 0) - 15))
              }
              className="px-2.5 py-2 rounded-xl bg-slate-800 active:bg-slate-700 text-xs font-bold text-slate-200"
            >
              -15s
            </button>
            <button
              type="button"
              onClick={() => setRestRemaining((r) => (r || 0) + 15)}
              className="px-2.5 py-2 rounded-xl bg-slate-800 active:bg-slate-700 text-xs font-bold text-slate-200"
            >
              +15s
            </button>
            <button
              type="button"
              onClick={() => setRestRemaining(null)}
              className="px-3 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-extrabold"
            >
              Passer
            </button>
          </div>
        </div>
      )}

      {/* Exercise Cards */}
      {draft.exercises.map((exLog) => {
        const exercise = exercises.find((e) => e.id === exLog.exerciseId);
        if (!exercise) return null;

        const lastPerf = getLastExercisePerformance(exercise.id, sessions);
        const goal = exLog.goalAtStart || goals[exercise.id];
        const stepW = getStepIncrement(
          exercise.defaultIncrementKg,
          profile.unit
        );

        return (
          <div
            key={exLog.id}
            className="w-full min-w-0 bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3.5 shadow-sm overflow-hidden"
          >
            {/* Exercise Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center flex-wrap gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                    {exercise.category}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {exercise.equipment}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-white mt-1 break-words">
                  {exercise.name}
                </h3>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setOpenNotes((prev) => ({
                      ...prev,
                      [exLog.id]: !prev[exLog.id],
                    }))
                  }
                  className={`p-2.5 rounded-xl border text-xs transition ${
                    exLog.note || openNotes[exLog.id]
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                  title="Ajouter une note"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeExerciseLog(exLog.id)}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 hover:text-rose-400 transition"
                  title="Retirer l'exercice"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Previous Session Performance + Automatic Goal Banner */}
            <div className="space-y-2">
              {lastPerf && (
                <div className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/70 border border-slate-800/80 rounded-xl px-3 py-2">
                  <History className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="break-words min-w-0">
                    <strong className="text-slate-200">Dernière fois :</strong>{' '}
                    {lastPerf.log.sets
                      .filter((s) => s.completed)
                      .map(
                        (s) =>
                          `${displayWeight(s.weight, profile.unit)}${
                            profile.unit
                          }×${s.reps}`
                      )
                      .join(', ')}
                  </span>
                </div>
              )}

              {goal && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-300 min-w-0">
                      <Target className="w-4 h-4 shrink-0" />
                      <span className="break-words">
                        Objectif : {goal.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-200 shrink-0">
                      {goal.badgeText}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {goal.reason}
                  </p>

                  {/* Freedom to Accept, Modify or Ignore */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleApplyGoal(exLog.id, goal)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        exLog.goalStatus === 'accepted'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-900 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Objectif appliqué</span>
                    </button>

                    {lastPerf && (
                      <button
                        type="button"
                        onClick={() =>
                          handleIgnoreGoal(exLog.id, lastPerf.log)
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          exLog.goalStatus === 'ignored'
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-900/90 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Garder charges précédentes
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sets List — 100% Mobile-Responsive 2-Row Card Layout */}
            <div className="space-y-2.5">
              {exLog.sets.map((set) => {
                const dispW = displayWeight(set.weight, profile.unit);
                return (
                  <div
                    key={set.id}
                    className={`p-3 rounded-xl border transition space-y-2.5 ${
                      set.completed
                        ? 'bg-emerald-500/10 border-emerald-500/40'
                        : 'bg-slate-950/90 border-slate-800'
                    }`}
                  >
                    {/* Top Row of Set: Set Number + Validate Button + Remove */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 ${
                            set.completed
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {set.setNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-300">
                          Série {set.setNumber}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {exLog.sets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSet(exLog.id, set.id)}
                            className="p-2 rounded-lg text-slate-500 hover:text-rose-400 active:bg-slate-900"
                            title="Supprimer cette série"
                            aria-label="Supprimer cette série"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            handleToggleSetCompleted(exLog.id, set.id)
                          }
                          className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition active:scale-95 ${
                            set.completed
                              ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>{set.completed ? 'Validée' : 'Valider'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Bottom Row of Set: 2-Column Grid for Weight & Reps Steppers */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Weight Stepper */}
                      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-1 min-w-0">
                        <button
                          type="button"
                          onClick={() =>
                            handleAdjustSet(exLog.id, set.id, 'weight', -stepW)
                          }
                          className="w-9 h-9 rounded-lg bg-slate-800 active:bg-slate-700 flex items-center justify-center text-slate-200 shrink-0"
                          aria-label="Diminuer le poids"
                        >
                          <Minus className="w-4 h-4" />
                        </button>

                        <div className="flex-1 min-w-0 text-center px-1">
                          <input
                            type="number"
                            inputMode="decimal"
                            step="any"
                            value={dispW}
                            onChange={(e) =>
                              handleDirectInputSet(
                                exLog.id,
                                set.id,
                                'weight',
                                e.target.value
                              )
                            }
                            className="w-full bg-transparent text-center font-extrabold text-white focus:outline-none p-0 leading-tight"
                          />
                          <div className="text-[10px] font-bold uppercase text-slate-400 leading-none">
                            {profile.unit}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleAdjustSet(exLog.id, set.id, 'weight', stepW)
                          }
                          className="w-9 h-9 rounded-lg bg-slate-800 active:bg-slate-700 flex items-center justify-center text-slate-200 shrink-0"
                          aria-label="Augmenter le poids"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Reps Stepper */}
                      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-1 min-w-0">
                        <button
                          type="button"
                          onClick={() =>
                            handleAdjustSet(exLog.id, set.id, 'reps', -1)
                          }
                          className="w-9 h-9 rounded-lg bg-slate-800 active:bg-slate-700 flex items-center justify-center text-slate-200 shrink-0"
                          aria-label="Diminuer les répétitions"
                        >
                          <Minus className="w-4 h-4" />
                        </button>

                        <div className="flex-1 min-w-0 text-center px-1">
                          <input
                            type="number"
                            inputMode="numeric"
                            value={set.reps}
                            onChange={(e) =>
                              handleDirectInputSet(
                                exLog.id,
                                set.id,
                                'reps',
                                e.target.value
                              )
                            }
                            className="w-full bg-transparent text-center font-extrabold text-white focus:outline-none p-0 leading-tight"
                          />
                          <div className="text-[10px] font-bold uppercase text-slate-400 leading-none">
                            rép
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleAdjustSet(exLog.id, set.id, 'reps', 1)
                          }
                          className="w-9 h-9 rounded-lg bg-slate-800 active:bg-slate-700 flex items-center justify-center text-slate-200 shrink-0"
                          aria-label="Augmenter les répétitions"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => handleAddSet(exLog.id)}
                className="w-full py-3 rounded-xl bg-slate-950 active:bg-slate-900 border border-dashed border-slate-700 text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Ajouter une série</span>
              </button>
            </div>

            {/* Perceived Difficulty Selector (2x2 on narrow mobile, 4 cols on wider screens) */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3 shrink-0" />
                  <span>Ressenti (ajuste ton prochain objectif) :</span>
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {DIFFICULTY_OPTIONS.map((opt) => {
                  const active = (exLog.difficulty || 'good') === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        updateExerciseLog(exLog.id, (l) => ({
                          ...l,
                          difficulty: opt.value,
                        }))
                      }
                      className={`py-2 px-2 rounded-xl border text-xs font-bold transition text-center ${
                        active
                          ? opt.color
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Note Field */}
            {(openNotes[exLog.id] || exLog.note) && (
              <div className="pt-1">
                <input
                  type="text"
                  value={exLog.note || ''}
                  onChange={(e) =>
                    updateExerciseLog(exLog.id, (l) => ({
                      ...l,
                      note: e.target.value,
                    }))
                  }
                  placeholder="Note (ex: hauteur siège 4, coudes serrés...)"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 outline-none"
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Add Exercise Button */}
      <button
        type="button"
        onClick={() => setShowExercisePicker(true)}
        className="w-full py-4 rounded-2xl bg-slate-900 active:bg-slate-800 border-2 border-dashed border-emerald-500/40 text-emerald-300 font-extrabold text-sm flex items-center justify-center gap-2 transition"
      >
        <Plus className="w-5 h-5" />
        <span>Ajouter un exercice ({exercises.length} disponibles)</span>
      </button>

      {/* Auto-rest toggle + Cancel Workout */}
      <div className="pt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 px-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoStartRest}
            onChange={(e) => setAutoStartRest(e.target.checked)}
            className="w-4 h-4 rounded accent-emerald-500"
          />
          <span>Repos auto ({profile.restTimerSeconds}s)</span>
        </label>

        {!confirmCancel ? (
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            className="text-rose-400/80 hover:text-rose-400 font-semibold py-1"
          >
            Abandonner la séance
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancelWorkout}
              className="px-3 py-1.5 rounded-lg bg-rose-500 text-white font-bold"
            >
              Confirmer
            </button>
            <button
              type="button"
              onClick={() => setConfirmCancel(false)}
              className="px-2 py-1.5 text-slate-400"
            >
              Non
            </button>
          </div>
        )}
      </div>

      {/* Exercise Picker Modal (100% Mobile Viewport Safe with dvh) */}
      {showExercisePicker && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-4">
          <div className="bg-[#0b0f19] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full mx-auto h-[88dvh] max-h-[88dvh] flex flex-col overflow-hidden animate-pop">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2 truncate">
                <Dumbbell className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="truncate">
                  {isCreatingCustom
                    ? 'Nouvel exercice personnalisé'
                    : `Choisir un exercice (${filteredExercises.length})`}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingCustom(false);
                  setShowExercisePicker(false);
                }}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isCreatingCustom ? (
              <form
                onSubmit={handleCreateCustomExercise}
                className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0"
              >
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                    Nom de l’exercice
                  </label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Ex: Squat Belt Machine, Pompes diamant..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                    Groupe musculaire
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {MUSCLE_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCustomCategory(cat)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border text-left transition ${
                          customCategory === cat
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                    Équipement
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {EQUIPMENT_TYPES.map((eq) => (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => setCustomEquipment(eq)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border text-left transition ${
                          customEquipment === eq
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {eq}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 flex gap-2 pb-6">
                  <button
                    type="button"
                    onClick={() => setIsCreatingCustom(false)}
                    className="flex-1 py-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-sm"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-sm"
                  >
                    Créer & Ajouter
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/* Search & Filters */}
                <div className="p-3 space-y-2.5 border-b border-slate-800/80 shrink-0 min-w-0">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher un exercice (ex: squat, poulie...)"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-9 py-2.5 text-white placeholder-slate-500 outline-none"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                        aria-label="Effacer la recherche"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Muscle Category Filter Pills */}
                  <div className="w-full flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    {['Tous', ...MUSCLE_CATEGORIES].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                          selectedCategory === cat
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-900 text-slate-300 border border-slate-800'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Equipment Filter Pills */}
                  <div className="w-full flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    {['Tous', ...EQUIPMENT_TYPES].map((eq) => (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => setSelectedEquipment(eq)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition ${
                          selectedEquipment === eq
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50'
                            : 'bg-slate-950 text-slate-400 border border-slate-800/80'
                        }`}
                      >
                        {eq === 'Tous' ? 'Tout équipement' : eq}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exercise List */}
                <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 pb-8">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedCategory !== 'Tous') {
                        setCustomCategory(selectedCategory as MuscleCategory);
                      }
                      if (selectedEquipment !== 'Tous') {
                        setCustomEquipment(selectedEquipment as EquipmentType);
                      }
                      if (searchQuery.trim()) {
                        setCustomName(searchQuery.trim());
                      }
                      setIsCreatingCustom(true);
                    }}
                    className="w-full p-3.5 rounded-xl bg-emerald-500/10 active:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-between text-xs font-bold transition"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>Créer mon propre exercice personnalisé</span>
                    </span>
                    <Plus className="w-4 h-4 shrink-0" />
                  </button>

                  {filteredExercises.length === 0 ? (
                    <div className="py-10 text-center space-y-2">
                      <p className="text-sm font-bold text-slate-300">
                        Aucun exercice trouvé
                      </p>
                      <p className="text-xs text-slate-500">
                        Essaie un autre mot-clé ou crée ton propre exercice ci-dessus.
                      </p>
                    </div>
                  ) : (
                    filteredExercises.map((ex) => {
                      const goal = goals[ex.id];
                      const alreadyInWorkout = draft.exercises.some(
                        (e) => e.exerciseId === ex.id
                      );
                      return (
                        <button
                          key={ex.id}
                          type="button"
                          onClick={() => handleAddExerciseToWorkout(ex)}
                          className="w-full text-left p-3.5 rounded-xl bg-slate-900/90 active:bg-slate-800 border border-slate-800 flex items-center justify-between gap-2 transition"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white break-words">
                                {ex.name}
                              </span>
                              {ex.isCustom && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold shrink-0">
                                  Perso
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-1 flex items-center flex-wrap gap-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold">
                                {ex.category}
                              </span>
                              <span>•</span>
                              <span>{ex.equipment}</span>
                              {goal && (
                                <span className="text-emerald-400 font-medium">
                                  • Défi :{' '}
                                  {formatWeight(
                                    goal.targetWeight,
                                    profile.unit
                                  )}{' '}
                                  × {goal.targetReps}
                                </span>
                              )}
                            </div>
                          </div>
                          {alreadyInWorkout ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          ) : (
                            <Plus className="w-5 h-5 text-slate-400 shrink-0" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
