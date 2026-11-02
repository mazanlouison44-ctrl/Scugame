import { Exercise, BadgeDef } from '../types';

export const DEFAULT_EXERCISES: Exercise[] = [
  // Pectoraux
  {
    id: 'bench-press',
    name: 'Développé couché barre',
    category: 'Pectoraux',
    equipment: 'Barre',
    defaultIncrementKg: 2.5,
  },
  {
    id: 'incline-db-press',
    name: 'Développé incliné haltères',
    category: 'Pectoraux',
    equipment: 'Haltères',
    defaultIncrementKg: 2,
  },
  {
    id: 'push-ups',
    name: 'Pompes classiques',
    category: 'Pectoraux',
    equipment: 'Poids du corps',
    defaultIncrementKg: 0,
  },
  {
    id: 'chest-press-machine',
    name: 'Chest Press guidée',
    category: 'Pectoraux',
    equipment: 'Machine',
    defaultIncrementKg: 2.5,
  },
  // Dos
  {
    id: 'lat-pulldown',
    name: 'Tirage vertical poulie haute',
    category: 'Dos',
    equipment: 'Poulie',
    defaultIncrementKg: 2.5,
  },
  {
    id: 'seated-cable-row',
    name: 'Tirage horizontal poulie',
    category: 'Dos',
    equipment: 'Poulie',
    defaultIncrementKg: 2.5,
  },
  {
    id: 'db-row',
    name: 'Rowing haltère unilatéral',
    category: 'Dos',
    equipment: 'Haltères',
    defaultIncrementKg: 2,
  },
  {
    id: 'pull-ups',
    name: 'Tractions pronation',
    category: 'Dos',
    equipment: 'Poids du corps',
    defaultIncrementKg: 0,
  },
  // Jambes
  {
    id: 'barbell-squat',
    name: 'Squat barre',
    category: 'Jambes',
    equipment: 'Barre',
    defaultIncrementKg: 2.5,
  },
  {
    id: 'leg-press',
    name: 'Presse à cuisses',
    category: 'Jambes',
    equipment: 'Machine',
    defaultIncrementKg: 5,
  },
  {
    id: 'romanian-deadlift',
    name: 'Soulevé de terre roumain',
    category: 'Jambes',
    equipment: 'Barre',
    defaultIncrementKg: 2.5,
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    category: 'Jambes',
    equipment: 'Machine',
    defaultIncrementKg: 2.5,
  },
  {
    id: 'leg-curl',
    name: 'Leg Curl ischios',
    category: 'Jambes',
    equipment: 'Machine',
    defaultIncrementKg: 2.5,
  },
  // Épaules
  {
    id: 'overhead-press',
    name: 'Développé militaire haltères',
    category: 'Épaules',
    equipment: 'Haltères',
    defaultIncrementKg: 2,
  },
  {
    id: 'lateral-raises',
    name: 'Élévations latérales',
    category: 'Épaules',
    equipment: 'Haltères',
    defaultIncrementKg: 1,
  },
  // Bras
  {
    id: 'dumbbell-curl',
    name: 'Curl biceps haltères',
    category: 'Bras',
    equipment: 'Haltères',
    defaultIncrementKg: 1,
  },
  {
    id: 'triceps-pushdown',
    name: 'Extension triceps poulie',
    category: 'Bras',
    equipment: 'Poulie',
    defaultIncrementKg: 2.5,
  },
  // Abdos
  {
    id: 'cable-crunch',
    name: 'Crunch poulie haute',
    category: 'Abdos',
    equipment: 'Poulie',
    defaultIncrementKg: 2.5,
  },
];

export const BADGES: BadgeDef[] = [
  {
    id: 'first_session',
    title: 'Premier Pas',
    description: 'Terminer ta toute première séance enregistrée.',
    icon: 'Flame',
    xpBonus: 50,
  },
  {
    id: 'five_sessions',
    title: 'Habitude Ancrée',
    description: 'Compléter 5 séances d’entraînement.',
    icon: 'Zap',
    xpBonus: 100,
  },
  {
    id: 'ten_sessions',
    title: 'Club des 10',
    description: 'Atteindre 10 séances enregistrées.',
    icon: 'Trophy',
    xpBonus: 200,
  },
  {
    id: 'first_pr',
    title: 'Premier Record',
    description: 'Établir ou battre un record personnel sur un exercice.',
    icon: 'Award',
    xpBonus: 75,
  },
  {
    id: 'goal_crusher',
    title: 'Défi Relevé',
    description: 'Valider un objectif automatique recommandé lors d’une séance.',
    icon: 'Target',
    xpBonus: 80,
  },
  {
    id: 'week_goal',
    title: 'Semaine Complète',
    description: 'Atteindre ton objectif de séances hebdomadaire.',
    icon: 'CalendarCheck',
    xpBonus: 120,
  },
  {
    id: 'month_regular',
    title: 'Mois Régulier',
    description: 'S’entraîner régulièrement sur 4 semaines actives.',
    icon: 'ShieldCheck',
    xpBonus: 250,
  },
  {
    id: 'custom_creator',
    title: 'Sur-Mesure',
    description: 'Créer ton premier exercice personnalisé.',
    icon: 'Sparkles',
    xpBonus: 40,
  },
];

export const SUGGESTED_TEMPLATES = [
  {
    id: 'full-body',
    title: 'Full Body Essentiel',
    subtitle: 'Idéal pour travailler tout le corps en 40 min',
    exerciseIds: ['bench-press', 'lat-pulldown', 'leg-press', 'overhead-press'],
  },
  {
    id: 'upper-body',
    title: 'Haut du Corps (Push / Pull)',
    subtitle: 'Pectoraux, dos, épaules et bras',
    exerciseIds: ['bench-press', 'seated-cable-row', 'incline-db-press', 'lateral-raises', 'dumbbell-curl'],
  },
  {
    id: 'lower-body',
    title: 'Bas du Corps & Gainage',
    subtitle: 'Quadriceps, ischios, fessiers et abdos',
    exerciseIds: ['barbell-squat', 'romanian-deadlift', 'leg-extension', 'leg-curl', 'cable-crunch'],
  },
];
