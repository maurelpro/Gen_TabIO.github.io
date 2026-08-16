"use strict";

/**
 * Zone3_ui - Gère l'export
 */
class Zone3_ui {

    constructor(exportManager) {
        this.exportManager = exportManager;
        this.items = [];
        this.previewVisible = false;

        this.selectAutomate = $("#selectAutomate");
        this.selectFormat = $("#selectFormat");
        this.btnDownload = $("#btnDownload");
        this.btnTogglePreview = $("#btnTogglePreview");
        this.preview = $("#exportPreview");

        this._initSelectors();
        this._bindEvents();
    }

    _initSelectors() {
        const automates = this.exportManager.getAutomates();
        this.selectAutomate.innerHTML = '<option value="">-- Choisir un automate --</option>';

        automates.forEach(automate => {
            const option = createElement("option", "", automate.name);
            option.value = automate.name;
            this.selectAutomate.appendChild(option);
        });
    }

    _bindEvents() {
        this.selectAutomate.addEventListener("change", () => this._updateFormats());
        this.selectFormat.addEventListener("change", () => this._updatePreview());
        this.btnDownload.addEventListener("click", () => this._download());
        this.btnTogglePreview.addEventListener("click", () => this._togglePreview());
    }

    _updateFormats() {
        const automateName = this.selectAutomate.value;
        this.selectFormat.innerHTML = '<option value="">-- Choisir un format --</option>';

        if (!automateName) {
            this._updatePreview();
            return;
        }

        const formats = this.exportManager.getFormatsByAutomate(automateName);
        formats.forEach(format => {
            const option = createElement("option", "", `${format.name} (${format.extension})`);
            option.value = format.name;
            this.selectFormat.appendChild(option);
        });

        this._updatePreview();
    }

    _updatePreview() {
        const automateName = this.selectAutomate.value;
        const formatName = this.selectFormat.value;

        if (!automateName || !formatName || this.items.length === 0) {
            this.preview.textContent = "";
            return;
        }

        try {
            const content = this.exportManager.generateContent(automateName, formatName, this.items);
            this.preview.textContent = content;
        } catch (e) {
            this.preview.textContent = `Erreur: ${e.message}`;
        }
    }

    _togglePreview() {
        this.previewVisible = !this.previewVisible;
        this.preview.style.display = this.previewVisible ? "block" : "none";
        this.btnTogglePreview.textContent = this.previewVisible ? "👁 Masquer" : "👁 Aperçu";
        if (this.previewVisible) this._updatePreview();
    }

    _download() {
        const automateName = this.selectAutomate.value;
        const formatName = this.selectFormat.value;

        if (!automateName || !formatName) {
            alert("Veuillez sélectionner un automate et un format");
            return;
        }

        if (this.items.length === 0) {
            alert("Aucune donnée à exporter. Validez d'abord la Zone 1.");
            return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
        const filename = `adressio_export_${timestamp}`;

        try {
            this.exportManager.download(automateName, formatName, this.items, filename);
        } catch (e) {
            alert(`Erreur lors du téléchargement: ${e.message}`);
        }
    }

    updateItems(items) {
        this.items = items;
        this._updatePreview();
    }
}
