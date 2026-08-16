"use strict";

/**
 * Helpers - Fonctions utilitaires UI
 */

function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return document.querySelectorAll(selector);
}

function createElement(tag, className, textContent) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (textContent) el.textContent = textContent;
    return el;
}

function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}
