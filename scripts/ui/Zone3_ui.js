"use strict";
/* ui/Zone3_ui.js — export : une fonction dédiée par Automate / format cible */

function automatorJSON(rows, cfg){
  return JSON.stringify({
    meta:{ outil:"ADRESSIO", genere:new Date().toISOString(),
           entrees:rows.input.length, sorties:rows.output.length },
    inputs:  rows.input.map(r  => ({ index:r.index, name:r.name, address:r.address, comment:r.comment })),
    outputs: rows.output.map(r => ({ index:r.index, name:r.name, address:r.address, comment:r.comment }))
  }, null, 2);
}

function automatorCSV(rows, cfg){
  const q = v => '"' + String(v ?? "").replace(/"/g,'""') + '"';
  const L = ["\uFEFFSection;Index;Name;Address;Comment"];
  [["INPUT",rows.input],["OUTPUT",rows.output]].forEach(([s,rs]) =>
    rs.forEach(r => L.push([q(s), r.index, q(r.name), q(r.address), q(r.comment)].join(";"))));
  return L.join("\n");
}

function automatorTXT(rows, cfg){
  const L = [`ADRESSIO — cartographie d'adresses · ${new Date().toLocaleString("fr-FR")}`, ""];
  const push = (t, rs) => {
    L.push(`══ ${t} (${rs.length}) ${"═".repeat(Math.max(2, 40 - t.length))}`);
    if (!rs.length){ L.push("  (aucun élément)", ""); return; }
    const wn = Math.max(...rs.map(r => r.name.length));
    const wa = Math.max(...rs.map(r => r.address.length));
    rs.forEach(r => L.push(`  ${String(r.index).padStart(2,"0")}  ${r.name.padEnd(wn)}  ${r.address.padEnd(wa)}  ${r.comment}`));
    L.push("");
  };
  push("INPUT", rows.input); push("OUTPUT", rows.output);
  return L.join("\n");
}

function automatorSCL(rows, cfg){
  const mapP = p => ({ E:"I", Q:"Q", I:"I", M:"M" }[p.toUpperCase()] || p.toUpperCase());
  const L = [`(* ═ ADRESSIO · export SCL / IEC 61131-3 · ${new Date().toLocaleString("fr-FR")} ═ *)`];
  [["input","INPUT"],["output","OUTPUT"]].forEach(([k, t]) => {
    const c = cfg.cat(k), rs = rows[k];
    L.push("", `(* ── ${t} · préfixe ${c.prefix} · ${rs.length} item(s) ── *)`);
    if (!rs.length){ L.push("(* section vide *)"); return; }
    L.push("VAR");
    rs.forEach(r => {
      const id = r.name.replace(/[^A-Za-z0-9_]/g, "_");
      const num = r.address.slice(c.prefix.length);
      const op = `%${mapP(c.prefix)}${c.started.hasY ? "X" : "B"}${num}`;
      L.push(`  ${id.padEnd(16)} AT ${op.padEnd(9)}: BOOL;${r.comment ? `  (* ${r.comment} *)` : ""}`);
    });
    L.push("END_VAR");
  });
  return L.join("\n");
}

const AUTOMATORS = [
  { id:"json", label:"JSON — Générique",               ext:"json", build:automatorJSON },
  { id:"csv",  label:"CSV — Tableur (Excel)",          ext:"csv",  build:automatorCSV  },
  { id:"txt",  label:"TXT — Texte brut",               ext:"txt",  build:automatorTXT  },
  { id:"scl",  label:"SCL — TIA Portal / IEC 61131-3", ext:"scl",  build:automatorSCL  }
];

class Zone3_ui {
  constructor(app){
    this.app = app;
    this.current = "json";
    this.previewVisible = false;
    this.sel = $("#fmtSelect");
    this.sel.innerHTML = AUTOMATORS.map(f => `<option value="${f.id}">${f.label}</option>`).join("");
    this.sel.addEventListener("change", () => { this.current = this.sel.value; this.refresh(); });
    $("#btnEye").addEventListener("click", () => this.setPreview(!this.previewVisible));
    $("#btnCopy").addEventListener("click", () => this.copy());
    $("#btnDl").addEventListener("click",  () => this.download());
    this.setPreview(false);

  }

  get fmt(){ return AUTOMATORS.find(f => f.id === this.current); }
  filename(){
    const d = new Date(), p = n => String(n).padStart(2, "0");
    return `adressio_${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}.${this.fmt.ext}`;
  }
  build(){ return this.fmt.build(this.app.rows, this.app.config); }

setPreview(vis){
  this.previewVisible = vis;
  $("#exportView").hidden = !vis;          // seul élément de contenu
  $("#icoEye").style.display = vis ? "none" : "";
  $("#icoEyeOff").style.display = vis ? "" : "none";
  $("#eyeLab").textContent = vis ? "Masquer" : "Aperçu";
  $("#btnEye").setAttribute("aria-pressed", vis);
  $("#btnEye").title = vis ? "Masquer l'aperçu" : "Afficher l'aperçu";
  if (vis) this.refresh();
}

  refresh(){
    const txt = this.build();
    $("#exportView").innerHTML = this.current === "json" ? this._hlJson(txt) : esc(txt);
    $("#z3foot").textContent =
      `${this.filename()} · ${new Blob([txt]).size.toLocaleString("fr-FR")} octets · Automate : ${this.fmt.label}`;
  }
  _hlJson(str){
    return esc(str)
      .replace(/(&quot;(?:[^\\]|\\.)*?&quot;)(\s*:)?/g, (m, s, c) =>
        c ? `<span class="j-k">${s}</span>${c}` : `<span class="j-s">${s}</span>`)
      .replace(/\b(-?\d+(?:\.\d+)?)\b/g, '<span class="j-n">$1</span>')
      .replace(/\b(true|false|null)\b/g, '<span class="j-b">$1</span>');
  }

  _flashBtn(btn, msg){
    const old = btn.textContent;
    btn.textContent = msg; btn.classList.add("ok-flash");
    setTimeout(() => { btn.textContent = old; btn.classList.remove("ok-flash"); }, 1400);
  }

  copy(){
    this.app.ensureFresh(); this.refresh();
    const txt = this.build(), btn = $("#btnCopy");
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject())
      .then(() => this._flashBtn(btn, "Copié"))
      .catch(() => {
        const t = document.createElement("textarea");
        t.value = txt; document.body.appendChild(t); t.select();
        document.execCommand("copy"); t.remove();
        this._flashBtn(btn, "Copié");
      });
  }
  download(){
    this.app.ensureFresh(); this.refresh();
    const blob = new Blob([this.build()], { type:"text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = this.filename();
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    this._flashBtn($("#btnDl"), "Téléchargé");
  }
}
