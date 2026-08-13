"use strict";
/* core/FormulaConfig.js — classe pure : configurations Input / Output */

class AdressBasicFormat {
  constructor(x = 0, y = 0, hasY = true){ this.x = +x || 0; this.y = +y || 0; this.hasY = !!hasY; }
  flat(){ return this.hasY ? this.x * 8 + this.y : this.x; }
}

class CategoryConfig {
  constructor({ prefix = "E", started = new AdressBasicFormat(),
                formulaSTARTED = "0",
                formulaX = "(n - (n % 8)) / 8",
                formulaY = "n % 8" } = {}){
    this.prefix = prefix; this.started = started;
    this.formulaSTARTED = formulaSTARTED; this.formulaX = formulaX; this.formulaY = formulaY;
  }
}

class FormulaConfig {
  constructor(engine){
    this.engine = engine;
    this.input  = new CategoryConfig({ prefix:"E" });
    this.output = new CategoryConfig({ prefix:"Q" });
    this.counts = { input:0, output:0 };
  }
  cat(k){ return k === "input" ? this.input : this.output; }
  setCounts(i, o){ this.counts.input = i; this.counts.output = o; }
  apply(k, c){
    const t = this.cat(k);
    t.prefix = c.prefix; t.started = c.started;
    t.formulaSTARTED = c.formulaSTARTED; t.formulaX = c.formulaX; t.formulaY = c.formulaY;
  }

  previewVars(cfgs){
    const si = cfgs.input.started.flat(), so = cfgs.output.started.flat();
    return {
      "Input.COUNT": this.counts.input,   "Input.ADDRESS_START": si, "Input.ADDRESS_END": si,
      "Output.COUNT": this.counts.output, "Output.ADDRESS_START": so, "Output.ADDRESS_END": so
    };
  }

  buildVars(){
    const cnt = this.counts;
    const start = { input:this.input.started.flat(), output:this.output.started.flat() };
    const refs = { input:new Set(), output:new Set() };
    for (const k of ["input","output"]){
      const c = this.cat(k);
      for (const f of ["formulaSTARTED","formulaX","formulaY"])
        for (const v of this.engine.collectRefs(c[f])){
          if (v === "Input.ADDRESS_END")  refs[k].add("input");
          if (v === "Output.ADDRESS_END") refs[k].add("output");
        }
    }
    if (refs.input.has("input"))   throw new FormulaError("Référence circulaire : une formule Input utilise Input.ADDRESS_END");
    if (refs.output.has("output")) throw new FormulaError("Référence circulaire : une formule Output utilise Output.ADDRESS_END");
    if (refs.input.has("output") && refs.output.has("input"))
      throw new FormulaError("Dépendance circulaire entre Input.ADDRESS_END et Output.ADDRESS_END");

    const order = refs.input.has("output") ? ["output","input"] : ["input","output"];
    const ends = {};
    for (const k of order)
      ends[k] = cnt[k] === 0 ? start[k] : this._endFlat(k, cnt, start, ends);

    return {
      "Input.COUNT": cnt.input,   "Input.ADDRESS_START": start.input,  "Input.ADDRESS_END": ends.input,
      "Output.COUNT": cnt.output, "Output.ADDRESS_START": start.output,"Output.ADDRESS_END": ends.output
    };
  }

  _endFlat(k, cnt, start, ends){
    const c = this.cat(k);
    const vars = {
      "Input.COUNT": cnt.input,  "Input.ADDRESS_START": start.input,
      "Output.COUNT": cnt.output,"Output.ADDRESS_START": start.output, n:0
    };
    if (ends.input  !== undefined) vars["Input.ADDRESS_END"]  = ends.input;
    if (ends.output !== undefined) vars["Output.ADDRESS_END"] = ends.output;
    const chk = (v, f) => {
      if (!Number.isInteger(v) || v < 0)
        throw new FormulaError(`${k.toUpperCase()} · ${f} : valeur invalide pour ADDRESS_END (${v})`);
      return v;
    };
    const off = chk(this.engine.evaluate(c.formulaSTARTED, vars), "formulaSTARTED");
    vars.n = cnt[k] - 1 + off;
    const X = chk(this.engine.evaluate(c.formulaX, vars), "formulaX");
    if (c.started.hasY){
      const Y = chk(this.engine.evaluate(c.formulaY, vars), "formulaY");
      let x = c.started.x + X, y = c.started.y + Y;
      if (y >= 8){ x += Math.floor(y / 8); y %= 8; }
      return x * 8 + y;
    }
    return c.started.x + X;
  }
}
