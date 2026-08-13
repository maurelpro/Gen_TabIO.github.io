"use strict";
/* ui/Zone1_ui.js — éditeur INPUT/OUTPUT, coloration, bascule */

class Zone1_ui {
  static LINE_H = 22;

  constructor(app){
    this.app = app;
    this.ta = $("#src"); this.hl = $("#hl"); this.gut = $("#gutIn");
    this.model = { input:{items:[],headerLine:-1}, output:{items:[],headerLine:-1}, errors:[] };

    $("#ioSwitch").addEventListener("click", () => this.jumpTo(this.view === "input" ? "output" : "input"));
    this.ta.addEventListener("input", () => { this.render(); this.app.onSourceChanged(); });
    this.ta.addEventListener("scroll", () => this.syncScroll());
    this.ta.addEventListener("click", () => this.onClick());
    this.ta.addEventListener("keyup",  () => this.trackView());
    this.ta.addEventListener("keydown", e => {
      if (e.key === "Tab"){ e.preventDefault();
        this.ta.setRangeText("  ", this.ta.selectionStart, this.ta.selectionEnd, "end");
        this.ta.dispatchEvent(new Event("input")); }
    });
    this.setView("input");
  }

  /* Format accepté :
     - [INPUT] / [OUTPUT]
     - « name : commentaire »            -> TOUJOURS valide
     - « name : # commentaire »          -> équivalent (# optionnel)
     - « # ... » ligne pleine            -> commentaire, ignoré             */
  parse(){
    const m = { input:{items:[],headerLine:-1}, output:{items:[],headerLine:-1}, errors:[] };
    let cur = null;
    this.ta.value.split("\n").forEach((line, i) => {
      const t = line.trim();
      if (/^\[INPUT\]$/i.test(t))  { cur = "input";  m.input.headerLine  = i; return; }
      if (/^\[OUTPUT\]$/i.test(t)) { cur = "output"; m.output.headerLine = i; return; }
      if (t === "" || /^[ \t]*#/.test(line)) return;          // vide ou commentaire plein
      if (!cur){ m.errors.push(i + 1); return; }
      const mm = line.match(/^[ \t]*([^\s:#][^:#]*?)[ \t]*:[ \t]*(.*)$/);
      if (mm){
        const rest = mm[2];
        const hm = rest.match(/^#[ \t]*(.*)$/);
        const comment = (hm ? hm[1] : rest).trim();           // « name : commentaire » toujours accepté
        m[cur].items.push({ name:mm[1].trim(), comment });
      } else m.errors.push(i + 1);
    });
    this.model = m;
    return m;
  }

  render(){ this.parse(); this.highlight(); this.gutter(); this.status(); }

  highlight(){
    let section = null;
    const html = this.ta.value.split("\n").map((line, i) => {
      const t = line.trim();
      if (/^\[INPUT\]$/i.test(t)){ section = "input";
        return `<span class="ln" data-hl-line="${i}"><span class="tg-in">[INPUT]</span></span>`; }
      if (/^\[OUTPUT\]$/i.test(t)){ section = "output";
        return `<span class="ln" data-hl-line="${i}"><span class="tg-out">[OUTPUT]</span></span>`; }
      if (/^[ \t]*#/.test(line))
        return `<span class="ln" data-hl-line="${i}"><span class="cmt">${esc(line)}</span></span>`;
      if (section && t !== ""){
        const m = line.match(/^([ \t]*)([^:\s#][^:#]*)([ \t]*:[ \t]*)(.*)$/);
        if (m)
          return `<span class="ln" data-hl-line="${i}">${m[1]}` +
                 `<span class="nm">${esc(m[2])}</span>` +
                 `<span class="pnc">${esc(m[3])}</span>` +
                 `<span class="cmt">${esc(m[4])}</span></span>`;
        return `<span class="ln err" data-hl-line="${i}">${esc(line)}</span>`;
      }
      return `<span class="ln" data-hl-line="${i}">${esc(line)}</span>`;
    }).join("\n");
    this.hl.innerHTML = html + "\n";
  }

  gutter(){
    const n = this.ta.value.split("\n").length;
    let h = "";
    for (let i = 1; i <= n; i++) h += `<div>${i}</div>`;
    this.gut.innerHTML = h;
    this.syncScroll();
  }

  syncScroll(){
    this.hl.scrollTop = this.ta.scrollTop;
    this.hl.scrollLeft = this.ta.scrollLeft;
    this.gut.style.transform = `translateY(${-this.ta.scrollTop}px)`;
  }

  status(){
    const m = this.model, nIn = m.input.items.length, nOut = m.output.items.length;
    const parts = [`<span class="ok">OK</span>&nbsp;${nIn} INPUT · ${nOut} OUTPUT`];
    if (m.input.headerLine < 0 || m.output.headerLine < 0)
      parts.push(`<span class="bad">section manquante</span>`);
    if (m.errors.length)
      parts.push(`<span class="bad">ligne(s) non reconnue(s) : ${m.errors.join(", ")}</span>`);
    $("#z1stat").innerHTML = parts.join(" &nbsp;·&nbsp; ");
  }

  flashBad(msg){
    const el = $("#z1stat");
    el.innerHTML = `<span class="bad">${esc(msg)}</span>`;
    clearTimeout(this._ft);
    this._ft = setTimeout(() => this.status(), 2000);
  }

  /* clic sur [INPUT] → saute à [OUTPUT], et inversement */
  onClick(){
    const line = this.ta.value.slice(0, this.ta.selectionStart).split("\n").length - 1;
    const m = this.model;
    setTimeout(() => {
      if (line === m.input.headerLine)       this.jumpTo("output");
      else if (line === m.output.headerLine) this.jumpTo("input");
      else this.trackView();
    }, 0);
  }

  jumpTo(sec){
    const m = this.model, h = m[sec].headerLine;
    if (h < 0){ this.flashBad(`Section [${sec.toUpperCase()}] introuvable dans la source`); return; }
    const starts = []; let acc = 0;
    this.ta.value.split("\n").forEach(l => { starts.push(acc); acc += l.length + 1; });
    const pos = starts[h];
    this.ta.focus();
    this.ta.setSelectionRange(pos, pos + ("[" + sec + "]").length);
    this.ta.scrollTop = Math.max(0, h * Zone1_ui.LINE_H - this.ta.clientHeight * 0.35);
    this.syncScroll();
    this.setView(sec);
    const ln = this.hl.querySelector(`[data-hl-line="${h}"]`);
    if (ln){ ln.classList.remove("flash"); void ln.offsetWidth; ln.classList.add("flash"); }
  }

  trackView(){
    const line = this.ta.value.slice(0, this.ta.selectionStart).split("\n").length - 1;
    const m = this.model;
    if (m.output.headerLine >= 0 && line >= m.output.headerLine) this.setView("output");
    else if (m.input.headerLine >= 0 && line >= m.input.headerLine) this.setView("input");
  }

  setView(sec){
    this.view = sec;
    $("#ioSwitch").classList.toggle("out", sec === "output");
    $("#ioSwitch").setAttribute("aria-pressed", sec === "output");
  }
}
