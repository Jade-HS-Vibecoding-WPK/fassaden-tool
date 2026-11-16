# Ziel
Fassaden-Tool: eine kleine Web-App für Architekturstudierende.
IFC-Modell hochladen → Fassadenmaterial und Fenstergrößen ausprobieren → Varianten speichern und vergleichen.
Entsteht in der Vibecoding KI-Werkstatt (Jade Hochschule, 16.–20.11.2026). Abgabe: GitHub-Repo mit README + Poster.

# Regeln
- Die Nutzerin studiert Architektur und kann nicht programmieren: jeden Schritt einfach erklären, auf Deutsch.
- Ein Feature pro Sitzung: nur die nächste offene Nummer aus dem Sitzungsplan in PLAN.md bauen, nicht mehr.
  Wird ein zweites Feature gewünscht, auf eine neue Sitzung (`/clear`) hinweisen.
- Erst bauen, wenn die Nutzerin ausdrücklich „los“ sagt. Beim Planen keine Dateien außer PLAN.md/CLAUDE.md anlegen oder ändern.
- Ende jeder Sitzung: testen, Commit vorschlagen, Stand in PLAN.md festhalten (Sitzung abhaken, Probleme notieren)
  und die Nutzerin daran erinnern.
- Neue Regel oder Entscheidung → sofort hier bzw. in PLAN.md eintragen.
- Keine API-Keys, keine personenbezogenen Daten, keine Büro-/Kundendaten.
- `testdaten/` nicht auf GitHub hochladen (Lizenz der Beispiel-IFC unklar) – steht in `.gitignore`.

# Technik
- Reine statische Webseite, läuft ohne Installation und auf GitHub Pages: `index.html`, `style.css`, `js/*.js`.
- Bibliotheken per CDN (Import-Map in `index.html`): three.js 0.160.0 (3D), web-ifc 0.0.57 (IFC lesen).
- Kein Node/npm auf dem Rechner. Lokal testen mit `python -m http.server 8000` (siehe `.claude/launch.json`).
- Git ist installiert und im Projekt eingerichtet (Zweig `main`). Commits lokal, GitHub erst ab Donnerstag.
- Code-Namen und Kommentare auf Deutsch.

# Aufbau
- `js/app.js` – Bedienoberfläche, Zustand, Varianten (Browser-Speicher localStorage)
- `js/szene.js` – 3D-Szene, Kamera, Ansichten, Screenshot
- `js/ifc.js` – IFC-Datei in 3D-Bauteile umwandeln (Wände, Fenster, Türen, Rest)
- `js/fassade.js` – Außenwände erkennen, Fassade mit Fensteröffnungen neu bauen, Flächen berechnen
- `js/materialien.js` – Fassadenmaterialien als selbst gezeichnete Texturen

# Entscheidungen
- Kein Beispielhaus: Die App ist fürs Studium, man lädt immer den eigenen Entwurf als einfache IFC hoch.
- PDF-Export des Variantenvergleichs ist Must.

# Gestaltung
- Swiss Style: weiß, viel Weißraum, dünne Linien, eine Akzentfarbe (Dunkelblau).
- Ein Hauptbutton pro Ansicht („Variante speichern“).
