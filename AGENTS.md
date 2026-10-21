<!-- codex-github-defaults:start -->
## Travail avec Codex et GitHub

- Vérifier branche, dépôt distant et modifications existantes avant toute édition. Une évolution cohérente utilise une branche `codex/<sujet>` et une PR vers la vraie branche par défaut ; reprendre la même branche pour les suites de cette évolution.
- Utiliser un worktree distinct pour les travaux concurrents ou lorsqu’il faut préserver un dossier occupé. Ne pas modifier la branche d’un autre chat ni mélanger ses changements dans un commit.
- Examiner et indexer explicitement les fichiers de la tâche, puis faire des commits compréhensibles. Les commits, le push, la création ou mise à jour de la PR et sa fusion en squash sont autorisés par défaut pour la tâche demandée, sans nouvelle confirmation. Examiner le diff et les contrôles du dernier commit, respecter les protections et les restrictions explicites de la tâche ; traiter ou signaler les échecs avant de conclure. Conserver la traçabilité dans GitHub et tenir compte des déploiements automatiques déclenchés par la fusion.
- Une release, un tag livré, un déploiement de production distinct de la fusion autorisée ou une migration de données de production nécessite une autorisation explicite couvrant cette action.
- Exécuter les vérifications adaptées avec les outils du projet. Mettre à jour `.github/workflows/codex-ci.yml` quand les commandes changent ; une CI de syntaxe ou de compilation ne remplace pas les tests fonctionnels, les essais sur appareil ou les vérifications nécessitant des services réels.
- Garder secrets, bases locales, données privées et caches hors de Git. Ne pas retirer automatiquement des fichiers déjà suivis. Les données persistantes ont une sauvegarde distincte.
- Pour chaque livraison : décrire le changement, les tests et leurs limites, indiquer branche/commit, état du push et de la CI, puis le lien de PR. Garder une version livrée identifiable par un tag autorisé et les données sauvegardées séparément.

### Vérifications du projet

Vérifier la syntaxe des scripts locaux et le rendu des pages touchées. Les scripts de capture nécessitent leur navigateur ; les dépendances CDN ne sont pas validées par une simple analyse de syntaxe.
<!-- codex-github-defaults:end -->
