"use strict";

/**
 * Zone1_ui - Gère l'éditeur Input/Output
 */
class Zone1_ui {

    constructor() {
        this.textarea = $("#inputSource");
        this.btnValidate = $("#btnValidate");
        this.btnToggleView = $("#btnToggleView");
        this.onValidate = null;
        this.onToggleView = null;

        this._bindEvents();
    }

    _bindEvents() {
        this.btnValidate.addEventListener("click", () => {
            if (this.onValidate) this.onValidate();
        });

        this.btnToggleView.addEventListener("click", () => {
            if (this.onToggleView) this.onToggleView();
        });
    }

    getSource() {
        return this.textarea.value;
    }

    setSource(value) {
        this.textarea.value = value;
    }

    parseSource(source) {
        const lines = source.split("\n");
        const items = [];
        let currentCategory = null;

        for (let line of lines) {
            line = line.trim();

            // Ignorer les commentaires et lignes vides
            if (line.startsWith("#") || line === "") continue;

            // Détecter les sections
            if (line.startsWith("[") && line.endsWith("]")) {
                const section = line.slice(1, -1).toLowerCase();
                if (section === "input" || section === "output") {
                    currentCategory = section;
                }
                continue;
            }

            // Parser les items
            if (currentCategory && line.includes(":")) {
                const parts = line.split(":");
                const nom = parts[0].trim();
                const commentaire = parts.slice(1).join(":").trim();

                if (nom) {
                    items.push(new ItemNmenique({
                        categorie: currentCategory,
                        nom: nom,
                        commentaire: commentaire,
                        adresse: ""
                    }));
                }
            }
        }

        return items;
    }
}
