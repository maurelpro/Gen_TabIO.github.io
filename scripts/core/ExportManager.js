"use strict";

// ============================================================
// GÉNÉRATEURS DE CONTENU (par automate/format)
// ============================================================

// ---------- Siemens TIA Portal ----------
function generateTiaCSV(items) {
    const entetes = "Name,DataType,Address,Comment\n";
    const lignes = items.map(item => {
        const dataType = "Bool";
        return `${item.nom},${dataType},${item.adresse},${item.commentaire}`;
    }).join("\n");
    return entetes + lignes;
}

function generateTiaXML(items) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<Document>\n';
    xml += '  <Engineering xmlns="http://www.siemens.com/automation/Openness/SW/Interface/v5">\n';
    xml += '    <SW.Tags.PlcTagTable ID="0">\n';
    xml += '      <Name>PLC_Tags</Name>\n';
    items.forEach((item, index) => {
        xml += `      <SW.Tags.PlcTag ID="${index + 1}">\n`;
        xml += `        <Name>${item.nom}</Name>\n`;
        xml += `        <LogicalAddress>${item.adresse}</LogicalAddress>\n`;
        xml += `        <DataType>Bool</DataType>\n`;
        xml += `        <Comment>${item.commentaire}</Comment>\n`;
        xml += `      </SW.Tags.PlcTag>\n`;
    });
    xml += '    </SW.Tags.PlcTagTable>\n';
    xml += '  </Engineering>\n';
    xml += '</Document>';
    return xml;
}

// ---------- Siemens STEP 7 Manager (SDF) ----------
function generateStep7SDF(items) {
    const entetes = "Nom\tAdresse\tType\tCommentaire\n";
    const lignes = items.map(item => {
        return `${item.nom}\t${item.adresse}\tBOOL\t${item.commentaire}`;
    }).join("\n");
    return entetes + lignes;
}

// ---------- Rockwell Studio 5000 ----------
function generateRockwellL5X(items) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<RSLogix5000Content>\n';
    xml += '  <Controller>\n';
    xml += '    <Tags>\n';
    items.forEach(item => {
        xml += `      <Tag Name="${item.nom}" DataType="BOOL" Address="${item.adresse}" Description="${item.commentaire}" />\n`;
    });
    xml += '    </Tags>\n';
    xml += '  </Controller>\n';
    xml += '</RSLogix5000Content>';
    return xml;
}

function generateRockwellCSV(items) {
    const entetes = "Tag Name,Data Type,Address,Description\n";
    const lignes = items.map(item => {
        return `${item.nom},BOOL,${item.adresse},${item.commentaire}`;
    }).join("\n");
    return entetes + lignes;
}

// ---------- Schneider EcoStruxure Control Expert ----------
function generateSchneiderXEF(items) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<EcoStruxureControlExpert>\n';
    xml += '  <Variables>\n';
    items.forEach((item, index) => {
        xml += `    <Variable ID="${index + 1}" Name="${item.nom}" DataType="BOOL" Address="${item.adresse}" Comment="${item.commentaire}" />\n`;
    });
    xml += '  </Variables>\n';
    xml += '</EcoStruxureControlExpert>';
    return xml;
}

function generateSchneiderCSV(items) {
    const entetes = "Name,DataType,Address,Comment\n";
    const lignes = items.map(item => {
        return `${item.nom},BOOL,${item.adresse},${item.commentaire}`;
    }).join("\n");
    return entetes + lignes;
}

// ---------- Mitsubishi GX Works3 ----------
function generateMitsubishiCSV(items) {
    const entetes = "Device,Name,DataType,Comment\n";
    const lignes = items.map(item => {
        return `${item.adresse},${item.nom},Bit,${item.commentaire}`;
    }).join("\n");
    return entetes + lignes;
}

// ---------- ABB Automation Builder ----------
function generateABB_CSV(items) {
    const entetes = "Name,Address,DataType,Comment\n";
    const lignes = items.map(item => {
        return `${item.nom},${item.adresse},BOOL,${item.commentaire}`;
    }).join("\n");
    return entetes + lignes;
}

// ============================================================
// CLASSE EXPORTMANAGER
// ============================================================
class ExportManager {

    constructor() {
        this.automates = [];
        this._registerAll();
    }

    _registerAll() {
        this.registerAutomate("Siemens TIA Portal", [
            { name: "CSV - TIA Portal", extension: ".csv", generator: generateTiaCSV },
            { name: "XML - TIA Portal", extension: ".xml", generator: generateTiaXML }
        ]);

        this.registerAutomate("Siemens STEP 7 Manager", [
            { name: "SDF - STEP 7 Manager", extension: ".sdf", generator: generateStep7SDF }
        ]);

        this.registerAutomate("Rockwell Studio 5000", [
            { name: "L5X - Rockwell", extension: ".L5X", generator: generateRockwellL5X },
            { name: "CSV - Rockwell", extension: ".csv", generator: generateRockwellCSV }
        ]);

        this.registerAutomate("Schneider EcoStruxure Control Expert", [
            { name: "XEF - Schneider", extension: ".xef", generator: generateSchneiderXEF },
            { name: "CSV - Schneider", extension: ".csv", generator: generateSchneiderCSV }
        ]);

        this.registerAutomate("Mitsubishi GX Works3", [
            { name: "CSV - Mitsubishi", extension: ".csv", generator: generateMitsubishiCSV }
        ]);

        this.registerAutomate("ABB Automation Builder", [
            { name: "CSV - ABB", extension: ".csv", generator: generateABB_CSV }
        ]);
    }

    registerAutomate(automateName, formatsArray) {
        this.automates.push({
            name: automateName,
            formats: formatsArray.map(f => ({
                name: f.name,
                extension: f.extension,
                generator: f.generator
            }))
        });
    }

    getAllFormatConvert() {
        const result = [];
        this.automates.forEach(automate => {
            automate.formats.forEach(format => {
                result.push({
                    automate: automate.name,
                    format: format.name,
                    extension: format.extension,
                    generator: format.generator
                });
            });
        });
        return result;
    }

    getAutomates() {
        return this.automates;
    }

    getFormatsByAutomate(automateName) {
        const automate = this.automates.find(a => a.name === automateName);
        return automate ? automate.formats : [];
    }

    generateContent(automateName, formatName, items) {
        const automate = this.automates.find(a => a.name === automateName);
        if (!automate) throw new Error(`Automate "${automateName}" non trouvé`);

        const format = automate.formats.find(f => f.name === formatName);
        if (!format) throw new Error(`Format "${formatName}" non trouvé`);

        return format.generator(items);
    }

    download(automateName, formatName, items, filename) {
        const content = this.generateContent(automateName, formatName, items);
        const automate = this.automates.find(a => a.name === automateName);
        const format = automate.formats.find(f => f.name === formatName);

        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename + format.extension;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
