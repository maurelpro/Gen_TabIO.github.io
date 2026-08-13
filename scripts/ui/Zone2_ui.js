"use strict";
/* ui/Zone2_ui.js — affichage lecture seule + panneau de configuration */

/* Coloration syntaxique temps réel des champs formule */
function highlightFormula(src){
  const opCls = { "+":"fx-op-plus", "-":"fx-op-minus", "*":"fx-op-mul",
                  "/":"fx-op-div", "%":"fx-op-mod", "(":"fx-par", ")":"fx-par" };
  let out = "", i = 0;
  while (i < src.length){
    const c = src[i];
    if (/\s/.test(c)){
      let j = i; while (j < src.length && /\s/.test(src[j])) j++;
      out += esc(src.slice(i, j)); i = j; continue;
    }
    if (/[0-9]/.test(c)){
      let j = i; while (j < src.length && /[0-9.]/.test(src[j])) j++;
      out += `<span class="fx-num">${esc(src.slice(i, j))}</span>`; i = j; continue;
    }
    if (/[A-Za-z_]/.test(c)){
      let j = i; while (j < src.length && /[A-Za-z0-9_.]/.test(src[j])) j++;
      const w = src.slice(i, j);
      let cls = "fx-bad";
      if (!w.endsWith(".")){
        if (w === "n") cls = "fx-var-n";
        else if (w.startsWith("Input.")  && FormulaEngine.ALLOWED.has(w)) cls = "fx-var-in";
        else if (w.startsWith("Output.") && FormulaEngine.ALLOWED.has(w)) cls = "fx-var-out";
      }
      out += `<span class="${cls}">${esc(w)}</span>`; i = j; continue;
    }
    if (opCls[c]) { out += `<span class="${opCls[c]}">${esc(c)}</span>`; i++; continue; }
    out += `<span class="fx-bad">${esc(c)}</span>`; i++;
  }
  return out;
}

class Zone2_ui {
  constructor(app){
    this.app = app;
    this.view = $("#addrView");
    this.fsIn  = document.querySelector('.cat[data-cat="input"]');
    this.fsOut = document.querySelector('.cat[data-cat="output"]');

    [this.fsIn, this.fsOut].forEach(fs => {
      fs.addEventListener("input", debounce(() => { this.validateLive(); this.app.markStale(); }, 280));
      fs.querySelector('[data-f="hasy"]').addEventListener("change", () => {
        this.applyHasY(fs); this.validateLive(); this.app.markStale();
      });
    });
    $("#btnUpdate").addEventListener("click", () => this.app.applyAndRegenerate(this.readAll()));

    this._fxInit();
    this.applyHasY(this.fsIn); this.applyHasY(this.fsOut);
    this._helpInit();
  }

  _fxInit(){
    $$(".fx-wrap").forEach(wrap => {
      const inp = wrap.querySelector("input");
      const hl  = wrap.querySelector(".fx-hl");
      const paint = () => { hl.innerHTML = highlightFormula(inp.value) + " "; };
      inp.addEventListener("input", paint);
      inp.addEventListener("scroll", () => { hl.scrollLeft = inp.scrollLeft; });
      paint();
    });
  }

  /* bouton « ? » → modale d'aide détaillée */
  _helpInit(){
    const modal = $("#helpModal");
    const open  = () => { modal.hidden = false; requestAnimationFrame(() => modal.classList.add("show")); };
    const close = () => { modal.classList.remove("show"); setTimeout(() => modal.hidden = true, 200); };
    $("#btnHelp").addEventListener("click", open);
    $("#helpClose").addEventListener("click", close);
    $("#helpOk").addEventListener("click", close);
    modal.addEventListener("click", e => { if (e.target === modal) close(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) close(); });
  }

  applyHasY(fs){
    const on = fs.querySelector('[data-f="hasy"]').checked;
    fs.querySelector('[data-wrap="sy"]').classList.toggle("disabled", !on);
    fs.querySelector('[data-wrap="fy"]').classList.toggle("disabled", !on);
  }

  readCat(fs){
    const g = f => fs.querySelector(`[data-f="${f}"]`);
    return {
      prefix: g("prefix").value.trim() || "?",
      started: new AdressBasicFormat(+g("sx").value || 0, +g("sy").value || 0, g("hasy").checked),
      formulaSTARTED: g("formulaSTARTED").value.trim() || "0",
      formulaX: g("formulaX").value.trim(),
      formulaY: g("formulaY").value.trim()
    };
  }
  readAll(){ return { input:this.readCat(this.fsIn), output:this.readCat(this.fsOut) }; }

  validateLive(){
    const cfgs = this.readAll();
    const vars = this.app.previewVars(cfgs);
    let allOk = true;
    for (const fs of [this.fsIn, this.fsOut]){
      const cat = fs.dataset.cat;
      const hasY = fs.querySelector('[data-f="hasy"]').checked;
      for (const f of ["formulaSTARTED","formulaX","formulaY"]){
        if (f === "formulaY" && !hasY){ this._setLed(fs, f, true, ""); continue; }
        const res = this.app.engine.validate(cfgs[cat][f], { ...vars, n:0 });
        this._setLed(fs, f, res.ok, res.ok ? "" : res.error);
        if (!res.ok) allOk = false;
      }
    }
    return allOk;
  }
  _setLed(fs, f, ok, msg){
    fs.querySelector(`[data-led="${f}"]`).className = "led " + (ok ? "ok" : "ko");
    const fld = fs.querySelector(`[data-f="${f}"]`).closest(".fld");
    fld.classList.toggle("invalid", !ok);
    fs.querySelector(`[data-f="${f}"]`).title = ok ? "Testée avec n=0 : valide" : msg;
    fs.querySelector(`[data-err="${f}"]`).textContent = msg;
  }

  render(rows){
    this.view.innerHTML =
      this._sec("INPUT", rows.input, "in") + this._sec("OUTPUT", rows.output, "out");
  }
  _sec(title, rows, cls){
    if (!rows.length)
      return `<div class="addr-sec ${cls}">${title} <span class="rng">· 0 item</span></div>
              <div class="addr-empty">— aucun élément défini —</div>`;
    const range = `${rows[0].address} → ${rows[rows.length - 1].address}`;
    return `<div class="addr-sec ${cls}">${title} <span class="rng">· ${rows.length} items · ${range}</span></div>` +
      rows.map((r, i) =>
        `<div class="addr-row ${cls}" style="animation-delay:${Math.min(i * 14, 300)}ms">
           <span class="idx">${String(r.index).padStart(2,"0")}</span>
           <span class="nm">${esc(r.name)}</span>
           <span class="ad">${esc(r.address)}</span>
           <span class="cm" title="${esc(r.comment)}">${esc(r.comment)}</span>
         </div>`).join("");
  }

  setStatus(txt, mode){
    const el = $("#cfgStatus");
    el.textContent = txt;
    el.className = mode === "err" ? "err" : mode === "stale" ? "stale" : "";
  }
}
