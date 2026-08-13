"use strict";
/* ui/App_ui.js — orchestration, splitters, état global + démarrage */

const DEFAULT_SRC =
`# Cartographie E/S — cellule de perçage
[INPUT]
bp_start : Bouton-poussoir marche
bp_stop : Bouton-poussoir arrêt (NC)
cap_pos_h : Capteur position haute
cap_pos_b : Capteur position basse
relais_th : Relais thermique moteur
sel_mode : Sélecteur auto / manuel


[OUTPUT]
km1 : Contacteur moteur principal
ev_circ_a : Électrovanne circuit A
voy_def : Voyant défaut (rouge)
klaxon : Avertisseur sonore`;

class App_ui {
  constructor(){
    this.engine = new FormulaEngine();
    this.config = new FormulaConfig(this.engine);
    this.generator = new AddressGenerator(this.engine);
    this.rows = { input:[], output:[] };
    this.stale = false;
  }

  init(){
    this.z1 = new Zone1_ui(this);
    this.z2 = new Zone2_ui(this);
    this.z3 = new Zone3_ui(this);
    $("#src").value = DEFAULT_SRC;
    this.setupSplitters();
    this.z1.render();
    this.z2.validateLive();
    this.applyAndRegenerate(this.z2.readAll(), { silent:true });
  }

  onSourceChanged(){
    this.config.setCounts(this.z1.model.input.items.length, this.z1.model.output.items.length);
    this.markStale();
  }
  markStale(){
    this.stale = true;
    this.z2.setStatus("Données modifiées — cliquez sur « Mettre à jour »", "stale");
  }
  ensureFresh(){
    if (this.stale) this.applyAndRegenerate(this.z2.readAll(), { silent:true });
  }
  previewVars(cfgs){
    this.config.setCounts(this.z1.model.input.items.length, this.z1.model.output.items.length);
    return this.config.previewVars(cfgs);
  }

  applyAndRegenerate(cfgs, opts = {}){
    this.config.apply("input", cfgs.input);
    this.config.apply("output", cfgs.output);
    this.config.setCounts(this.z1.model.input.items.length, this.z1.model.output.items.length);
    if (!this.z2.validateLive()){
      if (!opts.silent) this.z2.setStatus("ERREUR — formules invalides, corrigez les champs signalés", "err");
      return false;
    }
    return this.regenerate(opts);
  }

  regenerate(opts = {}){
    try {
      const vars = this.config.buildVars();
      this.rows = {
        input:  this.generator.generate(this.z1.model.input.items,  this.config.input,  vars, "input"),
        output: this.generator.generate(this.z1.model.output.items, this.config.output, vars, "output")
      };
      this.z2.render(this.rows);
      this.z3.refresh();
      this.stale = false;
      const sum = arr => arr.length ? `${arr[0].address} → ${arr[arr.length-1].address}` : "—";
      this.z2.setStatus(`VALIDE — INPUT ${sum(this.rows.input)} · OUTPUT ${sum(this.rows.output)}`);
      $("#z2range").textContent = `${this.rows.input.length} E · ${this.rows.output.length} S`;
      return true;
    } catch(e){
      this.z2.setStatus("ERREUR — " + e.message, "err");
      return false;
    }
  }

  setupSplitters(){
    const ws = $("#workspace"), rc = $("#rightcol"), p1 = $("#pane1"), p2 = $("#pane2");

    /* défaut : Zone 1 = 44 %, Zone 2 remplit tout le reste */
    const defaults = () => {
      p1.style.width = Math.round(ws.clientWidth * 0.44) + "px";
      p2.style.flex = "";       // retour au remplissage automatique
      p2.style.height = "";
    };
    defaults();

    const drag = (el, vert) => {
      el.addEventListener("pointerdown", e => {
        if (vert && window.innerWidth <= 960) return;
        e.preventDefault();
        el.setPointerCapture(e.pointerId);
        document.body.classList.add("dragging", vert ? "drag-v" : "drag-h");

        const move = ev => {
          if (vert){
            const r = ws.getBoundingClientRect();
            p1.style.width = Math.min(Math.max(ev.clientX - r.left, 300), r.width - 380) + "px";
          } else {
            const r2 = p2.getBoundingClientRect();
            const p3 = $("#pane3"), sh = $("#splitH");
            const maxH = rc.clientHeight - p3.offsetHeight - sh.offsetHeight - 4;
            const h = Math.min(Math.max(ev.clientY - r2.top, 150), Math.max(150, maxH));
            p2.style.flex = "none";        // hauteur fixe pendant le drag
            p2.style.height = h + "px";
          }
        };
        const up = () => {
          el.removeEventListener("pointermove", move);
          document.body.classList.remove("dragging","drag-v","drag-h");
          try { el.releasePointerCapture(e.pointerId); } catch(_){}
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerup", up, { once:true });
        el.addEventListener("pointercancel", up, { once:true });
      });

      el.addEventListener("dblclick", defaults);   // double-clic = remplissage auto

      el.addEventListener("keydown", e => {
        const s = 24;
        if (vert && e.key === "ArrowLeft")  { p1.style.width  = (p1.offsetWidth - s) + "px"; e.preventDefault(); }
        if (vert && e.key === "ArrowRight") { p1.style.width  = (p1.offsetWidth + s) + "px"; e.preventDefault(); }
        if (!vert && (e.key === "ArrowUp" || e.key === "ArrowDown")){
          const p3 = $("#pane3"), sh = $("#splitH");
          const maxH = rc.clientHeight - p3.offsetHeight - sh.offsetHeight - 4;
          const h = Math.min(Math.max(p2.offsetHeight + (e.key === "ArrowDown" ? s : -s), 150), Math.max(150, maxH));
          p2.style.flex = "none";
          p2.style.height = h + "px";
          e.preventDefault();
        }
      });
    };

    drag($("#splitV"), true);
    drag($("#splitH"), false);

    window.addEventListener("resize", () => {
      if (p1.offsetWidth > ws.clientWidth - 380)
        p1.style.width = Math.max(300, ws.clientWidth - 380) + "px";
      if (p2.style.flex === "none"){   // re-borne la hauteur fixe si la fenêtre change
        const p3 = $("#pane3"), sh = $("#splitH");
        const maxH = rc.clientHeight - p3.offsetHeight - sh.offsetHeight - 4;
        if (p2.offsetHeight > maxH) p2.style.height = Math.max(150, maxH) + "px";
      }
    });
  }
}

/* démarrage */
new App_ui().init();
