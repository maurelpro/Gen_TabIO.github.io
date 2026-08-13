"use strict";
/* core/AddressGenerator.js — classe pure : génération des adresses finales */

class AddressGenerator {
  constructor(engine){ this.engine = engine; }

  /* 1) décalage STARTED · 2) X · 3) Y si hasY · 4) + started.x/y · 5) adresse */
  generate(items, cfg, baseVars, catName){
    const out = [];
    for (let i = 0; i < items.length; i++){
      const vars = { ...baseVars, n:i };
      const off = this._check(this.engine.evaluate(cfg.formulaSTARTED, vars), "formulaSTARTED", i, catName);
      const v2 = { ...baseVars, n: i + off };
      const X = this._check(this.engine.evaluate(cfg.formulaX, v2), "formulaX", i, catName);
      let address;
      if (cfg.started.hasY){
        const Y = this._check(this.engine.evaluate(cfg.formulaY, v2), "formulaY", i, catName);
        let x = cfg.started.x + X, y = cfg.started.y + Y;
        if (y >= 8){ x += Math.floor(y / 8); y %= 8; }
        address = `${cfg.prefix}${x}.${y}`;
      } else {
        address = `${cfg.prefix}${cfg.started.x + X}`;
      }
      out.push({ index:i, name:items[i].name, comment:items[i].comment, address });
    }
    return out;
  }
  _check(v, f, n, cat){
    if (!Number.isInteger(v) || v < 0)
      throw new FormulaError(`${cat.toUpperCase()} · ${f} → valeur invalide pour n=${n} (${v})`);
    return v;
  }
}
