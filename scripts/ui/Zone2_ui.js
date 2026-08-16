"use strict";

/**
 * Zone2_ui - Gère le générateur d'adresses et la configuration
 */
class Zone2_ui {

    constructor() {
        this.addressList = $("#addressList");
        this.btnUpdate = $("#btnUpdateAddresses");
        this.onUpdate = null;

        this._bindEvents();
    }

    _bindEvents() {
        this.btnUpdate.addEventListener("click", () => {
            if (this.onUpdate) this.onUpdate();
        });
    }

    getConfig() {
        return {
            input: {
                prefix: $("#prefixInput").value || "I",
                format: $("#formatInput").value || "xy",
                startX: parseInt($("#startInputX").value) || 0,
                startY: parseInt($("#startInputY").value) || 0,
                formulaSTARTED: $("#formulaStarted").value || "0",
                formulaX: $("#formulaX").value || "n",
                formulaY: $("#formulaY").value || "0"
            },
            output: {
                prefix: $("#prefixOutput").value || "Q",
                format: $("#formatOutput").value || "xy",
                startX: parseInt($("#startOutputX").value) || 0,
                startY: parseInt($("#startOutputY").value) || 0,
                formulaSTARTED: $("#formulaStarted").value || "0",
                formulaX: $("#formulaX").value || "n",
                formulaY: $("#formulaY").value || "0"
            }
        };
    }

    displayAddresses(items, addresses) {
        this.addressList.innerHTML = "";

        items.forEach((item, index) => {
            const div = createElement("div", `address-item ${item.categorie}`);

            const addrSpan = createElement("span", "addr", addresses[index] || "---");
            const nameSpan = createElement("span", "name", item.nom);
            const commentSpan = createElement("span", "comment", item.commentaire);

            div.appendChild(addrSpan);
            div.appendChild(nameSpan);
            div.appendChild(commentSpan);
            this.addressList.appendChild(div);
        });
    }

    clearAddresses() {
        this.addressList.innerHTML = "";
    }
}
