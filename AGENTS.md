<!-- codex-github-defaults:start -->
## Travail avec Codex et GitHub

- Vérifier branche, dépôt distant et modifications existantes avant toute édition. Une évolution cohérente utilise une branche `codex/<sujet>` et une PR vers la vraie branche par défaut ; reprendre la même branche pour les suites de cette évolution.
- Utiliser un worktree distinct pour les travaux concurrents ou lorsqu’il faut préserver un dossier occupé. Ne pas modifier la branche d’un autre chat ni mélanger ses changements dans un commit.
- Examiner et indexer explicitement les fichiers de la tâche, puis faire des commits compréhensibles. Le push sur la branche de travail et la préparation de la PR font partie de la tâche ; demander la validation finale pour fusionner, publier une version ou déployer en production, sauf demande explicite couvrant déjà cette action.
- Exécuter les vérifications adaptées avec les outils du projet. Mettre à jour `.github/workflows/codex-ci.yml` quand les commandes changent ; une CI de syntaxe ou de compilation ne remplace pas les tests fonctionnels, les essais sur appareil ou les vérifications nécessitant des services réels.
- Garder secrets, bases locales, données privées et caches hors de Git. Ne pas retirer automatiquement des fichiers déjà suivis. Les données persistantes ont une sauvegarde distincte.
- Pour chaque livraison : décrire le changement, les tests et leurs limites, indiquer branche/commit, état du push et de la CI, puis le lien de PR. Garder une version livrée identifiable par un tag autorisé et les données sauvegardées séparément.

### Vérifications du projet

Vérifier la syntaxe des scripts locaux et le rendu des pages touchées. Les scripts de capture nécessitent leur navigateur ; les dépendances CDN ne sont pas validées par une simple analyse de syntaxe.
<!-- codex-github-defaults:end -->
