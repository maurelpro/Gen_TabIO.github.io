# PLC Address Generator

## Présentation

**PLC Address Generator** est un moteur JavaScript indépendant de l’interface utilisateur, conçu pour générer automatiquement des adresses PLC à partir de formules configurables.

L’objectif est de simplifier la création d’adresses telles que `E0.0`, `E0.1`, `E1.0`, `M10.5` ou `Q20`, sans avoir à définir manuellement chaque adresse.

Le système permet à l’utilisateur de définir **comment les adresses doivent être calculées**, puis génère automatiquement la liste correspondante.

## Fonctionnement

Le moteur repose sur trois éléments principaux :

* **FormulaEngine** : interprète et valide les formules.
* **FormulaConfig** : gère les paramètres de chaque catégorie.
* **AddressGenerator** : génère les adresses à partir de la configuration et des formules.
* ExportManager : qui sert fait une exportation vers le format pour l'ajout dans votre logiciel de travail 

L'ensemble fonctionne indépendamment de l'interface graphique et peut donc être utilisé dans différentes applications.

## Des adresses entièrement configurables

Chaque catégorie peut définir son propre :

* préfixe  ;
* adresse de départ ;
* mode d'adressage ;
* formule de calcul.

Par exemple, une configuration peut produire automatiquement :

```text
E0.0
E0.1
E0.2
E0.3
E0.4
E0.5
E0.6
E0.7
E1.0
E1.1
...
```

## Un système basé sur des formules

Les adresses sont générées à partir de formules simples utilisant notamment :

* `+`
* `-`
* `*`
* `/`
* `%`
* `()`
* `n`, représentant l'index courant.

Les formules peuvent également utiliser les informations liées aux entrées et sorties afin d'adapter automatiquement les calculs au contexte de génération.

Exemple :

```text
X = (n - (n % 8)) / 8
Y = n % 8
```

permet de répartir automatiquement les adresses sur plusieurs groupes de 8 éléments.

## Validation intégrée

Avant qu'une formule soit utilisée, le moteur vérifie qu'elle respecte les règles définies.

Il s'assure notamment que :

* la formule est correctement écrite ;
* seules les variables autorisées sont utilisées ;
* seuls les opérateurs disponibles sont acceptés ;
* le résultat est un entier ;
* le résultat n'est pas négatif.

En cas de problème, le système retourne une erreur permettant d'identifier clairement la formule concernée.

## Pensé pour évoluer

Le moteur est conçu pour être facilement extensible.

De nouvelles catégories peuvent être ajoutées sans modifier le fonctionnement principal du système. Il devient ainsi possible d'étendre progressivement le générateur à différents types d'adresses PLC.

La configuration peut également être conservée afin de permettre à l'utilisateur de retrouver ses paramètres lors d'une prochaine utilisation.

## Indépendant de l'interface

Le moteur ne dépend d'aucune interface graphique.

Il peut ainsi être intégré dans :

* une application web ;
* un configurateur PLC ;
* un outil de génération ;
* une interface industrielle ;
* ou toute autre application JavaScript.

## Objectif du projet

L'idée est de fournir un **petit moteur de génération d'adresses PLC flexible, simple et réutilisable**.

L'utilisateur définit les règles de calcul une seule fois, et le système se charge ensuite de transformer ces règles en une liste d'adresses PLC cohérentes et valides.

**En résumé :**

> Une configuration + des formules → une génération automatique d'adresses PLC.
