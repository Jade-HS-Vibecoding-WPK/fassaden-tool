# Ziel
Fassaden-Tool: eine kleine Web-App für Architekturstudierende.
IFC-Modell hochladen → Fassadenmaterial und Fenstergrößen ausprobieren → Varianten speichern und vergleichen.
Entsteht in der Vibecoding KI-Werkstatt (Jade Hochschule, 16.–20.11.2026). Abgabe: GitHub-Repo mit README + Poster.

# Regeln
- Die Nutzerin studiert Architektur und kann nicht programmieren: jeden Schritt einfach erklären, auf Deutsch.
- Ein Feature pro Sitzung: nur die oberste offene Zeile aus dem Sitzungsplan in PLAN.md bauen, nicht mehr
  (Reihenfolge der Zeilen zählt, nicht die Nummer – Zeilen können auf Wunsch umgestellt sein).
  Wird ein zweites Feature gewünscht, auf eine neue Sitzung (`/clear`) hinweisen.
- Erst bauen, wenn die Nutzerin ausdrücklich „los“ sagt. Beim Planen keine Dateien außer PLAN.md/CLAUDE.md anlegen oder ändern.
- Ende jeder Sitzung: testen, Commit + Hochladen zu GitHub vorschlagen, Stand in PLAN.md festhalten (Sitzung abhaken, Probleme notieren)
  und die Nutzerin daran erinnern.
- Neue Regel oder Entscheidung → sofort hier bzw. in PLAN.md eintragen.
- Keine API-Keys, keine personenbezogenen Daten, keine Büro-/Kundendaten.
- `testdaten/` nicht auf GitHub hochladen (Beispiel-IFC von der Bundesingenieurkammer, Nutzungsbedingungen nicht geklärt) – steht in `.gitignore`.

# Technik
- Reine statische Webseite, läuft ohne Installation und auf GitHub Pages: `index.html`, `style.css`, `js/*.js`.
- Bibliotheken per CDN (Import-Map in `index.html`): three.js 0.160.0 (3D), web-ifc 0.0.57 (IFC lesen);
  jsPDF 2.5.2 (PDF) wird in `js/pdf.js` erst beim ersten Klick nachgeladen.
- Kein Node/npm auf dem Rechner. Lokal testen mit `python -m http.server 8000` (siehe `.claude/launch.json`).
- Git ist installiert und im Projekt eingerichtet (Zweig `main`). GitHub: https://github.com/Jade-HS-Vibecoding-WPK/fassaden-tool
  (öffentlich). Nach jedem Commit auch hochladen (`git push`), damit die Zwischenstände dort liegen.
- Code-Namen und Kommentare auf Deutsch.
- Nach Änderungen an einer JS-Datei die Versionsnummer an ihrem Import erhöhen (`?v=…` in `index.html` bzw. im
  `import` in `app.js`), sonst zeigt der Browser alte Fassungen (python-Server schickt keine Zwischenspeicher-Regeln).
  Wird eine Datei an mehreren Stellen importiert (z. B. `materialien.js` in `app.js` und `fassade.js`), überall
  dieselbe Nummer, sonst lädt der Browser sie doppelt.

# Aufbau
- `js/app.js` – Bedienoberfläche, Zustand, Varianten speichern/laden
- `js/szene.js` – 3D-Szene, Kamera, 5 Bilder aus fester Kamera (Perspektive + Ansichten N/O/S/W)
- `js/varianten.js` – Varianten im Browser-Speicher (IndexedDB, nicht localStorage: mehr Platz für die Bilder)
- `js/ifc.js` – IFC-Datei in 3D-Bauteile umwandeln (Wände, Fenster, Türen, Rest)
- `js/fassade.js` – Außenwände erkennen, Fassade mit Fensteröffnungen neu bauen, Flächen berechnen
- `js/darstellung.js` – Zeichenstil: Farben der Bauteile (Rohmodell, Dach, Fenster …) und Kantenlinien
- `js/materialien.js` – Fassadenmaterialien als selbst gezeichnete Texturen
- `js/realistisch.js` – Darstellung „realistisch“ (nur im 3D-Fenster): echte Materialien, Himmel, Spiegelung
- `js/sonne.js` – Sonnenstand aus Datum, deutscher Uhrzeit und Koordinaten (Schatten zeichnet `szene.js`)
- `js/pdf.js` – PDF-Übersichtsseite A3 quer (1–4 Varianten), direkt als Datei gespeichert

# Entscheidungen
- Kein Beispielhaus: Die App ist fürs Studium, man lädt immer den eigenen Entwurf als einfache IFC hoch.
- PDF-Export des Variantenvergleichs ist Must.
- Außenwand = IFC-Eigenschaft „IsExternal“ ist nicht „nein“ UND die Wand liegt am Gebäuderand (Sichtprüfung),
  weil Revit „IsExternal“ oft bei allen Wänden auf „ja“ setzt. Korrektur per Klick.
- Varianten gehören zur IFC-Datei (Dateiname + Anzahl Wände); die Liste zeigt nur die des geladenen Modells.
- Oberfläche schlank: nur zeigen, was schon funktioniert; jeder Bereich kommt in seiner Sitzung dazu.

# Gestaltung
- **Glassmorphism (gebaut in Sitzung 15b):** dunkler Farbverlauf, Kopf- und Seitenleiste aus Glas, fast weißes 3D-Fenster –
  Details in PLAN.md unter „Design-Vision“. Farben auf Glas über die Variablen in `.glas` (style.css), helle Flächen über `:root`.
- Seitenleiste zeigt nur den aktuellen Schritt (Außenwände · Fassade · Fenster · Varianten, Umschalten in der Kopfleiste).
- Ausnahme Akzentfarbe: Sonnenknopf und Uhrzeit-Regler der Sonne dürfen Sonnengelb (#f5b82e) haben (spielerisch, Wunsch der Nutzerin).
- Ein Hauptbutton pro Ansicht („Variante speichern“), Akzentfarbe bleibt Dunkelblau (#1f3a68).
- Kennwerte zurückhaltend zeigen, nicht groß oder zentral (Wunsch der Nutzerin, 17.11.).
- PDF und Variantenbilder bleiben weiß, der neue Look gilt nur für die Bedienoberfläche.
