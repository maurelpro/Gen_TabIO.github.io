"use strict";
/* core/FormulaEngine.js — classe pure : tokenize, parse, évalue, valide */

class FormulaError extends Error {}

class FormulaEngine {
  static ALLOWED = new Set([
    "n",
    "Input.COUNT", "Input.ADDRESS_START", "Input.ADDRESS_END",
    "Output.COUNT", "Output.ADDRESS_START", "Output.ADDRESS_END"
  ]);
  constructor(){ this._cache = new Map(); }

  tokenize(src){
    const toks = []; let i = 0;
    while (i < src.length){
      const c = src[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/[0-9]/.test(c)){
        let j = i;
        while (j < src.length && /[0-9.]/.test(src[j])) j++;
        const raw = src.slice(i, j);
        if ((raw.match(/\./g) || []).length > 1) throw new FormulaError(`Nombre invalide « ${raw} »`);
        toks.push({ t:"num", v:parseFloat(raw) }); i = j; continue;
      }
      if (/[A-Za-z_]/.test(c)){
        let j = i;
        while (j < src.length && /[A-Za-z0-9_.]/.test(src[j])) j++;
        let word = src.slice(i, j);
        while (word.endsWith(".")) { word = word.slice(0, -1); j--; }
        if (!FormulaEngine.ALLOWED.has(word))
          throw new FormulaError(`Variable inconnue ou interdite « ${word} »`);
        toks.push({ t:"var", v:word }); i = j; continue;
      }
      if ("+-*/%()".includes(c)) { toks.push({ t:c }); i++; continue; }
      throw new FormulaError(`Caractère interdit « ${c} »`);
    }
    return toks;
  }

  parse(src){
    if (this._cache.has(src)) return this._cache.get(src);
    const toks = this.tokenize(src);
    if (!toks.length) throw new FormulaError("Formule vide");
    let p = 0;
    const peek = () => toks[p];
    const eat = t => {
      const tk = toks[p];
      if (!tk || tk.t !== t) throw new FormulaError("Parenthèse fermante attendue");
      p++; return tk;
    };
    const parseExpr = () => {
      let n = parseTerm();
      while (peek() && (peek().t === "+" || peek().t === "-")){
        const op = toks[p++].t; n = { op, l:n, r:parseTerm() };
      }
      return n;
    };
    const parseTerm = () => {
      let n = parseFactor();
      while (peek() && ["*","/","%"].includes(peek().t)){
        const op = toks[p++].t; n = { op, l:n, r:parseFactor() };
      }
      return n;
    };
    const parseFactor = () => {
      const tk = peek();
      if (!tk) throw new FormulaError("Fin de formule inattendue");
      if (tk.t === "+"){ p++; return parseFactor(); }
      if (tk.t === "-"){ p++; return { op:"neg", l:parseFactor() }; }
      if (tk.t === "num"){ p++; return { num:tk.v }; }
      if (tk.t === "var"){ p++; return { name:tk.v }; }
      if (tk.t === "("){ p++; const e = parseExpr(); eat(")"); return e; }
      throw new FormulaError(`Symbole inattendu « ${tk.t} »`);
    };
    const ast = parseExpr();
    if (p < toks.length) throw new FormulaError("Symbole inattendu en fin de formule");
    this._cache.set(src, ast);
    return ast;
  }

  evaluate(src, vars){
    const ast = this.parse(src);
    const ev = node => {
      if (node.num !== undefined) return node.num;
      if (node.name !== undefined){
        if (!(node.name in vars)) throw new FormulaError(`Variable non résolue « ${node.name} »`);
        return vars[node.name];
      }
      if (node.op === "neg") return -ev(node.l);
      const a = ev(node.l), b = ev(node.r);
      switch (node.op){
        case "+": return a + b;
        case "-": return a - b;
        case "*": return a * b;
        case "/": if (b === 0) throw new FormulaError("Division par zéro"); return a / b;
        case "%": if (b === 0) throw new FormulaError("Modulo par zéro"); return a % b;
      }
    };
    return ev(ast);
  }

  /* syntaxe + liste blanche + test n=0 + entier + positif */
  validate(src, vars){
    try {
      const v = this.evaluate(src, vars);
      if (!Number.isFinite(v))   return { ok:false, error:"Résultat non fini" };
      if (!Number.isInteger(v))  return { ok:false, error:`Le résultat doit être entier (obtenu ${v})` };
      if (v < 0)                 return { ok:false, error:`Le résultat doit être positif ou nul (obtenu ${v})` };
      return { ok:true, value:v };
    } catch(e){ return { ok:false, error:e.message }; }
  }

  collectRefs(src){
    const found = new Set();
    try {
      const walk = n => { if (!n) return; if (n.name) found.add(n.name); walk(n.l); walk(n.r); };
      walk(this.parse(src));
    } catch(e){ /* syntaxe invalide : signalée par validate() */ }
    return found;
  }
}
