"use strict";

/**
 * AddressGenerator - Génère les adresses à partir des items et de la config
 * Classe pure, sans dépendance DOM
 */
class AddressGenerator {

    constructor(engine) {
        this.engine = engine || new FormulaEngine();
    }

    /**
     * Génère les adresses pour une liste d'items
     * @param {Array} items - Liste d'ItemNmenique
     * @param {object} config - Configuration { input: {...}, output: {...} }
     * @returns {Array} Liste d'adresses
     */
    generate(items, config) {
        const addresses = [];
        const inputCount = items.filter(i => i.categorie === "input").length;
        const outputCount = items.filter(i => i.categorie === "output").length;

        const context = {
            "n": 0,
            "Input.COUNT": inputCount,
            "Output.COUNT": outputCount,
            "Input.ADDRESS_START": config.input.startX,
            "Output.ADDRESS_START": config.output.startX,
            "Input.ADDRESS_END": inputCount - 1,
            "Output.ADDRESS_END": outputCount - 1
        };

        let inputIndex = 0;
        let outputIndex = 0;

        for (const item of items) {
            const cfg = item.categorie === "input" ? config.input : config.output;
            const n = item.categorie === "input" ? inputIndex : outputIndex;

            context["n"] = n;

            try {
                const started = this.engine.evaluate(cfg.formulaSTARTED, context);
                const x = this.engine.evaluate(cfg.formulaX, context);
                const y = this.engine.evaluate(cfg.formulaY, context);

                const finalX = cfg.startX + started + x;
                const finalY = cfg.startY + y;

                let address;
                if (cfg.format === "xy") {
                    address = `${cfg.prefix}${finalX}.${finalY}`;
                } else {
                    address = `${cfg.prefix}${finalX}`;
                }

                addresses.push(address);
            } catch (e) {
                addresses.push(`ERR(${item.nom})`);
            }

            if (item.categorie === "input") inputIndex++;
            else outputIndex++;
        }

        return addresses;
    }
}
