#target photoshop
/**
 * Hideout — All placement cards · LIVE type · v2 scaling
 * Run after LOBBY_MASTER looks right, or run standalone.
 */

app.displayDialogs = DialogModes.NO;
app.preferences.rulerUnits = Units.PIXELS;

var BLEED = 37.5, SAFE = 75;
var VOID = cmyk(0,3,8,96), CREAM = cmyk(2,6,16,0), MUTED = cmyk(2,10,25,30), CARAMEL = cmyk(0,37,80,22);
var scriptFile = new File($.fileName);
var pkgRoot = scriptFile.parent.parent.parent;
var outFolder = scriptFile.parent.parent;
var stoneFile = new File(pkgRoot + "/references/menu-background-master-stone.jpg");

function cmyk(c,m,y,k){var s=new SolidColor();s.cmyk.cyan=c;s.cmyk.magenta=m;s.cmyk.yellow=y;s.cmyk.black=k;return s;}
function grp(p,n){var g=p.layerSets.add();g.name=n;return g;}
function fill(p,n,c){var l=p.artLayers.add();l.name=n;doc.activeLayer=l;doc.selection.selectAll();doc.selection.fill(c);doc.selection.deselect();return l;}
function guides(doc){
    doc.guides.add(Direction.VERTICAL,BLEED);doc.guides.add(Direction.VERTICAL,doc.width-BLEED);
    doc.guides.add(Direction.HORIZONTAL,BLEED);doc.guides.add(Direction.HORIZONTAL,doc.height-BLEED);
    doc.guides.add(Direction.VERTICAL,SAFE);doc.guides.add(Direction.VERTICAL,doc.width-SAFE);
    doc.guides.add(Direction.HORIZONTAL,SAFE);doc.guides.add(Direction.HORIZONTAL,doc.height-SAFE);
}
function txt(p,s,pt,col,fn,ital,x,y,bw){
    var l=p.artLayers.add();l.kind=LayerKind.TEXT;var t=l.textItem;
    if(bw){t.kind=TextType.PARAGRAPHTEXT;t.width=new UnitValue(bw,"px");}
    t.contents=s;t.size=new UnitValue(pt,"pt");t.color=col;
    try{t.font=fn;}catch(e){t.font="Georgia";}if(ital)t.fauxItalic=true;t.position=[x,y];
    l.name=s.split("\n")[0].substring(0,24);return l;}
function qr(p,cx,cy,sz,lab){
    var g=grp(p,lab||"QR");var l=g.artLayers.add();doc.activeLayer=l;var h=sz/2;var r=[[cx-h,cy-h],[cx+h,cy-h],[cx+h,cy+h],[cx-h,cy+h]];
    doc.selection.select(r);doc.selection.stroke(CARAMEL,4,StrokeLocation.OUTSIDE);doc.selection.deselect();return g;}
function stone(tex){
    if(!stoneFile.exists)return;
    var idPlc=charIDToTypeID("Plc ");var d=new ActionDescriptor();d.putPath(charIDToTypeID("null"),stoneFile);
    d.putEnumerated(charIDToTypeID("FTcs"),charIDToTypeID("QCSt"),charIDToTypeID("Qcsa"));
    executeAction(idPlc,d,DialogModes.NO);var pl=doc.activeLayer;pl.name="master_stone";pl.move(tex,ElementPlacement.INSIDE);
    var sc=Math.max(doc.width/pl.bounds[2].value,doc.height/pl.bounds[3].value)*1.05;pl.resize(sc*100,sc*100,AnchorPosition.MIDDLECENTER);
}
function rule(p,x,y,w){var l=p.artLayers.add();doc.activeLayer=l;var r=[[x,y],[x+w,y],[x+w,y+3],[x,y+3]];doc.selection.select(r);doc.selection.fill(CARAMEL);doc.selection.deselect();l.name="caramel_rule";}
var doc;
function makePiece(name,w,h,fn){
    doc=app.documents.add(w,h,300,name,NewDocumentMode.CMYK);guides(doc);
    var b=grp(doc,"BASE");fill(b,"void",VOID);var t=grp(doc,"TEXTURE");stone(t);
    var wlg=grp(doc,"WARM_LIGHT");wlg.visible=false;var lg=grp(doc,"LOGO");var cg=grp(doc,"COPY");var qg=grp(doc,"QR");var ag=grp(doc,"ACCENT");
    fn(doc,cg,ag,qg,lg,w,h);
    var sf=new File(outFolder+"/"+name+".psd");doc.saveAs(sf,new PhotoshopSaveOptions(),true);doc.close(SaveOptions.DONOTSAVECHANGES);
}

var F="CormorantGaramond-Italic", FR="CormorantGaramond-Regular", DS="DMSans-Regular", DM="DMSans-Medium", MONO="DMMono-Regular";

makePiece("hideout-counter-card-3x2-v1-LIVE",1125,675,function(d,c,a,q,l,w,h){
    txt(l,"hideout",16,CREAM,FR,false,SAFE,SAFE,200);
    txt(c,"Your usual \u2014\ntwo taps.",30,CREAM,F,true,SAFE,SAFE+40,w*0.55);
    qr(q,w-SAFE-70,h/2,120,"qr-nfc");
});

makePiece("hideout-lobby-stand-5x7-v1-LIVE",1575,2175,function(d,c,a,q,l,w,h){
    txt(l,"hideout",18,CREAM,FR,false,SAFE,SAFE+10,300);
    txt(c,"Same\nbuilding.",86,CREAM,F,true,SAFE,SAFE+200,w-SAFE*2);
    txt(c,"Terrace \u00b7 2 minutes.",16,MUTED,DS,false,SAFE,SAFE+620,w-SAFE*2);
    qr(q,w/2,h-SAFE-180,200,"qr-skyview");
});

makePiece("hideout-watermarc-4x6-FRONT-v1-LIVE",1275,1875,function(d,c,a,q,l,w,h){
    txt(c,"Welcome to the\nneighborhood.",48,CREAM,F,true,SAFE,SAFE+100,w-SAFE*2);
    rule(a,SAFE,SAFE+280,(w-SAFE*2)*0.38);
    txt(c,"Open-air terrace.\nCoffee. Real food.\nTwo minutes.",14,MUTED,DS,false,SAFE,SAFE+320,w-SAFE*2);
    txt(c,"2nd floor \u00b7 SkyView 22",10,MUTED,MONO,false,SAFE,h-SAFE-60,w-SAFE*2);
});

makePiece("hideout-watermarc-4x6-BACK-v1-LIVE",1275,1875,function(d,c,a,q,l,w,h){
    txt(c,"Order before\nyou walk over.",42,CREAM,F,true,SAFE,h/2-120,w-SAFE*2);
    qr(q,w/2,h/2+80,210,"qr-watermarc");
});

makePiece("hideout-salon-card-3x4-v1-LIVE",975,1275,function(d,c,a,q,l,w,h){
    txt(c,"Two minutes\naway.",36,CREAM,F,true,SAFE,SAFE+100,w-SAFE*2);
    qr(q,w/2,h-SAFE-120,150,"qr-neighbor");
});

makePiece("hideout-sunday-exit-4x6-v1-LIVE",1275,1875,function(d,c,a,q,l,w,h){
    txt(c,"Same house.\nDifferent room.",44,CREAM,F,true,SAFE,SAFE+420,w-SAFE*2);
    rule(a,SAFE,SAFE+600,(w-SAFE*2)*0.22);
    qr(q,w/2,h-SAFE-200,170,"qr-weekday");
    txt(l,"hideout",14,CREAM,FR,false,SAFE,h-SAFE-40,200);
});

makePiece("hideout-office-card-4x6-v1-LIVE",1275,1875,function(d,c,a,q,l,w,h){
    txt(l,"hideout",18,CREAM,FR,false,SAFE,SAFE,200);
    txt(c,"Office breakfast.",34,CREAM,F,true,SAFE,SAFE+70,w-SAFE*2);
    txt(c,"GALLON COLD BREW",9,MUTED,DM,false,SAFE,SAFE+190,w-SAFE*2);
    txt(c,"$16/person\n$45/gallon\n48hr lead",13,CREAM,MONO,false,SAFE,SAFE+250,w-SAFE*2);
    qr(q,w/2,SAFE+500,175,"qr-office");
    txt(c,"Weekly orders welcome.",11,MUTED,DS,false,SAFE,SAFE+720,w-SAFE*2);
});

makePiece("hideout-house-card-4x6-FRONT-v1-LIVE",1275,1875,function(d,c,a,q,l,w,h){
    txt(l,"hideout",32,CREAM,FR,false,SAFE,SAFE+60,w-SAFE*2);
    txt(c,"Open-air terrace.\nCoffee. Real food.",14,MUTED,DS,false,SAFE,SAFE+200,w-SAFE*2);
    qr(q,w/2,h-SAFE-200,190,"qr-neighbor");
});

makePiece("hideout-house-card-4x6-BACK-v1-LIVE",1275,1875,function(d,c,a,q,l,w,h){
    txt(c,"Wed\u2013Fri 8\u20135\nSat\u2013Sun 10\u20135\n2nd floor \u00b7 SkyView 22",12,MUTED,MONO,false,SAFE,SAFE+200,w-SAFE*2);
});

makePiece("hideout-mini-flyer-4x9-BACK-v1-LIVE",1275,2775,function(d,c,a,q,l,w,h){
    txt(c,"Order ahead.",52,CREAM,F,true,SAFE,SAFE+200,w-SAFE*2);
    qr(q,w/2,h/2,230,"qr-nfc");
});

alert("Done. 9 LIVE PSD files saved (*-LIVE.psd). Text layers are editable.");
