#target photoshop
/**
 * Hideout — Lobby Master (5×7)
 * File → Scripts → Browse → build-lobby-master.jsx
 * Creates LOBBY_MASTER.psd with LIVE editable type + placed stone
 */

app.displayDialogs = DialogModes.NO;
app.preferences.rulerUnits = Units.PIXELS;

var BLEED = 37.5;
var SAFE = 75;
var VOID = cmyk(0, 3, 8, 96);
var CREAM = cmyk(2, 6, 16, 0);
var MUTED = cmyk(2, 10, 25, 30);
var CARAMEL = cmyk(0, 37, 80, 22);

var scriptFile = new File($.fileName);
var pkgRoot = scriptFile.parent.parent.parent;
var outFolder = scriptFile.parent.parent;
var stoneFile = new File(pkgRoot + "/references/menu-background-master-stone.jpg");

function cmyk(c, m, y, k) {
    var s = new SolidColor();
    s.cmyk.cyan = c; s.cmyk.magenta = m; s.cmyk.yellow = y; s.cmyk.black = k;
    return s;
}

function font(name, fallback) {
    try { return name; } catch (e) { return fallback; }
}

function addGuides(doc) {
    doc.guides.add(Direction.VERTICAL, BLEED);
    doc.guides.add(Direction.VERTICAL, doc.width - BLEED);
    doc.guides.add(Direction.HORIZONTAL, BLEED);
    doc.guides.add(Direction.HORIZONTAL, doc.height - BLEED);
    doc.guides.add(Direction.VERTICAL, SAFE);
    doc.guides.add(Direction.VERTICAL, doc.width - SAFE);
    doc.guides.add(Direction.HORIZONTAL, SAFE);
    doc.guides.add(Direction.HORIZONTAL, doc.height - SAFE);
}

function makeGroup(parent, name) {
    var g = parent.layerSets.add();
    g.name = name;
    return g;
}

function fillSolid(parent, name, color) {
    var l = parent.artLayers.add();
    l.name = name;
    doc.activeLayer = l;
    doc.selection.selectAll();
    doc.selection.fill(color);
    doc.selection.deselect();
    return l;
}

function liveText(parent, text, pt, color, fontName, fauxItalic, x, y, boxWidth) {
    var l = parent.artLayers.add();
    l.kind = LayerKind.TEXT;
    var t = l.textItem;
    t.contents = text;
    t.size = new UnitValue(pt, "pt");
    t.color = color;
    try { t.font = fontName; } catch (e) { t.font = "Georgia"; }
    if (fauxItalic) t.fauxItalic = true;
    t.position = [x, y];
    if (boxWidth) {
        t.width = new UnitValue(boxWidth, "px");
        t.kind = TextType.PARAGRAPHTEXT;
    }
    l.name = text.split("\n")[0].substring(0, 28);
    return l;
}

function qrFrame(parent, cx, cy, size, label) {
    var g = makeGroup(parent, label || "QR");
    var l = g.artLayers.add();
    l.name = "caramel_frame";
    doc.activeLayer = l;
    var half = size / 2;
    var r = [
        [cx - half, cy - half],
        [cx + half, cy - half],
        [cx + half, cy + half],
        [cx - half, cy + half]
    ];
    doc.selection.select(r);
    doc.selection.stroke(CARAMEL, 4, StrokeLocation.OUTSIDE);
    doc.selection.deselect();
    liveText(g, "drop QR SVG", 9, MUTED, "DMSans-Regular", false, cx - half, cy + half + 8, size);
    return g;
}

function placeStone(texGroup) {
    if (!stoneFile.exists) {
        liveText(texGroup, "Place menu-background-master-stone.jpg", 12, MUTED, "DMSans-Regular", false, SAFE, SAFE + 20, 800);
        return;
    }
    var idPlc = charIDToTypeID("Plc ");
    var desc = new ActionDescriptor();
    desc.putPath(charIDToTypeID("null"), stoneFile);
    desc.putEnumerated(charIDToTypeID("FTcs"), charIDToTypeID("QCSt"), charIDToTypeID("Qcsa"));
    executeAction(idPlc, desc, DialogModes.NO);
    var placed = doc.activeLayer;
    placed.name = "master_stone";
    placed.move(texGroup, ElementPlacement.INSIDE);
    // cover canvas
    var sx = doc.width / placed.bounds[2].value;
    var sy = doc.height / placed.bounds[3].value;
    var sc = Math.max(sx, sy) * 1.05;
    placed.resize(sc * 100, sc * 100, AnchorPosition.MIDDLECENTER);
}

// --- Build ---
var W = 1575, H = 2175;
var doc = app.documents.add(W, H, 300, "LOBBY_MASTER", NewDocumentMode.CMYK);
addGuides(doc);

var baseG = makeGroup(doc, "BASE");
fillSolid(baseG, "void", VOID);

var texG = makeGroup(doc, "TEXTURE");
placeStone(texG);

var warmG = makeGroup(doc, "WARM_LIGHT");
warmG.visible = false;

var logoG = makeGroup(doc, "LOGO");
liveText(logoG, "hideout", 18, CREAM, "CormorantGaramond-Regular", false, SAFE, SAFE + 10, 300);

var copyG = makeGroup(doc, "COPY");
// L1 — ~30% visual width, upper-middle (not corner)
liveText(copyG, "Same\nbuilding.", 86, CREAM, "CormorantGaramond-Italic", true, SAFE, SAFE + 200, W - SAFE * 2);
// L3 — one support line
liveText(copyG, "Terrace \u00b7 2 minutes.", 16, MUTED, "DMSans-Regular", false, SAFE, SAFE + 620, W - SAFE * 2);

var qrG = makeGroup(doc, "QR");
var qrSize = 200;
var qrY = H - SAFE - qrSize - 80;
qrFrame(qrG, W / 2, qrY, qrSize, "qr-skyview");

var notesG = makeGroup(doc, "NOTES");
liveText(notesG, "Duplicate this file for other editorial cards. Copy: COPY_FINAL.md", 9, MUTED, "DMSans-Regular", false, SAFE, H - SAFE - 24, W - SAFE * 2);

var saveFile = new File(outFolder + "/LOBBY_MASTER.psd");
doc.saveAs(saveFile, new PhotoshopSaveOptions(), true);
// also versioned name
var saveFile2 = new File(outFolder + "/hideout-lobby-stand-5x7-v1-LIVE.psd");
doc.saveAs(saveFile2, new PhotoshopSaveOptions(), true);

alert("LOBBY_MASTER.psd saved with LIVE type.\nDuplicate for Counter, Salon, Sunday.");
