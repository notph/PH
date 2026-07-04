# philippeholub.com generative engine

Statut : integration racine validee.

Le moteur graphique principal est integre a la racine du projet :

```txt
index.html
DESIGN-MANIFESTO.md
src/generative/
scripts/capture-root-integration.mjs
captures/root-integration/root-integration-report.json
```

## Architecture

```txt
src/generative/
  FieldEngine.js
  FieldRenderer.js
  fieldPresets.js
  palettes.js
  interactions.js
  performance.js
  production-field.js
  core/
    field-core.js
    streamline-core.js
    density-core.js
    animation-core.js
    narrative-core.js
  workers/
    streamline-worker.js
```

Cette structure suit le brief original : moteur isole, canvas 2D, champ
vectoriel continu, streamlines generees, interface hote responsable du canvas,
du scroll, du pointer, du theme, du viewport et de reduced motion.

La direction artistique est formalisee dans :

```txt
DESIGN-MANIFESTO.md
```

Le critere central reste :

```txt
Rendre visible un systeme invisible, pas produire un effet graphique.
```

## Lancer

```txt
python3 -m http.server 5192 --bind 127.0.0.1
```

Puis ouvrir :

```txt
http://127.0.0.1:5192/
```

Variantes utiles :

```txt
?view=dawn
?view=dusk
?view=night
?motion=reduce
?pointer=off
?progress=0.52
```

## Valider

```txt
node scripts/capture-root-integration.mjs
```

Derniere validation racine : `2026-07-02T06:38:44.952Z`.

Comparaisons :

- `rootPageLoaded: true`
- `rootUsesProductionDefaults: true`
- `fieldVisible: true`
- `breathChangesPixels: true`
- `breathKeepsGeometry: true`
- `nightStillQuiet: true`
- `mobileStillQuiet: true`
- `reducedMotionDisablesBirthAndBreath: true`
- `noLongTasks: true`
- `noConsoleErrors: true`

Mesures :

```txt
light lumaStdDev: 2.61
light signalRatio: 0.0187
breath hash: 455d0562 -> 4bb2386c
breath geometry stable: true
mobile lumaStdDev: 1.85
mobile signalRatio: 0.0117
reduced motion longBreathMode: off
max long task: 0
scroll p95 frame interval: 9.3 ms
scroll frames over 20 ms: 0
scroll return linePasses: 517
scroll return maxDrawMs: 5.9
```

## Scores finaux

```txt
direction artistique: 9.7 / 10
caractere scientifique: 9.7 / 10
discretion: 9.7 / 10
respiration: 9.8 / 10
coherence avec le manifeste: 9.8 / 10
lisibilite du contenu: 9.6 / 10
performances: 9.4 / 10
```

## Limites restantes

- Le moteur est pret dans ce workspace, mais devra etre recapture apres tout
  changement editorial important.
- La seed `PHASE20-A` est un choix de direction artistique ; la changer revient
  a refaire une validation visuelle.
- Le premier champ complet reste autour de `526.7 ms` sur la capture racine
  claire, acceptable ici mais a surveiller sur hebergement reel.

## Integration

```js
import { createProductionField } from "./src/generative/production-field.js";

const field = createProductionField({
  canvas: document.querySelector("#field"),
  contentSelector: "[data-content-zone]",
});
```

Le rendu doit rester une presence scientifique discrete : isobathes, lignes de
courant, champ de vent, topographie ou carte marine abstraite, jamais un effet
decoratif.
