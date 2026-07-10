#target photoshop
/**
 * Hideout — Mockup-reference PSDs (the useful version)
 * Places each mockup PNG at 40% opacity + stone + guides.
 * YOU type live copy on top, then delete MOCKUP_REFERENCE group.
 * File → Scripts → Browse → build-mockup-reference-templates.jsx
 */

app.displayDialogs = DialogModes.NO;
app.preferences.rulerUnits = Units.PIXELS;

var BLEED = 37.5, SAFE = 75;
var VOID = cmyk(0,3,8,96);
var scriptFile = new File($.fileName);
var pkg = scriptFile.parent.parent.parent;
var out = scriptFile.parent.parent;
var mockDir = new Folder(pkg + "/mockups");
var stoneFile = new File(pkg + "/references/menu-background-master-stone.jpg");

function cmyk(c,m,y,k){var s=new SolidColor();s.cmyk.cyan=c;s.cmyk.magenta=m;s.cmyk.yellow=y;s.cmyk.black=k;return s;}
function grp(p,n){var g=p.layerSets.add();g.name=n;return g;}
function fill(p,n,c){var l=p.artLayers.add();l.name=n;doc.activeLayer=l;doc.selection.selectAll();doc.selection.fill(c);doc.selection.deselect();}
function guides(d){
    d.guides.add(Direction.VERTICAL,BLEED);d.guides.add(Direction.VERTICAL,d.width-BLEED);
    d.guides.add(Direction.HORIZONTAL,BLEED);d.guides.add(Direction.HORIZONTAL,d.height-BLEED);
    d.guides.add(Direction.VERTICAL,SAFE);d.guides.add(Direction.VERTICAL,d.width-SAFE);
    d.guides.add(Direction.HORIZONTAL,SAFE);d.guides.add(Direction.HORIZONTAL,d.height-SAFE);
}
function placeFile(file, parent, name) {
    if (!file.exists) return null;
    var idPlc = charIDToTypeID("Plc ");
    var d = new ActionDescriptor();
    d.putPath(charIDToTypeID("null"), file);
    d.putEnumerated(charIDToTypeID("FTcs"), charIDToTypeID("QCSt"), charIDToTypeID("Qcsa"));
    executeAction(idPlc, d, DialogModes.NO);
    var layer = doc.activeLayer;
    layer.name = name;
    if (parent) layer.move(parent, ElementPlacement.INSIDE);
    return layer;
}
function coverLayer(layer, tw, th) {
    var b = layer.bounds;
    var lw = b[2].as("px") - b[0].as("px");
    var lh = b[3].as("px") - b[1].as("px");
    var sc = Math.max(tw / lw, th / lh) * 100;
    layer.resize(sc, sc, AnchorPosition.MIDDLECENTER);
    layer.translate((tw/2) - (layer.bounds[0].as("px") + (layer.bounds[2].as("px")-layer.bounds[0].as("px"))/2),
                    (th/2) - (layer.bounds[1].as("px") + (layer.bounds[3].as("px")-layer.bounds[1].as("px"))/2));
}
function note(p, text) {
    var l = p.artLayers.add(); l.kind = LayerKind.TEXT; var t = l.textItem;
    t.contents = text; t.size = new UnitValue(11,"pt"); t.color = cmyk(2,10,25,30);
    try{t.font="Arial";}catch(e){} t.position=[SAFE, SAFE]; l.name = "INSTRUCTIONS";
}

var PIECES = [
    ["hideout-lobby-stand-5x7-v1", 1575, 2175, "02_skyview_lobby.png"],
    ["hideout-counter-card-3x2-v1", 1125, 675, "01_counter_nfc.png"],
    ["hideout-watermarc-4x6-FRONT-v1", 1275, 1875, "03_watermarc_card.png"],
    ["hideout-watermarc-4x6-BACK-v1", 1275, 1875, "03_watermarc_card_back.png"],
    ["hideout-salon-card-3x4-v1", 975, 1275, "04_salon_card.png"],
    ["hideout-sunday-exit-4x6-v1", 1275, 1875, "05_sunday_exit.png"],
    ["hideout-office-card-4x6-v1", 1275, 1875, "06_office_b2b.png"],
    ["hideout-house-card-4x6-FRONT-v1", 1275, 1875, "07_house_card.png"],
    ["hideout-mini-flyer-4x9-BACK-v1", 1275, 2775, "08_half_sheet_flyer_back.png"]
];

var doc;
for (var i = 0; i < PIECES.length; i++) {
    var spec = PIECES[i];
    var pieceName = spec[0], w = spec[1], h = spec[2], mock = spec[3];
    doc = app.documents.add(w, h, 300, pieceName, NewDocumentMode.CMYK);
    guides(doc);

    var base = grp(doc, "BASE"); fill(base, "void", VOID);
    var tex = grp(doc, "TEXTURE");
    if (stoneFile.exists) {
        var stone = placeFile(stoneFile, tex, "master_stone");
        if (stone) coverLayer(stone, w, h);
    }
    var ref = grp(doc, "MOCKUP_REFERENCE");
    var mockFile = new File(mockDir + "/" + mock);
    var refLayer = placeFile(mockFile, ref, "mockup_" + mock.replace(".png",""));
    if (refLayer) { coverLayer(refLayer, w, h); refLayer.opacity = 40; }
    grp(doc, "COPY_YOUR_TYPE_HERE");
    grp(doc, "QR_PLACEHOLDER");
    var notes = grp(doc, "NOTES");
    note(notes, "1. Type live copy on top (COPY_FINAL.md)\n2. Match mockup reference\n3. Delete MOCKUP_REFERENCE when done\n4. Drop QR SVG in QR_PLACEHOLDER");

    var sf = new File(out + "/" + pieceName + "-REF.psd");
    doc.saveAs(sf, new PhotoshopSaveOptions(), true);
    doc.close(SaveOptions.DONOTSAVECHANGES);
}

alert("Done. " + PIECES.length + " REF PSDs saved.\nOpen *-REF.psd — mockup at 40% for tracing.");
