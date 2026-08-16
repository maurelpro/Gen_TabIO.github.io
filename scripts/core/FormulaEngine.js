"use strict";

/**
 * FormulaEngine - Évalue et valide les formules mathématiques
 * Classe pure, sans dépendance DOM
 */
class FormulaEngine {

    constructor() {
        this.allowedVariables = new Set([
            "n",
            "Input.COUNT",
            "Output.COUNT",
            "Input.ADDRESS_START",
            "Output.ADDRESS_START",
            "Input.ADDRESS_END",
            "Output.ADDRESS_END"
        ]);
    }

    /**
     * Évalue une formule avec un contexte de variables
     * @param {string} formula - La formule à évaluer
     * @param {object} context - Les variables disponibles
     * @returns {number} Le résultat
     */
    evaluate(formula, context) {
        try {
            // Remplacer les variables par leurs valeurs
            let expr = formula;

            for (const [key, value] of Object.entries(context)) {
                expr = expr.replace(new RegExp(key.replace(/\./g, "\\."), "g"), value);
            }

            // Vérifier qu'il ne reste pas de variables non résolues
            if (/[a-zA-Z_]/.test(expr)) {
                const match = expr.match(/[a-zA-Z_][a-zA-Z0-9_.]*/);
                throw new Error(`Variable inconnue: ${match[0]}`);
            }

            // Évaluer l'expression de manière sécurisée
            const result = this._safeEval(expr);

            if (!Number.isFinite(result)) {
                throw new Error("Résultat non fini");
            }

            return result;
        } catch (e) {
            throw new Error(`Erreur formule "${formula}": ${e.message}`);
        }
    }

    /**
     * Valide une formule (syntaxe + résultat entier positif)
     * @param {string} formula
     * @param {object} context
     * @returns {object} { valid: boolean, error?: string, result?: number }
     */
    validate(formula, context) {
        try {
            const result = this.evaluate(formula, context);

            if (!Number.isInteger(result)) {
                return { valid: false, error: `Résultat non entier: ${result}` };
            }

            if (result < 0) {
                return { valid: false, error: `Résultat négatif: ${result}` };
            }

            return { valid: true, result };
        } catch (e) {
            return { valid: false, error: e.message };
        }
    }

    /**
     * Évaluation sécurisée (pas de eval direct)
     */
    _safeEval(expr) {
        // Autoriser uniquement: chiffres, opérateurs, parenthèses, espaces
        const sanitized = expr.replace(/\s/g, "");

        if (!/^[0-9+\-*/%().]+$/.test(sanitized)) {
            throw new Error("Caractères invalides dans l'expression");
        }

        // Utiliser Function pour évaluer (plus sûr que eval)
        try {
            return new Function(`return (${sanitized});`)();
        } catch (e) {
            throw new Error("Expression invalide");
        }
    }
}
