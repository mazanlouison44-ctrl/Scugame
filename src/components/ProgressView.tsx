import React, { useState } from 'react';
import {
  TrendingUp,
  Trophy,
  Calendar,
  Target,
  ArrowUpRight,
  Dumbbell,
  Clock,
  Trash2,
  Play,
} from 'lucide-react';
import {
  Exercise,
  ExerciseGoal,
  UserProfile,
  WorkoutSession,
} from '../types';
import {
  displayWeight,
  formatDuration,
  formatWeight,
} from '../utils/units';
import { estimate1RM } from '../utils/gamification';

interface ProgressViewProps {
  sessions: WorkoutSession[];
  exercises: Exercise[];
  goals: Record<string, ExerciseGoal>;
  profile: UserProfile;
  initialSelectedExerciseId?: string | null;
  onDeleteSession: (sessionId: string) => void;
  onRepeatSession: (session: WorkoutSession) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  sessions,
  exercises,
  goals,
  profile,
  initialSelectedExerciseId,
  onDeleteSession,
  onRepeatSession,
}) => {
  const [activeTab, setActiveTab] = useState<'exercises' | 'history'>(
    'exercises'
  );

  const exercisesWithCounts = exercises
    .map((ex) => {
      const count = sessions.filter((s) =>
        s.exercises.some(
          (e) => e.exerciseId === ex.id && e.sets.some((st) => st.completed)
        )
      ).length;
      return { ex, count };
    })
    .sort((a, b) => b.count - a.count);

  const [selectedExId, setSelectedExId] = useState<string>(
    initialSelectedExerciseId ||
      exercisesWithCounts[0]?.ex.id ||
      'bench-press'
  );

  const selectedExercise =
    exercises.find((e) => e.id === selectedExId) || exercises[0];

  const exerciseHistory = [...sessions]
    .reverse()
    .map((session) => {
      const exLog = session.exercises.find(
        (e) =>
          e.exerciseId === selectedExercise.id &&
          e.sets.some((s) => s.completed && s.reps > 0)
      );
      if (!exLog) return null;
      const completedSets = exLog.sets.filter((s) => s.completed && s.reps > 0);
      const maxWeightSet = completedSets.reduce((best, curr) =>
        curr.weight > best.weight ||
        (curr.weight === best.weight && curr.reps > best.reps)
          ? curr
          : best
      );
      const best1RM = Math.max(
        ...completedSets.map((s) => estimate1RM(s.weight, s.reps))
      );
      const totalVolume = completedSets.reduce(
        (sum, s) => sum + s.reps * Math.max(1, s.weight),
        0
      );
      return {
        sessionId: session.id,
        date: session.completedAt,
        sets: completedSets,
        maxWeight: maxWeightSet.weight,
        repsAtMaxWeight: maxWeightSet.reps,
        best1RM,
        totalVolume,
        difficulty: exLog.difficulty,
        note: exLog.note,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const latestEntry = exerciseHistory[exerciseHistory.length - 1];
  const prevEntry =
    exerciseHistory.length >= 2
      ? exerciseHistory[exerciseHistory.length - 2]
      : null;

  const allTimeBestSet =
    exerciseHistory.length > 0
      ? exerciseHistory.reduce((best, curr) =>
          curr.maxWeight > best.maxWeight ||
          (curr.maxWeight === best.maxWeight &&
            curr.repsAtMaxWeight > best.repsAtMaxWeight)
            ? curr
            : best
        )
      : null;

  const weightDiff =
    latestEntry && prevEntry ? latestEntry.maxWeight - prevEntry.maxWeight : 0;
  const repsDiff =
    latestEntry && prevEntry
      ? latestEntry.repsAtMaxWeight - prevEntry.repsAtMaxWeight
      : 0;

  const nextGoal = goals[selectedExercise.id];

  return (
    <div className="w-full max-w-full space-y-4 pb-28 animate-pop overflow-hidden">
      {/* Top Switcher */}
      <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('exercises')}
          className={`py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'exercises'
              ? 'bg-emerald-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4 shrink-0" />
          <span>Par Exercice</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-emerald-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4 shrink-0" />
          <span>Séances ({sessions.length})</span>
        </button>
      </div>

      {activeTab === 'exercises' ? (
        <div className="space-y-4 min-w-0">
          {/* Horizontal Exercise Selector Pills */}
          <div className="w-full flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {exercisesWithCounts.map(({ ex, count }) => {
              const active = ex.id === selectedExercise.id;
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => setSelectedExId(ex.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 border transition flex items-center gap-1.5 ${
                    active
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <span>{ex.name}</span>
                  {count > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                        active
                          ? 'bg-emerald-500 text-slate-950 font-extrabold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Exercise Detailed Sheet */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4 overflow-hidden">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {selectedExercise.category} • {selectedExercise.equipment}
                </span>
                <h2 className="text-base sm:text-lg font-extrabold text-white mt-1 break-words">
                  {selectedExercise.name}
                </h2>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] text-slate-400">Séances</div>
                <div className="text-base font-extrabold text-emerald-400">
                  {exerciseHistory.length}
                </div>
              </div>
            </div>

            {exerciseHistory.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Dumbbell className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-300">
                  Aucune séance enregistrée sur cet exercice
                </p>
                <p className="text-xs text-slate-500">
                  Ajoute « {selectedExercise.name} » lors de ton prochain entraînement pour voir ta courbe de progression.
                </p>
              </div>
            ) : (
              <>
                {/* Key Cards: Best Set PR + Comparison with Last Session */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 min-w-0">
                    <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Record</span>
                    </div>
                    {allTimeBestSet && (
                      <>
                        <div className="text-sm sm:text-base font-extrabold text-white mt-1 truncate">
                          {allTimeBestSet.maxWeight > 0
                            ? `${formatWeight(
                                allTimeBestSet.maxWeight,
                                profile.unit
                              )} × ${allTimeBestSet.repsAtMaxWeight}`
                            : `${allTimeBestSet.repsAtMaxWeight} rép`}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                          1RM :{' '}
                          {formatWeight(allTimeBestSet.best1RM, profile.unit)}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 min-w-0">
                    <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Vs précédente</span>
                    </div>
                    {!prevEntry ? (
                      <>
                        <div className="text-sm font-extrabold text-white mt-1">
                          1re séance
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Base de départ
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm sm:text-base font-extrabold text-white mt-1 truncate">
                          {weightDiff > 0
                            ? `+${formatWeight(weightDiff, profile.unit)}`
                            : weightDiff < 0
                            ? `${formatWeight(weightDiff, profile.unit)}`
                            : repsDiff > 0
                            ? `+${repsDiff} rép`
                            : repsDiff < 0
                            ? `${repsDiff} rép`
                            : 'Maintenue'}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                          Avant :{' '}
                          {formatWeight(prevEntry.maxWeight, profile.unit)} ×{' '}
                          {prevEntry.repsAtMaxWeight}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Simple & Clear SVG Evolution Chart */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-300 truncate">
                      Évolution ({profile.unit})
                    </span>
                    {exerciseHistory.length >= 2 && (
                      <span className="text-[11px] font-semibold text-emerald-400 shrink-0">
                        {displayWeight(exerciseHistory[0].maxWeight, profile.unit)}{' '}
                        →{' '}
                        {displayWeight(
                          exerciseHistory[exerciseHistory.length - 1].maxWeight,
                          profile.unit
                        )}{' '}
                        {profile.unit}
                      </span>
                    )}
                  </div>

                  <SimpleLoadChart
                    data={exerciseHistory.map((h) => ({
                      label: new Date(h.date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                      }),
                      value: displayWeight(
                        h.maxWeight > 0 ? h.maxWeight : h.repsAtMaxWeight,
                        profile.unit
                      ),
                      reps: h.repsAtMaxWeight,
                    }))}
                  />
                </div>

                {/* Next Automatic Goal Box */}
                {nextGoal && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 shrink-0" /> Prochain objectif
                      </div>
                      <div className="text-sm font-bold text-white mt-0.5 break-words">
                        {nextGoal.title}
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        {nextGoal.reason}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0">
                      {nextGoal.badgeText}
                    </span>
                  </div>
                )}

                {/* Past Logs for this Exercise */}
                <div className="space-y-2 pt-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Historique sur cet exercice
                  </h3>
                  {[...exerciseHistory].reverse().map((entry) => (
                    <div
                      key={entry.sessionId}
                      className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-200">
                          {new Date(entry.date).toLocaleDateString('fr-FR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        {entry.note && (
                          <span className="text-[11px] text-slate-400 italic truncate">
                            « {entry.note} »
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {entry.sets.map((s, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-semibold text-[11px]"
                          >
                            {s.weight > 0
                              ? `${displayWeight(s.weight, profile.unit)}${
                                  profile.unit
                                } × ${s.reps}`
                              : `${s.reps} rép`}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* SESSIONS HISTORY TAB */
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">
                Aucune séance terminée pour le moment
              </p>
              <p className="text-xs text-slate-500">
                Lance ta première séance depuis l’accueil pour remplir ton journal.
              </p>
            </div>
          ) : (
            sessions.map((session) => {
              const totalSets = session.exercises.reduce(
                (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
                0
              );
              return (
                <div
                  key={session.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold text-slate-400 flex items-center flex-wrap gap-1.5">
                        <span>
                          {new Date(session.completedAt).toLocaleDateString(
                            'fr-FR',
                            {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            }
                          )}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(session.durationSeconds)}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-white mt-0.5 break-words">
                        {session.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        +{session.xpEarned} XP
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteSession(session.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition"
                        title="Supprimer la séance"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Exercises summary inside session card */}
                  <div className="space-y-1.5">
                    {session.exercises.map((exLog) => {
                      const ex = exercises.find(
                        (e) => e.id === exLog.exerciseId
                      );
                      const completed = exLog.sets.filter((s) => s.completed);
                      if (completed.length === 0) return null;
                      return (
                        <div
                          key={exLog.id}
                          className="bg-slate-950/80 border border-slate-800/80 rounded-xl px-3 py-2 space-y-1 text-xs"
                        >
                          <div className="font-bold text-slate-200 truncate">
                            {ex?.name || 'Exercice'}
                          </div>
                          <div className="text-slate-400 font-medium text-[11px] flex flex-wrap gap-1.5">
                            {completed.map((s, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800"
                              >
                                {s.weight > 0
                                  ? `${displayWeight(
                                      s.weight,
                                      profile.unit
                                    )}${profile.unit}×${s.reps}`
                                  : `${s.reps} rép`}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer with PR count & Repeat button */}
                  <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                    <div className="flex items-center gap-3 text-slate-400">
                      <span>{totalSets} séries</span>
                      {session.prsAchieved && session.prsAchieved.length > 0 && (
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5" />
                          {session.prsAchieved.length} PR
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onRepeatSession(session)}
                      className="px-3 py-2 rounded-xl bg-slate-800 active:bg-slate-700 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition shrink-0"
                    >
                      <Play className="w-3 h-3 fill-emerald-300" />
                      <span>Refaire</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

const SimpleLoadChart: React.FC<{
  data: { label: string; value: number; reps: number }[];
}> = ({ data }) => {
  if (data.length === 0) return null;

  const recent = data.slice(-7);
  const values = recent.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = Math.max(5, maxVal - minVal);

  const width = 300;
  const height = 125;
  const padX = 24;
  const padY = 24;

  const points = recent.map((d, i) => {
    const x =
      recent.length === 1
        ? width / 2
        : padX + (i / (recent.length - 1)) * (width - padX * 2);
    const y =
      height -
      padY -
      ((d.value - minVal + range * 0.15) / (range * 1.3)) * (height - padY * 2);
    return { x, y, ...d };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-32 block"
      >
        <line
          x1={padX}
          y1={padY}
          x2={width - padX}
          y2={padY}
          stroke="#1e293b"
          strokeDasharray="3 3"
        />
        <line
          x1={padX}
          y1={height - padY}
          x2={width - padX}
          y2={height - padY}
          stroke="#1e293b"
        />

        {points.length > 1 && (
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />
        )}

        {points.map((p, idx) => (
          <g key={idx}>
            <circle
              cx={p.x}
              cy={p.y}
              r="5"
              fill="#0b0f19"
              stroke="#34d399"
              strokeWidth="3"
            />
            <text
              x={p.x}
              y={p.y - 10}
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize="10"
              fontWeight="bold"
            >
              {p.value}
            </text>
            <text
              x={p.x}
              y={height - 6}
              textAnchor="middle"
              fill="#64748b"
              fontSize="9"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};
