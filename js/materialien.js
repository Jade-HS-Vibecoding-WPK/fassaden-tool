// Fassadenmaterialien als selbst gezeichnete Muster im echten Maßstab.
// Farben bewusst gedeckt und leicht grau gebrochen. Fugen sind nur angedeutet wie in einer Federzeichnung:
// jeder Strich scharf, aber stellenweise fehlen Striche oder hören früher auf. Die Kacheln sind groß
// (mehrere Meter), damit man nicht sieht, wie sich das Muster wiederholt.
import * as THREE from 'three';
import { flaeche } from './darstellung.js';

export const MATERIALIEN = [
  { id: 'klinker-rot', name: 'Klinker rot', farbe: '#98534a', muster: 'klinker' },
  { id: 'klinker-anthrazit', name: 'Klinker anthrazit', farbe: '#77726d', muster: 'klinker' },
  { id: 'holz-natur', name: 'Holz natur', farbe: '#a6927e', muster: 'holz' },
  { id: 'holz-vergraut', name: 'Holz vergraut', farbe: '#9c978d', muster: 'holz' },
  { id: 'sichtbeton', name: 'Sichtbeton', farbe: '#b3b0aa', muster: 'beton' },
  { id: 'putz-altweiss', name: 'Putz altweiß', farbe: '#e2ddd3', muster: 'putz' },
  { id: 'putz-sand', name: 'Putz sand', farbe: '#cfc2a6', muster: 'putz' },
  { id: 'platten-anthrazit', name: 'Fassadenplatten anthrazit', farbe: '#63676b', muster: 'platten' },
  { id: 'platten-silber', name: 'Fassadenplatten silbergrau', farbe: '#aaaeb0', muster: 'platten' },
  { id: 'glas', name: 'Glas blaugrau', farbe: '#8c9eab', muster: 'glas' },
];

export const START_MATERIAL = 'klinker-rot';

// Jedes Muster: Größe einer Kachel in Metern (wiederholt sich lückenlos), Auflösung und Zeichenanweisung.
// Die Zeichenanweisung bekommt einen Stift z, der in Metern rechnet (siehe stiftAnlegen).
const MUSTER = {
  // Läuferverband: Stein 24 × 7,1 cm, Fuge ca. 1 cm → Raster 25 × 8,33 cm, 16 Steine × 30 Schichten
  klinker: {
    breite: 4, hoehe: 2.5, pixelProMeter: 256,
    zeichnen(z) {
      const stein = 0.25, schicht = 2.5 / 30;
      for (let reihe = 0; reihe < 30; reihe++) {
        const y = reihe * schicht;
        const versatz = reihe % 2 ? stein / 2 : 0;
        for (let x = -versatz; x < z.breite; x += stein) {
          z.flaeche(x, y, stein, schicht, abwandeln(z.farbe, 0.025, z.zufall));
        }
      }
      const fuge = abdunkeln(z.farbe, 0.68);
      for (let reihe = 0; reihe < 30; reihe++) {
        const y = reihe * schicht;
        const versatz = reihe % 2 ? stein / 2 : 0;
        for (let x = -versatz; x < z.breite; x += stein) {
          z.strich(x, y, x + stein, y, fuge);              // Lagerfuge
          z.strich(x, y, x, y + schicht, fuge, 1);         // Stoßfuge, etwas zarter
        }
      }
    },
  },
  // Senkrechte Bretter 12 cm. Fugen fast durchgängig, nur selten eine kleine Lücke,
  // leicht unterschiedlich kräftig, dazu ganz leichte Wolken
  holz: {
    breite: 3.6, hoehe: 4, pixelProMeter: 256,
    zeichnen(z) {
      const brett = 0.12;
      for (let x = 0; x < z.breite - 0.001; x += brett) {
        z.flaeche(x, 0, brett, z.hoehe, abwandeln(z.farbe, 0.03, z.zufall));
      }
      const fuge = abdunkeln(z.farbe, 0.62);
      for (let x = 0; x < z.breite - 0.001; x += brett) {
        // Abschnitte unterschiedlich lang (1–3 m) und je Brett versetzt, damit die seltenen Lücken kein Raster bilden
        const start = z.zufall() * z.hoehe;
        for (let y = start; y < start + z.hoehe - 0.01;) {
          const ende = Math.min(start + z.hoehe, y + 1 + 2 * z.zufall());
          z.strich(x, y, x, ende, fuge, 1.4, 0.6 + 0.25 * z.zufall(), true);
          y = ende;
        }
      }
      z.wolken(0.03);
    },
  },
  // Schalungstafeln 2,50 × 0,50 m, Tafelstöße nur zart, wolkige Fläche
  beton: {
    breite: 5, hoehe: 3, pixelProMeter: 160,
    zeichnen(z) {
      z.flaeche(0, 0, z.breite, z.hoehe, z.farbe);
      z.wolken(0.06, 2);
      z.koernung(0.035, 25000);
      const stoss = abdunkeln(z.farbe, 0.8);
      for (let y = 0; y < z.hoehe; y += 0.5) {
        for (let x = 0; x < z.breite; x += 0.5) z.strich(x, y, x + 0.5, y, stoss, 1);
      }
      for (let x = 0; x < z.breite; x += 2.5) {
        for (let y = 0; y < z.hoehe; y += 0.5) z.strich(x, y, x, y + 0.5, stoss, 1);
      }
    },
  },
  // Fast glatt, nur feine Körnung und leichte Wolken
  putz: {
    breite: 2, hoehe: 2, pixelProMeter: 256,
    zeichnen(z) {
      z.flaeche(0, 0, z.breite, z.hoehe, z.farbe);
      z.koernung(0.035, 30000);
      z.wolken(0.025);
    },
  },
  // Großformatige Platten 1,25 × 0,625 m mit feinen Fugen
  platten: {
    breite: 5, hoehe: 2.5, pixelProMeter: 192,
    zeichnen(z) {
      const pb = 1.25, ph = 0.625;
      for (let y = 0; y < z.hoehe - 0.001; y += ph) {
        for (let x = 0; x < z.breite - 0.001; x += pb) z.flaeche(x, y, pb, ph, abwandeln(z.farbe, 0.025, z.zufall));
      }
      const fuge = abdunkeln(z.farbe, 0.66);
      for (let y = 0; y < z.hoehe - 0.001; y += ph) {
        for (let x = 0; x < z.breite - 0.001; x += pb) {
          z.strich(x, y, x + pb, y, fuge);
          z.strich(x, y, x, y + ph, fuge);
        }
      }
    },
  },
  // Glasfelder 1,25 × 1,50 m, nur durch leichte Spiegelung je Feld erkennbar, ohne Profilstriche
  glas: {
    breite: 2.5, hoehe: 3, pixelProMeter: 128,
    zeichnen(z) {
      for (let y = 0; y < z.hoehe - 0.001; y += 1.5) {
        for (let x = 0; x < z.breite - 0.001; x += 1.25) {
          z.verlauf(x, y, 1.25, 1.5, aufhellen(z.farbe, 0.07), abdunkeln(z.farbe, 0.96));
        }
      }
      z.wolken(0.03);
    },
  },
};

// Zeichenstift für eine Kachel. Rechnet in Metern und wiederholt alles über den Rand hinaus,
// damit die Kachel lückenlos aneinanderpasst.
function stiftAnlegen(g, muster, farbe, zufall) {
  const px = muster.pixelProMeter;
  const b = muster.breite, h = muster.hoehe;
  // Wo Fugen kräftig sind und wo sie fehlen: weiche Flecken von etwa 1 m Größe
  const fugenFlecken = rauschen(zufall, Math.round(b * 1.2), Math.round(h * 1.2));
  const wolkenFlecken = rauschen(zufall, Math.round(b * 1.5), Math.round(h * 1.5));
  const ueberall = (x, y, malen) => {
    for (const dx of [-b, 0, b]) for (const dy of [-h, 0, h]) malen((x + dx) * px, (y + dy) * px);
  };
  return {
    breite: b, hoehe: h, farbe, zufall,
    flaeche(x, y, w, hh, ton) {
      g.fillStyle = ton;
      ueberall(x, y, (X, Y) => g.fillRect(X, Y, w * px + 0.5, hh * px + 0.5));
    },
    verlauf(x, y, w, hh, von, bis) {
      ueberall(x, y, (X, Y) => {
        const v = g.createLinearGradient(X, Y, X + w * px, Y + hh * px);
        v.addColorStop(0, von);
        v.addColorStop(1, bis);
        g.fillStyle = v;
        g.fillRect(X, Y, w * px + 0.5, hh * px + 0.5);
      });
    },
    // Ein scharfer Strich wie mit der Feder, aber nicht jeder wird gezeichnet.
    // Die Fleckenkarte sagt, wo eher viele und wo eher wenige Striche fehlen (keine Unschärfe).
    // Anfang und Ende rücken zufällig etwas nach innen, so entstehen unterschiedlich lange Lücken.
    // dicke in Pixeln; deckkraft 0–1 (Holz: je Strich verschieden);
    // durchgaengig = true: fast jeder Strich wird gezeichnet, Lücken nur wenige Zentimeter (Holz)
    strich(x1, y1, x2, y2, ton, dicke = 1.4, deckkraft = 0.9, durchgaengig = false) {
      const flecken = fugenFlecken((x1 + x2) / 2 / b, (y1 + y2) / 2 / h);
      const wahrscheinlichkeit = durchgaengig ? 0.97 : Math.min(0.95, Math.max(0.2, (flecken - 0.2) / 0.45));
      if (zufall() > wahrscheinlichkeit) return;
      const kuerzen = durchgaengig ? 0.03 : 0.3;
      const anfang = zufall() * zufall() * kuerzen; // meist kurz, selten lang
      const ende = 1 - zufall() * zufall() * kuerzen;
      const wackeln = () => (zufall() - 0.5) * 0.6; // Pixel
      g.strokeStyle = ton;
      g.globalAlpha = deckkraft;
      g.lineWidth = dicke * (0.85 + 0.3 * zufall());
      const dx = (x2 - x1) * px, dy = (y2 - y1) * px;
      const a = [wackeln(), wackeln(), wackeln(), wackeln()];
      ueberall(x1, y1, (X, Y) => {
        g.beginPath();
        g.moveTo(X + dx * anfang + a[0], Y + dy * anfang + a[1]);
        g.lineTo(X + dx * ende + a[2], Y + dy * ende + a[3]);
        g.stroke();
      });
      g.globalAlpha = 1;
    },
    // Viele winzige hellere und dunklere Punkte
    koernung(betrag, anzahl) {
      for (let i = 0; i < anzahl; i++) {
        g.fillStyle = abwandeln(farbe, betrag, zufall);
        g.fillRect(Math.floor(zufall() * b * px), Math.floor(zufall() * h * px), 2, 2);
      }
    },
    // Ganz weiche hellere und dunklere Stellen über alles legen (betrag 0.04 = bis zu ±4 %)
    wolken(betrag, feinheit = 1) {
      const W = Math.round(b * px), H = Math.round(h * px);
      const bild = g.getImageData(0, 0, W, H);
      const d = bild.data;
      for (let j = 0; j < H; j++) {
        for (let i = 0; i < W; i++) {
          let r = wolkenFlecken(i / W, j / H);
          if (feinheit > 1) r = 0.6 * r + 0.4 * fugenFlecken((i / W) * 2 % 1, (j / H) * 2 % 1);
          const f = 1 + (r - 0.5) * 2 * betrag;
          const k = (j * W + i) * 4;
          d[k] *= f; d[k + 1] *= f; d[k + 2] *= f;
        }
      }
      g.putImageData(bild, 0, 0);
    },
  };
}

// Bild einer Kachel zeichnen (gleiche Zufallszahlen bei jedem Öffnen, damit das Muster gleich bleibt)
function kachelZeichnen(eintrag) {
  const muster = MUSTER[eintrag.muster];
  const leinwand = document.createElement('canvas');
  leinwand.width = Math.round(muster.breite * muster.pixelProMeter);
  leinwand.height = Math.round(muster.hoehe * muster.pixelProMeter);
  const g = leinwand.getContext('2d', { willReadFrequently: true });
  muster.zeichnen(stiftAnlegen(g, muster, eintrag.farbe, zufallszahlen(eintrag.id)));
  return leinwand;
}

function eintragZu(id) {
  return MATERIALIEN.find((m) => m.id === id) ?? MATERIALIEN[0];
}

const kacheln = new Map();
function kachel(id) {
  if (!kacheln.has(id)) kacheln.set(id, kachelZeichnen(eintragZu(id)));
  return kacheln.get(id);
}

// Kleines Vorschaubild für die Seitenleiste: Ausschnitt von 0,8 × 0,8 m
export function musterBild(id) {
  const px = MUSTER[eintragZu(id).muster].pixelProMeter;
  const bild = document.createElement('canvas');
  bild.width = bild.height = 52;
  bild.getContext('2d').drawImage(kachel(id), 0, 0, 0.8 * px, 0.8 * px, 0, 0, 52, 52);
  return bild.toDataURL();
}

// Textur einmal je Material, normal und hervorgehoben teilen sie sich
const texturen = new Map();
function textur(id) {
  if (texturen.has(id)) return texturen.get(id);
  const muster = MUSTER[eintragZu(id).muster];
  const t = new THREE.CanvasTexture(kachel(id));
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / muster.breite, 1 / muster.hoehe); // Texturkoordinaten sind in Metern
  t.anisotropy = 8; // Muster bleibt auch schräg gesehen scharf
  texturen.set(id, t);
  return t;
}

// 3D-Material zu einer Material-Nummer; hover = mit blauem Schimmer, wenn die Maus darüber ist,
// 'auswahl' = ausgewählte Wand (Schalter „Einzelne Wände“): deutlich blau getönt, auch auf hellen Materialien sichtbar
const SCHIMMER = { hover: 0.45, auswahl: 0.35 };
const TOENUNG = { hover: 0xffffff, auswahl: 0x7f9cd0 };
const materialien = new Map();
export function fassadenMaterial(id, hover = false) {
  id = eintragZu(id).id;
  const art = hover === 'auswahl' ? 'auswahl' : hover ? 'hover' : '';
  const schluessel = id + (art ? `:${art}` : '');
  if (!materialien.has(schluessel)) {
    materialien.set(schluessel, flaeche(art ? TOENUNG[art] : 0xffffff, {
      map: textur(id),
      ...(art ? { emissive: 0x1f3a68, emissiveIntensity: SCHIMMER[art] } : {}),
    }));
  }
  return materialien.get(schluessel);
}

// ---------- Hilfen für Farben und Zufall ----------

function rgb(hex) {
  const zahl = parseInt(hex.slice(1), 16);
  return [(zahl >> 16) & 255, (zahl >> 8) & 255, zahl & 255];
}
function hexAus([r, g, b]) {
  const k = (w) => Math.round(Math.min(255, Math.max(0, w))).toString(16).padStart(2, '0');
  return `#${k(r)}${k(g)}${k(b)}`;
}
function abdunkeln(hex, faktor) { return hexAus(rgb(hex).map((w) => w * faktor)); }
function aufhellen(hex, anteil) { return hexAus(rgb(hex).map((w) => w + (255 - w) * anteil)); }
// Farbe zufällig etwas heller oder dunkler (betrag 0.03 = bis zu ±3 %)
function abwandeln(hex, betrag, zufall) { return abdunkeln(hex, 1 + (zufall() * 2 - 1) * betrag); }

// Weiche Fleckenkarte, die sich lückenlos wiederholt. Liefert für u, v zwischen 0 und 1 einen Wert zwischen 0 und 1.
function rauschen(zufall, zellenX, zellenY) {
  zellenX = Math.max(1, zellenX); zellenY = Math.max(1, zellenY);
  const gitter = Array.from({ length: zellenX * zellenY }, () => zufall());
  const wert = (i, j) => gitter[(((j % zellenY) + zellenY) % zellenY) * zellenX + (((i % zellenX) + zellenX) % zellenX)];
  const weich = (t) => t * t * (3 - 2 * t);
  return (u, v) => {
    const x = u * zellenX, y = v * zellenY;
    const i = Math.floor(x), j = Math.floor(y);
    const fx = weich(x - i), fy = weich(y - j);
    const oben = wert(i, j) + (wert(i + 1, j) - wert(i, j)) * fx;
    const unten = wert(i, j + 1) + (wert(i + 1, j + 1) - wert(i, j + 1)) * fx;
    return oben + (unten - oben) * fy;
  };
}

// Einfacher Zufallsgenerator mit festem Startwert
function zufallszahlen(text) {
  let s = 0;
  for (const z of text) s = (s * 31 + z.charCodeAt(0)) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
