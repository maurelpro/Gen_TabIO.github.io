# ADRESSIO — Générateur d'adresses PLC

Outil web de cartographie d'adresses pour automates programmables.

## Fonctionnalités

- **Zone 1** : Éditeur Input/Output avec format texte simple
- **Zone 2** : Générateur d'adresses avec formules mathématiques configurables
- **Zone 3** : Export vers 6 automates industriels

## Automates supportés

| Automate | Formats |
|----------|---------|
| Siemens TIA Portal | CSV, XML |
| Siemens STEP 7 Manager | SDF |
| Rockwell Studio 5000 | L5X, CSV |
| Schneider EcoStruxure Control Expert | XEF, CSV |
| Mitsubishi GX Works3 | CSV |
| ABB Automation Builder | CSV |


## Format de saisie

```
[INPUT]
nom_variable : commentaire
autre_variable : commentaire

[OUTPUT]
sortie_1 : commentaire
```

## Architecture

```
scripts/
├── core/          (classes pures, sans DOM)
│   ├── FormulaEngine.js
│   ├── FormulaConfig.js
│   ├── AddressGenerator.js
│   ├── ItemNmenique.js
│   └── ExportManager.js
└── ui/            (classes d'interface)
    ├── helpers.js
    ├── Zone1_ui.js
    ├── Zone2_ui.js
    ├── Zone3_ui.js
    └── App_ui.js
```

## Technologies

- HTML5 / CSS3 / JavaScript ES6+
- Aucune dépendance externe
- 100% côté client (navigateur)
