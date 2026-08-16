"use strict";

/**
 * ItemNmenique - Représente un élément E/S
 * Classe pure, sans dépendance DOM
 */
class ItemNmenique {

    constructor({ categorie = "input", nom = "", adresse = "", commentaire = "" } = {}) {
        this.categorie = categorie;   // "input" ou "output"
        this.nom = nom;
        this.adresse = adresse;
        this.commentaire = commentaire;
    }

    toString() {
        return `${this.categorie.toUpperCase()} | ${this.adresse} | ${this.nom} | ${this.commentaire}`;
    }
}
