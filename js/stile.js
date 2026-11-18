// Gemalte Darstellungen „Aquarell“ und „Bleistift“ (Sitzung 19d), „Marker“ (Sitzung 23g).
// Ablauf: Das 3D-Bild wird erst ganz normal im Zeichenstil gezeichnet, aber nicht auf den Bildschirm,
// sondern in ein unsichtbares Bild (mit Tiefe: wie weit weg ist jeder Punkt). Danach „übermalt“ ein kleines
// Grafikkarten-Programm (Shader) dieses Bild: Kanten finden, Farbe blasser und weicher machen, Papier,
// Farbränder und Schraffur darüberlegen. Beide Stile nutzen dieselbe Grundlage.
import * as THREE from 'three';

const ECKPUNKTE = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const MALEN = /* glsl */ `
uniform sampler2D tFarbe;   // 3D-Bild im Zeichenstil
uniform sampler2D tTiefe;   // Tiefe (0 = nah, 1 = Hintergrund)
uniform vec2 aufloesung;    // Bildgröße in Pixeln
uniform float nah, fern, ortho;
uniform int stil;           // 1 = Aquarell, 2 = Bleistift, 3 = Marker (Sitzung 23g)
uniform float abend;        // 0 = Tag, 1 = Abend (nur Aquarell)
uniform float nacht;        // 0 = Abend, 1 = tiefe Nacht (nur Aquarell)
uniform vec3 papier;
uniform mat4 projInv, kameraWelt; // um aus Bildpunkt und Tiefe den Punkt im Raum zu berechnen
uniform float bodenHoehe;   // bis zu dieser Höhe gelten waagerechte Flächen als Boden (Wiese im Aquarell)
varying vec2 vUv;

// ---- Zufall und Rauschen (immer gleich, damit nichts flackert) ----
float zufall(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float rauschen(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(zufall(i), zufall(i + vec2(1.0, 0.0)), u.x), mix(zufall(i + vec2(0.0, 1.0)), zufall(i + vec2(1.0, 1.0)), u.x), u.y);
}
float wolkig(vec2 p) { // mehrere Rauschen übereinander, 0 … 1
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * rauschen(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return s / 0.97;
}

// ---- Bild lesen ----
vec3 zuSRGB(vec3 c) { c = max(c, 0.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
vec3 farbe(vec2 uv) { return zuSRGB(texture2D(tFarbe, uv).rgb); }
float hell(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
float rohTiefe(vec2 uv) { return texture2D(tTiefe, uv).r; }
float tiefe(vec2 uv) { // Abstand zur Kamera
  float d = rohTiefe(uv);
  if (ortho > 0.5) return nah + d * (fern - nah);
  return nah * fern / (fern - d * (fern - nah));
}
float bauteil(vec2 uv) { return step(rohTiefe(uv), 0.99999); } // 1 = hier ist etwas, 0 = Hintergrund

// Punkt im Raum (Welt-Koordinaten, y = oben) zu einem Bildpunkt
vec3 weltPunkt(vec2 uv) {
  vec4 v = projInv * vec4(uv * 2.0 - 1.0, rohTiefe(uv) * 2.0 - 1.0, 1.0);
  return (kameraWelt * vec4(v.xyz / v.w, 1.0)).xyz;
}
// 1 = hier ist eine waagerechte Fläche, die tief liegt (Gelände, Bodenplatte, Terrasse unten)
float bodenFlaeche(vec2 uv, vec2 d) {
  vec3 a = weltPunkt(uv), b = weltPunkt(uv + vec2(d.x, 0.0)), c = weltPunkt(uv + vec2(0.0, d.y));
  vec3 n = normalize(cross(b - a, c - a));
  return smoothstep(0.85, 0.95, abs(n.y)) * step(a.y, bodenHoehe) * bauteil(uv);
}

// Kanten: Helligkeitssprünge (Linien der Zeichnung, Licht- und Schattenseiten) und Umriss (Sprung in der Tiefe)
float kante(vec2 uv, vec2 d) {
  float hl = hell(farbe(uv - vec2(d.x, 0.0))), hr = hell(farbe(uv + vec2(d.x, 0.0)));
  float ho = hell(farbe(uv + vec2(0.0, d.y))), hu = hell(farbe(uv - vec2(0.0, d.y)));
  float sprung = length(vec2(hr - hl, ho - hu));
  float tm = tiefe(uv);
  float tl = tiefe(uv - vec2(d.x, 0.0)), tr = tiefe(uv + vec2(d.x, 0.0));
  float to = tiefe(uv + vec2(0.0, d.y)), tu = tiefe(uv - vec2(0.0, d.y));
  float umriss = (abs(tl + tr - 2.0 * tm) + abs(to + tu - 2.0 * tm)) / min(tm, min(min(tl, tr), min(to, tu)));
  return clamp(smoothstep(0.07, 0.28, sprung) + smoothstep(0.02, 0.08, umriss), 0.0, 1.0);
}

// Bildrand: Farbe läuft unregelmäßig ins Papier aus
float randAuslauf(vec2 q) {
  float r = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
  return smoothstep(0.0, 0.1, r + (wolkig(q * 3.0) - 0.5) * 0.08);
}

// ---------- Aquarell ----------
vec3 aquarell(vec2 q, vec2 px, float s) {
  // Pinsel nicht ganz genau: Bild leicht verzogen
  vec2 wackel = (vec2(wolkig(q * 5.0), wolkig(q * 5.0 + 7.3)) - 0.5) * px * 5.0 * s;
  // Farbe locker gemalt: gegenüber den Linien verschoben, malt mal über den Umriss hinaus, mal bleibt ein weißer Spalt
  vec2 versatz = (vec2(wolkig(q * 2.2 + 4.0), wolkig(q * 2.2 + 9.0)) - 0.5) * px * 30.0 * s;
  vec2 uv = vUv + wackel + versatz;
  // leicht weich: Mittelwert der nahen Umgebung
  vec3 c = vec3(0.0);
  for (int i = -2; i <= 2; i++) for (int j = -2; j <= 2; j++) c += farbe(uv + vec2(float(i), float(j)) * px * 0.7 * s);
  c /= 25.0;
  // stellenweise scharf (Wunsch der Nutzerin): fleckig verteilt die ungewischte Farbe
  float scharf = smoothstep(0.4, 0.65, wolkig(q * 3.0 + 20.0));
  c = mix(c, farbe(uv), scharf * 0.85);
  // weitere Umgebung: wo sich die Farbe ändert, sammelt sich etwas Pigment am Rand
  vec3 umgebung = c;
  for (int k = 0; k < 8; k++) {
    float w = float(k) * 0.785;
    umgebung += farbe(uv + vec2(cos(w), sin(w)) * px * 7.0 * s);
  }
  umgebung /= 9.0;
  float farbrand = clamp(length(c - umgebung) * 2.0, 0.0, 1.0);

  // tief liegende waagerechte Flächen werden Wiese (am Abend dunkler)
  float wiesenFlaeche = bodenFlaeche(uv, px * 2.0 * s);
  vec3 wiesenGruen = mix(vec3(0.76, 0.80, 0.70), vec3(0.42, 0.46, 0.44), abend);
  c = mix(c, wiesenGruen * (0.75 + 0.3 * hell(c)), wiesenFlaeche * 0.6);
  // Farbe blasser und etwas weniger bunt (wie lasierend gemalt)
  c = mix(vec3(hell(c)), c, 0.8);
  c = mix(c, vec3(1.0), 0.25);
  // Pigment = was vom weißen Papier weggenommen wird; schwankt fleckig, mit hellen Pinselspuren, etwas mehr an den Farbrändern
  vec3 pigment = max(vec3(1.0) - c, 0.0);
  pigment *= 0.7 + 0.5 * wolkig(q * 3.0 + 3.0);
  pigment *= 0.85 + 0.3 * wolkig(q * 14.0 + 1.0);
  vec2 schraeg = vec2(q.x + q.y, q.x - q.y);
  pigment *= 1.0 - 0.18 * smoothstep(0.6, 0.85, wolkig(schraeg * vec2(6.0, 14.0) + 2.0)); // trockener Pinsel: helle Streifen
  pigment *= 1.0 + 0.3 * farbrand;
  pigment *= mix(1.0, 0.75 + 0.5 * smoothstep(0.3, 0.75, wolkig(q * vec2(2.0, 40.0) + 3.0)), wiesenFlaeche); // Grasstriche
  // Papierstruktur: Farbe sammelt sich in den Vertiefungen des Papiers
  float papierKorn = wolkig(q * 90.0);
  pigment *= 0.88 + 0.24 * papierKorn;

  // Hintergrund: Himmel und Boden als lockere Farbwäsche ums Gebäude
  float da = bauteil(uv);
  vec2 mitte = vUv + (vec2(wolkig(q * 2.0), wolkig(q * 2.0 + 5.0)) - 0.5) * 0.09;
  float nahe = 0.0;
  for (int k = 0; k < 12; k++) {
    float w = float(k) * 0.5236;
    vec2 r = vec2(cos(w) * aufloesung.y / aufloesung.x, sin(w));
    nahe += bauteil(mitte + r * 0.07) + bauteil(mitte + r * 0.16);
  }
  nahe /= 24.0;
  float oben = 0.0, unten = 0.0;
  for (int k = 1; k <= 4; k++) {
    oben += bauteil(mitte + vec2(0.0, float(k) * 0.06));
    unten += bauteil(mitte - vec2(0.0, float(k) * 0.06));
  }
  float boden = clamp((oben - unten) * 0.5, 0.0, 1.0); // Gebäude darüber = hier ist Boden
  // untere Bildhälfte: Wiese (Wunsch der Nutzerin: mehr Grün unten)
  float wiese = smoothstep(0.35, 0.12, vUv.y + (wolkig(q * vec2(3.0, 1.0) + 2.0) - 0.5) * 0.2);
  boden = max(boden, wiese);
  // Tag: graublauer Himmel, grüner Boden mit waagerechten Grasstrichen
  vec3 himmelTag = vec3(0.80, 0.83, 0.87);
  vec3 bodenTag = vec3(0.71, 0.75, 0.65); // gedämpftes Grün
  // Abend: Himmel oben lila, zum Horizont orange (Wolkenstreifen), Boden dunkel
  float h = smoothstep(0.45, 1.0, vUv.y + (wolkig(q * vec2(1.5, 5.0)) - 0.5) * 0.4);
  vec3 himmelAbend = mix(vec3(0.93, 0.55, 0.30), vec3(0.36, 0.32, 0.58), h);
  vec3 bodenAbend = vec3(0.36, 0.37, 0.42);
  // tiefe Nacht: Himmel nachtblau, oben fast schwarzblau, Boden dunkel
  himmelAbend = mix(himmelAbend, mix(vec3(0.30, 0.30, 0.45), vec3(0.11, 0.12, 0.24), h), nacht);
  bodenAbend = mix(bodenAbend, vec3(0.2, 0.21, 0.27), nacht);
  vec3 himmel = mix(mix(himmelTag, bodenTag, boden), mix(himmelAbend, bodenAbend, boden), abend);
  float wolke = smoothstep(0.25, 0.65, wolkig(q * 2.5 + 11.0));
  float gras = 0.35 + 0.65 * smoothstep(0.3, 0.75, wolkig(q * vec2(2.0, 40.0)));
  float waescheTag = max(min(nahe * 1.6, 1.0), wiese * 0.6) * mix(wolke, gras, boden) * 0.8;
  float waescheAbend = max(nahe, 0.8 + 0.15 * nacht) * (0.65 + 0.35 * wolke + 0.2 * nacht);
  float waesche = mix(waescheTag, waescheAbend, abend);
  vec3 hintergrund = max(vec3(1.0) - himmel, 0.0) * waesche;
  hintergrund *= 0.85 + 0.3 * papierKorn;
  pigment = mix(max(pigment, hintergrund), pigment, da);

  // Bildrand läuft ins Papier aus
  pigment *= randAuslauf(q);
  vec3 bild = papier * (vec3(1.0) - pigment);

  // feine graue Bleistiftkanten darüber, nicht ganz durchgezogen
  float linie = kante(vUv + wackel * 0.4, px * s) * (0.55 + 0.45 * rauschen(q * 40.0));
  linie *= randAuslauf(q) * (1.0 - 0.6 * abend);
  return mix(bild, vec3(0.36, 0.36, 0.38), linie * 0.55);
}

// ---------- Bleistift ----------
// Eine Lage Schraffur: einzelne Striche in einer Richtung, jeder etwas anders lang, kräftig und versetzt.
// Jeder Strich hat seine eigene Schwelle zwischen von und bis: je dunkler die Stelle, desto mehr Striche kommen dazu
// (so wird es dichter, ohne dass gleich ein strenges Kreuzmuster entsteht).
float schraffur(vec2 p, float winkel, float abst, float dunkel, float von, float bis, float saat) {
  vec2 r = vec2(cos(winkel), sin(winkel));
  vec2 n = vec2(-r.y, r.x);
  float k = dot(p, n) / abst + (rauschen(p * 0.015 + saat) - 0.5) * 0.5; // Striche nicht ganz gerade
  float nr = floor(k + 0.5);                                              // Nummer des Strichs
  float abstand = abs(k - nr);                                           // 0 = auf dem Strich
  float laenge = 70.0 + 90.0 * zufall(vec2(nr, saat + 1.0));
  float t = dot(p, r) / laenge + zufall(vec2(nr, saat + 2.0));
  float stueck = floor(t), f = fract(t);
  float zz = zufall(vec2(nr * 7.0 + stueck, saat + 3.0));
  float schwelle = mix(von, bis, zz);
  float da = smoothstep(schwelle, schwelle + 0.06, dunkel);
  float enden = smoothstep(0.0, 0.03, f) * smoothstep(1.0, 0.9, f) * step(0.06, zufall(vec2(nr * 3.0 + stueck, saat + 5.0)));
  float breite = 0.04 + 0.06 * dunkel;
  float linie = 1.0 - smoothstep(breite, breite + 0.1, abstand);
  float kraft = 0.5 + 0.5 * zufall(vec2(nr * 5.0 + stueck, saat + 4.0));
  return linie * enden * kraft * da;
}
vec3 bleistift(vec2 q, vec2 px, float s) {
  vec2 wackel = (vec2(wolkig(q * 9.0), wolkig(q * 9.0 + 4.1)) - 0.5) * px * 4.0 * s;
  vec2 uv = vUv + wackel;
  float l = 0.0;
  for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) l += hell(farbe(uv + vec2(float(i), float(j)) * px * s));
  l /= 9.0;
  float dunkel = smoothstep(0.72, 0.12, l) * 0.9; // helle und sonnige Flächen bleiben frei, Schatten werden schraffiert

  // Schraffur in Bildpunkten eines 1000 Pixel hohen Bildes, damit sie im 3D-Fenster und in den Bildern gleich wirkt.
  // Hauptrichtung schräg wie aus der Hand (ca. 60°), dichter durch Zwischenstriche in derselben Richtung,
  // erst sehr dunkle Stellen bekommen eine zweite, nur leicht gedrehte Lage
  vec2 p = q * 1000.0;
  float h = schraffur(p, 1.05, 5.5, dunkel, 0.2, 0.4, 0.0);
  h = max(h, schraffur(p + vec2(2.0, 0.0), 1.05, 5.5, dunkel, 0.38, 0.62, 10.0));
  h = max(h, schraffur(p, 0.6, 5.0, dunkel, 0.65, 0.9, 20.0));
  float ton = h * (0.2 + 0.25 * dunkel) + dunkel * dunkel * 0.22; // zarte Striche

  float linie = kante(uv, px * s) * (0.65 + 0.35 * rauschen(q * 50.0));
  float wert = (1.0 - ton) * (1.0 - linie * 0.75);
  wert = 1.0 - (1.0 - wert) * randAuslauf(q);
  wert *= 0.985 + 0.03 * rauschen(p * 0.7); // Papierkorn
  return mix(vec3(0.2, 0.21, 0.23), papier, wert);
}

// ---------- Marker (Sitzung 23g) ----------
// Eine Lage Marker: flächig angelegt, nur mit unregelmäßigen Strichspuren in Zugrichtung
// (Wunsch der Nutzerin: keine Parallelschraffur, keine weißen Lücken, keine einzelnen dunklen Striche).
// Statt Bahnen in festem Abstand: Rauschen, das in Zugrichtung lang gezogen ist – so entstehen Spuren
// verschiedener Breite an zufälligen Stellen, wie wenn der Marker mal mehr, mal weniger Farbe abgibt.
// Ergebnis: wie viel Farbe hier liegt (etwa 0,9 … 1,15; 1 = eine Lage).
float markerBahnen(vec2 p, float winkel, float abst, float saat) {
  vec2 r = vec2(cos(winkel), sin(winkel));
  vec2 n = vec2(-r.y, r.x);
  vec2 z = vec2(dot(p, r) / (abst * 12.0), dot(p, n) / abst); // längs gestreckt, quer fein
  z.y += (wolkig(p * 0.003 + saat) - 0.5) * 1.5;               // Spuren geschwungen, nicht gerade
  float spur = wolkig(z + saat);
  return 0.9 + 0.25 * smoothstep(0.35, 0.75, spur);
}
// Nur der Umriss (Sprung in der Tiefe), ohne Helligkeitssprünge: für den Boden, damit Schatten keinen Rand bekommen
float markerUmriss(vec2 uv, vec2 d) {
  float tm = tiefe(uv);
  float tl = tiefe(uv - vec2(d.x, 0.0)), tr = tiefe(uv + vec2(d.x, 0.0));
  float to = tiefe(uv + vec2(0.0, d.y)), tu = tiefe(uv - vec2(0.0, d.y));
  float umriss = (abs(tl + tr - 2.0 * tm) + abs(to + tu - 2.0 * tm)) / min(tm, min(min(tl, tr), min(to, tu)));
  return smoothstep(0.02, 0.08, umriss);
}
// Farbe kräftiger (wie ein Marker). Keine harten Farbstufen: die machten helle Flecken in Ziegeln und Holz.
vec3 markerFarbe(vec3 c) {
  float l = hell(c);
  return clamp(vec3(l) + (c - vec3(l)) * 1.7, 0.0, 1.0);
}
vec3 marker(vec2 q, vec2 px, float s) {
  vec2 p = q * 1000.0; // Strichgrößen wie in einem 1000 Pixel hohen Bild
  // locker aus der Hand (Wunsch der Nutzerin: lockerer): Farbe gegenüber den Linien deutlich verschoben,
  // malt mal über den Rand, mal bleibt ein Spalt; Linien selbst wackeln leicht
  vec2 wackel = (vec2(wolkig(q * 8.0), wolkig(q * 8.0 + 4.1)) - 0.5) * px * 5.0 * s;
  vec2 versatz = (vec2(wolkig(q * 2.0 + 4.0), wolkig(q * 2.0 + 9.0)) - 0.5) * px * 24.0 * s;
  vec2 uv = vUv + versatz;
  // weich gemittelt: Marker zeigt keine einzelnen Ziegel, nur die Farbe der Fläche
  vec3 c = vec3(0.0);
  for (int i = -2; i <= 2; i++) for (int j = -2; j <= 2; j++) c += farbe(uv + vec2(float(i), float(j)) * px * 1.5 * s);
  c /= 25.0;
  float l = hell(c);
  // Markertinte ist durchscheinend: eine Lage eher hell, erst übereinander wird es dunkel
  vec3 tinte = mix(markerFarbe(c), vec3(1.0), 0.3);
  float da = bauteil(uv);
  // Helligkeit der weiteren Umgebung: was deutlich dunkler ist als ringsum, ist Schatten oder eine Schattenseite
  float lUmg = 0.0;
  for (int k = 0; k < 8; k++) {
    float w = float(k) * 0.785;
    lUmg += hell(farbe(uv + vec2(cos(w), sin(w)) * px * 40.0 * s));
  }
  lUmg /= 8.0;

  // erste Lage: die Fläche selbst, steile Bahnen; ganz helle Flächen bleiben Papier (Glanzlicht)
  float frei = smoothstep(0.93, 0.97, l);
  float lage1 = markerBahnen(p, 1.25, 42.0, 0.0) * (1.0 - frei);
  // zweite Lage: Schatten und dunkle Seiten noch einmal mit demselben Marker, weich und flacher gezogen
  float schatten = max(smoothstep(0.05, 0.18, lUmg - l), smoothstep(0.2, 0.1, l));
  float lage2 = markerBahnen(p, 0.4, 50.0, 30.0) * schatten * 0.6;
  vec3 bild = papier * pow(tinte, vec3(lage1 + lage2)); // jede Lage Farbe darüber macht dunkler
  bild = mix(papier, bild, da);

  // Hintergrund: ein paar lockere Striche Himmel (blau, oben ums Haus) und Wiese (grün, unten)
  vec2 mitte = vUv + (vec2(wolkig(q * 2.0), wolkig(q * 2.0 + 5.0)) - 0.5) * 0.06;
  float nahe = 0.0;
  for (int k = 0; k < 12; k++) {
    float w = float(k) * 0.5236;
    vec2 rr = vec2(cos(w) * aufloesung.y / aufloesung.x, sin(w));
    nahe += bauteil(mitte + rr * 0.05) + bauteil(mitte + rr * 0.11);
  }
  nahe = smoothstep(0.15, 0.45, nahe / 24.0);
  float oben = 0.0, unten = 0.0;
  for (int k = 1; k <= 4; k++) {
    oben += bauteil(mitte + vec2(0.0, float(k) * 0.06));
    unten += bauteil(mitte - vec2(0.0, float(k) * 0.06));
  }
  float boden = clamp((oben - unten) * 0.5, 0.0, 1.0);
  boden = max(boden, smoothstep(0.3, 0.15, vUv.y + (wolkig(q * vec2(3.0, 1.0) + 2.0) - 0.5) * 0.15) * step(0.01, nahe));
  float himmelStriche = min(markerBahnen(p, 0.12, 45.0, 50.0), 1.0) * nahe * (1.0 - boden);
  float wiesenStriche = min(markerBahnen(p, 0.05, 35.0, 60.0), 1.0) * nahe * boden;
  vec3 himmel = vec3(0.70, 0.84, 0.95), wiese = vec3(0.70, 0.84, 0.58);
  vec3 hinten = papier * mix(vec3(1.0), himmel, himmelStriche) * mix(vec3(1.0), wiese, wiesenStriche);
  // Schlagschatten auf dem Boden (Wunsch der Nutzerin): dunkel mit dem grauen Marker gefüllt, ohne Umriss.
  // Ohne Gelände in der IFC liegt der Schatten auf dem „Hintergrund“: dort ist das Bild dunkler als weiß.
  float bodenSchatten = smoothstep(0.08, 0.35, 1.0 - hell(farbe(uv))) * (1.0 - da);
  float schattenLage = markerBahnen(p, 0.5, 30.0, 70.0);
  hinten *= mix(vec3(1.0), pow(vec3(0.58, 0.6, 0.68), vec3(schattenLage)), bodenSchatten);
  bild = mix(hinten, bild, da);

  // Fineliner: feine, graue Kanten (Wunsch der Nutzerin: nicht so schwarz und dick), nicht ganz durchgezogen.
  // Helligkeitssprünge zählen nur auf dem Gebäude, nicht auf dem Boden – sonst bekäme der Schatten einen Umriss.
  vec2 kuv = vUv + wackel * 0.5;
  vec2 kd = px * 0.85 * s;
  float aufBoden = max(1.0 - bauteil(kuv), bodenFlaeche(kuv, kd * 2.0));
  float linie = mix(kante(kuv, kd), markerUmriss(kuv, kd), aufBoden) * (0.75 + 0.25 * rauschen(q * 45.0));
  bild = mix(bild, vec3(0.2, 0.2, 0.23), smoothstep(0.3, 0.75, linie) * 0.78);
  float rand = randAuslauf(q);
  bild = mix(papier, bild, rand);
  bild *= 0.99 + 0.02 * rauschen(p * 0.7); // Papierkorn
  return bild;
}

void main() {
  vec2 px = 1.0 / aufloesung;
  float s = aufloesung.y / 1000.0; // Pinsel- und Strichgrößen wie in einem 1000 Pixel hohen Bild
  vec2 q = vUv * vec2(aufloesung.x / aufloesung.y, 1.0);
  vec3 c = stil == 1 ? aquarell(q, px, s) : stil == 2 ? bleistift(q, px, s) : marker(q, px, s);
  gl_FragColor = vec4(c, 1.0);
}
`;

export class Nachbearbeitung {
  constructor() {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tFarbe: { value: null }, tTiefe: { value: null }, aufloesung: { value: new THREE.Vector2() },
        nah: { value: 0.1 }, fern: { value: 1000 }, ortho: { value: 0 },
        stil: { value: 1 }, abend: { value: 0 }, nacht: { value: 0 }, papier: { value: new THREE.Color() },
        projInv: { value: new THREE.Matrix4() }, kameraWelt: { value: new THREE.Matrix4() }, bodenHoehe: { value: -1e9 },
      },
      vertexShader: ECKPUNKTE,
      fragmentShader: MALEN,
      depthTest: false,
      depthWrite: false,
    });
    this.buehne = new THREE.Scene();
    this.buehne.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material));
    this.kamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.ziel = null;
    this.groesse = new THREE.Vector2();
  }

  // Unsichtbares Bild in passender Größe (bei neuer Größe neu anlegen)
  zielFuer(breite, hoehe) {
    if (this.ziel && this.ziel.width === breite && this.ziel.height === hoehe) return this.ziel;
    if (this.ziel) { this.ziel.depthTexture.dispose(); this.ziel.dispose(); }
    this.ziel = new THREE.WebGLRenderTarget(breite, hoehe, {
      type: THREE.HalfFloatType,
      depthTexture: new THREE.DepthTexture(breite, hoehe),
    });
    return this.ziel;
  }

  // szene/kamera: was gezeichnet wird; stil: 'aquarell' oder 'bleistift'; abend: 0 … 1; papier: Farbe des Papiers;
  // bodenHoehe: waagerechte Flächen bis zu dieser Höhe werden im Aquarell Wiese
  malen(renderer, szene, kamera, { stil, abend = 0, nacht = 0, papier = 0xffffff, bodenHoehe = -1e9 }) {
    renderer.getDrawingBufferSize(this.groesse);
    const ziel = this.zielFuer(this.groesse.x, this.groesse.y);
    const alteFarbe = renderer.getClearColor(new THREE.Color());
    const alteDeckkraft = renderer.getClearAlpha();
    try {
      renderer.setClearColor(0xffffff, 1);
      renderer.setRenderTarget(ziel);
      renderer.render(szene, kamera);
    } finally {
      renderer.setRenderTarget(null);
      renderer.setClearColor(alteFarbe, alteDeckkraft);
    }
    const u = this.material.uniforms;
    u.tFarbe.value = ziel.texture;
    u.tTiefe.value = ziel.depthTexture;
    u.aufloesung.value.copy(this.groesse);
    u.nah.value = kamera.near;
    u.fern.value = kamera.far;
    u.ortho.value = kamera.isOrthographicCamera ? 1 : 0;
    u.stil.value = { aquarell: 1, bleistift: 2, marker: 3 }[stil] ?? 2;
    u.abend.value = abend;
    u.nacht.value = nacht;
    u.projInv.value.copy(kamera.projectionMatrixInverse);
    u.kameraWelt.value.copy(kamera.matrixWorld);
    u.bodenHoehe.value = bodenHoehe;
    // Farbwerte unverändert durchreichen (der Shader rechnet in Bildschirmfarben, nicht in „linearen“)
    u.papier.value.setHex(papier, THREE.LinearSRGBColorSpace);
    renderer.render(this.buehne, this.kamera);
  }
}
