# ScuGame — Application Mobile de Suivi Sportif Gamifiée (PWA)

**Enregistre ta séance en quelques secondes, vois tes progrès et découvre exactement quel petit défi relever la prochaine fois.**

## Fonctionnalités principales

- **Tableau de bord mobile** : niveau, XP, série hebdomadaire sans culpabilisation, prochaine séance suggérée, missions et derniers records personnels.
- **Séance en cours à une main** : saisie rapide (`+` / `-`), historique de la séance précédente, objectifs automatiques personnalisés, chronomètre de repos facultatif, difficulté ressentie et exercices personnalisés.
- **Objectifs automatiques prudents** : double progression intelligente (+1 répétition, +charge légère, +1 série ou maintien/consolidation si la séance précédente était difficile).
- **Progression & Graphiques** : évolution des charges par exercice, 1RM estimé, records personnels et journal des séances.
- **PWA installable & Hors-ligne** : ajout sur l’écran d’accueil iPhone et Android, sauvegarde locale automatique et export/import JSON.

## Démarrage local

```bash
npm install
npm run dev
```

## Déploiement sur Vercel

Ce projet est préconfiguré pour **Vercel** (`vercel.json` inclus, framework détecté automatiquement : **Vite**).
