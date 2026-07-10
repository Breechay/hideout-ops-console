#target photoshop
/**
 * Hideout Miami — Build all print PSD templates
 * File → Scripts → Browse → build-all-templates.jsx
 *
 * Requires: Cormorant Garamond, DM Sans, DM Mono installed
 * Output: parent psd-templates/ folder
 */

app.preferences.rulerUnits = Units.PIXELS;
app.displayDialogs = DialogModes.NO;
app.preferences.showEnglishFontNames = true;

var BLEED = 37.5;   // 0.125" @ 300dpi
var SAFE = 75;      // 0.25" from canvas edge

var CREAM = cmyk(2, 6, 16, 0);
var MUTED = cmyk(2, 10, 25, 30);
var CARAMEL = cmyk(0, 37, 80, 22);
var VOID = cmyk(0, 3, 8, 96);

var scriptFile = new File($.fileName);
var outFolder = scriptFile.parent.parent;

function cmyk(c, m, y, k) {
    var s = new SolidColor();
    s.cmyk.cyan = c; s.cmyk.magenta = m; s.cmyk.yellow = y; s.cmyk.black = k;
    return s;
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

function fillLayer(parent, name, color) {
    var l = parent.artLayers.add();
    l.name = name;
    app.activeDocument.activeLayer = l;
    app.activeDocument.selection.selectAll();
    app.activeDocument.selection.fill(color);
    app.activeDocument.selection.deselect();
    return l;
}

function addText(parent, content, size, color, font, style, x, y, width) {
    var l = parent.artLayers.add();
    l.kind = LayerKind.TEXT;
    var ti = l.textItem;
    ti.contents = content;
    ti.size = size;
    ti.color = color;
    try {
        ti.font = font;
    } catch (e) {
        ti.font = "Georgia";
    }
    if (style === "italic") ti.fauxItalic = true;
    if (style === "caps") {
        ti.contents = content.toUpperCase();
        try { ti.font = "DMSans-Medium"; } catch (e2) {}
    }
    ti.position = [x, y];
    if (width) {
        ti.width = width;
        ti.kind = TextType.PARAGRAPHTEXT;
    }
    l.name = content.substring(0, 24).replace(/\n/g, " ");
    return l;
}

function qrPlaceholder(parent, x, y, size, name) {
    var g = makeGroup(parent, name || "QR_PLACEHOLDER");
    var frame = g.artLayers.add();
    frame.name = "caramel_frame";
    // square stroke via selection
    app.activeDocument.activeLayer = frame;
    var r = [
        [x, y],
        [x + size, y],
        [x + size, y + size],
        [x, y + size]
    ];
    app.activeDocument.selection.select(r);
    app.activeDocument.selection.stroke(CARAMEL, 4);
    app.activeDocument.selection.deselect();
    addText(g, "QR", size * 0.2, MUTED, "DMSans-Regular", "normal", x + size * 0.25, y + size * 0.45, size * 0.5);
    addText(g, "replace with SVG", 8, MUTED, "DMSans-Regular", "normal", x, y + size + 12, size);
    return g;
}

function caramelRule(parent, x, y, width) {
    var l = parent.artLayers.add();
    l.name = "caramel_rule";
    app.activeDocument.activeLayer = l;
    var r = [[x, y], [x + width, y], [x + width, y + 3], [x, y + 3]];
    app.activeDocument.selection.select(r);
    app.activeDocument.selection.fill(CARAMEL);
    app.activeDocument.selection.deselect();
}

function buildDoc(filename, w, h, builder) {
    var doc = app.documents.add(w, h, 300, filename, NewDocumentMode.CMYK);
    addGuides(doc);

    var baseG = makeGroup(doc, "BASE");
    fillLayer(baseG, "void_fill", VOID);

    var texG = makeGroup(doc, "TEXTURE");
    addText(texG, "← Place Linked: menu-background-master-stone.jpg", 14, MUTED, "DMSans-Regular", "normal", SAFE, SAFE + 20, w - SAFE * 2);

    var warmG = makeGroup(doc, "WARM_LIGHT");
    addText(warmG, "← Optional: warm-light-overlay.png (Soft Light)", 12, MUTED, "DMSans-Regular", "normal", SAFE, SAFE + 50, w - SAFE * 2);
    warmG.visible = false;

    var logoG = makeGroup(doc, "LOGO");
    var copyG = makeGroup(doc, "COPY");
    var accentG = makeGroup(doc, "ACCENT");
    var qrG = makeGroup(doc, "QR");

    builder(doc, copyG, accentG, qrG, logoG, w, h);

    var note = makeGroup(doc, "NOTES");
    addText(note, "Copy: COPY_FINAL.md · Export: PDF/X-1a → exports/", 10, MUTED, "DMSans-Regular", "normal", SAFE, h - SAFE - 30, w - SAFE * 2);

    var saveFile = new File(outFolder + "/" + filename + ".psd");
    var psdOpts = new PhotoshopSaveOptions();
    psdOpts.layers = true;
    doc.saveAs(saveFile, psdOpts, true);
    doc.close(SaveOptions.DONOTSAVECHANGES);
}

// --- Templates ---

buildDoc("hideout-counter-card-3x2-v1", 1125, 675, function(doc, copy, accent, qr, logo, w, h) {
    addText(logo, "hideout", 18, CREAM, "CormorantGaramond-Regular", "normal", SAFE, SAFE);
    addText(copy, "Your usual —\ntwo taps.", 22, CREAM, "CormorantGaramond-Italic", "italic", SAFE, SAFE + 50, w * 0.55);
    qrPlaceholder(qr, w - SAFE - 140, h / 2 - 70, 120, "qr-nfc");
});

buildDoc("hideout-lobby-stand-5x7-v1", 1575, 2175, function(doc, copy, accent, qr, logo, w, h) {
    addText(logo, "hideout", 22, CREAM, "CormorantGaramond-Regular", "normal", SAFE, SAFE);
    addText(copy, "Same\nbuilding.", 52, CREAM, "CormorantGaramond-Italic", "italic", SAFE, SAFE + 120, w - SAFE * 2);
    addText(copy, "Terrace · 2 minutes.", 15, MUTED, "DMSans-Regular", "normal", SAFE, SAFE + 380, w - SAFE * 2);
    qrPlaceholder(qr, w / 2 - 100, h - SAFE - 320, 200, "qr-skyview");
    doc.layerSets.getByName("WARM_LIGHT").visible = true;
});

buildDoc("hideout-watermarc-4x6-FRONT-v1", 1275, 1875, function(doc, copy, accent, qr, logo, w, h) {
    addText(copy, "Welcome to the neighborhood.", 40, CREAM, "CormorantGaramond-Italic", "italic", SAFE, SAFE + 80, w - SAFE * 2);
    caramelRule(accent, SAFE, SAFE + 200, (w - SAFE * 2) * 0.4);
    addText(copy, "Open-air terrace.\nCoffee. Real food.\nTwo minutes.", 14, MUTED, "DMSans-Regular", "normal", SAFE, SAFE + 240, w - SAFE * 2);
    addText(copy, "2nd floor · SkyView 22", 10, MUTED, "DMMono-Regular", "normal", SAFE, h - SAFE - 80, w - SAFE * 2);
    doc.layerSets.getByName("WARM_LIGHT").visible = true;
});

buildDoc("hideout-watermarc-4x6-BACK-v1", 1275, 1875, function(doc, copy, accent, qr, logo, w, h) {
    addText(copy, "Order before\nyou walk over.", 36, CREAM, "CormorantGaramond-Italic", "italic", SAFE, SAFE + 200, w - SAFE * 2);
    qrPlaceholder(qr, w / 2 - 110, h / 2 - 60, 220, "qr-watermarc");
});

buildDoc("hideout-salon-card-3x4-v1", 975, 1275, function(doc, copy, accent, qr, logo, w, h) {
    addText(copy, "Two minutes\naway.", 28, CREAM, "CormorantGaramond-Italic", "italic", SAFE, SAFE + 80, w - SAFE * 2);
    qrPlaceholder(qr, w / 2 - 80, h - SAFE - 280, 160, "qr-neighbor");
});

buildDoc("hideout-sunday-exit-4x6-v1", 1275, 1875, function(doc, copy, accent, qr, logo, w, h) {
    addText(copy, "Same house.\nDifferent room.", 38, CREAM, "CormorantGaramond-Italic", "italic", SAFE, SAFE + 400, w - SAFE * 2);
    caramelRule(accent, SAFE, SAFE + 580, (w - SAFE * 2) * 0.25);
    qrPlaceholder(qr, SAFE, SAFE + 640, 150, "qr-weekday");
    addText(logo, "hideout", 14, CREAM, "CormorantGaramond-Regular", "normal", SAFE, h - SAFE - 40, 200);
    doc.layerSets.getByName("WARM_LIGHT").visible = true;
});

buildDoc("hideout-office-card-4x6-v1", 1275, 1875, function(doc, copy, accent, qr, logo, w, h) {
    addText(logo, "hideout", 20, CREAM, "CormorantGaramond-Regular", "normal", SAFE, SAFE);
    addText(copy, "Office breakfast.", 32, CREAM, "CormorantGaramond-Italic", "italic", SAFE, SAFE + 80, w - SAFE * 2);
    addText(copy, "GALLON COLD BREW", 9, MUTED, "DMSans-Medium", "caps", SAFE, SAFE + 200, w - SAFE * 2);
    addText(copy, "$16/person\n$45/gallon\n48hr lead", 12, CREAM, "DMMono-Regular", "normal", SAFE, SAFE + 260, w - SAFE * 2);
    qrPlaceholder(qr, w / 2 - 90, SAFE + 480, 180, "qr-office");
    addText(copy, "Weekly orders welcome.", 11, MUTED, "DMSans-Regular", "normal", SAFE, SAFE + 720, w - SAFE * 2);
    addText(copy, "_________________________", 11, MUTED, "DMSans-Regular", "normal", SAFE, SAFE + 780, w - SAFE * 2);
});

buildDoc("hideout-house-card-4x6-FRONT-v1", 1275, 1875, function(doc, copy, accent, qr, logo, w, h) {
    addText(logo, "hideout", 36, CREAM, "CormorantGaramond-Regular", "normal", SAFE, SAFE + 60, w - SAFE * 2);
    addText(copy, "Open-air terrace.\nCoffee. Real food.", 14, MUTED, "DMSans-Regular", "normal", SAFE, SAFE + 200, w - SAFE * 2);
    qrPlaceholder(qr, w / 2 - 100, h - SAFE - 360, 200, "qr-neighbor");
});

buildDoc("hideout-house-card-4x6-BACK-v1", 1275, 1875, function(doc, copy, accent, qr, logo, w, h) {
    addText(copy, "Wed–Fri 8–5\nSat–Sun 10–5\n2nd floor · SkyView 22", 11, MUTED, "DMMono-Regular", "normal", SAFE, SAFE + 200, w - SAFE * 2);
});

buildDoc("hideout-mini-flyer-4x9-BACK-v1", 1275, 2775, function(doc, copy, accent, qr, logo, w, h) {
    addText(copy, "Order ahead.", 44, CREAM, "CormorantGaramond-Italic", "italic", SAFE, SAFE + 200, w - SAFE * 2);
    qrPlaceholder(qr, w / 2 - 120, h / 2 - 100, 240, "qr-nfc");
});

buildDoc("hideout-character-styles-base", 1200, 800, function(doc, copy, accent, qr, logo, w, h) {
    addText(copy, "L1 — Cormorant Italic — Same building.", 52, CREAM, "CormorantGaramond-Italic", "italic", 60, 80, w - 120);
    addText(copy, "L2 — DM Sans Medium CAPS — GALLON COLD BREW", 9, MUTED, "DMSans-Medium", "caps", 60, 220, w - 120);
    addText(copy, "L3 — DM Sans — Terrace · 2 minutes.", 15, MUTED, "DMSans-Regular", "normal", 60, 300, w - 120);
    addText(copy, "L3 — DM Mono — $16/person", 12, CREAM, "DMMono-Regular", "normal", 60, 380, w - 120);
    addText(copy, "Colors: Cream · Muted · Caramel · Void — see PHOTOSHOP_EXECUTION_MANUAL.md", 10, MUTED, "DMSans-Regular", "normal", 60, 500, w - 120);
});

alert("Done. " + 11 + " PSD templates saved to:\n" + outFolder.fsName);
