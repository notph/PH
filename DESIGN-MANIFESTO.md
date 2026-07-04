# Design Manifesto

Source : Art Direction Book + Generative Engine Spec.

## Intention

Visualiser l'invisible.

Rendre sensible la complexite des systemes sans l'illustrer litteralement.

Le moteur graphique de `philippeholub.com` ne doit pas etre un decor. Il doit
donner l'impression qu'un instrument silencieux rend visible une structure
profonde : courants, isobathes, relief, champ de vent, potentiel physique ou
carte marine abstraite.

## Principes

- Evoquer, ne pas illustrer.
- Suggerer la profondeur.
- Laisser respirer.
- Evoluer lentement.
- Rester sobre.
- Servir le contenu.
- Etre coherent sur tous les supports.

## Formule de controle

```txt
Ce n'est pas une carte.
Ce n'est pas une science.
C'est une maniere de voir
ce qui ne se voit pas.
```

## Interdits

- Effet decoratif.
- Fond WebGL gratuit.
- Animation IA.
- Ecran de veille.
- Constellation.
- Reseau de particules.
- Glow demonstratif.
- Vortex spectaculaire.
- Mouvement synchrone visible.
- Texture vintage ou parchemin.

## Langage visuel

Les lignes doivent rester generatives. Aucune ligne importante ne doit etre
dessinee manuellement.

Familles autorisees :

- isobathes ;
- lignes de courant ;
- relief topographique ;
- champ potentiel ;
- vecteurs discrets ;
- points de mesure rares.

Les points lumineux sont des reperes, anomalies ou mesures. Jamais des etoiles.

## Rythme

Le systeme vit par respiration lente.

Le visiteur ne doit pas remarquer immediatement l'animation. Il doit sentir une
presence continue, comme un systeme naturel en evolution lente.

## Hierarchie

Le contenu reste prioritaire.

Le moteur peut creer de la profondeur, des zones d'interet et une accroche,
mais il ne doit jamais prendre le controle de la lecture.

Ordre attendu :

1. contenu ;
2. profondeur ;
3. mouvement ;
4. detail.

## Supports

La grammaire doit rester la meme sur desktop, tablette et mobile.

Mobile :

- scroll prioritaire ;
- interaction desactivee ou tres limitee ;
- lignes suffisamment presentes mais jamais envahissantes.

## Application

Le site final doit conserver :

- une marque discrete ;
- une composition calme ;
- un espace de lecture net ;
- des vides respirants ;
- un lien ou repere d'exploration sobre ;
- un mode clair et un mode nuit coherents.

La racine du projet doit donc etre jugee autant sur son comportement moteur que
sur sa conformite a cette grammaire visuelle.
