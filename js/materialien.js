// Fassadenmaterialien als selbst gezeichnete Muster im echten Maßstab.
// Farben bewusst gedeckt und leicht grau gebrochen. Fugen sind nur angedeutet wie in einer Federzeichnung:
// jeder Strich scharf, aber stellenweise fehlen Striche oder hören früher auf. Die Kacheln sind groß
// (mehrere Meter), damit man nicht sieht, wie sich das Muster wiederholt.
import * as THREE from 'three';
import { flaeche } from './darstellung.js?v=19';

export const MATERIALIEN = [
  { id: 'klinker-rot', name: 'Klinker rot', farbe: '#92564b', muster: 'klinker' },
  { id: 'klinker-anthrazit', name: 'Klinker anthrazit', farbe: '#77726d', muster: 'klinker' },
  // Lärche: übliches Fassadenholz (unbehandelt, warm-hell); Kennung bleibt 'holz-natur', damit alte Varianten passen
  { id: 'holz-natur', name: 'Lärche', farbe: '#bfa88b', muster: 'holz' },
  { id: 'holz-vergraut', name: 'Holz vergraut', farbe: '#9c978d', muster: 'holz' },
  { id: 'sichtbeton', name: 'Sichtbeton', farbe: '#b3b0aa', muster: 'beton' },
  { id: 'putz-altweiss', name: 'Putz altweiß', farbe: '#e2ddd3', muster: 'putz' },
  { id: 'putz-sand', name: 'Putz sand', farbe: '#cfc2a6', muster: 'putz' },
  { id: 'platten-anthrazit', name: 'Fassadenplatten anthrazit', farbe: '#63676b', muster: 'platten' },
  { id: 'platten-silber', name: 'Fassadenplatten silbergrau', farbe: '#aaaeb0', muster: 'platten' },
  { id: 'glas', name: 'Glas blaugrau', farbe: '#8c9eab', muster: 'glas' },
  // Wird als echte Glasfassade mit Pfosten und Riegeln gebaut (fassade.js); das Muster ist nur Vorschaubild
  // und Ersatz für Wände, die sich nicht nachbauen lassen. Nicht für Stützen.
  { id: 'pfosten-riegel', name: 'Pfosten-Riegel', farbe: '#8c9eab', muster: 'pfostenRiegel', pfostenRiegel: true },
];

export const PFOSTEN_RIEGEL = 'pfosten-riegel';

export const START_MATERIAL = 'klinker-rot';

// Dachmaterialien (Sitzung 17b): ein Material für alle Dachteile. Muster liegen so auf der Dachfläche,
// dass Ziegelreihen waagerecht (parallel zur Traufe) und Falze die Schräge hinunter laufen (fassade.js).
// Farben (zweimal geändert nach Test, Wunsch der Nutzerin): etwas dunkler und weniger gesättigt als die Fassaden,
// je Paar im selben Farbton wie das passende Fassadenmaterial, nur dunkler:
// Ziegel rot ↔ Klinker rot (Farbton ca. 10°), Ziegel anthrazit ↔ Klinker anthrazit (warmes Grau),
// Stehfalz ↔ Fassadenplatten (kühles Grau), Schlicht hell ↔ Sichtbeton.
// kante: schlichte Farbe der schmalen Dachkanten (Ortgang, Traufkante), wie ein Ortgangblech.
export const DACHMATERIALIEN = [
  { id: 'dach-hell', name: 'Schlicht hell', farbe: '#b4b1ab', kante: '#9b9893', muster: 'abdichtung' },
  { id: 'ziegel-rot', name: 'Ziegel rot', farbe: '#7d4e45', kante: '#66423b', muster: 'ziegel' },
  { id: 'ziegel-anthrazit', name: 'Ziegel anthrazit', farbe: '#58554f', kante: '#4a4843', muster: 'ziegel' },
  { id: 'stehfalz-hell', name: 'Stehfalz hellgrau', farbe: '#969a9c', kante: '#85898b', muster: 'stehfalz' },
  { id: 'stehfalz-anthrazit', name: 'Stehfalz anthrazit', farbe: '#4f5357', kante: '#44474b', muster: 'stehfalz' },
  { id: 'gruendach', name: 'Gründach', farbe: '#6c705f', kante: '#6b6d6b', muster: 'gruendach' },
];

// Startwert: ruhiges Hellgrau, damit das Dach nicht heraussticht (Wunsch der Nutzerin)
export const START_DACH = 'dach-hell';

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
  // Pfosten-Riegel: Glasfelder 1,25 × 1,50 m mit 5 cm breiten Profilen in der Farbe des Dachs
  pfostenRiegel: {
    breite: 2.5, hoehe: 3, pixelProMeter: 128, vorschau: 2,
    zeichnen(z) {
      for (let y = 0; y < z.hoehe - 0.001; y += 1.5) {
        for (let x = 0; x < z.breite - 0.001; x += 1.25) {
          z.verlauf(x, y, 1.25, 1.5, aufhellen(z.farbe, 0.07), abdunkeln(z.farbe, 0.96));
        }
      }
      const profil = '#3a3d42'; // wie PROFILFARBE in darstellung.js
      for (let x = 0; x < z.breite - 0.001; x += 1.25) z.flaeche(x - 0.025, 0, 0.05, z.hoehe, profil);
      for (let y = 0; y < z.hoehe - 0.001; y += 1.5) z.flaeche(0, y - 0.025, z.breite, 0.05, profil);
    },
  },

  // --- Dach ---
  // Dachabdichtung / Kies: fast glatt, feine Körnung, Bahnenstöße alle 1 m nur ganz zart
  abdichtung: {
    breite: 4, hoehe: 4, pixelProMeter: 128,
    zeichnen(z) {
      z.flaeche(0, 0, z.breite, z.hoehe, z.farbe);
      z.koernung(0.03, 20000);
      z.wolken(0.025);
      const stoss = abdunkeln(z.farbe, 0.85);
      for (let x = 0; x < z.breite - 0.001; x += 1) z.strich(x, 0, x, z.hoehe, stoss, 1, 0.6, true);
    },
  },
  // Falzziegel ca. 30 cm breit, Lattung 33,3 cm: Reihen waagerecht, Ziegel je Reihe gegeneinander versetzt
  ziegel: {
    breite: 3, hoehe: 3, pixelProMeter: 192,
    zeichnen(z) {
      const breit = 0.3, reihe = 1 / 3;
      for (let y = 0; y < z.hoehe - 0.001; y += reihe) {
        const versatz = Math.round(y / reihe) % 2 ? breit / 2 : 0;
        for (let x = -versatz; x < z.breite; x += breit) z.flaeche(x, y, breit, reihe, abwandeln(z.farbe, 0.04, z.zufall));
      }
      const fuge = abdunkeln(z.farbe, 0.6);
      for (let y = 0; y < z.hoehe - 0.001; y += reihe) {
        const versatz = Math.round(y / reihe) % 2 ? breit / 2 : 0;
        // Unterkante der Reihe: kräftig, mit schmalem Schattenband (Überdeckung)
        z.flaeche(0, y, z.breite, 0.025, abdunkeln(z.farbe, 0.85));
        for (let x = -versatz; x < z.breite; x += breit) {
          z.strich(x, y, x + breit, y, fuge, 1.6);
          z.strich(x, y, x, y + reihe, fuge, 1);
        }
      }
    },
  },
  // Stehfalzdeckung: Bahnen 50 cm breit, Falze als durchgehende Linien die Schräge hinunter
  stehfalz: {
    breite: 4, hoehe: 4, pixelProMeter: 160,
    zeichnen(z) {
      const bahn = 0.5;
      for (let x = 0; x < z.breite - 0.001; x += bahn) z.flaeche(x, 0, bahn, z.hoehe, abwandeln(z.farbe, 0.02, z.zufall));
      const falz = abdunkeln(z.farbe, 0.62);
      const licht = aufhellen(z.farbe, 0.25);
      for (let x = 0; x < z.breite - 0.001; x += bahn) {
        z.flaeche(x + 0.006, 0, 0.008, z.hoehe, licht);
        z.strich(x, 0, x, z.hoehe, falz, 1.6, 0.9, true);
      }
    },
  },
  // Extensives Gründach: Sedum-Teppich, unregelmäßige hellere und dunklere Flecken
  gruendach: {
    breite: 3, hoehe: 3, pixelProMeter: 160,
    zeichnen(z) {
      z.flaeche(0, 0, z.breite, z.hoehe, z.farbe);
      z.wolken(0.12, 2);
      for (let i = 0; i < 2600; i++) {
        const r = 0.01 + 0.025 * z.zufall();
        const ton = z.zufall() < 0.5 ? abdunkeln(z.farbe, 0.8) : aufhellen(z.farbe, 0.18);
        z.fleck(z.zufall() * z.breite, z.zufall() * z.hoehe, r, r, ton, 0.8);
      }
      z.koernung(0.06, 15000);
    },
  },
};

// ---------- Darstellung „realistisch“ (Umschalter im 3D-Fenster, Sitzung 17) ----------
// Gleiche Maße wie oben, aber ohne Federstriche: durchgehende Fugen, Maserung, Poren.
// Dazu je Muster ein Reliefbild (hell = vorne, dunkel = vertieft, z. B. Fugen) und wie rau/glänzend die Fläche ist.
const ECHT = {
  klinker: {
    breite: 4, hoehe: 2.5, pixelProMeter: 256, rau: 0.9, metall: 0,
    zeichnen(z) {
      const stein = 0.25, schicht = 2.5 / 30, fuge = 0.01;
      z.flaeche(0, 0, z.breite, z.hoehe, '#b9b3a8'); // Mörtel
      z.relief(0, 0, z.breite, z.hoehe, 40);
      for (let reihe = 0; reihe < 30; reihe++) {
        const y = reihe * schicht;
        const versatz = reihe % 2 ? stein / 2 : 0;
        for (let x = -versatz; x < z.breite; x += stein) {
          z.flaeche(x + fuge / 2, y + fuge / 2, stein - fuge, schicht - fuge, abwandeln(z.farbe, 0.1, z.zufall));
          z.relief(x + fuge / 2, y + fuge / 2, stein - fuge, schicht - fuge, 230 + 25 * z.zufall());
        }
      }
      z.koernungEcht(0.06, 60000);
      z.wolken(0.04);
    },
  },
  holz: {
    breite: 3.6, hoehe: 4, pixelProMeter: 256, rau: 0.75, metall: 0,
    zeichnen(z) {
      const brett = 0.12, fuge = 0.008;
      z.relief(0, 0, z.breite, z.hoehe, 230);
      for (let x = 0; x < z.breite - 0.001; x += brett) {
        const ton = abwandeln(z.farbe, 0.08, z.zufall);
        z.flaeche(x, 0, brett, z.hoehe, ton);
        // Maserung: einige feine, leicht gewellte Linien längs des Bretts
        const dunkel = abdunkeln(ton, 0.82);
        for (let i = 0; i < 7; i++) {
          const x0 = x + fuge + z.zufall() * (brett - 2 * fuge);
          const welle = 0.002 + 0.006 * z.zufall();
          const k = 1 + Math.floor(z.zufall() * 3); // ganze Wellen je Kachelhöhe, damit sie lückenlos weiterläuft
          const phase = z.zufall() * 6.3;
          const punkte = [];
          for (let y = 0; y <= z.hoehe + 0.001; y += 0.05) {
            punkte.push([x0 + welle * Math.sin((y / z.hoehe) * k * 2 * Math.PI + phase), y]);
          }
          z.kurve(punkte, dunkel, 0.8 + z.zufall(), 0.25 + 0.3 * z.zufall());
        }
        // ab und zu ein Ast
        if (z.zufall() < 0.35) {
          z.fleck(x + 0.03 + z.zufall() * 0.06, z.zufall() * z.hoehe, 0.008, 0.018, abdunkeln(ton, 0.7), 0.6);
        }
        // Fuge zwischen den Brettern: schmaler, dunkler Schattenspalt
        z.flaeche(x, 0, fuge, z.hoehe, abdunkeln(z.farbe, 0.4));
        z.relief(x, 0, fuge, z.hoehe, 20);
      }
      z.wolken(0.04);
    },
  },
  beton: {
    breite: 5, hoehe: 3, pixelProMeter: 160, rau: 0.85, metall: 0,
    zeichnen(z) {
      z.flaeche(0, 0, z.breite, z.hoehe, z.farbe);
      z.relief(0, 0, z.breite, z.hoehe, 220);
      z.wolken(0.08, 2);
      z.koernungEcht(0.05, 40000);
      z.poren(1800, abdunkeln(z.farbe, 0.55));
      // Tafelstöße zart, Ankerlöcher als kleine dunkle Punkte
      const stoss = abdunkeln(z.farbe, 0.85);
      for (let y = 0; y < z.hoehe - 0.001; y += 0.5) z.linie(0, y, z.breite, y, stoss, 1, 0.7);
      for (let x = 0; x < z.breite - 0.001; x += 2.5) z.linie(x, 0, x, z.hoehe, stoss, 1, 0.7);
      for (let y = 0.25; y < z.hoehe; y += 1) {
        for (let x = 0.3125; x < z.breite; x += 0.625) z.fleck(x, y, 0.012, 0.012, abdunkeln(z.farbe, 0.5), 0.9, true);
      }
    },
  },
  putz: {
    breite: 2, hoehe: 2, pixelProMeter: 256, rau: 0.95, metall: 0,
    zeichnen(z) {
      z.flaeche(0, 0, z.breite, z.hoehe, z.farbe);
      z.relief(0, 0, z.breite, z.hoehe, 200);
      z.koernungEcht(0.07, 90000, true);
      z.wolken(0.035);
    },
  },
  platten: {
    breite: 5, hoehe: 2.5, pixelProMeter: 192, rau: 0.5, metall: 0.15,
    zeichnen(z) {
      const pb = 1.25, ph = 0.625, fuge = 0.008;
      z.flaeche(0, 0, z.breite, z.hoehe, abdunkeln(z.farbe, 0.35));
      z.relief(0, 0, z.breite, z.hoehe, 15);
      for (let y = 0; y < z.hoehe - 0.001; y += ph) {
        for (let x = 0; x < z.breite - 0.001; x += pb) {
          z.verlauf(x + fuge / 2, y + fuge / 2, pb - fuge, ph - fuge,
            abwandeln(aufhellen(z.farbe, 0.04), 0.03, z.zufall), abwandeln(z.farbe, 0.03, z.zufall));
          z.relief(x + fuge / 2, y + fuge / 2, pb - fuge, ph - fuge, 240);
        }
      }
      z.koernungEcht(0.02, 20000);
    },
  },
  // Glas: das Bild ist nur der Grundton, die Spiegelung macht das Material selbst
  glas: {
    breite: 2.5, hoehe: 3, pixelProMeter: 128, rau: 0.05, metall: 0.6, glas: true,
    zeichnen(z) {
      for (let y = 0; y < z.hoehe - 0.001; y += 1.5) {
        for (let x = 0; x < z.breite - 0.001; x += 1.25) z.flaeche(x, y, 1.25, 1.5, abwandeln(abdunkeln(z.farbe, 0.7), 0.04, z.zufall));
      }
      z.relief(0, 0, z.breite, z.hoehe, 200);
      for (let x = 0; x < z.breite - 0.001; x += 1.25) z.flaeche(x - 0.004, 0, 0.008, z.hoehe, '#2c2f33');
      for (let y = 0; y < z.hoehe - 0.001; y += 1.5) z.flaeche(0, y - 0.004, z.breite, 0.008, '#2c2f33');
    },
  },
  pfostenRiegel: {
    breite: 2.5, hoehe: 3, pixelProMeter: 128, rau: 0.05, metall: 0.6, glas: true,
    zeichnen(z) {
      for (let y = 0; y < z.hoehe - 0.001; y += 1.5) {
        for (let x = 0; x < z.breite - 0.001; x += 1.25) z.flaeche(x, y, 1.25, 1.5, abwandeln(abdunkeln(z.farbe, 0.7), 0.04, z.zufall));
      }
      z.relief(0, 0, z.breite, z.hoehe, 120);
      const profil = '#3a3d42';
      for (let x = 0; x < z.breite - 0.001; x += 1.25) { z.flaeche(x - 0.025, 0, 0.05, z.hoehe, profil); z.relief(x - 0.025, 0, 0.05, z.hoehe, 255); }
      for (let y = 0; y < z.hoehe - 0.001; y += 1.5) { z.flaeche(0, y - 0.025, z.breite, 0.05, profil); z.relief(0, y - 0.025, z.breite, 0.05, 255); }
    },
  },

  // --- Dach ---
  abdichtung: {
    breite: 4, hoehe: 4, pixelProMeter: 128, rau: 0.95, metall: 0,
    zeichnen(z) {
      z.flaeche(0, 0, z.breite, z.hoehe, z.farbe);
      z.relief(0, 0, z.breite, z.hoehe, 200);
      z.koernungEcht(0.08, 70000, true);
      z.wolken(0.04);
      for (let x = 0; x < z.breite - 0.001; x += 1) {
        z.linie(x, 0, x, z.hoehe, abdunkeln(z.farbe, 0.9), 1, 0.6);
        z.relief(x, 0, 0.01, z.hoehe, 240);
      }
    },
  },
  // Falzziegel: Farbe je Ziegel nur leicht verschieden (geändert nach Test: vorher zu bunt),
  // dazu großflächige, weiche Alterung. Relief: jeder Ziegel steigt zur Unterkante hin an und hat
  // zwei flache Wellen (Mulden) quer, oben liegt er im Schatten des Ziegels darüber.
  ziegel: {
    breite: 3, hoehe: 3, pixelProMeter: 192, rau: 0.75, metall: 0, relief: 2.5,
    zeichnen(z) {
      const breit = 0.3, reihe = 1 / 3, zellen = 8;
      for (let y = 0; y < z.hoehe - 0.001; y += reihe) {
        const versatz = Math.round(y / reihe) % 2 ? breit / 2 : 0;
        for (let x = -versatz; x < z.breite; x += breit) {
          const ton = abwandeln(z.farbe, 0.03, z.zufall);
          for (let i = 0; i < zellen; i++) {
            const welle = Math.sin(((i + 0.5) / zellen) * 2 * Math.PI * 2); // zwei Mulden je Ziegel
            const streifen = abdunkeln(ton, 1 + 0.035 * welle);
            z.flaeche(x + (i * breit) / zellen, y, breit / zellen, reihe, streifen);
            for (let j = 0; j < zellen; j++) {
              z.relief(x + (i * breit) / zellen, y + (j * reihe) / zellen, breit / zellen, reihe / zellen,
                70 + j * 18 + 25 * welle);
            }
          }
          z.flaeche(x, y, breit, 0.03, abdunkeln(ton, 0.72)); // Schatten unter dem Ziegel darüber
          z.relief(x, y, breit, 0.03, 20);
          z.flaeche(x + breit - 0.004, y, 0.004, reihe, abdunkeln(ton, 0.8)); // schmaler Spalt zum Nachbarn
        }
      }
      z.koernungEcht(0.03, 40000);
      z.wolken(0.05);
    },
  },
  stehfalz: {
    breite: 4, hoehe: 4, pixelProMeter: 160, rau: 0.4, metall: 0.55,
    zeichnen(z) {
      const bahn = 0.5;
      z.relief(0, 0, z.breite, z.hoehe, 120);
      for (let x = 0; x < z.breite - 0.001; x += bahn) {
        z.verlauf(x, 0, bahn, z.hoehe, abwandeln(aufhellen(z.farbe, 0.05), 0.03, z.zufall), abwandeln(z.farbe, 0.03, z.zufall));
        z.flaeche(x - 0.01, 0, 0.02, z.hoehe, aufhellen(z.farbe, 0.15)); // Falz
        z.flaeche(x + 0.01, 0, 0.006, z.hoehe, abdunkeln(z.farbe, 0.6)); // Schattenseite des Falzes
        z.relief(x - 0.01, 0, 0.02, z.hoehe, 255);
      }
      z.koernungEcht(0.015, 15000);
    },
  },
  gruendach: {
    breite: 3, hoehe: 3, pixelProMeter: 160, rau: 1, metall: 0,
    zeichnen(z) {
      z.flaeche(0, 0, z.breite, z.hoehe, abdunkeln(z.farbe, 0.85));
      z.relief(0, 0, z.breite, z.hoehe, 120);
      z.wolken(0.15, 2);
      for (let i = 0; i < 9000; i++) {
        const r = 0.006 + 0.018 * z.zufall();
        const w = z.zufall();
        const ton = w < 0.15 ? '#9a7b5e' : w < 0.25 ? '#a7a24e' : abwandeln(aufhellen(z.farbe, 0.1 * z.zufall()), 0.18, z.zufall);
        z.fleck(z.zufall() * z.breite, z.zufall() * z.hoehe, r, r * (0.6 + 0.6 * z.zufall()), ton, 0.85);
        z.relief(z.zufall() * z.breite, z.zufall() * z.hoehe, r, r, 160 + 95 * z.zufall());
      }
      z.koernungEcht(0.1, 50000, true);
    },
  },
};

// Zeichenstift für eine Kachel. Rechnet in Metern und wiederholt alles über den Rand hinaus,
// damit die Kachel lückenlos aneinanderpasst. hg: Zeichenfläche fürs Reliefbild (nur „realistisch“)
function stiftAnlegen(g, muster, farbe, zufall, hg = null) {
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
    // --- nur für „realistisch“ ---
    // Körnung, halb durchscheinend; mitRelief: auch im Reliefbild (Putz fühlt sich rau an)
    koernungEcht(betrag, anzahl, mitRelief = false) {
      for (let i = 0; i < anzahl; i++) {
        const x = Math.floor(zufall() * b * px), y = Math.floor(zufall() * h * px);
        const z = zufall();
        g.globalAlpha = 0.6;
        g.fillStyle = abdunkeln(farbe, 1 + (z * 2 - 1) * betrag);
        g.fillRect(x, y, 2, 2);
        if (mitRelief && hg) { hg.fillStyle = grau(150 + 105 * z); hg.fillRect(x, y, 2, 2); }
      }
      g.globalAlpha = 1;
    },
    // Durchgehender Strich (ohne Lücken wie bei der Feder)
    linie(x1, y1, x2, y2, ton, dicke = 1, deckkraft = 1) {
      this.kurve([[x1, y1], [x2, y2]], ton, dicke, deckkraft);
    },
    // Linienzug aus Punkten [x, y] in Metern
    kurve(punkte, ton, dicke = 1, deckkraft = 1) {
      g.strokeStyle = ton;
      g.lineWidth = dicke;
      g.globalAlpha = deckkraft;
      ueberall(0, 0, (X, Y) => {
        g.beginPath();
        punkte.forEach(([x, y], i) => (i ? g.lineTo : g.moveTo).call(g, X + x * px, Y + y * px));
        g.stroke();
      });
      g.globalAlpha = 1;
    },
    // Ovaler Fleck (Ast im Holz, Ankerloch im Beton); vertieft = auch im Reliefbild als Loch
    fleck(x, y, rx, ry, ton, deckkraft = 1, vertieft = false) {
      const malen = (ctx, stil, alpha) => {
        ctx.fillStyle = stil;
        ctx.globalAlpha = alpha;
        ueberall(x, y, (X, Y) => { ctx.beginPath(); ctx.ellipse(X, Y, rx * px, ry * px, 0, 0, 2 * Math.PI); ctx.fill(); });
        ctx.globalAlpha = 1;
      };
      malen(g, ton, deckkraft);
      if (vertieft && hg) malen(hg, grau(30), 1);
    },
    // Kleine dunkle Luftporen (Sichtbeton), im Reliefbild vertieft
    poren(anzahl, ton) {
      for (let i = 0; i < anzahl; i++) {
        const r = 0.001 + 0.002 * zufall() * zufall();
        this.fleck(zufall() * b, zufall() * h, r, r, ton, 0.5 + 0.4 * zufall(), true);
      }
    },
    // Rechteck im Reliefbild: wert 0 (tief) … 255 (vorne)
    relief(x, y, w, hh, wert) {
      if (!hg) return;
      hg.fillStyle = grau(wert);
      ueberall(x, y, (X, Y) => hg.fillRect(X, Y, w * px + 0.5, hh * px + 0.5));
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
  return MATERIALIEN.find((m) => m.id === id) ?? DACHMATERIALIEN.find((m) => m.id === id) ?? MATERIALIEN[0];
}

const kacheln = new Map();
function kachel(id) {
  if (!kacheln.has(id)) kacheln.set(id, kachelZeichnen(eintragZu(id)));
  return kacheln.get(id);
}

// Kleines Vorschaubild für die Seitenleiste: Ausschnitt von 0,8 × 0,8 m (Pfosten-Riegel größer, damit man das Raster sieht)
export function musterBild(id) {
  const muster = MUSTER[eintragZu(id).muster];
  const px = muster.pixelProMeter, groesse = muster.vorschau ?? 0.8;
  const start = muster.vorschau ? 0.4 : 0; // Pfosten-Riegel: Profilkreuz in der Mitte des Bildes
  const bild = document.createElement('canvas');
  bild.width = bild.height = 52;
  bild.getContext('2d').drawImage(kachel(id), start * px, start * px, groesse * px, groesse * px, 0, 0, 52, 52);
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
    const material = flaeche(art ? TOENUNG[art] : 0xffffff, {
      map: textur(id),
      ...(art ? { emissive: 0x1f3a68, emissiveIntensity: SCHIMMER[art] } : {}),
    });
    material.userData.materialID = id; // damit „realistisch“ das passende Gegenstück findet
    materialien.set(schluessel, material);
  }
  return materialien.get(schluessel);
}

// Schlichtes Material für die schmalen Dachkanten (ohne Muster), einmal je Dachmaterial
const kantenMaterialien = new Map();
export function dachKantenMaterial(id) {
  const eintrag = eintragZu(id);
  if (!kantenMaterialien.has(eintrag.id)) kantenMaterialien.set(eintrag.id, flaeche(eintrag.kante ?? abdunkeln(eintrag.farbe, 0.85)));
  return kantenMaterialien.get(eintrag.id);
}

// ---------- „realistisch“: Texturen und 3D-Materialien ----------

// Farb- und Reliefbild einer realistischen Kachel
function echtKachelZeichnen(eintrag) {
  const muster = ECHT[eintrag.muster];
  const neu = () => {
    const l = document.createElement('canvas');
    l.width = Math.round(muster.breite * muster.pixelProMeter);
    l.height = Math.round(muster.hoehe * muster.pixelProMeter);
    return l;
  };
  const farbbild = neu(), reliefbild = neu();
  const g = farbbild.getContext('2d', { willReadFrequently: true });
  const hg = reliefbild.getContext('2d');
  muster.zeichnen(stiftAnlegen(g, muster, eintrag.farbe, zufallszahlen(eintrag.id + ':echt'), hg));
  return { farbbild, reliefbild };
}

function alsTextur(bild, muster, farbig) {
  const t = new THREE.CanvasTexture(bild);
  if (farbig) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / muster.breite, 1 / muster.hoehe);
  t.anisotropy = 8;
  return t;
}

// 3D-Material „realistisch“ zum Fassadenmaterial `original` (aus fassadenMaterial()).
// Hervorhebung beim Überfahren/Auswählen (Tönung, Schimmer) wird übernommen.
const echtTexturen = new Map();
export function realistischesFassadenMaterial(original) {
  const eintrag = eintragZu(original.userData.materialID);
  const muster = ECHT[eintrag.muster];
  if (!echtTexturen.has(eintrag.id)) {
    const { farbbild, reliefbild } = echtKachelZeichnen(eintrag);
    echtTexturen.set(eintrag.id, { map: alsTextur(farbbild, muster, true), bump: alsTextur(reliefbild, muster, false) });
  }
  const { map, bump } = echtTexturen.get(eintrag.id);
  return new THREE.MeshStandardMaterial({
    map,
    bumpMap: bump,
    bumpScale: muster.relief ?? (muster.glas ? 0.3 : 1.5),
    roughness: muster.rau,
    metalness: muster.metall,
    envMapIntensity: muster.glas ? 1.4 : 0.6,
    color: original.color,
    emissive: original.emissive,
    emissiveIntensity: original.emissiveIntensity,
    side: original.side,
  });
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
function grau(wert) { const w = Math.round(Math.min(255, Math.max(0, wert))); return `rgb(${w},${w},${w})`; }
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
