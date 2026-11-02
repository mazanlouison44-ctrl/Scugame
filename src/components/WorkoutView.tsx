import React, { useState, useEffect } from 'react';
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

const CATEGORIES: MuscleCategory[] = [
  'Pectoraux',
  'Dos',
  'Jambes',
  'Épaules',
  'Bras',
  'Abdos',
  'Full Body',
];

const EQUIPMENTS: EquipmentType[] = [
  'Barre',
  'Haltères',
  'Machine',
  'Poulie',
  'Poids du corps',
];

const DIFFICULTY_OPTIONS: {
  value: DifficultyLevel;
  label: string;
  desc: string;
  color: string;
}[] = [
  {
    value: 'easy',
    label: 'Facile',
    desc: 'Marge confortable (+2-3 rép)',
    color: 'border-teal-500/50 bg-teal-500/15 text-teal-300',
  },
  {
    value: 'good',
    label: 'Maîtrisé',
    desc: 'Effort idéal, bonne forme',
    color: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300',
  },
  {
    value: 'hard',
    label: 'Difficile',
    desc: 'Dernières rép très dures',
    color: 'border-amber-500/50 bg-amber-500/15 text-amber-300',
  },
  {
    value: 'failure',
    label: 'Limite / Échec',
    desc: 'À la limite, on consolidera',
    color: 'border-rose-500/50 bg-rose-500/15 text-rose-300',
  },
];

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
  // Workout elapsed timer
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    const startMs = new Date(draft.startedAt).getTime();
    return Math.max(0, Math.floor((Date.now() - startMs) / 1000));
  });

  // Optional Rest Timer state
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const [autoStartRest, setAutoStartRest] = useState<boolean>(true);

  // Exercise Picker Modal
  const [showExercisePicker, setShowExercisePicker] = useState<boolean>(
    draft.exercises.length === 0
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');

  // Custom Exercise Creation Sub-modal
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] =
    useState<MuscleCategory>('Pectoraux');
  const [customEquipment, setCustomEquipment] =
    useState<EquipmentType>('Haltères');

  // Open Note Input Toggle per exercise log id
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

    // Pre-fill sets smartly from goal or previous performance
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
      const defaultW = ex.equipment === 'Poids du corps' ? 0 : 20;
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
      defaultIncrementKg:
        customEquipment === 'Poids du corps'
          ? 0
          : customEquipment === 'Haltères'
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

  const filteredExercises = exercises.filter((ex) => {
    const matchesCat =
      selectedCategory === 'Tous' || ex.category === selectedCategory;
    const matchesSearch = ex.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-36 animate-pop">
      {/* Sticky Top Session Header */}
      <div className="sticky top-0 z-30 bg-[#0b0f19]/95 backdrop-blur-md border-b border-slate-800/90 -mx-4 px-4 py-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <input
            type="text"
            value={draft.title}
            onChange={(e) =>
              onUpdateDraft({ ...draft, title: e.target.value })
            }
            className="bg-transparent text-base font-extrabold text-white focus:outline-none focus:border-b border-emerald-500 truncate w-full"
          />
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
            <span className="font-mono font-semibold text-emerald-400">
              {formatDuration(elapsedSeconds)}
            </span>
            <span>•</span>
            <span>{totalCompletedSets} série(s) validée(s)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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
            <Timer className="w-4 h-4" />
            {restRemaining !== null && <span>{restRemaining}s</span>}
          </button>

          <button
            type="button"
            onClick={() => onFinishWorkout(draft, elapsedSeconds)}
            disabled={totalCompletedSets === 0}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition ${
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
        <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-lg animate-pop">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Repos en cours
              </div>
              <div className="text-lg font-mono font-extrabold text-white">
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
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
            >
              -15s
            </button>
            <button
              type="button"
              onClick={() => setRestRemaining((r) => (r || 0) + 15)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
            >
              +15s
            </button>
            <button
              type="button"
              onClick={() => setRestRemaining(null)}
              className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 text-xs font-extrabold"
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
            className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-sm"
          >
            {/* Exercise Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                    {exercise.category}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {exercise.equipment}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-white mt-1">
                  {exercise.name}
                </h3>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setOpenNotes((prev) => ({
                      ...prev,
                      [exLog.id]: !prev[exLog.id],
                    }))
                  }
                  className={`p-2 rounded-xl border text-xs transition ${
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
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 hover:text-rose-400 transition"
                  title="Retirer l'exercice"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Previous Session Performance + Automatic Goal Banner */}
            <div className="space-y-2">
              {lastPerf && (
                <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/70 border border-slate-800/80 rounded-xl px-3 py-2">
                  <History className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
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
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-300">
                      <Target className="w-4 h-4 shrink-0" />
                      <span>Objectif du jour : {goal.title}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-200 shrink-0">
                      {goal.badgeText}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {goal.reason}
                  </p>

                  {/* Freedom to Accept, Modify or Ignore */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleApplyGoal(exLog.id, goal)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                        exLog.goalStatus === 'accepted'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-900 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      <span>Objectif appliqué</span>
                    </button>

                    {lastPerf && (
                      <button
                        type="button"
                        onClick={() =>
                          handleIgnoreGoal(exLog.id, lastPerf.log)
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
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

            {/* Sets List — Big One-Handed Controls */}
            <div className="space-y-2.5">
              {exLog.sets.map((set) => {
                const dispW = displayWeight(set.weight, profile.unit);
                return (
                  <div
                    key={set.id}
                    className={`p-2.5 rounded-xl border transition ${
                      set.completed
                        ? 'bg-emerald-500/10 border-emerald-500/40'
                        : 'bg-slate-950/90 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      {/* Set Number Badge */}
                      <div className="flex items-center gap-1">
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-extrabold flex items-center justify-center ${
                            set.completed
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {set.setNumber}
                        </span>
                      </div>

                      {/* Weight Stepper */}
                      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleAdjustSet(exLog.id, set.id, 'weight', -stepW)
                          }
                          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-200"
                          aria-label="Diminuer le poids"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <div className="px-1.5 text-center min-w-[60px]">
                          <input
                            type="number"
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
                            className="w-12 bg-transparent text-center font-extrabold text-sm text-white focus:outline-none"
                          />
                          <div className="text-[9px] font-bold uppercase text-slate-400 -mt-1">
                            {profile.unit}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleAdjustSet(exLog.id, set.id, 'weight', stepW)
                          }
                          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-200"
                          aria-label="Augmenter le poids"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Reps Stepper */}
                      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleAdjustSet(exLog.id, set.id, 'reps', -1)
                          }
                          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-200"
                          aria-label="Diminuer les répétitions"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <div className="px-1 text-center min-w-[48px]">
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) =>
                              handleDirectInputSet(
                                exLog.id,
                                set.id,
                                'reps',
                                e.target.value
                              )
                            }
                            className="w-10 bg-transparent text-center font-extrabold text-sm text-white focus:outline-none"
                          />
                          <div className="text-[9px] font-bold uppercase text-slate-400 -mt-1">
                            rép
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleAdjustSet(exLog.id, set.id, 'reps', 1)
                          }
                          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-200"
                          aria-label="Augmenter les répétitions"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Validate Set Button */}
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleSetCompleted(exLog.id, set.id)
                        }
                        className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center transition active:scale-95 shrink-0 ${
                          set.completed
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                        aria-label="Valider la série"
                      >
                        <Check className="w-5 h-5 stroke-[2.5]" />
                      </button>

                      {/* Remove Set if more than 1 */}
                      {exLog.sets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSet(exLog.id, set.id)}
                          className="p-1.5 text-slate-600 hover:text-rose-400"
                          title="Supprimer cette série"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => handleAddSet(exLog.id)}
                className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-dashed border-slate-700 text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Ajouter une série</span>
              </button>
            </div>

            {/* Perceived Difficulty Selector (Drives next session's prudent goal) */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3" /> Ressenti (ajuste ton prochain objectif) :
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
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
                      className={`py-1.5 px-1 rounded-lg border text-[11px] font-bold transition text-center ${
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
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
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
        className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border-2 border-dashed border-emerald-500/40 text-emerald-300 font-extrabold text-sm flex items-center justify-center gap-2 transition"
      >
        <Plus className="w-5 h-5" />
        <span>Ajouter un exercice</span>
      </button>

      {/* Auto-rest toggle + Cancel Workout */}
      <div className="pt-4 flex items-center justify-between text-xs text-slate-400 px-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoStartRest}
            onChange={(e) => setAutoStartRest(e.target.checked)}
            className="rounded accent-emerald-500"
          />
          <span>Lancer le repos ({profile.restTimerSeconds}s) après chaque série</span>
        </label>

        {!confirmCancel ? (
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            className="text-rose-400/80 hover:text-rose-400 font-semibold"
          >
            Abandonner
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancelWorkout}
              className="px-2.5 py-1 rounded-lg bg-rose-500 text-white font-bold"
            >
              Confirmer l’abandon
            </button>
            <button
              type="button"
              onClick={() => setConfirmCancel(false)}
              className="text-slate-400"
            >
              Non
            </button>
          </div>
        )}
      </div>

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-4">
          <div className="bg-[#0b0f19] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full mx-auto h-[85vh] flex flex-col overflow-hidden animate-pop">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-emerald-400" />
                <span>
                  {isCreatingCustom
                    ? 'Nouvel exercice personnalisé'
                    : 'Choisir un exercice'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingCustom(false);
                  setShowExercisePicker(false);
                }}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isCreatingCustom ? (
              <form
                onSubmit={handleCreateCustomExercise}
                className="p-4 space-y-4 overflow-y-auto flex-1"
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
                    placeholder="Ex: Hip Thrust barre, Dips lestés..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                    Groupe musculaire
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map((cat) => (
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
                    {EQUIPMENTS.map((eq) => (
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

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingCustom(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-sm"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-sm"
                  >
                    Créer & Ajouter
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/* Search & Filter */}
                <div className="p-3 space-y-2.5 border-b border-slate-800/80">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher un exercice..."
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none"
                    />
                  </div>

                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {['Tous', ...CATEGORIES].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                          selectedCategory === cat
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exercise List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingCustom(true)}
                    className="w-full p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-between text-xs font-bold transition"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Créer un exercice personnalisé
                    </span>
                    <Plus className="w-4 h-4" />
                  </button>

                  {filteredExercises.map((ex) => {
                    const goal = goals[ex.id];
                    const alreadyInWorkout = draft.exercises.some(
                      (e) => e.exerciseId === ex.id
                    );
                    return (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => handleAddExerciseToWorkout(ex)}
                        className="w-full text-left p-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 flex items-center justify-between gap-2 transition"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white truncate">
                              {ex.name}
                            </span>
                            {ex.isCustom && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                                Perso
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>
                              {ex.category} • {ex.equipment}
                            </span>
                            {goal && (
                              <span className="text-emerald-400 font-medium">
                                • Objectif : {formatWeight(goal.targetWeight, profile.unit)} × {goal.targetReps}
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
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
