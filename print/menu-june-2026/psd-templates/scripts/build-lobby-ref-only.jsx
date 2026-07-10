#target photoshop
app.displayDialogs = DialogModes.NO;
var BLEED=37.5,SAFE=75,VOID=cmyk(0,3,8,96);
function cmyk(c,m,y,k){var s=new SolidColor();s.cmyk.cyan=c;s.cmyk.magenta=m;s.cmyk.yellow=y;s.cmyk.black=k;return s;}
var root="/Users/breechay/Documents/hideout-ops-console/print/menu-june-2026";
var W=1575,H=2175;
var doc=app.documents.add(W,H,300,"hideout-lobby-stand-5x7-v1",NewDocumentMode.CMYK);
doc.guides.add(Direction.VERTICAL,SAFE);doc.guides.add(Direction.VERTICAL,W-SAFE);
doc.guides.add(Direction.HORIZONTAL,SAFE);doc.guides.add(Direction.HORIZONTAL,H-SAFE);
var base=doc.layerSets.add();base.name="BASE";
var bl=base.artLayers.add();doc.activeLayer=bl;doc.selection.selectAll();doc.selection.fill(VOID);doc.selection.deselect();
function place(path,parent,nm){var f=new File(path);if(!f.exists)return;var idPlc=charIDToTypeID("Plc ");var d=new ActionDescriptor();d.putPath(charIDToTypeID("null"),f);d.putEnumerated(charIDToTypeID("FTcs"),charIDToTypeID("QCSt"),charIDToTypeID("Qcsa"));executeAction(idPlc,d,DialogModes.NO);var l=doc.activeLayer;l.name=nm;l.move(parent,ElementPlacement.INSIDE);return l;}
function cover(l,tw,th){var b=l.bounds,lw=b[2].as("px")-b[0].as("px"),lh=b[3].as("px")-b[1].as("px");var sc=Math.max(tw/lw,th/lh)*100;l.resize(sc,sc,AnchorPosition.MIDDLECENTER);}
var tex=doc.layerSets.add();tex.name="TEXTURE";
var stone=place(root+"/references/menu-background-master-stone.jpg",tex,"master_stone");if(stone)cover(stone,W,H);
var refG=doc.layerSets.add();refG.name="MOCKUP_REFERENCE";
var mock=place(root+"/mockups/02_skyview_lobby.png",refG,"mockup");if(mock){cover(mock,W,H);mock.opacity=40;}
doc.layerSets.add().name="COPY_YOUR_TYPE_HERE";
doc.layerSets.add().name="QR_PLACEHOLDER";
var sf=new File(root+"/psd-templates/hideout-lobby-stand-5x7-v1-REF.psd");
doc.saveAs(sf,new PhotoshopSaveOptions(),true);
alert("Lobby REF saved. Type live on top. Delete MOCKUP_REFERENCE when done.");
