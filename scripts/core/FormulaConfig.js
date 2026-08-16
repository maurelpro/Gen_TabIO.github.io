"use strict";

/**
 * FormulaConfig - Gère la configuration Input/Output
 * Classe pure, sans dépendance DOM
 */
class FormulaConfig {

    constructor() {
        this.input = {
            prefix: "I",
            format: "xy",  // "xy" ou "y"
            startX: 0,
            startY: 0,
            formulaSTARTED: "0",
            formulaX: "n",
            formulaY: "0"
        };

        this.output = {
            prefix: "Q",
            format: "xy",
            startX: 0,
            startY: 0,
            formulaSTARTED: "0",
            formulaX: "n",
            formulaY: "0"
        };
    }

    setConfig(type, key, value) {
        if (this[type] && key in this[type]) {
            this[type][key] = value;
        }
    }

    getConfig(type) {
        return { ...this[type] };
    }

    getAll() {
        return {
            input: this.getConfig("input"),
            output: this.getConfig("output")
        };
    }
}
