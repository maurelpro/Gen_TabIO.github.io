"use strict";

/**
 * App_ui - Orchestration principale
 */
class App_ui {

    constructor() {
        this.engine = new FormulaEngine();
        this.generator = new AddressGenerator(this.engine);
        this.exportManager = new ExportManager();

        this.zone1 = new Zone1_ui();
        this.zone2 = new Zone2_ui();
        this.zone3 = new Zone3_ui(this.exportManager);

        this.items = [];

        this._bindEvents();
        this._initSplitters();
    }

    _bindEvents() {
        // Zone 1
        this.zone1.onValidate = () => this._validateAndGenerate();
        this.zone1.onToggleView = () => this._toggleView();

        // Zone 2
        this.zone2.onUpdate = () => this._updateAddresses();

        // Modale aide
        $("#btnHelp").addEventListener("click", () => {
            $("#helpModal").classList.add("active");
        });

        $("#btnCloseModal").addEventListener("click", () => {
            $("#helpModal").classList.remove("active");
        });

        $("#helpModal").addEventListener("click", (e) => {
            if (e.target === $("#helpModal")) {
                $("#helpModal").classList.remove("active");
            }
        });
    }

    _validateAndGenerate() {
        try {
            const source = this.zone1.getSource();
            const items = this.zone1.parseSource(source);

            if (items.length === 0) {
                alert("Aucun item valide trouvé. Vérifiez le format.");
                return;
            }

            this.items = items;
            this._updateAddresses();
            this.zone3.updateItems(items);

        } catch (e) {
            alert(`Erreur de validation: ${e.message}`);
        }
    }

    _updateAddresses() {
        if (this.items.length === 0) {
            alert("Validez d'abord la Zone 1.");
            return;
        }

        try {
            const config = this.zone2.getConfig();
            const addresses = this.generator.generate(this.items, config);

            // Mettre à jour les adresses dans les items
            this.items.forEach((item, index) => {
                item.adresse = addresses[index];
            });

            this.zone2.displayAddresses(this.items, addresses);
            this.zone3.updateItems(this.items);

        } catch (e) {
            alert(`Erreur de génération: ${e.message}`);
        }
    }

    _toggleView() {
        const source = this.zone1.getSource();
        const lines = source.split("\n");
        const inputLines = [];
        const outputLines = [];
        let currentSection = null;

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed === "[INPUT]") {
                currentSection = "input";
                continue;
            }
            if (trimmed === "[OUTPUT]") {
                currentSection = "output";
                continue;
            }
            if (currentSection === "input") inputLines.push(line);
            if (currentSection === "output") outputLines.push(line);
        }

        const newSource = "[INPUT]\n" + inputLines.join("\n") + "\n\n[OUTPUT]\n" + outputLines.join("\n");
        this.zone1.setSource(newSource);
    }

    _initSplitters() {
        // Splitter vertical entre Zone 1 et Zone 2
        this._makeDraggable($("#splitterV"), "vertical");
        // Splitter horizontal dans Zone 2
        this._makeDraggable($("#splitterH"), "horizontal");
        // Splitter horizontal entre Zone 2 et Zone 3
        this._makeDraggable($("#splitterH2"), "horizontal");
    }

    _makeDraggable(splitter, direction) {
        let startPos = 0;
        let startSize = 0;
        let target = null;

        splitter.addEventListener("mousedown", (e) => {
            e.preventDefault();
            startPos = direction === "vertical" ? e.clientX : e.clientY;

            if (splitter.id === "splitterV") {
                target = $(".zone-1");
                startSize = target.offsetHeight;
            } else if (splitter.id === "splitterH") {
                target = $(".config-panel");
                startSize = target.offsetHeight;
            } else if (splitter.id === "splitterH2") {
                target = $(".zone-2");
                startSize = target.offsetHeight;
            }

            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        });

        const onMove = (e) => {
            if (!target) return;
            const currentPos = direction === "vertical" ? e.clientY : e.clientY;
            const diff = currentPos - startPos;
            const newSize = Math.max(50, startSize + diff);
            target.style.height = newSize + "px";
        };

        const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
            target = null;
        };
    }
}

// Démarrage
document.addEventListener("DOMContentLoaded", () => {
    window.app = new App_ui();
});
