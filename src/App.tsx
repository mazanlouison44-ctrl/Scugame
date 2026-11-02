import React, { useState, useEffect } from 'react';
import { Home, Dumbbell, TrendingUp, User, CheckCircle2 } from 'lucide-react';
import {
  ActiveWorkoutDraft,
  Exercise,
  ExerciseGoal,
  UserProfile,
  WeightUnit,
  WorkoutExerciseLog,
  WorkoutSession,
} from './types';
import {
  DEFAULT_PROFILE,
  getAllExercises,
  loadActiveDraft,
  loadCustomExercises,
  loadGoals,
  loadProfile,
  loadSessions,
  saveActiveDraft,
  saveCustomExercises,
  saveGoals,
  saveProfile,
  saveSessions,
  seedDemoData,
} from './utils/storage';
import {
  computeNextGoalForExercise,
  evaluateGoalAchievement,
  getLastExercisePerformance,
} from './utils/goalsEngine';
import {
  checkNewBadges,
  detectSessionPRs,
  getLevelInfo,
} from './utils/gamification';
import { OnboardingModal } from './components/OnboardingModal';
import { HomeView } from './components/HomeView';
import { WorkoutView } from './components/WorkoutView';
import { WorkoutSummaryView } from './components/WorkoutSummaryView';
import { ProgressView } from './components/ProgressView';
import { ProfileView } from './components/ProfileView';
import { InstallPWAModal } from './components/InstallPWAModal';

type TabId = 'home' | 'workout' | 'progress' | 'profile';

export function App() {
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const [customExercises, setCustomExercises] = useState<Exercise[]>(() =>
    loadCustomExercises()
  );
  const [sessions, setSessions] = useState<WorkoutSession[]>(() =>
    loadSessions()
  );
  const [goals, setGoals] = useState<Record<string, ExerciseGoal>>(() =>
    loadGoals()
  );
  const [activeDraft, setActiveDraft] = useState<ActiveWorkoutDraft | null>(
    () => loadActiveDraft()
  );

  const [currentTab, setCurrentTab] = useState<TabId>('home');
  const [selectedProgressExerciseId, setSelectedProgressExerciseId] = useState<
    string | null
  >(null);

  // Post-workout summary state
  const [completedSessionSummary, setCompletedSessionSummary] = useState<{
    session: WorkoutSession;
    leveledUp: boolean;
    newlyUnlockedBadges: string[];
  } | null>(null);

  // Network connectivity & sync toast
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // PWA Install Prompt & Standalone state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  });

  const allExercises = getAllExercises(customExercises);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Mark any offline-saved sessions as synced when connection returns
      setSessions((prev) => {
        const hadUnsynced = prev.some((s) => s.synced === false);
        if (!hadUnsynced) return prev;
        const updated = prev.map((s) => ({ ...s, synced: true }));
        saveSessions(updated);
        setSyncMessage('Connexion rétablie : séance synchronisée');
        setTimeout(() => setSyncMessage(null), 3500);
        return updated;
      });
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      setShowInstallModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleAddToHomeScreen = async () => {
    if (deferredPrompt) {
      // Android / Chrome: launch native installation prompt automatically
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult?.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // iPhone / Safari or browsers without native prompt: open simple step-by-step help
      setShowInstallModal(true);
    }
  };

  const handleUpdateProfile = (updated: UserProfile) => {
    setProfile(updated);
    saveProfile(updated);

    // Re-format goal titles if unit changed
    if (updated.unit !== profile.unit) {
      const updatedGoals: Record<string, ExerciseGoal> = {};
      for (const ex of allExercises) {
        const lastPerf = getLastExercisePerformance(ex.id, sessions);
        if (lastPerf) {
          updatedGoals[ex.id] = computeNextGoalForExercise(
            ex,
            lastPerf.log,
            updated.unit
          );
        }
      }
      setGoals(updatedGoals);
      saveGoals(updatedGoals);
    }
  };

  const handleOnboardingFresh = (
    name: string,
    unit: WeightUnit,
    weeklyTarget: number
  ) => {
    const newProfile: UserProfile = {
      ...DEFAULT_PROFILE,
      name,
      unit,
      weeklyTarget,
      onboardingDone: true,
    };
    setProfile(newProfile);
    saveProfile(newProfile);
  };

  const handleOnboardingDemo = (
    name: string,
    unit: WeightUnit,
    weeklyTarget: number
  ) => {
    const seeded = seedDemoData(name);
    const updatedProfile: UserProfile = {
      ...seeded.profile,
      unit,
      weeklyTarget,
    };
    saveProfile(updatedProfile);
    setProfile(updatedProfile);
    setSessions(seeded.sessions);
    setGoals(seeded.goals);
  };

  const buildExerciseLogForDraft = (exId: string): WorkoutExerciseLog => {
    const ex = allExercises.find((e) => e.id === exId);
    const goal = goals[exId];
    const lastPerf = getLastExercisePerformance(exId, sessions);

    let initialSets = [];
    if (goal) {
      initialSets = Array.from({ length: goal.targetSets }).map((_, idx) => ({
        id: `set-${Date.now()}-${exId}-${idx}`,
        setNumber: idx + 1,
        weight: goal.targetWeight,
        reps: goal.targetReps,
        completed: false,
      }));
    } else if (lastPerf && lastPerf.log.sets.length > 0) {
      initialSets = lastPerf.log.sets.map((s, idx) => ({
        id: `set-${Date.now()}-${exId}-${idx}`,
        setNumber: idx + 1,
        weight: s.weight,
        reps: s.reps,
        completed: false,
      }));
    } else {
      const isZeroW =
        ex?.equipment === 'Poids du corps' ||
        ex?.equipment === 'Élastiques' ||
        ex?.equipment === 'TRX';
      const defaultW = isZeroW ? 0 : 20;
      initialSets = [1, 2, 3].map((num) => ({
        id: `set-${Date.now()}-${exId}-${num}`,
        setNumber: num,
        weight: defaultW,
        reps: 10,
        completed: false,
      }));
    }

    return {
      id: `exlog-${Date.now()}-${exId}`,
      exerciseId: exId,
      sets: initialSets,
      difficulty: 'good',
      goalAtStart: goal,
      goalStatus: goal ? 'accepted' : undefined,
    };
  };

  const handleStartEmptyWorkout = () => {
    if (activeDraft) {
      setCurrentTab('workout');
      return;
    }
    const newDraft: ActiveWorkoutDraft = {
      id: `draft-${Date.now()}`,
      title: `Séance du ${new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      })}`,
      startedAt: new Date().toISOString(),
      exercises: [],
      lastSavedAt: new Date().toISOString(),
    };
    setActiveDraft(newDraft);
    saveActiveDraft(newDraft);
    setCurrentTab('workout');
  };

  const handleStartSuggestedWorkout = (
    title: string,
    exerciseIds: string[]
  ) => {
    const newDraft: ActiveWorkoutDraft = {
      id: `draft-${Date.now()}`,
      title,
      startedAt: new Date().toISOString(),
      exercises: exerciseIds.map((id) => buildExerciseLogForDraft(id)),
      lastSavedAt: new Date().toISOString(),
    };
    setActiveDraft(newDraft);
    saveActiveDraft(newDraft);
    setCurrentTab('workout');
  };

  const handleRepeatSession = (session: WorkoutSession) => {
    const exIds = session.exercises.map((e) => e.exerciseId);
    handleStartSuggestedWorkout(session.title, exIds);
  };

  const handleUpdateDraft = (updated: ActiveWorkoutDraft) => {
    setActiveDraft(updated);
    saveActiveDraft(updated);
  };

  const handleAddCustomExercise = (ex: Exercise) => {
    const updatedCustoms = [...customExercises, ex];
    setCustomExercises(updatedCustoms);
    saveCustomExercises(updatedCustoms);

    // Check if custom_creator badge unlocks
    const badgeCheck = checkNewBadges(
      profile,
      sessions,
      updatedCustoms.length
    );
    if (badgeCheck.newlyUnlocked.length > 0) {
      const nextXp = profile.xp + badgeCheck.bonusXp;
      const updatedProf: UserProfile = {
        ...profile,
        xp: nextXp,
        level: getLevelInfo(nextXp).level,
        unlockedBadges: [
          ...profile.unlockedBadges,
          ...badgeCheck.newlyUnlocked,
        ],
      };
      setProfile(updatedProf);
      saveProfile(updatedProf);
    }
  };

  const handleFinishWorkout = (
    finalDraft: ActiveWorkoutDraft,
    elapsedSeconds: number
  ) => {
    const nowIso = new Date().toISOString();

    // Filter exercises that have at least 1 completed set
    const validExercises: WorkoutExerciseLog[] = finalDraft.exercises
      .map((exLog) => {
        const completedSets = exLog.sets
          .filter((s) => s.completed && s.reps > 0)
          .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
        const achieved = evaluateGoalAchievement(
          { ...exLog, sets: completedSets },
          exLog.goalAtStart || goals[exLog.exerciseId]
        );
        return {
          ...exLog,
          sets: completedSets,
          goalAchieved: achieved,
        };
      })
      .filter((exLog) => exLog.sets.length > 0);

    if (validExercises.length === 0) return;

    const totalSets = validExercises.reduce(
      (sum, ex) => sum + ex.sets.length,
      0
    );
    const goalsAchievedCount = validExercises.filter(
      (ex) => ex.goalAchieved
    ).length;

    // Detect PRs
    const prsAchieved = detectSessionPRs(
      validExercises,
      sessions,
      allExercises,
      nowIso
    );

    // Compute XP earned: Base 80 XP + 10 XP/set + 25 XP/goal achieved + 35 XP/PR
    const baseSessionXp =
      80 +
      totalSets * 10 +
      goalsAchievedCount * 25 +
      prsAchieved.length * 35;

    const newSession: WorkoutSession = {
      id: `session-${Date.now()}`,
      title: finalDraft.title.trim() || 'Séance Musculation',
      startedAt: finalDraft.startedAt,
      completedAt: nowIso,
      durationSeconds: Math.max(60, elapsedSeconds),
      exercises: validExercises,
      xpEarned: baseSessionXp,
      prsAchieved,
      goalsAchievedCount,
      synced: isOnline,
    };

    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    saveSessions(updatedSessions);

    // Prepare automatic goals for next session for each worked exercise
    const updatedGoals = { ...goals };
    for (const exLog of validExercises) {
      const exDef = allExercises.find((e) => e.id === exLog.exerciseId);
      if (exDef) {
        updatedGoals[exDef.id] = computeNextGoalForExercise(
          exDef,
          exLog,
          profile.unit
        );
      }
    }
    setGoals(updatedGoals);
    saveGoals(updatedGoals);

    // Evaluate Badges & Level Up
    const prevLevel = getLevelInfo(profile.xp).level;
    const badgeCheck = checkNewBadges(
      profile,
      updatedSessions,
      customExercises.length
    );
    const totalXpGained = baseSessionXp + badgeCheck.bonusXp;
    newSession.xpEarned = totalXpGained;

    const nextTotalXp = profile.xp + totalXpGained;
    const nextLevel = getLevelInfo(nextTotalXp).level;

    const updatedProfile: UserProfile = {
      ...profile,
      xp: nextTotalXp,
      level: nextLevel,
      unlockedBadges: [
        ...profile.unlockedBadges,
        ...badgeCheck.newlyUnlocked,
      ],
    };
    setProfile(updatedProfile);
    saveProfile(updatedProfile);

    // Clear active draft & open Summary View
    setActiveDraft(null);
    saveActiveDraft(null);
    setCompletedSessionSummary({
      session: newSession,
      leveledUp: nextLevel > prevLevel,
      newlyUnlockedBadges: badgeCheck.newlyUnlocked,
    });
  };

  const handleCancelWorkout = () => {
    setActiveDraft(null);
    saveActiveDraft(null);
    setCurrentTab('home');
  };

  const handleDeleteSession = (sessionId: string) => {
    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);
    saveSessions(updated);
  };

  const handleUpdateSingleGoal = (
    exerciseId: string,
    updatedGoal: ExerciseGoal
  ) => {
    const next = { ...goals, [exerciseId]: updatedGoal };
    setGoals(next);
    saveGoals(next);
  };

  const handleExportJSON = () => {
    const payload = {
      profile,
      customExercises,
      sessions,
      goals,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scugame-sauvegarde-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(String(e.target?.result));
        if (data.profile) {
          setProfile(data.profile);
          saveProfile(data.profile);
        }
        if (Array.isArray(data.customExercises)) {
          setCustomExercises(data.customExercises);
          saveCustomExercises(data.customExercises);
        }
        if (Array.isArray(data.sessions)) {
          setSessions(data.sessions);
          saveSessions(data.sessions);
        }
        if (data.goals) {
          setGoals(data.goals);
          saveGoals(data.goals);
        }
      } catch {
        alert('Fichier JSON invalide.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetAll = () => {
    localStorage.clear();
    setProfile(DEFAULT_PROFILE);
    setCustomExercises([]);
    setSessions([]);
    setGoals({});
    setActiveDraft(null);
    setCompletedSessionSummary(null);
    setCurrentTab('home');
  };

  if (!profile.onboardingDone) {
    return (
      <OnboardingModal
        onCompleteFresh={handleOnboardingFresh}
        onLoadDemo={handleOnboardingDemo}
      />
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#0b0f19] text-slate-100 flex flex-col">
      {/* Main Mobile Container */}
      <main className="w-full max-w-md mx-auto px-3.5 sm:px-4 safe-top flex-1 min-w-0">
        {syncMessage && (
          <div className="mb-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-pop">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* If Workout Summary is active, show it first */}
        {completedSessionSummary ? (
          <WorkoutSummaryView
            session={completedSessionSummary.session}
            profile={profile}
            leveledUp={completedSessionSummary.leveledUp}
            newlyUnlockedBadges={completedSessionSummary.newlyUnlockedBadges}
            nextGoals={goals}
            exercises={allExercises}
            onUpdateGoal={handleUpdateSingleGoal}
            onDone={() => {
              setCompletedSessionSummary(null);
              setCurrentTab('home');
            }}
          />
        ) : currentTab === 'home' ? (
          <HomeView
            profile={profile}
            sessions={sessions}
            exercises={allExercises}
            goals={goals}
            activeDraft={activeDraft}
            isOnline={isOnline}
            isStandalone={isStandalone}
            onAddToHomeScreen={handleAddToHomeScreen}
            onStartEmptyWorkout={handleStartEmptyWorkout}
            onStartSuggestedWorkout={handleStartSuggestedWorkout}
            onResumeDraft={() => setCurrentTab('workout')}
            onOpenExerciseProgress={(exId) => {
              setSelectedProgressExerciseId(exId);
              setCurrentTab('progress');
            }}
          />
        ) : currentTab === 'workout' ? (
          activeDraft ? (
            <WorkoutView
              draft={activeDraft}
              profile={profile}
              exercises={allExercises}
              sessions={sessions}
              goals={goals}
              onUpdateDraft={handleUpdateDraft}
              onAddCustomExercise={handleAddCustomExercise}
              onFinishWorkout={handleFinishWorkout}
              onCancelWorkout={handleCancelWorkout}
            />
          ) : (
            <div className="py-16 text-center space-y-4 animate-pop">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <Dumbbell className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-extrabold text-white">
                  Prêt à t’entraîner ?
                </h2>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Démarre une séance vierge ou lance la séance suggérée depuis l’accueil.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartEmptyWorkout}
                className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition"
              >
                Démarrer une nouvelle séance
              </button>
            </div>
          )
        ) : currentTab === 'progress' ? (
          <ProgressView
            sessions={sessions}
            exercises={allExercises}
            goals={goals}
            profile={profile}
            initialSelectedExerciseId={selectedProgressExerciseId}
            onDeleteSession={handleDeleteSession}
            onRepeatSession={handleRepeatSession}
          />
        ) : (
          <ProfileView
            profile={profile}
            sessions={sessions}
            canInstallPWA={Boolean(deferredPrompt)}
            onTriggerInstallPWA={handleAddToHomeScreen}
            onUpdateProfile={handleUpdateProfile}
            onLoadDemo={() => {
              const seeded = seedDemoData(profile.name);
              setProfile(seeded.profile);
              setSessions(seeded.sessions);
              setGoals(seeded.goals);
            }}
            onResetAll={handleResetAll}
            onExportJSON={handleExportJSON}
            onImportJSON={handleImportJSON}
          />
        )}
      </main>

      {/* PWA Installation Help Modal (iPhone & Android) */}
      <InstallPWAModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />

      {/* Bottom One-Handed Navigation (4 entries max as specified in Brief section 7) */}
      {!completedSessionSummary && (
        <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#0b0f19]/95 backdrop-blur-lg border-t border-slate-800/90 safe-bottom">
          <div className="max-w-md mx-auto grid grid-cols-4 px-2 pt-1.5">
            <button
              type="button"
              onClick={() => setCurrentTab('home')}
              className={`flex flex-col items-center justify-center py-2 rounded-xl transition ${
                currentTab === 'home'
                  ? 'text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[11px] font-bold mt-1">Accueil</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!activeDraft) {
                  handleStartEmptyWorkout();
                } else {
                  setCurrentTab('workout');
                }
              }}
              className={`relative flex flex-col items-center justify-center py-2 rounded-xl transition ${
                currentTab === 'workout'
                  ? 'text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Dumbbell className="w-5 h-5" />
              <span className="text-[11px] font-bold mt-1">Séance</span>
              {activeDraft && (
                <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1.5 right-6 animate-ping" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab('progress')}
              className={`flex flex-col items-center justify-center py-2 rounded-xl transition ${
                currentTab === 'progress'
                  ? 'text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-[11px] font-bold mt-1">Progrès</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab('profile')}
              className={`flex flex-col items-center justify-center py-2 rounded-xl transition ${
                currentTab === 'profile'
                  ? 'text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[11px] font-bold mt-1">Profil</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
export default App;
