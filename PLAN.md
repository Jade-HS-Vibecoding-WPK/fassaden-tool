# Umsetzungsplan Fassaden-Tool

## Idee
Werkzeug fürs Architekturstudium: Den eigenen Entwurf als recht einfaches 3D-Modell als IFC
exportieren (z. B. aus Revit oder ArchiCAD), in der App hochladen, die Außenwände mit verschiedenen
Fassadenmaterialien belegen, Fenstergrößen ändern und daraus Varianten machen, die man
nebeneinander vergleicht und als PDF mitnimmt.

## Must (läuft spätestens Do 12 Uhr)
- [x] IFC-Datei des eigenen Entwurfs hochladen (Button oder Datei ins Fenster ziehen) und in 3D ansehen
- [x] Außenwände automatisch erkennen (IFC-Eigenschaft „IsExternal“ + Lage im Gebäude), per Klick korrigierbar
- [x] Norden = Plan-oben (keine Einstellung)
- [x] Material pro Himmelsrichtung (N/O/S/W): Klinker, Holz, Sichtbeton, Putz, Metall (je 1–2 Farbtöne); Glas seit 18.11. gestrichen, dafür Pfosten-Riegel
- [x] Fenster pro Himmelsrichtung: Breite und Höhe in % (Sturz bleibt, Brüstung wandert, 0 % = Fenster zu)
- [x] Kennwerte je Himmelsrichtung und gesamt: Fassadenfläche, Fensterfläche, Fensterflächenanteil
- [x] Darstellung mit klarem Unterschied zwischen Rohmodell und Entwurf:
      - Alles aus der IFC (Decken, Innenwände, nicht gestaltete Wände) hellgrau-weiß wie ein Arbeitsmodell
      - Dächer in einem festen, ruhigen Dunkelgrau mit Zeichenlinien (nicht weiß) – **seit Sitzung 17b wählbar, Start hellgrau**
      - Gestaltete Fassade „farbig + Zeichenlinien“: gedeckte, ruhige Materialfarben (nicht knallig), dunkle Kantenlinien
        und gezeichnete Struktur (Fugen, Bretter, Raster), wie eine kolorierte Architekturzeichnung –
        künstlerisch, nicht realistisch
- [x] Varianten speichern (Name + Bilder) und nebeneinander vergleichen;
      pro Variante automatisch 5 Bilder aus fester Kamera: Perspektive + Ansichten Nord/Ost/Süd/West
- [x] PDF-Übersichtsseite: bis zu 4 Varianten auf **A3 quer**, mit Perspektive + 4 Ansichten,
      Kennwerten (Materialien bewusst nicht, Wunsch der Nutzerin); im Kopf Standort (Nordpfeil gestrichen, s. Sitzung 10)
- [x] Für Kommiliton*innen: kurze Anleitung beim ersten Öffnen und Hinweise, wie man die IFC exportiert

## Should (wenn Must steht, Ziel Mittwoch) – in dieser Reihenfolge abarbeiten
**1. Feinjustierung**
- [x] 2. Schritt: einzelne Wand anklicken und anderes Material geben
- [x] 2. Schritt: einzelnes Fenster anklicken, Breite/Höhe in cm ändern

**2. Pfosten-Riegel**
- [x] Pfosten-Riegel-Fassade als eigenes Material für eine ganze Seite;
      Anzahl der Felder einstellbar (z. B. 8 breit × 3 hoch), Pfosten und Riegel werden gleichmäßig verteilt

**3. Sonne & Standort** (kommt erst nach 4a + 4b, Wunsch der Nutzerin 17.11.)
- [x] Sonnenstand und Schatten in 3D: Datum und Uhrzeit frei wählbar, Schnelltasten 21.3. / 21.6. / 21.12. (Sitzung 15)
- [x] Standort per Ortssuche (OpenStreetMap, Namensnennung in der App); Koordinaten gehen weiter auch von Hand (Sitzung 16)

**4. Darstellung & Extras**
- [x] Darstellung umschaltbar auf „realistisch“: Texturen mit Klinkerfugen, Holzmaserung, Glasspiegelung
- [x] Eigene Farbe pro Material (Farbtöne zum Anklicken, Sitzung 18)
- [x] PDF zusätzlich mit einer eigenen Seite pro Variante (Schalter „Einzelseiten je Variante“, Sitzung 19)

## Could (wenn Zeit bleibt)
- [ ] Zusätzlicher Kennwert: Fensterfläche / Grundfläche (z. B. Belichtung nach 1/8-Regel);
      braucht Räume (IfcSpace) oder Decken in der IFC, sonst zeigt die App „nicht berechenbar“
- [ ] Varianten als Arbeitsdatei sichern und später wieder laden (ein PDF kann die App nicht zurücklesen)
- [x] Sonnenverlauf als Animation über den Tag (Sitzung 19e)
- [ ] Grobe Kosten und CO₂ pro Variante
- [–] ~~Geänderte Fassade wieder als IFC speichern~~ (gestrichen 18.11., Wunsch der Nutzerin)

## Wie es technisch gelöst wird (einfach erklärt)
- **Webseite ohne Installation:** eine `index.html` mit Aussehen (`style.css`) und Logik (`js/`).
  Läuft im Browser und später kostenlos auf GitHub Pages.
- **3D-Ansicht:** Bibliothek three.js. **IFC lesen:** Bibliothek web-ifc. Beide werden aus dem Internet geladen.
- **Fassade:** Die App liest die Außenwände aus der IFC und baut sie als eigene „Scheiben“ nach.
  So kann sie Material und Fensterlöcher frei ändern und die Flächen genau ausrechnen.
- **Materialien:** werden als Muster im echten Maßstab gezeichnet (z. B. Klinker 24 × 7,1 cm).
- **Varianten:** werden im Browser-Speicher dieses Rechners abgelegt (IndexedDB, fasst auch die Bilder).
- **Gerät:** gebaut für Laptop/Desktop, nicht für Handy oder Tablet.
- **Nutzer*innen:** du und deine Kommiliton*innen, deshalb muss die App ohne Erklärung verständlich sein.
- **Fensterflächenanteil:** Fensterfläche ÷ Fassadenfläche der jeweiligen Seite (Rohbaumaße).

## Bekannte Grenzen (bewusst in Kauf genommen)
- Gebogene oder L-förmige Wände bleiben unverändert.
- Norden ist immer Plan-oben, der Nordpfeil aus der IFC wird nicht ausgewertet.
- Ohne IFC-Datei zeigt die App nichts an (kein Beispielhaus, bewusst so entschieden).

## Tipps für den IFC-Export aus dem Entwurf
- Außenwände als Wände modellieren (nicht als Volumen/Masse), Fenster und Türen als echte Bauteile.
- Außenwände als „extern“ markieren (IsExternal), dann erkennt die App sie sicher.
- Räume mit exportieren (IfcSpace), wenn der Kennwert Fenster/Grundfläche gebraucht wird.
- Einfach halten: eine Wand pro Seite und Geschoss reicht, Details stören eher.

## Speicherstände und GitHub
- Nach jedem fertigen Feature ein Commit (Speicherstand) und gleich danach hochladen zu GitHub.
- **Geändert (17.11.):** Zwischenstände sollen laut Werkstatt doch laufend auf GitHub liegen, nicht erst ab Donnerstag.
  Repo: https://github.com/Jade-HS-Vibecoding-WPK/fassaden-tool (öffentlich, MIT-Lizenz, README von GitHub).
  Erstes Hochladen am 17.11. nach Sitzung 8. GitHub Pages seit 18.11. an: https://jade-hs-vibecoding-wpk.github.io/fassaden-tool/
- `testdaten/` wird nicht hochgeladen (Beispiel-IFC stammt von der Bundesingenieurkammer, Nutzungsbedingungen nicht geklärt).

## Sitzungsplan (ein Feature pro Sitzung)
Ablauf jeder Sitzung: `/clear` → ein Feature bauen → testen → Commit + Hochladen → Stand hier in PLAN.md festhalten.
Erledigte Sitzungen abhaken, die oberste offene Zeile ist dran (die Nummern bleiben, auch wenn Zeilen umgestellt werden).

**Mo 16.11.**
- [x] 0. PLAN.md und CLAUDE.md fertig

**Di 17.11. – Grundgerüst**
- [x] 1. Git im Projekt einrichten und erster Commit (16.11.)
- [x] 2. IFC hochladen und in 3D ansehen (16.11.)
- [x] 3. Außenwände erkennen und per Klick korrigieren (16.11.)
- [x] 4. Darstellung: Rohmodell hellgrau-weiß, Dach dunkelgrau, Zeichenstil mit Kantenlinien (16.11.)
- [x] 5. Material pro Himmelsrichtung (16.11.)

**Mi 18.11. – Must fertig, dann Should 1 + 2**
- [x] 6. Fenster pro Himmelsrichtung (Breite/Höhe in %) (16.11.)
- [x] 6b. Material: Schalter „Alle Seiten gleich“ (Wunsch der Nutzerin, wie die Oberflächen-Überschreibung in ArchiCAD) (16.11.)
- [x] 6c. Fenster: Schalter „Alle Seiten gleich“ (wie 6b, Wunsch der Nutzerin) (16.11.)
- [x] 6d. Stützen: ein Material für alle Stützen (Wunsch der Nutzerin) (16.11.)
- [x] 7. Kennwerte (Fassadenfläche, Fensterfläche, Fensterflächenanteil) (16.11.)
- [x] 8. Varianten speichern, mit 5 Bildern (Perspektive + N/O/S/W) (16.11.)
- [x] 9. Variantenvergleich nebeneinander (17.11.)
- [x] 9b. Ansichten gerade auf die Fassade, auch wenn das Gebäude im Plan gedreht ist (Wunsch der Nutzerin) (17.11.)
- [x] 10. PDF-Übersichtsseite A3 quer (17.11.)
- [x] 10b. Perspektive: Blick weniger steil von oben, und selbst einstellbar (Wunsch der Nutzerin, 17.11.)
- [x] 10c. Seitenleiste ruhiger: Nebensächliches und Erklärtexte ausklappbar (Wunsch der Nutzerin, 17.11.)
- [x] 11. Kurze Anleitung beim ersten Öffnen + IFC-Export-Hinweise → **Must komplett** (17.11.)
- [x] 12. Should 1a: einzelne Wand → anderes Material (17.11.)
- [x] 13. Should 1b: einzelnes Fenster → Maße ändern (17.11.)
- [x] 14. Should 2: Pfosten-Riegel-Fassade (17.11.)

**Do 19.11. – bis 12 Uhr fertig**
- [x] 17. Should 4a: Umschalter „realistisch“ (umgestellt 17.11., Wunsch der Nutzerin) (17.11.)
- [x] 17b. Dachmaterial wählbar (Wunsch der Nutzerin 17.11.: dunkle Dächer stechen heraus) (17.11.)
- [x] 18. Should 4b: eigene Farbe pro Material (17.11.)
- [x] 18b. Zahl der Außenwände („89 von 192 Wänden sind Außenwände“) kleiner und weiter unten zeigen, z. B. bei „Bauteile ▸“
      in Bereich 1 (Wunsch der Nutzerin 17.11.: eher unwichtig, steht zu weit oben) (17.11.)
- [x] 15. Should 3a: Sonnenstand und Schatten (nach hinten gestellt, Wunsch der Nutzerin 17.11.) (17.11.)
- [x] 15b. Neues Design umsetzen (Glassmorphism, s. „Design-Vision“) – vorgezogen, Wunsch der Nutzerin 17.11.:
      „damit ich mir das Ganze besser vorstellen kann“; mit Ansichtsknöpfen 3D/N/O/S/W (17.11.)
- [x] 16. Should 3b: Standort per Ortssuche (17.11.)
- [x] 19. Should 4c: PDF-Einzelseiten (18.11.)
- [x] 19b. PDF auch in der Darstellung „realistisch“ (Wunsch der Nutzerin 18.11.) (18.11.)
- [x] 19c. Sonne startet mit heutigem Datum und aktueller Uhrzeit (Wunsch der Nutzerin 18.11.) (18.11.)
- [x] 19d. Weitere Zeichenstile neben „Zeichnung“: Aquarell und Bleistiftzeichnung (Wunsch der Nutzerin 18.11.) (18.11.)
- [x] 19e. Sonnenverlauf als Animation (Could, vorgezogen, Wunsch der Nutzerin 18.11.) (18.11.)
- [x] 20. Ab ca. 10:30: Test mit eigener IFC, Fehler beheben (18.11.)
      (18.11.: Nutzerin testet laufend mit eigenen Dateien, alles funktioniert; dabei kam 20b auf)
- [x] 20b. Licht hinter Pfosten-Riegel im Aquarell (Wunsch der Nutzerin 18.11.) (18.11.)
- [x] 20c. PDF maßstäblich und ohne Schrift (Wunsch der Nutzerin 18.11.) (18.11.)
- [x] 20d. Fehler: Varianten lassen sich nicht löschen (gemeldet 18.11.) (18.11.). Ursache vermutlich: „Löschen“ fragt mit einem
      Browser-Fenster (`confirm`) nach, das im App-Browser von Claude nicht erscheint und dann als „Nein“ zählt.
      Vorschlag: Nachfrage direkt im Knopf – 1. Klick macht „Wirklich löschen?“ (rot, ein paar Sekunden), 2. Klick löscht.
- [x] 20f. Ansichten ohne Schatten (Wunsch der Nutzerin 18.11., vor 20e gestellt) (18.11.): bisher waren in den Ansichten N/O/S/W
      immer 2 Seiten zu dunkel (Licht fest von Südost bzw. echte Sonne). Neu: für jede Ansicht Licht von vorne, leicht
      von links oben → alle 4 Fassaden gleich hell, keine Sonnenschatten.
      Perspektive bleibt wie sie ist (mit Sonne). Technisch: `lichtVonVorneSetzen` in `szene.js`, aufgerufen in `bilderAufnehmen`.
- [x] 20e. (18.11.) Beschriftung „Ansicht Nord“ statt „N“ (Wunsch der Nutzerin 18.11.): im PDF und im Variantenvergleich unter jeder
      Ansicht „Ansicht Nord / Nordost / Ost …“ – die Richtung, in die die Fassade wirklich zeigt, in 8 Stufen (nicht mehr „N (NNW)“).
      Genau dazwischen (z. B. NNW) → zur Hauptrichtung runden („Ansicht Nord“). Technisch: `ansichtKennzeichen` in `app.js`.
- [x] 20g. (18.11.) Schriftart im PDF „Artifakt Element Light“ (Wunsch der Nutzerin 18.11.) statt Helvetica – für Kennzeichen,
      Maßstab und Kennwerte-Tabelle. Technisch: jsPDF braucht die Schrift als TTF-Datei, die ins PDF eingebettet wird
      (`addFileToVFS` + `addFont` in `pdf.js`), sonst fehlen auch Umlaute. Vorher klären: Artifakt ist eine Schrift von
      Autodesk – darf die Datei in unser öffentliches GitHub-Repo und in PDFs eingebettet werden? Wenn nein: ähnliche freie Schrift.
      **Entschieden 18.11.:** Artifakt ist eine Firmenschrift (nicht frei) → stattdessen **Source Sans 3 Light** (Adobe,
      SIL Open Font License, darf ins Repo und ins PDF). Für Hervorhebungen eine kräftigere Stufe derselben Schrift.
      TTF-Dateien + Lizenz in eigenem Ordner im Projekt ablegen.
      **Gebaut:** `schriften/` (Light + Semibold + LICENSE.md), `pdf.js` lädt sie beim ersten PDF und bettet nur die
      benutzten Zeichen ein (PDF bleibt klein). Fehlt die Schrift, nimmt das PDF wie früher Helvetica.
      Getestet mit Test-Variante: alle Texte im PDF in Source Sans 3. Offen: Aussehen am echten PDF ansehen
      (im Browserfenster von Claude ließ sich das PDF nicht anzeigen).
- [x] 21. Auf GitHub hochladen und über GitHub Pages veröffentlichen (vor 20e gezogen, Wunsch der Nutzerin) (18.11.)
      Live-Demo: https://jade-hs-vibecoding-wpk.github.io/fassaden-tool/ (Pages aus Zweig `main`, Ordner `/`).
      Jeder `git push` auf `main` aktualisiert die Seite nach 1–2 Minuten von selbst. → **12 Uhr Freeze**
- [x] 23. Umgebung aus OpenStreetMap, nur in der Perspektive (Wunsch der Nutzerin 18.11., Variante A; vor 22 gezogen) (18.11.): Nachbarhäuser als
      schlichte helle Klötze (Höhe aus Geschosszahl/Höhe in OSM, sonst Standardwert), Straßen und Grünflächen als Flächen
      auf dem Boden. Ort kommt aus der Ortssuche (Sitzung 16).
      **Entscheidung (Wunsch der Nutzerin 18.11.):** eigener runder Knopf **„Umgebung“ direkt unter dem Sonnenknopf**
      (gleiche Form/Größe, nicht im Sonnen-Feld versteckt). An = Umgebung sichtbar, aus = wie bisher.
      **Entscheidung (Nutzerin 18.11.):** Verschieben kommt in dieser Sitzung mit: Regler Ost–West und Nord–Süd (Meter)
      in einem aufklappbaren Feld neben dem Umgebungsknopf (wie beim Sonnen-Feld); Drehung gibt es schon (Sitzung 20e).
      Nachbarhäuser, die das eigene Haus überdecken, werden ausgeblendet. Ohne gesuchten Ort: Oldenburg.
      Vorher klären/beachten:
      - Ansichten N/O/S/W bleiben ohne Nachbarn (sie würden die Fassade verdecken), nur Geländelinie wie bisher.
      - Daten per Overpass-API (OSM) – zweite Stelle, an der etwas das Gerät verlässt (nur der Ort/Umkreis) → Anleitung und
        CLAUDE.md anpassen; sparsam abfragen (einmal pro Ort, Ergebnis merken).
      - Namensnennung „© OpenStreetMap-Mitwirkende“ in der App sichtbar; im PDF als einzige Schrift-Ausnahme winzig,
        nur wenn Umgebung gezeigt wird.
      - Haus muss richtig auf dem Grundstück stehen: wahrscheinlich Verschieben + Drehen per Regler nötig
        (IFC-Modelle haben oft keine echte Lage) – evtl. eigene Sitzung davor.
      - Variante B (echte Geländehöhen, Hang) vorerst nicht: steht nicht in OSM, bräuchte zweite Datenquelle.
      **Gebaut:** neue Datei `js/umgebung.js`. Knopf mit zwei Häuschen unter der Sonne (an = Dunkelblau), Pfeil daneben
      klappt ein Feld auf: eigene Adresssuche (setzt denselben Ort wie die Suche bei der Sonne, genau statt auf 0,01° gerundet),
      Regler „Haus verschieben“ W–O und S–N (±100 m, 0,5-m-Schritte), Infozeile mit Anzahl Häuser und © OSM.
      Runde Modellplatte (150 m), Nachbarn hell mit grauen Kanten, Höhe = `height` bzw. Geschosse × 3 m + 1 m, sonst 6 m
      (Garage/Schuppen 3 m). Straßenbreite nach Art geschätzt (2–12 m). Grün und Wasser als Flächen. Alles am Plattenrand
      rund abgeschnitten. Nachbarhäuser unter dem eigenen Haus verschwinden (auch beim Verschieben).
      Im 3D-Fenster blenden N/O/S/W die Umgebung aus, Drehen/3D zeigt sie wieder. Gespeicherte Bilder: nur die Perspektive
      mit Umgebung. Varianten merken Ort + Verschiebung und stellen sie beim Laden wieder her. PDF: „Umgebung © OpenStreetMap-
      Mitwirkende“ in 6 pt links vom Maßstab, nur wenn eine Variante Umgebung hat. Anleitung + CLAUDE.md ergänzt.
      **Korrektur zum Plan:** Eine Drehung zum Einstellen gibt es nicht – die „Drehung“ aus 20e ist nur die automatische
      Erkennung für die Beschriftung der Ansichten. Norden bleibt Plan-oben (wie in den Export-Tipps); das Haus muss also
      genordet exportiert sein.
      Getestet (Test-ArchiCAD.ifc): mit Beispieldaten (37 Häuser, lange Straßen, Park) Zeichnung, Aquarell, Realistisch,
      mit Sonne, Verschieben, Ansicht S, Variante speichern (Perspektive mit, Ansichten ohne Umgebung), Laden stellt alles
      wieder her, PDF mit Vermerk. Testvariante wieder gelöscht. Keine neuen Fehler in der Konsole.
      **Probleme:** Die echten Overpass-Server waren beim Test fast die ganze Zeit überlastet („at capacity“, 502/504);
      nur kleine Abfragen kamen kurz durch. Die App fragt deshalb drei Server nacheinander (je höchstens 20 s, zwei Runden)
      und meldet sonst „überlastet … Knopf aus und wieder an“. **Mit echten Daten noch nicht gesehen – bitte später nochmal testen.**
      Nachbarn werfen noch keinen Schatten (nur das eigene Haus). In „Realistisch“ wirken Nachbarn auf der Schattenseite recht dunkel.
      Versionsnummern: `umgebung.js?v=4` (in `app.js` und `szene.js`), `szene.js?v=49`, `pdf.js?v=26h`, `app.js?v=53`, `style.css?v=30b`.
- [x] 23b. Umgebungs-Vorlagen statt nur OpenStreetMap (Wunsch der Nutzerin 18.11.: OSM lädt oft nicht, Server überlastet) (18.11.).
      Im Umgebungs-Feld eine Auswahl: **Städtisch · Ländlich · Wald · Wiese · Echter Ort (OpenStreetMap)**.
      Vorschlag (noch abzustimmen):
      - Vorlagen werden in der App selbst gebaut: kein Internet nötig, lädt sofort, nichts verlässt das Gerät.
      - Gleicher Stil wie bisher: runde Modellplatte, helle Klötze, schlichte Modellbäume (Kugel auf Stamm).
        Städtisch = Blockrand/Reihenhäuser 3–5 Geschosse an Straßen, Gehwege, Straßenbäume;
        Ländlich = wenige Einfamilienhäuser, Feldweg, Wiese, Baumgruppen; Wald = dichte Bäume mit Lichtung ums Haus;
        Wiese = grüne Platte mit ein paar Bäumen.
      - **Entscheidung (Nutzerin 18.11.):** Bei „Ländlich“ haben die Häuser teils Satteldächer (nicht nur flache Klötze),
        im gleichen hellen Modellstil.
      - Sieht jedes Mal gleich aus (feste Zufallszahlen); ums eigene Haus bleibt immer Platz.
      - „Haus verschieben“ und der OSM-Vermerk nur bei „Echter Ort“. Schlägt OSM fehl: Hinweis auf die Vorlagen.
      - Varianten speichern die Wahl; das PDF nennt OSM nur bei „Echter Ort“.
      - **Entscheidung (Nutzerin 18.11.):** Beim ersten Einschalten kommt **Ländlich**.
      **Gebaut:** `vorlageBauen` in `js/umgebung.js` (OSM-Teil dafür in gemeinsame Bausteine zerlegt: Platte, Nachbarhaus,
      runder Rand). Im Umgebungs-Feld 5 kleine Knöpfe (Städtisch · Ländlich · Wald · Wiese · Echter Ort); Adresse,
      „Haus verschieben“ und der © OSM-Vermerk nur bei „Echter Ort“. Beim ersten Einschalten klappt das Feld auf.
      Der freie Platz richtet sich nach der Größe des eigenen Hauses; Bäume als eine Sammelform (schnell, Wald ca. 1100 Bäume in 6 ms).
      - Städtisch: Straßenraster mit Gehwegen und Straßenbäumen, geschlossener Blockrand 3–5 Geschosse, grüne Höfe.
        **Änderung beim Bauen:** Das Haus steht an einer Straßenecke, gegenüber im Südosten ein kleiner Park –
        sonst verdeckten die hohen Nachbarn das Haus aus der üblichen Blickrichtung (Südost, 15° von oben).
      - Ländlich: geschwungene Dorfstraße, Feldweg, ca. 20 Häuser (ca. 2/3 mit Satteldach, teils giebelständig, Schuppen),
        Hof mit Scheune, Gartenbäume, Baumgruppen, beige Äcker.
      - Wald: dichter Wald mit Lichtung ums Haus, die sich nach Südosten zur Waldwiese öffnet (sonst sah man das Haus nicht),
        am Waldrand niedrigere Bäume, Waldweg nach Süden.
      - Wiese: grüne Platte, Feldweg, ca. 20 einzelne Bäume und eine Gruppe.
      Varianten speichern `umgebung: { art }` (bei „Echter Ort“ wie bisher mit Ort + Verschiebung); alte Varianten ohne Art
      gelten als „Echter Ort“. PDF nennt OSM nur bei „Echter Ort“. Anleitung (Datenschutz-Satz) ergänzt.
      Getestet (Test-ArchiCAD.ifc): alle 4 Vorlagen in Zeichnung, Wiese in Realistisch, Ländlich in Aquarell; Umschalten
      Vorlage ↔ Echter Ort (Felder und Vermerk erscheinen/verschwinden); Test-Variante mit „Ländlich“ gespeichert,
      auf Wald gewechselt, geladen → wieder Ländlich; Perspektivbild mit Umgebung; Test-Variante wieder gelöscht. Keine neuen Fehler.
      **Probleme/offen:** PDF mit Vorlage nicht eigens erzeugt (nur die Bedingung für den OSM-Vermerk geändert).
      Dreht man die Perspektive stark (z. B. von Norden), können Stadthäuser bzw. Waldbäume das Haus verdecken.
      In „Realistisch“ wirkt die Wiese eher grau (wie die Platte bei OSM). Echte OSM-Daten weiter ungetestet (Server überlastet).
      **Nachtrag Bäume (Wunsch der Nutzerin 18.11., nach Vorbild-Silhouetten „etwas baumiger“):** statt Kugel auf Stamm
      jetzt Kronen aus mehreren unregelmäßigen, kantigen Laub-Ballen, dickere Stämme, vier Wuchsformen
      (rund, oval, schlank, locker mit sichtbaren Ästen), jeder Baum zufällig gedreht. Mischung je Vorlage
      (Wald eher oval/schlank, Stadt eher oval). Krone etwas kräftiger grün. Wald weiterhin ca. 1100 Bäume in 5 ms.
      Das Vorbild-Bild selbst ist nicht in der App (nur als Anregung für die Formen).
      Versionsnummern: `umgebung.js?v=5f` (in `app.js` und `szene.js`), `szene.js?v=50f`, `pdf.js?v=27`, `app.js?v=54f`, `style.css?v=31`.
- [x] 23c. Dachmaterialien zusammenfassen (Wunsch der Nutzerin 18.11.) (18.11.): In der Dach-Auswahl stehen noch Farben im Namen
      (z. B. „Stehfalz grau“). Wie bei der Fassade nur noch je Material ein Eintrag („Stehfalz“, „Ziegel“ …),
      die Farbe kommt über die Farbtöne zum Anklicken.
      **Gebaut:** Dach-Auswahl jetzt Schlicht · Ziegel · Stehfalz · Gründach (`DACHMATERIALIEN` in `materialien.js`).
      Ziegel startet rot, Stehfalz hellgrau; der Ton steht immer im Namen („Dach: Ziegel · anthrazit“).
      „Ziegel anthrazit“ und „Stehfalz anthrazit“ stehen in `ALTE_KENNUNGEN` → alte Varianten werden beim Laden zu
      Ziegel/Stehfalz + anthrazit (auch ein dort eigens gewählter Ton bleibt erhalten, `alteKennungenUmstellen` in `app.js`).
      Getestet (Test-ArchiCAD.ifc): Auswahl zeigt die 4 Einträge, Ziegel → Farbtöne rot/anthrazit/braun/schwarz engobiert;
      künstlich „alte“ Test-Variante mit Ziegel anthrazit geladen → Ziegel + anthrazit, Dach im 3D richtig. Test-Variante gelöscht.
      Keine neuen Fehler. Probleme: keine.
      Versionsnummern: `materialien.js?v=26` (in `app.js`, `fassade.js`, `realistisch.js`), `fassade.js?v=26`, `realistisch.js?v=26`,
      `szene.js?v=51`, `app.js?v=55`.
- [x] 23d. „Außenwände“ aus der Kopfleiste nehmen (Wunsch der Nutzerin 18.11.) (18.11.): Ein eigener Reiter wirkt, als könne man
      dort etwas gestalten. Stattdessen beim Dateinamen oben ein kleiner Pfeil zum Aufklappen.
      **Gebaut:** Kopfleiste nur noch Fassade · Fenster · Varianten. Dateiname-Pille mit Pfeil ▾ klappt links den Bereich
      „Modell“ auf (Außenwände prüfen, „Andere IFC-Datei laden“, Bauteile); dann ist kein Reiter markiert, Pfeil ▴, Pille hell.
      Zweiter Klick auf den Pfeil → zurück zum letzten Reiter. Neu: Klick auf den Dateinamen öffnet nicht mehr direkt die
      Dateiauswahl (kein versehentliches Neuladen). Vor dem Laden unverändert („IFC-Datei wählen“). Anleitung Schritt 2 ergänzt.
      Nur der Name wird bei schmalem Fenster gekürzt, der Pfeil bleibt sichtbar.
      Getestet (Test-ArchiCAD.ifc): 3 Reiter, Start auf Fassade, Pfeil auf/zu, zurück zu Fenster, keine neuen Fehler.
      Probleme: keine. Versionsnummern: `app.js?v=57`, `style.css?v=33`.
- [x] 23e. Einzelnes Fenster zurücksetzen (Wunsch der Nutzerin 18.11.) (18.11.): Bei „Einzelne Fenster“ das angewählte Fenster
      wieder auf 100 % (Maße aus der IFC) stellen können.
      **Gebaut:** Neben „wie die Seite“ der Knopf „wie in der IFC“: setzt jedes gewählte Fenster auf seine eigene Größe
      aus der IFC (als eigenes Maß in cm, gilt also auch, wenn die Seite z. B. auf 50 % steht; wird mit der Variante
      gespeichert). Knopf nur sichtbar, wenn ein gewähltes Fenster gerade nicht seine IFC-Größe hat (`ifcMass`, `nichtWieIfc` in `app.js`).
      Getestet (Test-ArchiCAD.ifc): Breite 60 cm → Knopf erscheint; Seiten auf 50 % → Fenster 50 × 50 cm, „wie in der IFC“ →
      100 × 100 cm, Knopf verschwindet. Keine neuen Fehler. Probleme: keine.
      Versionsnummern: `app.js?v=58`, `style.css?v=34`.
- [x] 23f. PDF-Blattgröße wählbar (Wunsch der Nutzerin 18.11.) (18.11.): A4, A3, A2, A1, A0 (bisher fest A3 quer).
      **Gebaut:** Unter „Varianten“ neben „Maßstab“ die Auswahl „Blattgröße“ (Start A3). Entscheidung: immer quer (kein Hochformat).
      Ansichten bleiben maßstäblich, nur die Perspektive wächst mit dem Blatt; Einzelseiten bekommen dieselbe Größe.
      Passt es nicht, schlägt die Meldung den nächsten gröberen Maßstab und das kleinste größere Blatt vor, auf das es passt
      (`BLATTGROESSEN`, `passt` in `pdf.js`). Anleitung Schritt 4 angepasst.
      Getestet (3 alte Test-Varianten, direkt über `pdfErstellen`, ohne Speichern): Seitengrößen A4–A0 stimmen, alle Bilder
      innerhalb 15 mm Rand; 3 Varianten 1:100 auf A3 → „Bitte 1:200 oder das Blatt A2 wählen“. Keine neuen Fehler.
      Probleme: Das PDF selbst ließ sich im eingebauten Browser nicht ansehen – bitte einmal echt speichern und anschauen.
      Auf A0/A1 kann die Perspektive etwas unscharf wirken (Bild hat feste Pixelzahl).
      Versionsnummern: `pdf.js?v=28`, `app.js?v=59`.
- [x] 23i. PDF-Inhalt wählbar (Wunsch der Nutzerin 18.11., vor 23g gestellt) (18.11.): einzelne Varianten für sich speichern,
      auch nur Ansichten oder nur Perspektive. Soll übersichtlich bleiben, der Vergleich eher als zweite Möglichkeit.
      **Gebaut wie vorgeschlagen (Nutzerin: „Los, so bauen“):** Der Schalter „Einzelseiten je Variante“ ist weg. Neu unter „Blattgröße“:
      - „Seiten“ (erst ab 2 angekreuzten Varianten): Je Variante (Start) · Vergleich · Beides. Die Texte sind kurz, weil
        die Seitenleiste schmal ist; die lange Erklärung steht im Tooltip.
      - „Bilder“: Alle (Perspektive + Ansichten, Start) · Nur Ansichten · Nur Perspektive. Bei „Nur Perspektive“ ist „Maßstab“ grau,
        und auf dem Blatt steht kein „Ansichten M 1:…“. Bei „Nur Ansichten“ fehlt auch der OSM-Vermerk (Umgebung ist nur in der Perspektive).
      - Immer eine einzige PDF-Datei. Kennwerte: bei „Je Variante“ auf jeder Seite, bei „Vergleich“/„Beides“ nur auf der Vergleichsseite (wie bisher).
      - Dateiname: „Fassadenvariante_…“ (1 Variante), „Fassadenvarianten_…“ (je Variante), „Variantenvergleich_…“ (Vergleich/Beides).
      - Der Knopf „Als PDF speichern“ im Vergleichsfenster nimmt dieselben Einstellungen aus der Seitenleiste.
      Code: `pdfErstellen` hat statt `einzelseiten` jetzt `seiten` und `bildwahl`; `spalteAnordnen` kennt die 3 Bildwahlen.
      Getestet (3 alte Test-Varianten direkt über `pdfErstellen`, ohne Speichern): alle Kombinationen A4/A3, 1 und 3 Varianten,
      mit/ohne Kennwerte – Seitenzahl stimmt (z. B. 3 Varianten „Beides“ = 4 Seiten), kein Bild über dem 15-mm-Rand, keine Überlappung;
      passt es nicht, kommt wie bisher der Vorschlag (Maßstab oder Blatt). Seitenleiste angesehen, Maßstab graut aus. Keine neuen Fehler.
      Probleme: Das PDF selbst ließ sich im eingebauten Browser wieder nicht ansehen – bitte einmal echt speichern und anschauen.
      Versionsnummern: `pdf.js?v=29`, `app.js?v=60`, `style.css?v=35c`.
- [x] 23j. Höhere Auflösung der Bilder im PDF (Wunsch der Nutzerin 18.11., nach 23i): „Variante speichern“ macht die
      5 Bilder jetzt 3000 × 2000 Pixel als JPEG 92 % (vorher 1500 × 1000, 85 %; `bilderAufnehmen` in `szene.js`).
      - Aquarell und Bleistift brauchten nichts: `stile.js` rechnet Pinsel/Striche schon relativ zur Bildhöhe.
      - Kantenlinien bleiben 1 Pixel dick, wirken im PDF also feiner (wie geplottet). Falls zu blass: später kräftiger machen.
      - Getestet (Test-Neu.ifc): Zeichnung + Aquarell gespeichert, alle 5 Bilder 3000 × 2000, zusammen ca. 1,7 MB je Variante;
        Speichern weiterhin ca. 1–2 s. PDF A1 „beides“ mit 2 Varianten: 3 Seiten, 3,4 MB, unter 1 s, keine Fehler.
      - Schon gespeicherte Varianten bleiben unscharf, bis man sie lädt und neu speichert.
      Probleme: Das PDF wurde nur im Browser erzeugt, nicht angesehen – bitte einmal echt speichern und auf A1/A0 anschauen.
      Versionsnummern: `szene.js?v=52`, `app.js?v=61`.
- [x] 23g. Neuer Darstellungsstil „Marker“ (Wunsch der Nutzerin 18.11., abgestimmt: erst Marker, dann Collage 23k):
      Aussehen wie eine schnelle Entwurfsskizze mit Copic-Markern.
      - Kräftige, aber wenige Farbflächen (Farben vereinfacht, in Stufen); sichtbare, parallele Markerstriche
        mit etwas dunkleren Überlappungen, wo zwei Striche übereinander liegen.
      - Striche malen manchmal leicht über den Umriss hinaus oder lassen weiße Lücken (locker aus der Hand).
      - Schatten = zweite Lage desselben Markers (dunkler), schwarze Fineliner-Kanten darüber.
      - Hintergrund: weißes Papier, nur ein paar lockere Striche Himmel (blau) und Wiese (grün) ums Haus.
      - Gilt im 3D-Fenster, in den gespeicherten Bildern und im PDF. Neuer Knopf „Marker“ neben Bleistift.
      Code: dritter Stil im vorhandenen Übermal-Programm in `js/stile.js` (wie Aquarell/Bleistift), Vermerk „· Marker“.
      Gebaut (18.11.): `marker()` in `stile.js` – Fläche weich gemittelt (keine einzelnen Ziegel), Farben kräftiger und
      in Stufen, Tinte durchscheinend (eine Lage hell, Überlappung dunkler). Schatten = was deutlich dunkler ist als ringsum.
      Glas im Marker kräftig blau (`szene.js`). Erster Versuch war zu dunkel (Klinker fast schwarzrot) → Tinte aufgehellt.
      Getestet mit Test-Neu.ifc (Klinker), ohne und mit Sonne: keine Fehler.
      Probleme: Varianten-Bilder und PDF im Marker-Stil nicht extra getestet (gleicher Weg wie Aquarell/Bleistift) –
      bitte einmal eine Variante speichern und anschauen. Schattenseite ohne Sonne bekommt keine 2. Lage.
      Überarbeitet (Wunsch der Nutzerin, gleiche Sitzung): keine weißen Lücken und keine einzelnen dunklen Striche mehr,
      statt feiner Parallelschraffur breite, weiche, geschwungene Bahnen (ca. 42 px), Überlappung nur sanft.
      Lockerer: Farbe stärker gegen die Linien verschoben, Linien wackeln leicht. Umrisse dünner und grau statt schwarz.
      Farbstufen entfernt (machten helle Flecken im Klinker). Getestet mit Test-Neu.ifc, keine Fehler.
      2. Überarbeitung (Nutzerin: „zu schwammig und verwischt“, Bahnen wirkten noch wie Parallelschraffur,
      Umrisse etwas stärker): weniger weichgezeichnet (1,5 statt 4 px) und weniger Versatz (24 statt 40 px);
      keine Bahnen in festem Abstand mehr, sondern lang gezogenes Rauschen = unregelmäßige Strichspuren;
      Umrisse etwas dicker und dunkler (dunkelgrau, nicht schwarz). Getestet, keine Fehler.
      3. Schlagschatten (Wunsch der Nutzerin): Der Schatten des Hauses auf dem Boden ist jetzt mit grauem Marker
      dunkel gefüllt (mit Strichspuren) und hat keinen Umriss mehr. Vorher war er nur als Linie zu sehen, weil er ohne
      Gelände in der IFC auf dem „Hintergrund“ liegt. Auf Boden und Hintergrund zeichnet der Marker nur noch echte
      Umrisse (Tiefensprung, `markerUmriss`), keine Helligkeitssprünge. Getestet mit Sonne, keine Fehler.
      Versionsnummern: `stile.js?v=20`, `szene.js?v=53f`, `app.js?v=62f`.
- [x] 23k. Neuer Darstellungsstil „Collage“ – Zeitungs-Collage (Wunsch der Nutzerin 18.11.):
      - Flächen wie aus Zeitschriften ausgerissen: Rasterpunkte (wie im Druck), ausgefranste weiße Reißkanten,
        Stücke leicht verdreht/versetzt, kleiner Schatten darunter. Ab und zu ein Streifen Klebeband.
      - Himmel und Wiese als große ausgerissene Papierstücke, Fenster eher dunkel und glänzend.
      - Keine echten Fotos aus dem Internet (Rechte, Repo öffentlich): Alles wird im Programm selbst gezeichnet.
      Code: vierter Stil in `js/stile.js`, Knopf „Collage“, Vermerk „· Collage“.
      Gebaut (18.11.): `collage()` in `stile.js`. Ebenen: weißes Papier · Himmel-Rechteck · Wiesen-Streifen ·
      Haus · Klebeband. (Erst:) Das Haus ist in große, unregelmäßige Stücke geteilt (ca. 420 px), jedes leicht verdreht/versetzt,
      eigener Rasterwinkel und Farbton („aus einer anderen Zeitschrift“). Wo ein Stück über dem Nachbarn liegt:
      weißer Reißrand und kleiner Schatten. Um das ganze Haus ein weißer Reißrand mit Schatten. Schlagschatten der Sonne =
      Stück graues Rasterpapier. Fenster dunkelblau (`szene.js`) → im Bild sattes Hochglanz mit schrägen Lichtstreifen.
      Klebeband nur dort, wo ein Ende auf dem Haus und eins daneben liegt. Kanten des Modells fein grau nachgezogen.
      Erster Versuch: Stücke zu klein (260 px), sah aus wie zersprungenes Glas → größer, weiße Risse unregelmäßig schmal.
      Getestet mit Test-Neu.ifc, ohne und mit Sonne; Variante gespeichert (Bilder 3000 × 2000), keine Fehler.
      Probleme: Himmel und Wiese sind feste Rechtecke im Bild (nicht am Haus ausgerichtet) – bei sehr hohem/flachem
      Haus evtl. unpassend. PDF im Collage-Stil nicht extra angesehen. Beim Testen 2 Varianten (3 und 4, 15:07)
      doppelt gespeichert – kann die Nutzerin löschen.
      Überarbeitet (Wunsch der Nutzerin, gleiche Sitzung): weniger Stücke (ca. 600 px) und weniger verdreht (bis ca. 1°,
      Versatz 8 statt 14 px); weiße Risse feiner; Rasterpunkte kleiner und mit weniger Unterschied Papier/Tinte
      (weniger auffällig); Himmel blasser blau; Kanten kräftiger. Fenster unverändert. Getestet, keine Fehler.
      2. Überarbeitung (Wunsch der Nutzerin): keine Risse mehr auf dem Haus – das Haus ist ein ganzes Stück
      (nur noch Reißrand und Schatten am Umriss). Die Risse liegen jetzt ums Haus herum und laufen waagerecht:
      Himmel und Wiese aus je 2 waagerechten Papierstreifen (Funktion `streifen`). Getestet, keine Fehler.
      3. Überarbeitung (Wunsch der Nutzerin): unten mehr Risse, nicht ganz waagerecht, wilder – Wiese aus 3 Streifen,
      schräger gelegt (bis ca. 3,5°), Ränder mit großen Bögen (`reissenWild`); zwischen den Streifen blitzt stellenweise
      weißes Papier durch. Himmel unverändert. Getestet, keine Fehler.
      Tagesverlauf (Nutzerin: „Sonnenanimation funktioniert bei Marker und Collage nicht“ – lief zwar, aber ohne
      Abend/Nacht): Marker und Collage haben jetzt Abend und Nacht wie das Aquarell. Himmel abends lila/orange, nachts
      dunkelblau, Wiese dunkler, Fenster leuchten nach und nach (gleiche Regeln wie Aquarell, `mitStimmung` in
      `szene.js`, `himmelStimmung`/`wieseStimmung` in `stile.js`). Marker legt abends/nachts mehr Hintergrund an.
      Bleistift bleibt ohne Stimmung. Getestet: Collage 16:45 und 21:00, Marker nachts – keine Fehler.
      Versionsnummern: `stile.js?v=22`, `szene.js?v=55`, `app.js?v=64`.
- [x] 23h. Haus mit der Maus verschieben (Wunsch der Nutzerin 18.11.): Haus als Ganzes anklicken und auf der
      Umgebungs-Platte ziehen, statt über die Regler „Haus verschieben“. Soll auch bei den Vorlagen gehen
      (bisher steht das Haus dort fest in der Mitte).
      Vorschlag (noch abzustimmen):
      - Nur wenn die Umgebung an ist und man in der Perspektive ist. Kurzer Klick bleibt wie bisher
        (Wand/Fenster wählen), erst Gedrückthalten + Ziehen verschiebt das Haus; die Kamera dreht dabei nicht mit.
      - Wie bisher wandert in Wahrheit die Umgebung (Ansichten und Maße bleiben unberührt), Norden bleibt Plan-oben.
      - Vorlagen: Verschieben innerhalb der Platte; Nachbarhäuser/Bäume unter dem Haus verschwinden
        (bei den Vorlagen heißt das: Platz ums Haus nicht mehr fest eingeplant).
      - Regler bei „Echter Ort“ bleiben zum Feinjustieren; Varianten merken die Lage auch bei Vorlagen.
      Gebaut (18.11.): In der Perspektive mit Umgebung: Maus auf dem Haus ca. ½ s still gedrückt halten (Zeiger wird
      zur greifenden Hand), dann ziehen. Gleich ziehen dreht wie immer die Kamera – erster Versuch ohne Halten ging nicht:
      Nach „3D“ füllt das Haus fast das Bild, dann konnte man kaum noch drehen. Kurzer Klick bleibt Klick.
      Die Kamera wandert beim Ziehen mit der Umgebung mit, so bleibt die Umgebung im Bild stehen und das Haus geht mit
      der Maus. Grenze: 100 m von der Mitte der Platte. Jede Umgebungsart hat ihre eigene Lage; neue IFC = Vorlagen
      wieder Mitte (dort ist Platz eingeplant), neuer Ort = Mitte. Unter dem Haus verschwinden Nachbarhäuser und jetzt
      auch Bäume (`hausFreistellen` in `umgebung.js`). Varianten speichern die Lage auch bei Vorlagen.
      Hinweis in der Legende unten und im Umgebungsfeld.
      Getestet mit Test-Neu.ifc: Ländlich (schnell ziehen dreht, Halten + Ziehen verschiebt, Nachbar unter dem Haus
      verschwindet, alter Platz kommt wieder), Wald (Bäume unter dem Haus weg). Keine Fehler.
      Probleme: Nach dem Ziehen dreht die Kamera um die alte Stelle, nicht ums Haus – Knopf „3D“ holt das Haus
      wieder in die Mitte. „Echter Ort“ (OSM) und Speichern/Laden einer Variante mit verschobenem Haus nicht extra
      getestet – bitte einmal ausprobieren.
      Versionsnummern: `szene.js?v=56c`, `umgebung.js?v=6`, `app.js?v=65c`.
- [–] 23l. ~~Variante wieder als IFC speichern~~ – **gestrichen (18.11., Wunsch der Nutzerin)**.
      War schon gebaut und getestet (Knopf „Als IFC speichern“, `js/ifcexport.js`), die Nutzerin will den
      Rückweg nach Archicad dann doch nicht. Alles wieder entfernt, nichts davon committet.
- [ ] 22. Nachmittag: README (Poster macht die Nutzerin selbst nach Moodle-Vorlage)

**Fr 20.11.** – Polieren & präsentieren, Abgabe bis 16 Uhr

Wenn es eng wird, zuerst streichen: 19d (Aquarell/Bleistift), dann 19c (Sonne mit aktueller Uhrzeit).
Was bis Do 10:30 nicht fertig ist, wandert zu Could.

## Stand (18.11.2026, nach Sitzung 20b)
- CLAUDE.md und PLAN.md angelegt, Plan mit der Nutzerin abgestimmt.
- Test-IFC liegt in `testdaten/` (Einfamilienhaus, Revit 2023, IFC2x3: 192 Wände, 57 Fenster, 49 Türen).
  Quelle: Bundesingenieurkammer, Seite „BIM-Praxisbeispiele“ (Download zum Betrachten angeboten).
  Weder in der Datei noch auf der Seite steht eine Erlaubnis zum Weiterverbreiten. Deshalb nicht hochladen;
  wer es doch will, fragt vorher bei der Kammer (info@bingk.de) nach.
- Git ist im Projekt eingerichtet (Zweig `main`, Name Paulina Awick, Uni-E-Mail, nur für dieses Projekt hinterlegt).
- `.gitignore` schließt `testdaten/` aus. Erster Commit gemacht (Sitzung 1).
- Sitzung 2 (16.11.): IFC hochladen (Knopf oder ins Fenster ziehen) und in 3D ansehen läuft.
  Test-IFC lädt in ca. 5 s: 192 Wände, 57 Fenster, 49 Türen, 316 weitere Bauteile. Drehen/Zoomen/Verschieben geht,
  falsche Dateien (z. B. .pdf) bekommen eine verständliche Meldung.
- Früher Entwurf verschlankt: Oberfläche zeigt nur, was schon funktioniert; weitere Bereiche kommen in ihrer Sitzung dazu.
  Akzentfarbe jetzt Dunkelblau (#1f3a68). Name der App: „Fassaden-Tool“.
- Bauteile sind schon nach Art sortiert (Wand/Fenster/Tür/Rest), vorläufig nur grau eingefärbt.
- Lokaler Testserver: `.claude/launch.json` (python -m http.server 8000).
- Sitzung 3 (16.11.): Außenwände werden erkannt und blau markiert, Klick auf eine Wand schaltet außen ↔ innen,
  „Erkennung zurücksetzen“ macht alle Klicks rückgängig. Neue Datei `js/fassade.js`.
  **Entscheidung:** In der Test-IFC stehen 191 von 192 Wänden auf „IsExternal = ja“, sogar „Innenwand 13 cm“.
  Deshalb zählt eine Wand nur als Außenwand, wenn (1) die IFC nicht „nein“ sagt und (2) auf einer Seite keine
  andere Wand mehr kommt (waagerechte Sichtprüfung von 6 Punkten der Wand aus).
  Ergebnis Test-IFC: 92 von 192 Wänden außen, Erkennung dauert unter 0,1 s.
- Sitzung 4 (16.11.): Zeichenstil. Neue Datei `js/darstellung.js` mit allen Farben und den Kantenlinien.
  Rohmodell hellgrau-weiß (#eeeeec), Dach dunkelgrau (#5f6266), Fenster hellblau-grau halb durchsichtig,
  Türen hellgrau, Kantenlinien an allen Bauteilen (nur echte Kanten ab 30° Knick).
  **Entscheidung:** Linien als Mittelding: grau (#727272), leicht durchscheinend, nicht fast schwarz.
  Außenwände vorläufig in ruhigerem Blau (#5b7db3), bis in Sitzung 5 die Materialien kommen.
  Dach = IfcRoof, Decke mit Typ „Dach“ (IfcSlab ROOF) oder Decke, die zu einem IfcRoof gehört. Test-IFC: 14 Dachteile.
  Gelände = IfcSite (hell, ohne Linien). Die Kamera richtet sich jetzt auf Wände und Dach aus, nicht aufs ganze Gelände.
- Sitzung 5 (16.11.): Material pro Himmelsrichtung. Neuer Bereich „3 Fassade“: je Seite (Nord/Ost/Süd/West)
  eine Auswahlliste mit Musterbild und Anzahl der Wände. Neue Datei `js/materialien.js`.
  10 Materialien: Klinker rot/anthrazit, Holz natur/vergraut, Sichtbeton, Putz altweiß/sand,
  Fassadenplatten anthrazit/silbergrau, Glas blaugrau. Start: überall Klinker rot.
  Muster im echten Maßstab gezeichnet (Klinker 24 × 7,1 cm, Bretter 12 cm, Schaltafeln 2,50 × 0,50 m,
  Fassadenplatten 1,25 × 0,625 m, Glasfelder 1,25 × 1,50 m), Fugen etwas dunkler als die Grundfarbe.
  Nach Rückmeldung überarbeitet: Kacheln mehrere Meter groß (Klinker 4 × 2,5 m), damit sich nichts sichtbar wiederholt;
  Holz weniger gelb, Klinker rot ohne Braunstich, Klinker anthrazit heller,
  Sichtbeton ohne Ankerlöcher, „Metall“ heißt jetzt „Fassadenplatten“ (Fugenraster statt Stehfalz).
  Himmelsrichtung = Richtung der freien Außenseite der Wand, auf die nächste der 4 Richtungen gerundet (Norden = -Z = Plan-oben).
  Test-IFC: Nord 13, Ost 29, Süd 14, West 36 Außenwände. Hover zeigt einen blauen Schimmer, Klick schaltet weiter außen ↔ innen.
- Sitzung 6 (16.11.): Fenster pro Himmelsrichtung. Neuer Bereich „4 Fenster“: je Seite Regler Breite und Höhe (0–200 %, 5er-Schritte),
  Anzahl der Fenster je Seite, Textknopf „Alle Fenster auf 100 %“.
  So funktioniert es: Fenster und Türen werden ihren Wänden zugeordnet (auch beiden Schalen einer mehrschaligen Wand).
  Sobald ein Fenster nicht mehr 100 % hat, baut die App jede betroffene Wand als eigene Scheibe nach
  (Umriss der beiden Wandseiten aus der IFC, auch Giebel und schräge Ecken) und schneidet die Löcher neu aus.
  Die Original-Wand wird so lange ausgeblendet. Bei 100 % überall sieht man wieder die unveränderte IFC.
  Das Fenster wird neu gezeichnet (Rahmen + Glas, ohne Sprossen, siehe Entscheidung unten). Beim Vergrößern: 10 cm Abstand zu Wandrand
  und Nachbaröffnungen, zwei wachsende Nachbarfenster teilen sich die Lücke; sitzt ein Fenster schon in der IFC
  näher am Rand, gilt dieser Abstand. Kleiner als 100 % geht immer, 0 % = Fenster weg, Wand geschlossen.
  Neu bauen dauert ca. 80 ms, die Regler reagieren also fast sofort.
  **Änderung an der Wanderkennung:** Die Richtung einer Wand kommt jetzt aus ihren großen Seitenflächen statt aus der
  Streuung der Eckpunkte (die war bei Wänden mit vielen Fenstern leicht schief). Test-IFC jetzt 89 statt 92 Außenwände:
  Nord 14, Ost 29, Süd 11, West 35.
  Test-IFC: 54 von 57 Fenstern verstellbar (Nord 10, Ost 14, Süd 12, West 18). 3 Fenster sitzen in keiner Wand
  (vermutlich Dachfenster/Gauben). 87 von 89 Außenwänden lassen sich nachbauen.
  **Nachbesserung nach Test mit eigener ArchiCAD-IFC** (IFC4, 14 Wände, 4 Fenster; Kopie als `testdaten/Test-ArchiCAD.ifc`):
  Vorher war dort kein Fenster verstellbar. Gründe: (1) Wandrichtung durch schräge Flächen und Laibungsstufen um 2–3° verdreht,
  (2) ArchiCAD baut Laibungen mit vielen Stufen/Anschlägen, die App hielt die Wände deshalb für unregelmäßig.
  Jetzt: Richtung = die Richtung mit der meisten senkrechten Fläche (±2°); „regelmäßig“ = mindestens die Hälfte der Fläche
  liegt auf Vorder- oder Rückseite. Ergebnis: alle 4 Außenwände (36 cm) nachbaubar, alle 4 Fenster verstellbar.

- Sitzung 6b (16.11.): Schalter „Alle Seiten gleich“ im Bereich „3 Fassade“. An: nur eine Zeile „Alle“
  (mit Gesamtzahl der Außenwände), ihr Material gilt für Nord/Ost/Süd/West. Aus: wieder die vier Zeilen,
  die Auswahl je Seite bleibt im Hintergrund erhalten. „Alle“ startet beim ersten Einschalten mit dem Material
  der Nordseite und merkt sich danach die eigene Auswahl. Getestet mit `Test-ArchiCAD.ifc`: an/aus/wieder an
  stellt jeweils die richtige Auswahl her, 3D-Wände wechseln sofort, keine Fehler. Nur `app.js`, `index.html`, `style.css` geändert.
  Problem: keines. Auch der Schalter geht beim Neuladen verloren (gespeichert wird mit den Varianten, Sitzung 8).

- Sitzung 6c (16.11.): Schalter „Alle Seiten gleich“ auch im Bereich „4 Fenster“. An: nur eine Zeile „Alle“
  (mit Gesamtzahl der Fenster) und Reglern Breite/Höhe, gilt für Nord/Ost/Süd/West. Aus: wieder die vier Zeilen,
  die Werte je Seite bleiben im Hintergrund erhalten. „Alle“ startet beim ersten Einschalten mit den Werten der Nordseite
  und merkt sich danach die eigenen. „Alle Fenster auf 100 %“ setzt auch „Alle“ zurück.
  Material- und Fenster-Schalter sind unabhängig voneinander. Getestet mit `Test-ArchiCAD.ifc`: an/aus/wieder an,
  3D-Fenster ändern sich sofort, Zurücksetzen klappt, keine Fehler. Nur `app.js` und `index.html` geändert.
  Problem: keines. Auch dieser Schalter geht beim Neuladen verloren (gespeichert wird mit den Varianten, Sitzung 8).

- Sitzung 6d (16.11.): Stützen (IfcColumn) sind eine eigene Bauteil-Art und bekommen ein gemeinsames Material.
  Im Bereich „3 Fassade“ unter den Himmelsrichtungen eine eigene Zeile „Stützen“ (mit dünner Trennlinie, Anzahl,
  Musterbild, gleiche 10 Materialien). **Entscheidung:** Startwert Sichtbeton. Die Zeile hängt nicht am Schalter
  „Alle Seiten gleich“ und erscheint nur, wenn die IFC Stützen hat. Muster im echten Maßstab:
  Seitenflächen waagerecht entlang der Fläche, Ober-/Unterseite in Draufsicht. Statuszeile nennt jetzt auch die Stützen.
  Getestet: `Test-ArchiCAD.ifc` 4 runde Stützen, Einfamilienhaus (Revit) 8 Stützen; Materialwechsel sofort sichtbar,
  Schalter an/aus lässt die Zeile stehen, keine Fehler. Geändert: `ifc.js`, `fassade.js`, `darstellung.js`, `app.js`, `index.html`, `style.css`.
  Probleme: Bei runden Stützen kann das Muster an einer Stelle einen kleinen Versatz haben (fällt bei Beton/Putz nicht auf,
  bei Klinker/Holz evtl. schon). Das Ausblenden der Zeile ohne Stützen ist nicht getestet, da beide Test-IFCs Stützen haben.
  Auch die Stützenwahl geht beim Neuladen verloren (gespeichert wird mit den Varianten, Sitzung 8).

- Sitzung 7 (16.11.): Neuer Bereich „5 Kennwerte“ mit Tabelle Nord/Ost/Süd/West + Gesamt: Fassadenfläche,
  Fensterfläche (m², 0,1 genau) und Fensterflächenanteil (ganze %). Rechnet sofort neu bei Reglern,
  „Alle Seiten gleich“, Zurücksetzen und Klick auf eine Wand (außen ↔ innen).
  So wird gerechnet: Fassade = Umriss der Außenseite jeder Außenwand (mit Giebel, Öffnungen mitgezählt);
  gebogene/L-förmige Wände ohne Umriss: Länge × Höhe. Fenster = aktuelle Lochgröße (nach Regler),
  jede Öffnung nur einmal (in ihrer Außenwand). Glastür: die durchsichtigen Teile der Tür (Transparenz aus der IFC)
  decken in der Ansicht mindestens die Hälfte der Türöffnung ab, dann zählt die ganze Öffnung als Fenster.
  Getestet: `Test-ArchiCAD.ifc` gesamt 83,1 m² Fassade, 15,5 m² Fenster, 19 % (West 48 % wegen großer Glasfront,
  wird richtig als Glastür erkannt). Regler Nord 0 % / 200 % / zurück ändert die Werte richtig. Einfamilienhaus (Revit):
  831,5 m² Fassade, 139,0 m² Fenster, 17 %. Keine Fehler. Geändert: `ifc.js`, `fassade.js`, `app.js`, `index.html`, `style.css`.
  Probleme: Die Kennwerte sind nur so gut wie die Außenwand-Erkennung. Im Einfamilienhaus zählen Kellerwände,
  Schornstein- und Gaubenwände sowie einige dünne Dachgeschoss-Wände (13 cm, vermutlich Innenwände) mit,
  dadurch sind Fassade und Fenster dort zu groß; per Klick korrigierbar. Revit-Innentüren mit großem Glaseinsatz
  (ca. 54 % Glas) zählen als Glastür, wenn sie in einer Wand sitzen, die als Außenwand gilt.
  Mehrschalige Wände: Gelten beide Schalen als außen, wird die Fläche doppelt gezählt (Schale per Klick abschalten).

- Sitzung 8 (16.11.): Neuer Bereich „6 Varianten“: Namensfeld (leer = „Variante 1, 2 …“), Hauptbutton
  „Variante speichern“, darunter die Liste (neueste oben) mit Vorschaubild, Name, Datum, Fensteranteil
  und den Textknöpfen „Laden“ / „Löschen“ (mit Sicherheitsfrage). Neue Datei `js/varianten.js`.
  Gespeichert werden: alle Einstellungen (Material je Seite, Stützen, beide Schalter „Alle Seiten gleich“ samt
  Werten im Hintergrund, Fenster je Seite, Wand-Klicks als Liste der umgeschalteten Wände), die Kennwerte und 5 Bilder.
  **Entscheidungen (mit der Nutzerin):** Ansichten N/O/S/W als Parallelprojektion (wie eine gezeichnete Ansicht),
  Perspektive schräg von oben aus Südosten; beides aus fester Kamera, unabhängig vom aktuellen Blick.
  „Laden“ stellt alle Einstellungen wieder her. Varianten gehören zur IFC-Datei (Dateiname + Anzahl Wände).
  Speicher: IndexedDB statt localStorage (localStorage hätte nur für ca. 10 Varianten gereicht).
  Bilder: 1500 × 1000 Pixel, JPEG, ohne blauen Hover-Schimmer. Die Perspektive passt sich den sichtbaren Bauteilen an
  (Haus mittig, füllt ca. 90 % der Bildhöhe), die Ansichten der Gebäudebox (Wände + Dach).
  Getestet: `Test-ArchiCAD.ifc` speichern, verstellen, laden → Kennwerte, Material, Regler, Schalter und
  Wand-Klick (4 → 3 Außenwände) wieder genau wie gespeichert; bleibt nach Neuladen der Seite erhalten; Löschen klappt.
  Einfamilienhaus (Revit): Speichern 0,5 s, ca. 470 KB pro Variante (Platz für sehr viele Varianten). Keine Fehler.
  Geändert: `szene.js`, `app.js`, `index.html`, `style.css`, neu `varianten.js`.
  Probleme: `toBlob` brauchte im Test-Browser ca. 1 s pro Bild, deshalb jetzt `toDataURL` (ca. 20 ms).
  In den Ansichten erscheinen Gelände/Modellplatte und Treppen vor der Fassade mit (wie in einer echten Ansicht).
  Varianten erkennen „ihr“ Modell am Dateinamen: Wird die IFC umbenannt, ist die Liste leer;
  wird sie unter gleichem Namen neu exportiert, können die Wand-Klicks auf andere Wände fallen (Wand-Nummern ändern sich).
  Die Varianten gibt es nur in diesem Browser auf diesem Rechner (Arbeitsdatei sichern = Could).

- Sitzung 9 (17.11.): Variantenvergleich. In der Variantenliste hat jede Variante ein Kästchen zum Ankreuzen;
  ab 2 Kreuzen erscheint unter der Liste der Textknopf „… Varianten vergleichen“. **Höchstens 4** (wie später das PDF A3 quer),
  danach sind die übrigen Kästchen gesperrt. Gelöschte Varianten fallen aus der Auswahl.
  Der Vergleich liegt als eigene weiße Ansicht über der ganzen App (mehr Platz als nur der 3D-Bereich),
  eine Spalte je Variante, älteste links. Zeilen auf gleicher Höhe: Name + Datum (bleibt beim Scrollen oben),
  Perspektive, Ansichten N/O/S/W (2 × 2), Material je Seite + Stützen (mit Musterbild; bei „Alle Seiten gleich“
  das tatsächlich geltende Material), Fenster je Seite (Breite/Höhe in %, „zu (0 %)“), Kennwerte je Seite + Gesamt.
  Klick auf ein Bild zeigt es groß, Esc oder Klick schließt es; „Schließen“ oder Esc schließt den Vergleich.
  Unterschiede werden bewusst nicht farbig markiert. Die Zeile „Stützen“ gibt es nur, wenn das Modell Stützen hat.
  Getestet mit `Test-ArchiCAD.ifc`: 3 und 4 Varianten nebeneinander, Sperre beim 5. Kästchen, großes Bild, Esc,
  Löschen angekreuzter Varianten. Keine Fehler. Geändert: `app.js`, `index.html`, `style.css`.
  Nebenbei behoben: „Variante speichern“ baut die Fenster vor dem Speichern einmal neu. Vorher konnten die Kennwerte
  veraltet sein, wenn direkt nach einer Reglerbewegung gespeichert wurde (fiel nur beim sehr schnellen Testskript auf).
  Probleme: keine. Die Auswahl der Kästchen wird nicht gespeichert (nach Neuladen der Seite leer).

- Sitzung 9b (17.11.): Ansichten gerade auf die Fassade. Die App bestimmt beim Speichern, um wie viel Grad das Gebäude
  im Plan gedreht ist (Richtung aller Außenwände, große Wände zählen mehr), und dreht die Kameras für die 4 Ansichten
  und die Perspektive mit. Der Bildausschnitt jeder Ansicht wird in der gedrehten Richtung gemessen, damit nichts abgeschnitten wird.
  Die Drehung wird mit der Variante gespeichert. Im Vergleich steht auf den kleinen Bildern z. B. „N (NNW)“,
  im großen Bild „Ansicht Nord – zeigt nach Nordnordwest“ (16 Himmelsrichtungen, je 22,5°). Kaum gedreht (unter ca. 11°): nur „N“.
  Ältere Varianten behalten ihre alten Bilder und ihre alte Beschriftung.
  Getestet: `Test-ArchiCAD.ifc` ist um ca. 19° gedreht (Nord zeigt nach NNW), Einfamilienhaus (Revit) um ca. 32°;
  in beiden Fällen sind alle 4 Ansichten gerade (Giebel symmetrisch, keine zweite Seite sichtbar). Keine Fehler.
  Geändert: `fassade.js`, `szene.js`, `app.js`, `style.css`.
  Probleme: Bei einem Gebäude, das fast genau 45° gedreht ist, ist die Einteilung der Wände in Nord/Ost/Süd/West
  nicht eindeutig (gab es vorher auch schon). Die Kamera beim Öffnen der Datei (3D-Bereich) bleibt ungedreht aus Südosten.

- Sitzung 10 (17.11.): PDF-Übersichtsseite A3 quer. Neue Datei `js/pdf.js`, Bibliothek jsPDF 2.5.2 (wird erst beim
  ersten Klick aus dem Internet geladen). Unter der Variantenliste: Hinweis, ab 1 Kreuz ein Feld „Standort fürs PDF“
  und der Textknopf „Als PDF speichern“; ab 2 Kreuzen zusätzlich „Vergleichen“. Im Vergleichsfenster ein Knopf
  „Als PDF speichern“ neben „Schließen“ (nimmt dieselbe Auswahl und denselben Standort).
  Die Datei landet direkt im Download-Ordner: `Fassadenvariante_<Modell>_<Datum>.pdf` (1 Variante) bzw.
  `Variantenvergleich_<Modell>_<Datum>.pdf`. Blatt: Kopf mit Titel, Modell, Standort (nur wenn eingetragen), Datum;
  **kein Nordpfeil** (gestrichen nach Test, Wunsch der Nutzerin: gehört nicht zu Ansichten und Perspektive); eine Spalte je Variante (älteste links) mit Name, Datum, Perspektive, 4 Ansichten (Kennzeichen wie im
  Vergleich, z. B. „N (NNW)“) und Kennwerte; unten eine Fußzeile mit den Erklärungen.
  **Geändert (17.11., Wunsch der Nutzerin):** Material und Fenstergrößen stehen nicht auf dem PDF (die Bilder zeigen sie),
  dadurch sind die Bilder größer. Anordnung je nach Anzahl: 1 Variante = großes Bild, Ansichten in einer Reihe darunter,
  Kennwerte rechts; 2 = Ansichten in einer Reihe; 3 und 4 = Ansichten 2 × 2; Kennwerte jeweils darunter.
  Zu lange Namen werden mit „…“ gekürzt. Schrift Helvetica.
  Getestet mit `Test-ArchiCAD.ifc` und 1, 2, 3 und 4 Varianten: alles passt aufs Blatt, Umlaute und m² stimmen,
  Knopf in der Liste und im Vergleich erzeugen die Datei, keine Fehler. Ca. 300 KB pro Variante.
  Geändert: `app.js`, `index.html`, `style.css`, neu `pdf.js`.
  Probleme: Bei 4 Varianten bleibt unten etwas Weißraum (die Spalten sind schmal, die Bilder können nicht breiter werden).
  **Nachtrag (17.11.):** Schalter „Kennwerte aufs PDF“ (Start: an) unter dem Standortfeld; aus = nur Bilder, die Bilder
  werden dann größer, die Fußzeile nennt nur noch die Ansichten. Gilt auch für den Knopf im Vergleich.
  Der Browser hatte nach der Änderung noch die alte `pdf.js` (mit Nordpfeil) im Zwischenspeicher, auch nach Strg+Umschalt+R.
  Deshalb jetzt Versionsnummern: `js/app.js?v=10` in `index.html` und `./pdf.js?v=10b` in `app.js`.
  **Regel:** Nach Änderungen an einer JS-Datei die Nummer an ihrem Import erhöhen.
  Beim Testen hing ein Testskript im Browser-Fenster der App fest und hat den Download abgefangen (Meldung „gespeichert“,
  aber keine Datei). Behoben; nach eigenen Testskripten die Seite neu laden bzw. die Änderung zurücknehmen.
  Der Standort wird nicht gespeichert (nach Neuladen der Seite leer). Sonderzeichen außerhalb des westeuropäischen
  Zeichensatzes (z. B. Emojis) im Variantennamen erscheinen im PDF falsch. Ohne Internet kein PDF (Meldung erscheint).

- Sitzung 10b (17.11.): Perspektive einstellbar. Im Bereich „6 Varianten“ über dem Namensfeld: Auswahl „Blick aus“
  (Nordost, Südost, Südwest, Nordwest; Start Südost) und Regler „Blickhöhe“ 0–45° in 5er-Schritten (Start 15°, vorher fest ca. 26°).
  Beim Verstellen springt das 3D-Fenster auf genau diesen Blick (danach wieder frei drehbar); gespeichert wird immer
  der eingestellte Blick, nicht der aktuelle im 3D-Fenster. Ist das Gebäude im Plan gedreht, dreht sich der Blick mit (wie die Ansichten).
  Der Blick wird mit der Variante gespeichert, „Laden“ stellt ihn wieder ein. Ältere Varianten behalten ihre Bilder und
  gelten als „aus Südosten, ca. 26°“ (Laden lässt dort die Einstellung, wie sie ist).
  Vergleich: Kennzeichen auf der Perspektive, z. B. „SW · 5°“, im großen Bild „Perspektive aus Südwesten, 5°“.
  PDF: dieselbe lange Beschriftung oben links auf der Perspektive; in der Fußzeile steht statt „Perspektive aus Südosten“
  jetzt „Blickhöhe der Perspektive in Grad über der Waagerechten“.
  Getestet mit `Test-ArchiCAD.ifc`: Varianten mit SW 5° und NO 40° gespeichert, mit alter „Variante 1“ verglichen,
  PDF-Knopf im Vergleich (Texte geprüft), Laden stellt Auswahl und Regler richtig ein. Testvarianten wieder gelöscht. Keine Fehler.
  Geändert: `szene.js` (Kamera-Einpassen als eigener Baustein), `app.js`, `pdf.js`, `index.html`, `style.css`.
  Versionsnummern: `app.js?v=11`, `szene.js?v=11`, `pdf.js?v=11`.
  Probleme: Die Kamera beim Öffnen einer IFC nutzt noch den alten festen Blick (Südost, ca. 26°), bis man den Regler bewegt.
  Bei 0° liegt die Kamera auf halber Gebäudehöhe, nicht auf Augenhöhe eines Menschen. Das PDF-Blatt selbst wurde nur
  über seine Texte geprüft, nicht als Bild angesehen.

- Sitzung 10c (17.11.): Seitenleiste ruhiger. Alle grauen Erklärtexte in den Bereichen 2–6 sind zugeklappt hinter einem
  kleinen grauen Textknopf „Erklärung ▸“ (aufgeklappt „▾“, Hover dunkelblau). In Bereich 6 gibt es zwei davon
  (zum Blick und zum Speichern), jeweils direkt unter dem, was sie erklären. Bereich 1 zeigt nach dem Laden nur noch
  den Dateinamen, die Bauteil-Anzahlen stehen zugeklappt unter „Bauteile ▸“. Start: alles zugeklappt.
  Immer sichtbar bleiben: Fehler- und Statusmeldungen, die Zahl der Außenwände, „… oder die Datei einfach ins Fenster ziehen“,
  der Hinweis zum Ankreuzen unter der Variantenliste und die Startseite ohne Modell.
  Technik: eingebautes Ausklapp-Element des Browsers (`<details>`), fast ohne JavaScript.
  Getestet mit `Test-ArchiCAD.ifc`: alles startet zugeklappt, Auf- und Zuklappen klappt, keine Fehler.
  Geändert: `index.html`, `style.css`, `app.js`. Versionsnummern: `app.js?v=12`, neu auch `style.css?v=12b`.
  Probleme: keine. Ob etwas aufgeklappt ist, merkt sich die App nicht (nach Neuladen wieder zu).
  **Geändert nach Test (17.11., Wunsch der Nutzerin):** Bei „5 Kennwerte“ und „6 Varianten“ sind die Erklärungen ganz entfernt
  (auch nicht ausklappbar), damit die Leiste nicht zu voll wird. Ausklappbare Erklärungen gibt es nur noch in den Bereichen 2–4.
  Etwas mehr Abstand zwischen „Blickhöhe“ und Namensfeld.
  **Nochmals geändert (Wunsch der Nutzerin):** Das Wort „Erklärung“ ist weg, zum Aufklappen gibt es nur noch die kleine Ecke ▸/▾
  (etwas größer, wird beim Daraufzeigen blau, Tooltip „Erklärung aufklappen“). „Bauteile ▸“ in Bereich 1 behält sein Wort.
  Versionsnummer jetzt `style.css?v=12f`.

- Sitzung 11 (17.11.): Anleitung als Startseite im 3D-Bereich (ersetzt „Noch kein Modell geladen“): Titel „So geht’s“,
  kurzer Satz (alles bleibt im Browser), 4 Schritte mit blauer Nummer: IFC laden · Außenwände prüfen · Gestalten · Vergleichen.
  Darunter aufklappbar „IFC-Export – Tipps ▸“ mit drei Spalten Allgemein / Revit / ArchiCAD (Menüweg, IFC-Version,
  Wände als „außen“ kennzeichnen: Revit Wandtyp „Funktion = Außen“, ArchiCAD „Position = Außen“) und dem Hinweis,
  dass Menüs je nach Version anders heißen. Nach dem Laden einer IFC verschwindet die Anleitung; oben in der Seitenleiste
  erscheint der Textknopf „Anleitung“ (wird zu „Anleitung schließen“). Mit Modell liegt die Anleitung weiß über dem
  3D-Fenster, schließen mit „Zurück zum Modell“, dem Textknopf oder Esc. „IFC wird gelesen …“ liegt über der Anleitung.
  Getestet (Browser 1440 × 900) mit `Test-ArchiCAD.ifc`: Startseite, Aufklappen, Laden, Öffnen/Schließen auf allen drei Wegen. Keine Fehler.
  Geändert: `index.html`, `style.css`, `app.js`. Versionsnummern: `app.js?v=13`, `style.css?v=13`.
  Probleme: Die Menüwege für Revit/ArchiCAD sind aus dem Gedächtnis, nicht im Programm nachgeprüft – bitte einmal mit
  der eigenen Programmversion vergleichen. Im schmalen Fenster (unter 1000 px) stehen die drei Spalten untereinander.

- Sitzung 12 (17.11.): Einzelne Wand → anderes Material. Im Bereich „3 Fassade“ unter der Materialwahl (mit dünner Trennlinie)
  der Schalter „Einzelne Wände“. Aus: Klick schaltet wie bisher außen ↔ innen. An: nur Außenwände lassen sich anfahren;
  Klick wählt eine Wand, Umschalt + Klick nimmt weitere dazu bzw. wieder heraus, Klick ins Leere oder auf die einzige
  gewählte Wand hebt die Auswahl auf. Gewählte Wände sind deutlich blau getönt (stärker als der Hover-Schimmer).
  Darunter „1 Wand gewählt.“ und die Zeile „Auswahl“ mit Musterbild und Liste: „wie die Seite“ + die 10 Materialien;
  haben die gewählten Wände Verschiedenes, steht „– verschieden –“. Textknopf „Einzelne Wände zurücksetzen (n Wände)“
  erscheint, sobald eine Wand ein eigenes Material hat. Erklärung ausklappbar (▸). Ausschalten hebt die Auswahl auf,
  die eigenen Materialien bleiben. Eigenes Material bleibt auch bei Änderung der Seite oder „Alle Seiten gleich“.
  Gespeichert mit der Variante (Liste Wand-Nummer → Material), „Laden“ stellt es wieder her; ältere Varianten: keine.
  Vor dem Fotografieren wird die Auswahl aufgehoben (keine blaue Wand auf den Bildern). Vergleich: neue Zeile
  „Einzelne Wände“ (z. B. „1 Wand Holz natur“), nur wenn eine der Varianten welche hat. PDF unverändert (zeigt es über die Bilder).
  Neues Modell laden löscht die eigenen Materialien.
  Getestet mit `Test-ArchiCAD.ifc`: Auswahl, Umschalt-Klick, „verschieden“, Seitenmaterial ändern, „wie die Seite“,
  Zurücksetzen, Speichern → Zurücksetzen → Laden, Vergleich, Schalter aus = außen/innen wie bisher. Testvariante wieder gelöscht.
  Geändert: `app.js`, `fassade.js`, `materialien.js`, `szene.js` (meldet jetzt auch Klicks ins Leere), `index.html`, `style.css`.
  Versionsnummern: `app.js?v=14b`, `fassade.js?v=14b`, `materialien.js?v=14b` (in `app.js` und `fassade.js` gleich!), `szene.js?v=14`, `style.css?v=14`.
  Probleme: Die Zuordnung hängt an der Wand-Nummer aus der IFC – wird die IFC neu exportiert, können eigene Materialien
  auf anderen Wänden landen (wie bei den Wand-Klicks). Bei mehrschaligen Wänden bekommt nur die angeklickte Schale das Material.
  Mit echter Maus noch nicht ausprobiert (Test lief über künstliche Klicks) – bitte einmal selbst klicken, auch Umschalt + Klick.
  **Geändert nach Test (Wunsch der Nutzerin):** Ohne Auswahl steht unter dem Schalter keine Kurzanleitung mehr,
  nur die ausklappbare Erklärung (▸); „n Wände gewählt.“ erscheint erst, wenn etwas ausgewählt ist. Versionsnummer `app.js?v=14c`.
  Von der Nutzerin mit dem Einfamilienhaus ausprobiert: passt. Erklärung auf einen Satz gekürzt:
  „Wand anklicken, Umschalt + Klick für mehrere.“

- Sitzung 13 (17.11.): Einzelnes Fenster → Maße ändern. Im Bereich „4 Fenster“ unter „Alle Fenster auf 100 %“ (mit dünner Trennlinie)
  der Schalter „Einzelne Fenster“. Ist er an, geht „Einzelne Wände“ aus und umgekehrt. An: nur verstellbare Fenster
  (in nachbaubaren Außenwänden) lassen sich anfahren (heller blauer Schimmer); Klick wählt, Umschalt + Klick nimmt dazu/heraus,
  Klick ins Leere hebt die Auswahl auf. Gewählte Fenster: Glas blau, Rahmen dunkelblau.
  Darunter „n Fenster gewählt.“ und zwei Felder Breite / Höhe in cm (aktuelle Größe, gerundet auf ganze cm);
  bei verschiedenen Maßen leer mit „verschieden“. Übernommen wird beim Bestätigen (Eingabetaste, Feld verlassen, Pfeile);
  eine Eingabe ändert nur dieses Maß, das andere bleibt, wie das Fenster gerade ist. 0 = Fenster zu.
  Passt das Maß nicht (10 cm Abstand zu Wandrand/Nachbaröffnung), baut die App so groß wie möglich, das Feld zeigt das
  tatsächliche Maß und darunter steht „Größer passt hier nicht …“. Textknöpfe „wie die Seite“ (für die Auswahl) und
  „Einzelne Fenster zurücksetzen (n Fenster)“. Eigenes Maß bleibt bei Reglern der Seite und „Alle Seiten gleich“.
  Gespeichert mit der Variante (Liste Fenster-Nummer → Breite/Höhe in cm), „Laden“ stellt es wieder her; ältere Varianten: keine.
  Vor dem Fotografieren wird die Auswahl aufgehoben. Vergleich: neue Zeile „Einzelne Fenster“ unter den Fenstern
  (z. B. „1 Fenster 150 × 120 cm“), nur wenn eine der Varianten welche hat. Neues Modell laden löscht die eigenen Maße.
  Getestet mit `Test-ArchiCAD.ifc`: echter Mausklick und Umschalt + Klick, Eingabe 200 cm (Kennwerte Süd 1,0 → 2,0 m²),
  900 cm → 430 cm mit Hinweis, Regler Süd 50 % lässt das eigene Maß stehen, Höhe 0 = zu, zwei Fenster „verschieden“,
  Speichern → Zurücksetzen → Laden, Vergleich, Schalter schließen sich gegenseitig aus. Testvariante wieder gelöscht. Keine Fehler.
  Geändert: `app.js`, `fassade.js`, `darstellung.js` (Farben für Hover/Auswahl der Fenster), `szene.js` (findet auch neu
  gezeichnete Fenster beim Anklicken), `index.html`, `style.css`.
  Versionsnummern alle auf `v=15`: `app.js`, `szene.js`, `ifc.js`, `fassade.js`, `materialien.js`, `darstellung.js`
  (in `ifc.js`, `fassade.js`, `materialien.js` gleich!), `style.css`.
  Probleme: Die Zuordnung hängt an der Fenster-Nummer aus der IFC (wie bei den Wänden: nach neuem Export evtl. falsche Fenster).
  Türen und Fenster in gebogenen/L-förmigen Wänden lassen sich nicht einzeln ändern. Der Browser im Test hatte die alte
  `index.html` im Zwischenspeicher – falls der Schalter fehlt: Strg+Umschalt+R. Mit echter Maus nur kurz ausprobiert.
  **Geändert (Wunsch der Nutzerin):** In der ausklappbaren Erklärung zu „Einzelne Fenster“ steht kein „0 = Fenster zu“ mehr.

- Sitzung 14 (17.11.): Pfosten-Riegel-Fassade. Neues Material „Pfosten-Riegel“ in der Liste jeder Himmelsrichtung, bei „Alle“
  und bei „Einzelne Wände“ (nicht bei den Stützen). Darunter erscheint die Zeile „Felder [8] breit [3] hoch“ (1–40 × 1–20,
  übernommen beim Bestätigen); die Felder gelten je Wand. Für „Alle“ und jede einzelne Wand gibt es eigene Felder
  (eine einzelne Wand startet mit den Feldern ihrer Seite; bei mehreren gewählten Wänden mit Verschiedenem steht „versch.“).
  So wird gebaut: Die Außenwand wird ausgeblendet und durch Glas im Umriss ihrer Außenseite ersetzt (auch Giebel),
  ringsum ein Rahmenprofil entlang jeder Umrisskante, innen Pfosten und Riegel gleichmäßig verteilt.
  Profile 5 cm breit, 15 cm tief (höchstens Wanddicke), bündig mit der Außenseite der Wand; Glas in der Mitte der Profile.
  Fenster **und Türen** in dieser Wand verschwinden. Riegel werden über die ganze Wandhöhe verteilt (auch in den Giebel).
  Fenster-Regler einer Pfosten-Riegel-Seite sind grau und gesperrt, statt „n Fenster“ steht „Pfosten-Riegel“
  (bei „Alle“ nur, wenn alle vier Seiten Pfosten-Riegel haben). Kennwerte: die ganze Wandfläche zählt als Fenster,
  Öffnungen darin zählen nicht noch einmal. Hover und Auswahl färben Glas und Profile wie bei den Fenstern.
  **Farbe (Wunsch der Nutzerin):** Dach, Fensterrahmen und Pfosten/Riegel jetzt gemeinsam Anthrazit #3a3d42 (`PROFILFARBE` in `darstellung.js`).
  Gespeichert mit der Variante (Felder je Seite, „Alle“, je Wand), „Laden“ stellt es wieder her; ältere Varianten: 8 × 3.
  Vergleich: Material z. B. „Pfosten-Riegel 4 × 2 Felder“, bei den Fenstern „ganz verglast (Pfosten-Riegel)“.
  Getestet mit `Test-ArchiCAD.ifc`: Süd 8 × 3 → 4 × 2 (Süd 14,8 m² Fassade = 14,8 m² Fenster, 100 %), „Alle Seiten gleich“ an/aus,
  alle Seiten Pfosten-Riegel, Westgiebel per Mausklick einzeln 3 × 3 (folgt dem Giebel), Speichern → Zurücksetzen → Laden
  (Kennwerte und Felder wieder gleich), Vergleich, gespeichertes Bild ohne blaue Auswahl. Testvariante wieder gelöscht.
  Einfamilienhaus (Revit): alle Seiten Pfosten-Riegel in 0,17 s, keine Fehler.
  Geändert: `fassade.js`, `materialien.js`, `darstellung.js`, `app.js`, `index.html`, `style.css`.
  Versionsnummern: `app.js`, `ifc.js`, `fassade.js`, `materialien.js`, `darstellung.js`, `style.css` alle auf `v=16`.
  Probleme: Gebogene/L-förmige Wände bekommen nur ein Muster (Glas mit gezeichnetem Raster), zählen aber auch als Fenster.
  Bei mehrschaligen Wänden blieb die innere Schale zunächst stehen (behoben, s. u. „Gitterkästen weg“).
  Riegel liegen je Wand auf eigener Höhe (bei verschieden hohen Nachbarwänden derselben Seite nicht auf einer Linie).
  Hinter der Glaswand sieht man Deckenkanten und Innenraum (wie ein Arbeitsmodell). Mit echter Maus nur ein Klick getestet.
  **Geändert nach Test (Wunsch der Nutzerin):**
  (1) **Oberlicht:** Die oberste Feldreihe jeder Wand ist halb so hoch wie die anderen („Felder hoch“ zählt sie mit,
  bei 1 gibt es kein Oberlicht). Bei Giebelwänden liegt das Oberlicht in der Giebelspitze.
  (2) **Gitterkästen weg:** Im Einfamilienhaus (Westseite) wurden kurze, 37 cm hohe Wandstücke über den Fenstern
  (13 cm, liegen in der Dicke der Außenwand) selbst zu kleinen Pfosten-Riegel-Kästen. Neu (`anbauteileZuordnen` in `fassade.js`):
  Kleinere Wände und sonstige Bauteile, die ganz in einer Wand stecken oder bis 30 cm davor/dahinter sitzen
  (geprüft an den echten Eckpunkten, weil Gebäude gedreht sein können), verschwinden mit ihr, wenn sie zur Glaswand wird.
  Dadurch verschwindet auch die innere Schale mehrschaliger Wände mit. Kennwerte bleiben gleich (die Wandstücke zählen
  wie bisher zur Fassadenfläche). Einfamilienhaus West: 8 Wandstücke + 4 weitere Wände und 8 sonstige Bauteile ausgeblendet.
  Getestet mit beiden IFCs, keine Fehler. Versionsnummern: `fassade.js?v=17c` (in `app.js`), `app.js?v=17d` (in `index.html`).
  **Fehler behoben (17.11., neue Test-IFC der Nutzerin):** Eine neue ArchiCAD-IFC (IFC4 Reference View, 16 Wände, 26 Fenster,
  alle Wände „außen“; Kopie als `testdaten/Test-Neu.ifc`) zeigte „0 von 16 Wänden sind Außenwände“.
  Ursache: Export-Option „Komplexe Elemente aufteilen: An“. Die Wand selbst hat dann keine Form, die steckt in ihren
  Schichten (je Wand 5 × IfcBuildingElementPart); die App sah leere Wände und hielt die Schichten für „weitere Bauteile“.
  Jetzt: `ifc.js` setzt die Schichten wieder zur Wand zusammen (nur Schichten von Wänden; Schichten von Decken bleiben, wie sie sind),
  leere Formen werden übersprungen. `fassade.js`: Eine Wand gilt als nachbaubar, wenn mindestens die Hälfte ihrer Fläche
  parallel zur Wand liegt – auch die Trennflächen zwischen den Schichten zählen (vorher nur Vorder- und Rückseite).
  Ergebnis neue IFC: 16 von 16 Außenwänden, alle nachbaubar, alle 26 Fenster verstellbar, Pfosten-Riegel und Holz klappen.
  Gegenprobe: `Test-ArchiCAD.ifc` (4 von 14, 4 nachbaubar, 83,1 m² / 15,5 m²) und Einfamilienhaus (89 von 192, 87 nachbaubar,
  831,5 m² / 139,0 m²) genau wie vorher. Keine Fehler.
  Versionsnummern: `ifc.js?v=17`, `fassade.js?v=17e` (in `app.js`), `app.js?v=17f` (in `index.html`).
  Hinweis: Die Wand-Nummern sind jetzt die der ganzen Wand (nicht der Schichten) – bei Modellen mit Schichten
  waren vorher ohnehin keine Varianten mit Wand-Klicks möglich.
- Sitzung 17 (17.11.): Umschalter „Zeichnung | Realistisch“ oben rechts im 3D-Fenster (erscheint, sobald ein Modell geladen ist).
  Neue Datei `js/realistisch.js`: tauscht für jedes Bild im 3D-Fenster kurz alle Materialien gegen „echte“
  (three.js MeshStandardMaterial), blendet die Kantenlinien aus, setzt Himmelsverlauf als Hintergrund und eine
  vorberechnete Himmelskugel für Spiegelungen, stellt die Sonne tiefer von Südwesten (Licht- und Schattenseiten)
  und belichtet weich (ACES), damit helle Decken nicht ausbrennen – danach sofort alles zurück.
  Dadurch arbeiten Hervorheben, Auswahl und das Speichern unverändert weiter; **gespeicherte Bilder, Vergleich und PDF
  bleiben im Zeichenstil** (geprüft: gespeichertes Bild weiß mit Linien, obwohl „realistisch“ an war).
  `materialien.js`: eigene, feinere Muster je Material (durchgehende Mörtelfugen und Farbunterschiede je Stein,
  Holzmaserung mit Ästen und Schattenfuge, Beton mit Poren und Ankerlöchern, raue Putzkörnung, Platten mit Fugen,
  Glas dunkler und spiegelnd) plus Reliefbild (Fugen vertieft). Der Zeichenstil ist unverändert.
  Rohmodell bleibt hellgrau, Fenster spiegeln den Himmel, Rahmen/Pfosten leicht glänzend.
  Ruckel-Test Einfamilienhaus: Zeichnung ca. 44 Bilder/s, realistisch ca. 60 (keine Linien).
  Getestet mit `Test-Neu.ifc` und Einfamilienhaus, keine Fehler. Die Wahl wird nicht gespeichert (beim Neuladen „Zeichnung“).
  Versionsnummern: `materialien.js?v=18` (in `app.js`, `fassade.js`, `realistisch.js`), `realistisch.js?v=18`,
  `szene.js?v=18b`, `fassade.js?v=18`, `app.js?v=18b`, `style.css?v=18`.
  Hinweis: Beim Testen ist im eingebauten Browser von Claude eine Test-Variante „Variante 1“ zum Einfamilienhaus entstanden
  (nicht in deinem normalen Browser).
- Sitzung 17b (17.11.): Dachmaterial wählbar. Im Bereich „3 Fassade“ unter „Stützen“ die Zeile **„Dach“** (Anzahl Dachteile,
  Musterbild, Liste), ein Material für alle Dachteile; erscheint nur, wenn die IFC ein Dach hat. Trennlinie wie bei „Stützen“
  (stehen beide da, nur eine Linie). 6 Dachmaterialien (eigene Liste `DACHMATERIALIEN` in `materialien.js`, nicht bei den Wänden):
  **Schlicht hell** (Abdichtung, Start), Ziegel rot, Ziegel anthrazit, Stehfalz hellgrau, Stehfalz anthrazit, Gründach.
  Muster im echten Maßstab: Ziegel 30 cm × Lattung 33,3 cm, Reihen versetzt, Schattenband unter jeder Reihe;
  Stehfalz Bahnen 50 cm; Abdichtung Bahnenstöße alle 1 m ganz zart; Gründach Sedum-Flecken. Je eine Fassung für „realistisch“
  (Ziegel mit Relief zur Unterkante, Stehfalz glänzend mit erhabenem Falz, Gründach rau).
  So liegt das Muster (`dachVorbereiten` in `fassade.js`): je Dreieck nach seiner Neigung – geneigt: Reihen parallel zur Traufe,
  Falze die Schräge hinunter (auch auf Walmflächen); flach: Draufsicht (Norden oben); senkrecht (Ortgang, Attika): wie eine Wand.
  **Fensterrahmen und Pfosten/Riegel bleiben anthrazit**, unabhängig vom Dach.
  Gespeichert mit der Variante, „Laden“ stellt es wieder her; ältere Varianten: „Schlicht hell“. Vergleich: neue Zeile „Dach“
  unter „Stützen“ (nur, wenn das Modell ein Dach hat). Bilder/PDF zeigen es automatisch (Zeichenstil).
  Das Dachmaterial bleibt beim Öffnen einer anderen IFC stehen (wie die Materialien der Seiten).
  Getestet: Einfamilienhaus (14 Dachteile, Walmdach mit Gauben) alle Materialien, Zeichnung und realistisch, Speichern → Umstellen →
  Laden, Vergleich mit älterer Variante; `Test-ArchiCAD.ifc` (8 Dachteile, Satteldach) mit Stützen- und Dachzeile. Testvariante wieder gelöscht. Keine Fehler.
  Geändert: `materialien.js`, `fassade.js`, `darstellung.js`, `app.js`, `index.html`, `style.css`.
  Versionsnummern: `darstellung.js?v=19` (in `ifc.js`, `fassade.js`, `materialien.js`, `realistisch.js`), `ifc.js?v=19`,
  `materialien.js?v=19b` (in `app.js`, `fassade.js`, `realistisch.js`), `fassade.js`/`realistisch.js`/`szene.js`/`app.js` `v=19b`, `style.css?v=19`.
  Probleme: Gründach und Ziegel liegen auch auf sehr steilen oder flachen Flächen (keine Prüfung, ob das baulich passt).
  Auf Flachdächern zeigt Stehfalz nach Norden, nicht nach dem Gebäude ausgerichtet. Mit echter Maus nicht ausprobiert (Test über Skript).
  **Geändert nach Test (Wunsch der Nutzerin):** (1) **Ortgang:** Am Ortgang liefen die Muster schräg. Jetzt werden schmale
  Dachkanten (Ortgang, Traufkante, Attika-Rand) erkannt und ohne Muster in einer schlichten, etwas dunkleren Farbe gezeigt
  (wie ein Ortgangblech; `kantenDreiecke` in `fassade.js`: Dreiecke je Ebene sortiert, Ebene schmaler als 60 cm = Kante,
  Kanten als eigenes Netz `userData.dachKante`). (2) **Farben** dunkler und weniger gesättigt, passend zu den Fassaden:
  Schlicht hell #b7b5af, Ziegel rot #7f5a51, Ziegel anthrazit #545453, Stehfalz hellgrau #9b9d9c, Stehfalz anthrazit #4b4d50,
  Gründach #6c705f; je eine Kantenfarbe (`kante` in `DACHMATERIALIEN`).
  Getestet: `Test-ArchiCAD.ifc` (Ortgang und Traufkante schlicht, Ziegelreihen sauber), Einfamilienhaus (Walmdach, Zeichnung und realistisch). Keine Fehler.
  Versionsnummern: `materialien.js?v=19c` (in `app.js`, `fassade.js`, `realistisch.js`), `fassade.js`/`realistisch.js`/`szene.js`/`app.js` `v=19c`.
  Probleme: Ein Dachteil, das nur aus schmalen Flächen besteht, bekommt weiter überall das Muster (bewusst, sonst wäre es ganz ohne Material).
  Ältere gespeicherte Varianten behalten ihre Bilder mit den alten, helleren Dachfarben.
  **Nochmals geändert (Wunsch der Nutzerin): Farben abgestimmt, „realistisch“ echter.**
  Jedes Dachmaterial hat jetzt denselben Farbton wie sein Gegenstück in der Fassade, nur dunkler:
  Klinker rot #92564b (vorher #98534a, etwas weniger grell) ↔ Ziegel rot #7d4e45; Klinker anthrazit ↔ Ziegel anthrazit #58554f (warmes Grau);
  Fassadenplatten ↔ Stehfalz hellgrau #969a9c / anthrazit #4f5357 (kühles Grau); Sichtbeton ↔ Schlicht hell #b4b1ab.
  Ziegel „realistisch“: Farbunterschied je Ziegel von ±10 % auf ±3 % (vorher zu bunt), dafür weiche großflächige Alterung;
  Relief mit zwei flachen Mulden je Ziegel (Falzziegel), Schatten unter dem Ziegel darüber, schmaler Spalt zum Nachbarn, kräftigeres Relief.
  Licht „realistisch“ (`szene.js`): Himmelslicht leicht kühl, vom Boden zurückgeworfenes Licht warm und dunkler, Sonne leicht warm.
  **Schlagschatten bewusst nicht**: die kommen mit Sitzung 15 (Sonnenstand und Schatten).
  Versionsnummern: `materialien.js?v=19d` (in `app.js`, `fassade.js`, `realistisch.js`), `fassade.js`/`realistisch.js`/`szene.js`/`app.js` `v=19d`.
  Getestet mit dem Einfamilienhaus (Zeichnung und realistisch), keine Fehler.
  Hinweis: Klinker rot ist eine Fassadenfarbe – ältere Varianten behalten ihre Bilder mit dem alten Rot.
  **Außerdem (Wunsch der Nutzerin):** „Holz natur“ heißt jetzt **„Lärche“** (übliches Fassadenholz) und ist heller (#bfa88b statt #a6927e).
  Die interne Kennung bleibt `holz-natur`, gespeicherte Varianten zeigen den neuen Namen. Versionsnummern jetzt `v=19e`
  (`materialien.js`, `fassade.js`, `realistisch.js`, `szene.js`, `app.js`).
- Sitzung 18 (17.11.): Eigene Farbe pro Material. Im Bereich „3 Fassade“ unter der Materialwahl (dünne Trennlinie) der Block
  **„Farbtöne“**: je Material, das gerade benutzt wird (Seiten, einzelne Wände, Stützen, Dach), **eine** Zeile mit Name,
  gewähltem Ton und kleinen runden Farbpunkten (gewählter Punkt dunkelblau umrandet, Tooltip = Name des Tons).
  Ein Klick färbt das Material überall sofort um, auch in „realistisch“; die Musterbilder der Materialzeilen ändern sich mit.
  Fugen, Bretter, Struktur werden aus der neuen Farbe abgeleitet, das Fugenbild bleibt gleich. Dachkanten: beim Startton
  die abgestimmte Kantenfarbe, sonst etwas dunkler als die Fläche. Materialien ohne Töne (Gründach, Pfosten-Riegel) erscheinen nicht.
  **Klinker:** ein Material „Klinker“ (Kennung bleibt `klinker-rot`), Töne rot (Start), anthrazit, hell weiß-bunt, braunviolett, schwarz.
  Alle Töne: Liste `FARBTOENE` in `materialien.js` (Werte siehe „Nächste Schritte“ → Sitzung 18).
  Gespeichert mit der Variante (`farbtoene`: nur abweichende Töne), „Laden“ stellt sie wieder her; ältere Varianten: Starttöne.
  Ältere Varianten mit „Klinker anthrazit“ werden beim Laden zu Klinker + Ton anthrazit (`alteKennungenUmstellen` in `app.js`).
  Vergleich: Name mit Ton, z. B. „Klinker · anthrazit“, „Schlicht hell · dunkel“, Musterbild im Ton der Variante.
  Getestet mit `Test-ArchiCAD.ifc`: Klinker braunviolett/weiß-bunt, Dach dunkel (Zeichnung und realistisch), Speichern → Laden,
  nachgestellte alte Variante mit Süd = Klinker anthrazit, Vergleich mit 3 Varianten. Testvarianten wieder gelöscht. Keine Fehler.
  Geändert: `materialien.js`, `app.js`, `index.html`, `style.css`. Versionsnummern alle `v=20`
  (`materialien.js` in `app.js`, `fassade.js`, `realistisch.js`; `fassade.js`, `realistisch.js`, `szene.js`, `app.js`, `style.css`).
  Probleme: Weil der Ton je Material überall gilt, kann man nicht mehr Nord rot und Süd anthrazit klinkern
  (bewusst so entschieden). Eine **alte** Variante mit beiden Klinkern zeigt im Vergleich weiter beide Farben (richtig),
  „Laden“ macht aber allen Klinker anthrazit. Mit echter Maus nur kurz geklickt (Test über Skript).
  **Geändert nach Test (Wunsch der Nutzerin): auch Holz, Putz und Fassadenplatten zusammengelegt.** Materialliste jetzt:
  Klinker, Holzfassade, Sichtbeton, Putz, Fassadenplatten, Glas, Pfosten-Riegel. Kennungen bleiben `holz-natur`, `putz-altweiss`,
  `platten-anthrazit`; `holz-vergraut`, `putz-sand`, `platten-silber` stehen in `ALTE_KENNUNGEN` und werden beim Laden
  zu Material + Ton (vergraut, sand, silbergrau). „Glas blaugrau“ heißt jetzt „Glas“ (Ton blaugrau). Namen zeigen den Ton
  immer mit, z. B. „Holzfassade · Lärche“, „Putz · ocker“. Die Dachmaterialien (Ziegel, Stehfalz) bleiben vorerst getrennt.
  Getestet: Einfamilienhaus, alte „Variante 1“ (Holz, Putz sand, Platten, Klinker anthrazit) lädt als Holzfassade, Putz · sand,
  Fassadenplatten, Klinker · anthrazit. Keine Fehler. Versionsnummern `v=20b` (`materialien.js`, `fassade.js`, `realistisch.js`,
  `szene.js`, `app.js`). Gleiche Grenze wie beim Klinker: alte Varianten mit z. B. Putz altweiß **und** Putz sand bekommen beim Laden einen Ton.
  **Außerdem (Wunsch der Nutzerin):** Farbpunkte nach Helligkeit sortiert, hell links → dunkel rechts (nur die Anzeige,
  `helligkeit` in `app.js`). Versionsnummer `app.js?v=20c`.
- Sitzung 18b (17.11.): Die Zahl der Außenwände („4 von 14 Wänden sind Außenwände“) steht nicht mehr oben in Bereich „2 Außenwände“,
  sondern klein und grau in Bereich „1 Modell“ in der zugeklappten Liste „Bauteile ▸“, als zweite Zeile unter den Bauteil-Anzahlen.
  Sie zählt weiter sofort mit, wenn eine Wand außen ↔ innen umgeschaltet wird (auch zugeklappt). Bereich 2 zeigt jetzt nur noch
  die Erklärungs-Ecke ▸ und bei Bedarf „Erkennung zurücksetzen“.
  Getestet mit `Test-ArchiCAD.ifc`: Zahl steht unter „Bauteile“, Klick auf eine Wand 4 → 3, „Erkennung zurücksetzen“ → 4. Keine Fehler.
  Geändert: `index.html`, `app.js`. Versionsnummer `app.js?v=21`. Probleme: keine.
  **Geändert nach Test (Wunsch der Nutzerin: noch unauffälliger, App möglichst unkompliziert):** Den Bereich „Außenwände“
  gibt es nicht mehr. Unter „Bauteile ▸“ steht jetzt „4 von 14 Wänden sind Außenwände (farbig). Falsch erkannt? Wand anklicken,
  um sie umzuschalten.“ Der Textknopf heißt jetzt „Außenwände zurücksetzen“ und steht unter „Bauteile ▸“ in Bereich 1,
  sichtbar nur, wenn eine Wand von Hand umgeschaltet wurde. Die Bereiche sind neu nummeriert:
  **1 Modell · 2 Fassade · 3 Fenster · 4 Kennwerte · 5 Varianten** (ältere Einträge in diesem Plan nennen noch die alten Nummern).
  Die Anleitung behält ihren Schritt „Außenwände prüfen“ (erklärt das Anklicken). Getestet mit `Test-ArchiCAD.ifc`:
  Klick auf eine Wand 4 → 3, Knopf erscheint, Zurücksetzen → 4, Knopf verschwindet. Keine Fehler. Versionsnummer `app.js?v=21b`.
- Sitzung 15 (17.11.): Sonnenstand und Schatten. Im 3D-Fenster unter „Zeichnung | Realistisch“ der Knopf **„Sonne“** (an = dunkelblau).
  Ist die Sonne an, erscheint darunter ein kleines Feld: Schnelltasten 21.3. / 21.6. / 21.12. (Jahr bleibt), Datum,
  Regler Uhrzeit (0–24 Uhr, 15-min-Schritte, deutsche Uhrzeit, Sommerzeit automatisch), Breite / Länge (Start Oldenburg 53,14° N, 8,21° O;
  übernommen beim Bestätigen, Unsinniges wird auf ±90° / ±180° begrenzt) und eine Zeile wie „Sonne 36° hoch, aus Westen (261°). MESZ.“
  Neue Datei `js/sonne.js`: Sonnenstand nach der vereinfachten Formel des US-Wetterdienstes (genau auf ca. 1°).
  Geprüft: 21.3. 12 Uhr Oldenburg 37° (= 90° − 53°), 21.12. 13 Uhr 13° (= 90° − 53° − 23,4°).
  `szene.js`: Die Sonne steht laut Datum/Uhrzeit (Norden = Plan-oben), Schlagschatten in **Zeichnung und Realistisch**;
  Glas wirft keinen Schatten. Ein unsichtbarer „Schattenboden“ unter dem Gebäude zeigt den Schatten auch ohne Gelände
  in der IFC. Sehr lange Schatten (tiefe Sonne) werden bei 4 × Gebäudegröße abgeschnitten. Zeichenstil mit Sonne: etwas weniger
  Grundlicht, damit die Schatten ruhig, aber deutlich sind; tiefe Sonne (unter 15°) in „realistisch“ wärmer.
  Sonne untergegangen: Hinweis im Feld, keine Schatten, nur Himmelslicht. Sonne aus: alles wie vorher.
  **Bilder:** Ist die Sonne beim Speichern an, haben die 5 Bilder Schatten; die Variante speichert Datum, Uhrzeit, Ort und Sonnenstand
  (`sonne`, sonst `null`). „Laden“ stellt die Sonne wieder ein bzw. schaltet sie aus; ältere Varianten lassen die Einstellung, wie sie ist.
  Vergleich: Zeile „Schatten“ unter den Ansichten (z. B. „21.12.2026, 13:00 Uhr (MEZ)“, darunter die Koordinaten, sonst „ohne“),
  nur wenn eine Variante Schatten hat. PDF: Zeile „Schatten: …“ unter dem Datum jeder Spalte und eine zweite Fußzeile mit Erklärung.
  Schnelligkeit: Der Schatten wird nur neu berechnet, wenn Sonne oder Bauteile sich ändern (nicht bei jedem Bild).
  Einfamilienhaus: ohne Sonne ca. 52 Bilder/s, mit Sonne ca. 45 (vorher ohne diesen Kniff nur 21).
  Getestet mit `Test-ArchiCAD.ifc` und dem Einfamilienhaus: Schattenrichtung stimmt (Sonne aus Westen → Schatten nach Osten),
  Realistisch, Speichern mit/ohne Sonne, Vergleich, PDF-Texte, Laden, Koordinaten. Testvarianten wieder gelöscht. Keine Fehler.
  Geändert: `szene.js`, `app.js`, `pdf.js`, `index.html`, `style.css`, neu `sonne.js`.
  Versionsnummern: `szene.js?v=22b`, `sonne.js?v=22`, `pdf.js?v=22` (in `app.js`), `app.js?v=22b`, `style.css?v=22b`.
  Probleme: Das PDF-Blatt wurde nur über seine Texte geprüft, nicht als Bild angesehen (der eingebaute Browser zeigt keine PDFs).
  Im schmalen Fenster deckte das Sonnen-Feld einen Teil des Modells ab (behoben, s. u.: jetzt zugeklappt). Der Schattenboden liegt auf Höhe
  der Gebäude-Unterkante: Bei Häusern mit Keller ohne Gelände in der IFC liegt der Bodenschatten deshalb auf Kellerhöhe.
  Mit echter Maus nicht ausprobiert (Test über Skript). Der Standort fürs PDF-Kopffeld (Text) und die Koordinaten der Sonne
  sind noch getrennt – das kann die Ortssuche (Sitzung 16) zusammenführen.
  **Geändert nach Test (Wunsch der Nutzerin: Feld verdeckte das Gebäude, Sonne ist eher untergeordnet):** Das Feld ist jetzt
  **zugeklappt**. Ist die Sonne an, steht links neben dem Knopf nur kurz Datum und Uhrzeit, z. B. „21.6. · 17:30 ▸“
  (Tooltip mit Sonnenhöhe und Richtung); ein Klick darauf klappt die Einstellungen auf (▾), ein zweiter wieder zu.
  Alles kleiner (Schrift 11 px, Feld 176 px statt 232 px breit): Datum ohne Beschriftung, Uhrzeit-Regler mit Zeit daneben,
  Breite und Länge nebeneinander („°N“, „°O“, ohne Pfeile im Feld), Infozeile kürzer.
  Getestet mit `Test-ArchiCAD.ifc` und echter Maus (Aufklappen, Regler, Zuklappen). Keine Fehler.
  Versionsnummern `app.js?v=22c`, `style.css?v=22c`.
  **Nochmals geändert (Wunsch der Nutzerin: auch Datum/Uhrzeit einklappen, spielerischer):** Statt „Sonne“ und der Kurzangabe
  gibt es ein **rundes Sonnensymbol** (aus = graue Umrisslinie, Strahlen drehen sich beim Daraufzeigen; an = gelbe Sonne mit
  leichtem Schein). Ist die Sonne an, erscheint links daneben ein kleiner runder Pfeil ▾ / ▴, der die Einstellungen auf- und zuklappt.
  Der **Uhrzeit-Regler zeigt den Tagesverlauf** als Himmelsfarbe, aus der Sonnenhöhe zu jeder Stunde an diesem Tag und Ort
  (Nacht dunkelblau, Dämmerung orange, Tag hellblau); der Griff ist eine kleine gelbe Sonne, nachts ein blasser Mond.
  **Entscheidung:** Sonnengelb (#f5b82e) ist die einzige Ausnahme von „eine Akzentfarbe“, nur für die Sonne.
  Getestet mit `Test-ArchiCAD.ifc` und Mausklicks (an, aufklappen). Keine Fehler. Versionsnummern `app.js?v=22d`, `style.css?v=22d`.

- Sitzung 15b (17.11.): Neues Design (Glassmorphism) nach der Design-Vision unten. Nur Aussehen und Aufbau, die Funktionen bleiben gleich.
  **Hintergrund:** dunkler Verlauf Nachtblau → Violett → Petrol mit weichen Farbflecken (Blau, Violett, Petrol, dunkles Grün, Grünschimmer).
  **Kopfleiste aus Glas:** „Fassaden-Tool“, Dateiname, die Schritte **Außenwände · Fassade · Fenster · Varianten** als Pillen
  (aktiver Schritt hell; ohne Modell gesperrt; im schmalen Fenster seitlich schiebbar), rechts „Anleitung“ und **„Variante speichern“** (Dunkelblau, rund).
  **Seitenleiste aus Glas (300 px):** zeigt nur den aktuellen Schritt. „Außenwände“ = IFC laden + Zahl der Außenwände + Zurücksetzen + „Bauteile ▸“.
  Nach dem Laden startet die App im Schritt „Außenwände“. Beim Wechsel des Schritts gehen „Einzelne Wände“ / „Einzelne Fenster“ aus
  (sonst würde ein Klick ins Modell unbemerkt etwas auswählen). „Varianten“ = Blick, Namensfeld, Liste, Vergleich/PDF.
  **Kennwerte:** eine kleine Zeile unten in der Seitenleiste („Fassade 83,1 m² · Fenster 15,5 m² · 19 %“), Tabelle je Seite mit ▸ aufklappbar.
  **Meldungen** zu den Varianten (gespeichert, geladen, gelöscht) erscheinen als kleine weiße Pille oben im 3D-Fenster und verschwinden nach 4 s (Fehler nach 12 s).
  **3D-Fenster:** runde Ecken, fast weiß (#f4f5f8); oben rechts untereinander die neuen **Ansichtsknöpfe 3D / N / O / S / W**,
  „Zeichnung | Realistisch“ und die Sonne, unten links die Maus-Legende – alles kleine helle Glas-Pillen.
  3D = eingestellter Blick aus „Varianten“, N/O/S/W = waagerecht und gerade auf die Fassade (dreht sich mit dem Gebäude wie die gespeicherten Ansichten);
  danach frei drehbar, der Knopf ist dunkelblau, bis man selbst dreht. Nebenbei: Beim Öffnen einer IFC startet die Kamera jetzt mit dem eingestellten
  Blick (Haus füllt das Fenster) statt mit dem alten festen Blick (Problem aus Sitzung 10b behoben).
  **Schrift:** Artifakt Element über `local(...)` (Fließtext Regular auf Glas, Anleitung Light, Überschriften Heavy); ohne die Schrift Helvetica/Arial.
  **Bleibt weiß:** gespeicherte Bilder (beim Fotografieren reinweiß, geprüft: Pixel 255/255/255), PDF, Variantenvergleich und großes Bild.
  Getestet (Browser 1440 × 900 und 1000 × 700) mit `Test-ArchiCAD.ifc` und Einfamilienhaus: Schritte, Ansicht Ost, Speichern aus dem Schritt
  „Varianten“, Meldung, Kennwerte aufklappen, Sonne an, Anleitung öffnen/Esc. Testvariante wieder gelöscht. Keine Fehler in der Konsole.
  Geändert: `index.html`, `style.css`, `app.js`, `szene.js`. Versionsnummern `app.js?v=23b`, `szene.js?v=23`, `style.css?v=23b`.
  Probleme: Ob die Schrift Artifakt bei dir richtig erscheint, hängt von ihrem Namen im System ab – bitte einmal ansehen.
  Mit echter Maus nur teilweise getestet (Schritte, Ansichtsknöpfe, Speichern ja; Regler und Einzelauswahl über die alten Funktionen).
  Variantenvergleich und PDF bewusst unverändert weiß (gelten als „Blatt“, nicht als Bedienung).
  **Geändert nach Test (Wunsch der Nutzerin):** Schritt **„Außenwände“ steht ganz rechts** (Fassade · Fenster · Varianten · Außenwände),
  nach dem Laden startet die App bei „Fassade“; ohne Modell ist „Außenwände“ aktiv, weil dort „IFC-Datei wählen“ sitzt.
  **Kennwerte-Zeile klebt nicht mehr** unten über dem Arbeitsbereich: sie steht nach dem Inhalt, aufgeklappt schiebt sie nichts zu,
  und beim Schrittwechsel klappt sie wieder zu. **Seitenleiste deckender** und farblich neutral (dunkles Grau statt nur Glas),
  die **Farbtöne** haben zusätzlich eine eigene Unterlage, damit die Farben echt wirken.
  **Nochmals geändert (Wunsch der Nutzerin, nach Versuchen hell/deckend und hell/durchsichtig):** Die Farbtöne-Unterlage ist
  **deckend mittelgrau** (#43464d, neutral, nichts scheint durch), Glas-Anklang nur über hellen Rand, Lichtreflex oben links
  und weichen Schatten; Schrift hell, gewählter Farbpunkt mit weißem Ring.
  **Entscheidung:** Hinter Farben, die man beurteilen soll, keine durchscheinenden Flächen (verfälschen die Farbe).
  Versionsnummern `app.js?v=23c`, `style.css?v=23f`.
  **Nachtrag (Wunsch der Nutzerin):** Seitenleiste schmaler, 3D-Fenster mindestens ca. **2/3 der Breite**:
  Breite = 30 % des Fensters, mindestens 210 px, höchstens 280 px (vorher fest 300 px). Unter 900 px Fensterbreite
  rücken die Zeilen enger zusammen (schmalere Beschriftung, kleinere Musterbilder und Vorschaubilder).
  Gemessen: Fenster 664 px breit → Leiste 210 px, 3D 412 px = 66 %. Versionsnummer `style.css?v=23h`.
  Problem: Im sehr schmalen Fenster werden lange Materialnamen in den Listen abgeschnitten (z. B. „Sichtbet…“), im normalen Browserfenster nicht.
  **Nachtrag (Wunsch der Nutzerin): Hintergrund ohne Lila**, eher grau-blau-grünlich: Verlauf `#16243a → #1f2c36 → #0f3a33`,
  Fleck oben rechts Graublau `#4f6b7c` statt Violett, oben links gedecktes Blau `#35618f`; Petrol, dunkles Grün und Grünschimmer bleiben.
  Listen-Hintergrund `#25313a`. Versionsnummer `style.css?v=23i`.
  **Nachtrag (Wunsch der Nutzerin):** Im Schritt „Fassade“ ist **„Alle Seiten gleich“ beim Start an** (Startmaterial „Alle“ = Klinker rot).
  Die Fenster starten weiter je Seite. Getestet: Start zeigt nur „Alle“, Materialwahl wirkt, aus/an wie bisher. Versionsnummer `app.js?v=23d`.
  **Entscheidung (Wunsch der Nutzerin, ändert Sitzung 6b):** Beim **Ausschalten** übernehmen die vier Seiten das Material von „Alle“
  (und bei Pfosten-Riegel dessen Felder); dann ändert man nur noch die Seite, die anders werden soll. Die eigene Auswahl je Seite
  im Hintergrund gibt es damit beim Material nicht mehr (Fenster-Schalter unverändert). Varianten laden stellt weiter genau den gespeicherten Stand her.
  Getestet: Alle = Putz → aus → alle vier Seiten Putz → Süd auf Klinker, 3D zeigt es sofort. Versionsnummer `app.js?v=23e`.
  **Nachtrag (Frage der Nutzerin „wo lade ich ein anderes Modell?“):** Seit „Außenwände“ ganz rechts steht, war „IFC-Datei wählen“ versteckt.
  Jetzt ist der **Dateiname in der Kopfleiste eine kleine Glas-Pille „Test-ArchiCAD.ifc · ändern“**; ein Klick öffnet die Dateiauswahl
  (Tooltip „… – klicken, um eine andere IFC-Datei zu laden“). Ohne Modell ist die Pille ausgeblendet. Ins Fenster ziehen geht weiter überall.
  Unter 900 px Fensterbreite: Kopfleiste kompakter (Titel kleiner, Dateiname gekürzt ohne „· ändern“, Schritte schmaler, seitlich schiebbar).
  Getestet: Klick auf die Pille öffnet die Dateiauswahl; 1440 px und 664 px breit angesehen. Versionsnummern `app.js?v=23f`, `style.css?v=23m`.
  **Nachtrag (Wunsch der Nutzerin):** Auch beim **Laden eines anderen Modells** steht die Fassade wieder auf **„Alle Seiten gleich“**
  (Material von „Alle“ bleibt, wie es war). Getestet: ArchiCAD-Test laden → Schalter aus → Einfamilienhaus laden → Schalter an, nur „Alle“ sichtbar.
  Versionsnummer `app.js?v=23g`.

- Sitzung 16 (17.11.): Ortssuche. Im aufgeklappten Sonnen-Feld über Breite/Länge ein Suchfeld „Ort suchen …“.
  Enter fragt OpenStreetMap (Nominatim), höchstens 1 Anfrage pro Sekunde, bis zu 5 Treffer mit voller Adresse (Tooltip zeigt alles),
  darunter „Suche: © OpenStreetMap-Mitwirkende“ (Link zur Lizenzseite). Klick auf einen Treffer setzt Breite/Länge (Schatten sofort neu),
  schreibt einen kurzen Namen (z. B. „Jade Hochschule, Oldenburg“) ins Suchfeld **und** in „Standort fürs PDF“ (dort frei änderbar).
  Von Hand geänderte Koordinaten löschen den Ortsnamen (er würde nicht mehr stimmen). Ohne Internet: „Suche geht gerade nicht …“.
  Der Ortsname wird mit der Sonne der Variante gespeichert; Vergleich und PDF zeigen z. B. „Rom (41,89° N, 12,48° O)“, ältere Varianten nur Koordinaten.
  Anleitung: „Nur die Ortssuche bei der Sonne fragt bei OpenStreetMap nach.“
  Getestet mit `Test-ArchiCAD.ifc`: Suche „Jade Hochschule Oldenburg“, „Rom“ (Sonne 37° → 48° hoch), „Wilhelmshaven“, echter Mausklick auf
  einen Treffer, Speichern, Vergleich, Laden, Koordinate von Hand. Testvariante wieder gelöscht. Keine Fehler.
  Geändert: `sonne.js`, `app.js`, `index.html`, `style.css`. Versionsnummern `sonne.js?v=24`, `app.js?v=24b`, `style.css?v=24`.
  Probleme: Die Meldung ohne Internet und das PDF-Blatt selbst wurden nicht ausprobiert (nur die Texte). Bei 3–4 Varianten kann die
  Schatten-Zeile im PDF gekürzt sein („…“), dann fehlen zuerst die Koordinaten. Der Standort für Sonne und PDF gilt nicht beim Neuladen
  der Seite (wieder Oldenburg, PDF-Feld leer), nur in gespeicherten Varianten.

- Sitzung 19 (18.11.): PDF-Einzelseiten. Unter „Kennwerte aufs PDF“ der Schalter **„Einzelseiten je Variante“** (Start aus),
  sichtbar erst ab 2 angekreuzten Varianten. An: nach der Übersichtsseite folgt je Variante eine eigene Seite A3 quer,
  aufgebaut wie das 1-Varianten-PDF (große Perspektive, Ansichten in einer Reihe, Kennwerte rechts bzw. ohne, wenn
  „Kennwerte aufs PDF“ aus ist). Titel der Einzelseite „Fassadenvariante 2 von 3“, Kopf und Fußzeile wie auf der Übersicht,
  unten rechts „Seite 3 von 4“ (nur bei mehreren Seiten). Gilt auch für den PDF-Knopf im Vergleich. Dateiname unverändert.
  Technik: `pdf.js` zeichnet jede Seite mit demselben Baustein (`seiteZeichnen`); die Bilder sind nur einmal in der Datei,
  das PDF wird dadurch kaum größer (3 Varianten: 923 KB → 944 KB).
  Getestet mit `Test-ArchiCAD.ifc` und 3 Testvarianten: Schalter aus = 1 Seite, an = 4 Seiten (Texte jeder Seite geprüft),
  Knopf im Vergleich = 4 Seiten, 1 Variante = Schalter versteckt und 1 Seite. Testvarianten wieder gelöscht. Keine Fehler.
  Geändert: `pdf.js`, `app.js`, `index.html`, `style.css`. Versionsnummern `pdf.js?v=25`, `app.js?v=25`, `style.css?v=25`.
  Probleme: Die Seiten wurden nur über ihre Texte geprüft, nicht als Bild angesehen (das Testfenster kann das PDF nicht anzeigen) –
  bitte einmal ein PDF mit Einzelseiten selbst öffnen. Der Schalter wird nicht gespeichert (nach Neuladen wieder aus).
  **Geändert nach Test (Wunsch der Nutzerin 18.11.):** Auf den Einzelseiten stehen **nie** Kennwerte (auch wenn „Kennwerte aufs PDF“ an ist),
  die Bilder werden dort dadurch größer; die Übersicht richtet sich weiter nach dem Schalter. Versionsnummern `pdf.js?v=25b`, `app.js?v=25b`.
  **Nachtrag (Wunsch der Nutzerin 18.11.):** In der Variantenliste steht unter dem Namen nur noch das Datum, ohne „Fensteranteil … %“
  (sonst zu voll; der Anteil steht weiter im Vergleich und im PDF). Versionsnummer `app.js?v=25c`.
  **Nochmals geändert (Wunsch der Nutzerin 18.11.):** Auf den Einzelseiten steht **gar kein Text** mehr außer den Kennzeichen auf den Bildern
  (z. B. „Perspektive aus Nordosten, 15°“, „N (NNW)“): kein Titel, kein Modell, kein Stand, kein Variantenname, keine Fußzeile.
  Die 5 Bilder sitzen mittig und so groß wie möglich auf dem Blatt. Die Seitenzahlen („Seite x von y“) sind ganz weggefallen.
  Reihenfolge der Einzelseiten = Spalten der Übersicht (älteste zuerst), der Name steht nur dort.
  Getestet mit Platzhalterbildern: Übersicht unverändert, Einzelseiten je 5 Bilder und nur deren Kennzeichen. Versionsnummern `pdf.js?v=25d`, `app.js?v=25d`.
  **Nachtrag (Wunsch der Nutzerin 18.11.):** Material **„Glas“ ist nicht mehr wählbar** (Fassade je Seite, „Alle“, Stützen, einzelne Wände);
  für Glasfassaden gibt es Pfosten-Riegel. Glas bleibt im Hintergrund erhalten (`ausgeblendet: true` in `materialien.js`), damit alte
  Varianten mit Glas weiter richtig laden und „Glas“ anzeigen. Getestet mit `Test-ArchiCAD.ifc` in einem zweiten Tab: alle Listen ohne Glas,
  gesetzter Wert „glas“ zeigt weiter „Glas“, keine Fehler. Versionsnummern `materialien.js?v=25` (in `app.js`, `fassade.js`, `realistisch.js`),
  `fassade.js?v=25`, `realistisch.js?v=25`, `szene.js?v=25`, `app.js?v=25e`.
  **Nachtrag (Wunsch der Nutzerin 18.11.):** Dachmaterial „Schlicht hell“ heißt jetzt nur **„Schlicht“** (bei den Farbtönen „Dach: Schlicht“).
  Nur der Name in `materialien.js`, die Kennung `dach-hell` bleibt, alte Varianten laden weiter. Versionsnummern alle `v=25f`
  (`materialien.js` in `app.js`, `fassade.js`, `realistisch.js`; `fassade.js`, `realistisch.js`, `szene.js`, `app.js`).

- Sitzung 19b (18.11.): Bilder und PDF auch „realistisch“. „Variante speichern“ macht die 5 Bilder jetzt in der Darstellung,
  die gerade im 3D-Fenster eingestellt ist (Zeichnung oder Realistisch), für Perspektive **und** Ansichten N/O/S/W.
  Hintergrund der Bilder bleibt weiß (kein Himmel), die Spiegelung des Himmels in den Materialien bleibt.
  Die Darstellung wird mit der Variante gespeichert (`darstellung`); ältere Varianten gelten als Zeichnung.
  Vermerk an der Perspektive: im Vergleich „SO · 15° · realistisch“, im großen Bild und im PDF „Perspektive aus Südosten, 15° · realistisch“.
  Variantenliste unverändert, „Laden“ schaltet die Darstellung im 3D-Fenster nicht um.
  Technik: `realistischZeichnen` in `szene.js` nimmt jetzt eine Kamera und kann ohne Himmel zeichnen; `bilderAufnehmen` nutzt es.
  Getestet mit `Test-ArchiCAD.ifc`: je eine Variante realistisch und Zeichnung gespeichert, alle Bilder angesehen
  (realistisch: Texturen, Licht- und Schattenseiten, weißer Hintergrund; Zeichnung wie bisher), Vergleich zeigt den Vermerk nur bei der
  realistischen. Testvarianten wieder gelöscht. Keine Fehler. Geändert: `szene.js`, `app.js`, `index.html`. Versionsnummern `szene.js?v=26`, `app.js?v=26`.
  Probleme: Das PDF selbst wurde nicht erzeugt/angesehen (gleicher Beschriftungs-Baustein wie im Vergleich) – bitte einmal selbst ein PDF
  mit einer realistischen Variante speichern.

## Design-Vision (Entwurf 17.11., in Sitzung 15b umgesetzt)
Mit der Nutzerin als Testseite entworfen und abgestimmt („erstmal so festhalten“). Umbau später in einer eigenen Sitzung.
- **Stil:** Glassmorphism – halbtransparente Glaskarten mit Unschärfe vor einem dunklen, farbigen Verlauf,
  feine helle Ränder, weiche Schatten, viel Luft.
- **Hintergrund:** dunkler Verlauf Nachtblau → Graublau → Petrol (Grundton `linear-gradient(135deg, #16243a, #1f2c36, #0f3a33)`,
  **geändert 17.11.: kein Lila mehr**), darüber weiche Farbflecken: Blau `#35618f` oben links, Graublau `#4f6b7c` oben rechts, Petrol `#12807a` unten rechts,
  **dunkles Grün** `#1c5c39` unten links (nach Rückmeldung abgedunkelt) und ein leichter Grünschimmer in der Mitte.
- **Gläser (Kopfleiste, Seitenleiste):** sehr durchsichtig und spiegelnd: Weiß 3–20 % mit Lichtreflex oben links,
  Unschärfe ca. 16 px, helle Oberkante, Ecken ca. 22 px rund. Schrift darauf fast weiß (`#eef2f8`), Regular statt Light.
- **3D-Fenster:** fast weiß (ca. 84 % deckend), damit die Materialfarben echt wirken; Schrift dort dunkelgrau (`#2c3445`), nie ganz schwarz.
  Das 3D-Fenster nimmt den größten Teil der Fläche ein, das Haus füllt es fast ganz.
- **Aufbau:** oben eine Glas-Kopfleiste mit App-Name, Dateiname, den Schritten **Außenwände · Fassade · Fenster · Varianten**
  (ohne Nummern, aktiver Schritt als helle „Pille“) und rechts „Variante speichern“ (Dunkelblau, rund).
  Passen die Schritte nicht hinein, lassen sie sich mit einer dünnen Glas-Schiebeleiste seitlich schieben.
  Links eine Glas-Seitenleiste nur mit dem aktuellen Schritt (Seitenleiste ca. 300 px, Schiebeleiste ebenfalls aus Glas).
  Im 3D-Fenster oben rechts kleine Glas-Knöpfe 3D / N / O / S / W, unten links die Maus-Legende als Glas-Pille.
  **Entscheidung (17.11., vor Sitzung 15b):** Die Knöpfe 3D / N / O / S / W kommen in Sitzung 15b mit und funktionieren
  (Klick dreht die Kamera auf die Perspektive bzw. gerade auf die Ansicht Nord/Ost/Süd/West, danach wieder frei drehbar).
- **Kennwerte:** klein, als eine Zeile unten in der Seitenleiste (nicht zentral, Wunsch der Nutzerin).
- **Schrift:** Artifakt Element (Autodesk): Fließtext **Light**, Überschriften **Heavy**, größer und schwer.
  Bei der Nutzerin installiert (kommt mit Revit). Schriftdatei **nicht** auf GitHub (Lizenz Autodesk); wer sie nicht hat,
  sieht Helvetica/Arial. Einbinden über `@font-face` mit `local("Artifakt Element Light")` usw.
- **Ruckel-Test (17.11.):** Einfamilienhaus mit Glas-Effekten in der echten App 4 s gedreht: ca. 50 Bilder/s, ohne Glas ca. 51 –
  kein Unterschied. Nur auf diesem Rechner gemessen; über dem 3D-Bild nur wenige, kleine Glas-Elemente verwenden.

## Nächste Schritte
- **Sitzung 20e (erledigt 18.11.):** Unter jeder Ansicht steht jetzt „Ansicht Nord“ usw. statt „N“ bzw. „N (NNW)“ – im PDF,
  unter den Bildern im Vergleich und als Titel des großen Bildes. Neue Funktion `fassadenRichtung` in `app.js` (ersetzt
  `genaueRichtung`): erst auf 16 Stufen runden, eine Zwischenstufe wie NNW zählt zur Hauptrichtung → Schrägrichtungen
  (Nordost …) nur bei etwa 34°–56° Drehung. Rundung mit Drehungen von 0° bis 200° nachgerechnet (Grenzen 33,7°/33,8° und
  56,2°/56,3° stimmen). Getestet mit `Test-Neu.ifc` (nicht gedreht): Vergleich und PDF zeigen „Ansicht Nord/Ost/Süd/West“, keine Fehler.
  Hinweis: Längste Beschriftung („Ansicht Nordwest“) ist im PDF ca. 20 mm breit; erst bei einer Fassade unter ca. 6 m in 1:500
  könnte sie in die nächste Ansicht ragen. Neue Testvarianten „Variante 3/4“ von Test-Neu.ifc im Speicher.
  Versionsnummern `app.js?v=49`, `pdf.js?v=26e` (nur Kommentar geändert).
- **Sitzung 20f (erledigt 18.11.):** Ansichten ohne Schatten. Für jede der 4 Ansichten (nur gespeicherte Bilder, Vergleich, PDF)
  stellt `lichtVonVorneSetzen` die Sonne hinter den Betrachter, etwas nach links und oben; kein Bauteil wirft Schatten,
  Schattenboden aus. Danach stellt `bilderAufnehmen` Sonne und Schatten fürs 3D-Fenster zurück. `realistischZeichnen`
  setzt die feste Sonne (ohne Sonnenstand) dann nicht. Hinweis: In einer geraden Ansicht sieht man Laibungen und
  Rücksprünge kaum als Fläche, sie zeigen sich über die Kantenlinien (echte Schlagschatten wären eine eigene Sitzung).
  Getestet mit `Test-Neu.ifc`: Zeichnung ohne Sonne und Aquarell mit Sonne (11:30) – alle 4 Ansichten gleich hell,
  3D-Fenster behält Sonne und Schatten, keine Fehler. Zwei Testvarianten („Variante 1/2“ von Test-Neu.ifc) noch im Speicher.
  Versionsnummern `szene.js?v=45` (in `app.js`), `app.js?v=48c`.
- **Sitzung 20d (erledigt 18.11.):** Löschen fragt jetzt im Knopf nach statt mit `confirm()`: 1. Klick → rotes „Wirklich löschen?“,
  2. Klick innerhalb von 4 s löscht, sonst springt der Knopf zurück. Ein Doppelklick löscht nicht (2. Klick zählt erst ab 0,4 s).
  Nur `app.js` (v=48b) und `style.css` (v=29b). Getestet im App-Browser: Nachfrage erscheint, Doppelklick löscht nicht,
  2. Klick löscht („Test A“, „Test B“ gelöscht), nach 4 s zurück zu „Löschen“. Keine neuen Fehler in der Konsole.
  Probleme: keine. (In der Konsole standen nur alte, erwartete Hinweise von PDF-Versuchen mit Varianten von vor 20c.)
- **Sitzung 20c (erledigt 18.11.):** Umgesetzt wie unten geplant. `szene.bilderAufnehmen` liefert jetzt `{ bilder, masse }`
  (je Ansicht Bildgröße und Gebäudelage in Metern), `app.js` speichert `masse` mit der Variante. `pdf.js` schneidet jede Ansicht
  aufs Gebäude zu, setzt sie in mm (Meter × 1000 ÷ Maßstab) auf eine gemeinsame Unterkante mit dünner Geländelinie, ohne Rahmen.
  Auswahl „Maßstab“ (1:50/1:100/1:200/1:500, Start 1:100) ersetzt das Feld „Standort fürs PDF“. Unten rechts „Ansichten M 1:…“.
  **Zusätzlich (beim Testen nötig geworden):** Die App probiert mehrere Anordnungen und nimmt die mit der größten Perspektive –
  Varianten nebeneinander (Spalten) oder **untereinander (Zeilen)**; bei 1 Variante steht die Kennwerte-Tabelle neben der
  Perspektive, rechts oder darunter. Hinweis in der Anleitung: beim Drucken „Tatsächliche Größe“.
  Versionen: `szene.js?v=44`, `pdf.js?v=26d`, `app.js?v=47`, `style.css?v=28`.
  Getestet mit Test-Neu.ifc (Südseite 20,0 m): im PDF 1:100 genau 200 mm (+1 mm Bildrand) ✓. 1 Variante 1:100 mit Kennwerten ✓;
  2 Varianten 1:200 mit Einzelseiten (3 Seiten) ✓; 3 Varianten 1:200 untereinander ✓; alte Variante → Hinweis „bitte neu speichern“ ✓;
  2 Varianten 1:100 → Hinweis „bitte 1:200 wählen“ ✓; echter Knopf in der App ✓. Keine Fehler in der Konsole.
  Probleme/Grenzen: 4 Varianten eines 20-m-Hauses passen erst in 1:500 (A3 ist dafür zu klein). Das PDF wurde über eine
  nachgezeichnete Vorschau geprüft, nicht in einem PDF-Programm geöffnet – die Nutzerin sollte einmal ein PDF öffnen und nachmessen.
  Beim Testen sind 4 Test-Varianten „Test A–D“ zu Test-Neu.ifc im Browser entstanden (dürfen gelöscht werden).
- **Sitzung 20c (Planung, Wunsch der Nutzerin 18.11.):** PDF maßstäblich und ohne Schrift. Geklärt mit der Nutzerin:
  - **Maßstab fest wählbar** beim PDF: Auswahlfeld 1:50 / 1:100 / 1:200 / 1:500 (Start 1:100). Kein „automatisch“.
    Alle Ansichten N/O/S/W **aller Varianten auf dem Blatt** im selben Maßstab, damit man sie vergleichen kann.
    Passt der Maßstab nicht aufs Blatt, wird kein PDF gemacht, sondern ein Hinweis: „Passt in 1:100 nicht aufs Blatt, bitte 1:200 wählen“.
  - **Die Perspektive bleibt ohne Maßstab** (geht bei einer Perspektive nicht) und füllt den übrigen Platz.
  - **Schrift auf den Blättern nur noch:** die Kennzeichen der Bilder (N/O/S/W bzw. „Perspektive aus Südosten, 15°“) und
    einmal pro Blatt der Maßstab („M 1:100“). Weg fallen: Titel, Modell, Standort, Stand, „Fassaden-Tool“, Variantennamen,
    Datum, Schatten-Zeile und Fußzeile – auf Übersicht und Einzelseiten. Das Feld „Standort fürs PDF“ verschwindet damit.
  - **Kennwerte angekreuzt:** dann zusätzlich nur die Kennwerte-Tabelle mit ihrer kurzen Erklärung (m², Anteil = Fenster ÷ Fassade).
  - Vorschlag zur Anordnung: Ansichten einer Variante stehen auf einer gemeinsamen Unterkante (wie in einer Bauzeichnung),
    ohne Rahmen ums Bild (der Rahmen zeigte sonst nur den weißen Bildrand, nicht das Gebäude).
  - Technisch: Beim Speichern einer Variante merkt sich `szene.js` (`bilderAufnehmen`), wie viele Meter jedes Ansichtsbild breit
    und hoch ist und wo die Gebäudeunterkante liegt; `app.js` speichert das mit der Variante; `pdf.js` setzt die Bilder danach
    in mm aufs Blatt (Meter × 1000 ÷ Maßstab). Ältere Varianten kennen diese Maße nicht → Hinweis „bitte neu speichern“.
    `index.html` (Auswahlfeld), Versionsnummern erhöhen.
  - Hinweis für die Anleitung: beim Drucken „Tatsächliche Größe“ wählen, nicht „An Seite anpassen“, sonst stimmt der Maßstab nicht.
  - Testen: im PDF eine bekannte Wandlänge nachmessen (z. B. 10 m in 1:100 = 10 cm), mit 1 und 4 Varianten, mit Einzelseiten,
    mit und ohne Kennwerte, alter Variante (Hinweis) und zu großem Maßstab (Hinweis).
- **Sitzung 20 (erledigt 18.11.):** Die Nutzerin hat laufend mit eigenen IFC-Dateien getestet, alles funktioniert. Keine Fehler zu beheben.
- **Sitzung 20b (erledigt 18.11.):** Umgesetzt wie unten geplant. Das Glas der Pfosten-Riegel-Wand hat Texturkoordinaten 0–1 über die
  ganze Wand und die Markierung `raumLicht` (`fassade.js`). Im Aquarell malt `raumLichtMalen()` (`szene.js`) einen kleinen Verlauf
  (oben warm, unten fast Dunkelblau), Stärke = Anteil leuchtender Fenster ÷ 0,25 (voll an, sobald ein Viertel der Fenster leuchtet).
  Versionsnummern `fassade.js?v=25g`, `szene.js?v=43c`, `app.js?v=46c`.
  **Nachtrag (Wunsch der Nutzerin: soll immer gehen, auch bei einzelnen Wänden):** Einzelne Wände mit Pfosten-Riegel leuchten genauso.
  Bisher blieb eine Glaswand dunkel, solange sie ausgewählt war oder die Maus darüber stand; jetzt leuchtet sie auch dann
  (die Auswahl zeigen die dunkelblauen Profile). Getestet: einzelne Wand gewählt, Pfosten-Riegel, 18:30 → leuchtet; Zeichnung zeigt
  die blaue Auswahl wie bisher. Normale Fenster bleiben ausgewählt weiter blau (unverändert).
  Getestet mit Test-Neu.ifc, alle Seiten Pfosten-Riegel, Aquarell mit Sonne, 18.11. in Oldenburg: 15:00 zarter Schimmer,
  18:30 warmer Raum mit Verlauf, 03:00 dunkel. Keine Fehler in der Konsole.
  Probleme: Bei Test-Neu.ifc ist jede Wand ein Geschoss hoch, dort sitzt das Licht richtig unter jeder Decke. Geht eine Wand
  über mehrere Geschosse, wirkt sie wie eine hohe Halle. Die Animation wurde nur über den Regler geprüft, nicht über ▶.
- **Sitzung 20b (Planung, Wunsch der Nutzerin 18.11.):** Licht hinter der Pfosten-Riegel-Fassade im Aquarell.
  Bisher: Die ganze Glaswand zählt wie **ein** Fenster – sie ist entweder ganz dunkel oder auf einmal ganz hell
  (meist dunkelblau, weil eine einzige Zufallszahl über die ganze Wand entscheidet).
  Vorschlag (geändert nach Rückmeldung: nicht jedes Feld einzeln, sondern **ein ganzer Raum hinter der Fassade**):
  - **Die ganze Glaswand leuchtet zusammen**, wie ein beleuchteter Raum dahinter. Sie geht abends schon mit den
    ersten Fenstern an (nicht per Zufall erst spät) und nachts zusammen mit den letzten wieder aus, jeweils weich ein- und ausgeblendet.
  - **Zarter als die Fenster:** warm, aber schwächer leuchtend, Pfosten und Riegel bleiben dunkel davor.
  - **Wie von einer Deckenlampe:** oben heller warmer Schein, der nach unten ins Dunkelblau ausläuft (Verlauf über die ganze Wandhöhe).
    Geht die Glaswand über mehrere Geschosse, wirkt sie wie eine hohe Halle (Geschosse kennt die Wand nicht).
  - Nur im Aquarell, wie die Fensterlichter. Zeichnung, Realistisch, Bleistift, Kennwerte und PDF bleiben unverändert.
  - Technisch: `szene.js` (Leuchten im Aquarell), evtl. kleine Markierung des Glases in `fassade.js`; Versionsnummern erhöhen.
  - Testen mit Test-Neu.ifc/Einfamilienhaus, eine Seite Pfosten-Riegel, Animation über den Abend laufen lassen.
- **Nachtrag 2 zu 19e (erledigt 18.11.):** Umgesetzt wie unten geplant, nur `szene.js` (v=42, `app.js` v=45).
  Leuchtende Fenster mindestens 60 % warm getönt. Getestet am 18.11. in Oldenburg: 14:15 (Sonne 13°) erstes Fenster an,
  15:45 (Sonne 4°) mehrere, 23:00 einige wieder aus. Keine Fehler in der Konsole. Probleme: keine.
- **Nachtrag 2 zu 19e (Planung, Wunsch der Nutzerin 18.11.):** Fensterlichter im Aquarell zeitlich weiter auseinanderziehen,
  die ersten früher an und früher aus. Bisher: alle gleichzeitig an bei Sonne < 10°, 23–2 Uhr aus, 5–7 Uhr an, alle
  gleichzeitig aus bei Sonne > 10°. Vorschlag (`lichterAnteil` in `szene.js`): abends nach und nach an von Sonne 14° bis −4°;
  nachts nach und nach aus von 21 bis 2 Uhr; morgens 5–7 Uhr an und nach und nach aus, bis die Sonne 14° hoch steht.
  Leuchtende Fenster dafür auch bei noch hoher Sonne schon warm getönt (sonst sieht man die ersten nicht).
- **Nachtrag 19e (erledigt 18.11., Wunsch der Nutzerin):** Abspiel-Knopf sitzt jetzt in der oberen Zeile links neben Pfeil
  und Sonnenknopf, nur bei eingeschalteter Sonne zu sehen (auf- und zugeklappt). Während die Animation läuft, steht links
  daneben klein die Uhrzeit als Glas-Pille. `index.html`, `style.css` (v=27), `app.js` (v=44).
  Getestet: Sonne aus → kein Knopf; an + zugeklappt → Knopf da, Uhrzeit läuft mit; Sonne aus während der Animation → stoppt,
  Knopf weg; aufgeklappt → Knopf bleibt oben. Keine Fehler in der Konsole. Probleme: keine.
- **Sitzung 19e (erledigt 18.11.):** Abspiel-Knopf ▶/⏸ (Sonnengelb), zuerst links neben dem Uhrzeit-Regler (s. Nachtrag).
  Läuft 24 Stunden ab der eingestellten Uhrzeit in 20 s (`TAGESVERLAUF_DAUER` in `app.js`), minutengenau, über Mitternacht,
  und hält am Ende wieder bei der Startzeit an. Stoppt auch, wenn man selbst am Regler zieht, die Sonne ausschaltet oder eine
  Variante lädt. Geändert: `index.html`, `style.css` (v=26), `app.js` (v=43).
  Getestet mit Test-Neu.ifc im Aquarell: 10:15 → 12:36 → … → 00:43 → … → 10:15 in 20 s, flüssig; Pause hält bei 17:26 an.
  Keine Fehler in der Konsole. Probleme: keine. Hinweis: Nach einer Pause steht die Uhr auf einer krummen Minute
  (z. B. 17:26), der Regler zeigt dann die nächste Viertelstunde.
- **Sitzung 19e (Planung, Wunsch der Nutzerin 18.11.):** Sonnenverlauf als kleine Animation, gedacht vor allem fürs Aquarell
  (Schatten wandern, am Ende Abendlicht mit lila-orangem Himmel und leuchtenden Fenstern). Geklärt mit der Nutzerin (18.11.):
  - **Nur ansehen**, kein Video-Export: Abspiel-Knopf (▶/⏸) neben dem Uhrzeit-Regler im Sonnen-Feld.
  - Die App schiebt den Uhrzeit-Regler selbst weiter, Modell bleibt dabei drehbar.
  - **Start bei der Uhrzeit, die gerade am Regler steht** (beim Öffnen der Seite ist das „jetzt“, s. Sitzung 19c), und
    **genau 24 Stunden** bis zur selben Uhrzeit am nächsten Tag (Wunsch der Nutzerin 18.11.). Um Mitternacht springt der
    Regler von 23:45 auf 0:00 weiter; das Datum bleibt gleich (ein Tag Unterschied ändert den Sonnenstand kaum).
    Nachts zeigt der Regler wie gehabt den Mond, keine Schatten. Vorschlag Dauer: ca. 20 s für die 24 Stunden.
    Am Ende hält die Animation an, der Regler steht wieder auf der Startzeit.
  - Läuft in jeder Darstellung, wirkt aber im Aquarell am schönsten. Schaltet bei Bedarf die Sonne ein.
  - Vor Sitzung 20 eingeschoben, damit sie beim Test mitgeprüft wird. Wenn es ruckelt (Aquarell malt jedes Bild neu):
    weniger Bilder pro Sekunde.
- **Sitzung 19c (erledigt 18.11.):** Beim Öffnen der Seite steht die Sonne auf **heute und jetzt** (deutsche Uhrzeit,
  auf die Viertelstunde gerundet wie der Regler, höchstens 23:45), Ort weiter Oldenburg. Danach frei verstellbar; die eigene
  Einstellung bleibt bis zum Neuladen. Geladene Varianten mit Sonne bringen weiter ihr gespeichertes Datum/Uhrzeit mit.
  Nachts steht die Sonne unter dem Horizont: Regler zeigt den Mond, keine Schatten (gab es schon). Nur `app.js` geändert (v=27).
  Getestet: 09:33 Uhr → Regler 09:30, Datum 18.11.2026, keine Fehler. Probleme: keine.
- **Sitzung 19d (erledigt 18.11.):** Umschalter im 3D-Fenster hat vier Knöpfe: Zeichnung · Realistisch · Aquarell · Bleistift.
  Neue Datei `js/stile.js` (`Nachbearbeitung`): zeichnet den Zeichenstil in ein unsichtbares Bild mit Tiefe und übermalt es
  mit einem Shader. Aquarell: Farbe blasser, weich verlaufen, fleckig, Papierkorn, leichte Farbränder, feine graue Kanten,
  graublaue Himmels- und graugrüne Bodenwäsche ums Gebäude, Bildrand läuft ins Weiß aus. Abendlicht: ist die Sonne an und
  steht tiefer als 10° (ganz ab 4° unter dem Horizont), wird der Himmel lila-orange, das Licht kühler, die Fenster
  (Material `MATERIAL.fenster`) leuchten warm. Bleistift: nur Grau, zittrige Kanten, Schraffur je nach Dunkelheit in bis zu
  drei Richtungen (helle Flächen frei), Papierkorn. Im 3D-Fenster warmes Papier (#fbfaf7), gespeicherte Bilder weiß.
  `szene.stil` ersetzt `szene.realistisch`; Variante speichert `darstellung` ('aquarell'/'bleistift'), Vermerk „· Aquarell“/„· Bleistift“
  im Vergleich und im PDF (wie „· realistisch“).
  **Nachgebessert (Wunsch der Nutzerin, gleiche Sitzung):** Aquarell weniger unscharf, Farbschicht gegen die Linien
  verschoben (malt locker über den Umriss, lässt mal einen weißen Spalt), mehr Grün unten (Wiesenwäsche in der unteren
  Bildhälfte; tief liegende waagerechte Flächen – bis 1,5 m über dem tiefsten Wandpunkt – und das IFC-Gelände werden Wiese).
  Sonne an (Aquarell und Bleistift): kräftigere Schatten (weniger Grundlicht, Schatten auf dem Boden dunkler),
  im Aquarell leicht blau-violett. Bleistift: keine strenge Kreuzschraffur mehr – lange, unterschiedlich kräftige Einzelstriche
  in einer Hauptrichtung (ca. 60°), dichter durch Zwischenstriche, erst sehr dunkle Stellen bekommen eine leicht gedrehte
  zweite Lage; sonnige Flächen bleiben frei.
  **Zweite Nachbesserung (Wunsch der Nutzerin):** Schatten bei beiden noch stärker (Grundlicht ×0,4, Sonne ×1,35,
  Bodenschatten 60 %). Bleistift zarter: Striche enger (5,5 statt 8), feiner und heller, Schatten zusätzlich als leichter
  grauer Grundton. Aquarell stellenweise scharf (fleckig verteilt ungewischte Farbe), Grün unten weniger und gedämpfter.
  **Dritte Nachbesserung (Wunsch der Nutzerin):** Aquarell-Gläser tagsüber dunkler (#76889c). Tiefe Nacht (Sonne 4° bis 18°
  unter dem Horizont): Himmel nachtblau, Licht und Gelände dunkler. Fensterlichter nach Uhrzeit (`szene.uhrzeit` aus `app.js`):
  bis 1 Uhr alle an, 1–3 Uhr gehen sie nach und nach aus (jedes Fenster mit fester Zufallszahl aus seiner Lage),
  3–4 Uhr ganz dunkel, 4–6 Uhr gehen wieder Lichter an (eigene Ergänzung, der Nutzerin gesagt). Fenster ohne Licht dunkelblau.
  Getestet: 13:00, 18:00, 23:00, 02:00 (etwa die Hälfte an), 03:30 (alles dunkel), keine Fehler.
  **Zeitplan der Lichter geändert (Wunsch der Nutzerin):** bis 23 Uhr alle an, 23–24 Uhr gehen wenige einzelne aus (noch 85 %),
  0–2 Uhr nach und nach die übrigen, 2–5 Uhr ganz dunkel, 5–7 Uhr nach und nach wieder an. Getestet: 22:30, 23:45, 01:00, 03:00, 06:00.
  Versionsnummern: `stile.js?v=14` (in `szene.js`), `szene.js?v=41` (in `app.js`), `app.js?v=42` (in `index.html`).
  Getestet mit dem Einfamilienhaus: Aquarell am Tag (12:00, 13:00, 15:00) und am Abend (16:45), Bleistift mit Sonne (13:00), Perspektive und Ansicht S,
  Vergleich mit Vermerk, Realistisch und Zeichnung weiter in Ordnung, keine Fehler in der Konsole. Testvarianten wieder gelöscht.
  Probleme: Die Muster (Rauschen, Schraffur) hängen am Bildschirm, nicht am Gebäude – beim Drehen „gleitet“ das Gebäude
  unter dem Papier (bei Zeichenstilen üblich). Die Abendstimmung im Aquarell sieht man nur mit eingeschalteter Sonne.
  Höher liegendes Gelände (mehr als 1,5 m über dem tiefsten Wandpunkt, z. B. bei Keller) bleibt im Aquarell grau.
  Bei Sonne um 15 Uhr im November liegt fast alles im Schatten, das Aquarell wirkt dann insgesamt grau. Die Inspo-Bilder der Nutzerin liegen nicht im Projekt.
- **Sitzung 19d (Planung, Wunsch der Nutzerin 18.11.):** Weitere Stile für die Darstellung, neben „Zeichnung“ und „Realistisch“:
  **Aquarell** und **Bleistiftzeichnung**. Geklärt mit der Nutzerin (18.11.):
  - **Beide Stile** in dieser Sitzung.
  - **Umschalten:** zwei weitere Knöpfe im Umschalter im 3D-Fenster: Zeichnung · Realistisch · Aquarell · Bleistift.
  - **Bilder und PDF:** wie „Realistisch“ seit 19b – gespeichert wird im gewählten Stil, das PDF vermerkt den Stil.
  - **Aquarell** nach den Inspo-Bildern der Nutzerin (nicht im Repo): Grundlage hell und zurückhaltend (Bild 2):
    blasse Materialfarben, feine graue Bleistiftkanten, Papierstruktur, Bildrand läuft weich ins Weiß aus.
    Dazu Abendlicht aus Bild 1: Steht die Sonne tief oder ist sie untergegangen, wird der Himmel lila-orange
    verlaufen und die Fenster leuchten warm.
  - **Bleistift:** nur Grautöne, leicht zittrige Kantenlinien, dunkle Seiten und Schatten schräg schraffiert, helles Papier.
  - Technik-Idee: Nachbearbeitung des fertigen 3D-Bildes (Kanten finden, Farbe aufhellen/verwischen, Papier und
    Schraffur darüberlegen), damit beide Stile dieselbe Grundlage nutzen.
  Aufwendig: Wenn die Zeit knapp wird, zuerst das Abendlicht im Aquarell weglassen, dann einen der beiden Stile.
- **Sitzung 19b (erledigt, s. o.; Wunsch der Nutzerin 18.11., nach Sitzung 19):** Die Darstellung „realistisch“ soll auch aufs PDF.
  Stand heute: Die 5 Bilder einer Variante werden beim Speichern immer im Zeichenstil gemacht; „realistisch“ gilt nur im 3D-Fenster.
  Technisch machbar: `szene.js` kann ein Bild schon realistisch zeichnen (`realistischZeichnen`), das lässt sich beim Fotografieren nutzen.
  Gilt nur für neu gespeicherte Varianten (alte haben keine realistischen Bilder). Vor dem Bauen klären:
  (1) Werden die Bilder in der Darstellung gemacht, die gerade im 3D-Fenster eingestellt ist, oder immer beide (doppelter Speicher)?
  (2) Gilt es auch für die 4 Ansichten oder nur für die Perspektive? (3) Wie wählt man es fürs PDF bzw. im Vergleich aus?
  **Entschieden (18.11., mit der Nutzerin):** (1) Die Bilder entstehen in der Darstellung, die gerade im 3D-Fenster
  eingestellt ist (kein doppelter Speicher). (2) Gilt für alle 5 Bilder (Perspektive + N/O/S/W).
  (3) Keine eigene Auswahl fürs PDF; die Darstellung wird mit der Variante gespeichert, Vergleich und PDF zeigen
  einen kleinen Vermerk „realistisch“ an der Perspektive. Variantenliste bleibt unverändert.
- **Sitzung 19 (erledigt, s. o.; Entscheidung 17.11., vor dem Bauen):** PDF-Einzelseiten. Neuer Schalter „Einzelseiten je Variante“
  unter „Kennwerte aufs PDF“, **Start aus** (aus = PDF wie bisher). An und ab 2 angekreuzten Varianten: nach der
  Übersichtsseite folgt je Variante eine eigene Seite A3 quer, aufgebaut **wie das 1-Varianten-PDF** (große Perspektive,
  Ansichten in einer Reihe, Kennwerte rechts – richtet sich nach „Kennwerte aufs PDF“). Kein Material, keine Fenstergrößen.
  Bei nur 1 Variante gibt es keine zusätzliche Seite. Gilt auch für den PDF-Knopf im Vergleich.
- **Sitzung 16 (Entscheidung 17.11., vor dem Bauen):** Ortssuche. Suchfeld im aufgeklappten Sonnen-Feld über Breite/Länge,
  gesucht wird erst bei Enter (OpenStreetMap/Nominatim, höchstens 1 Anfrage pro Sekunde), bis zu 5 Treffer.
  Klick auf einen Treffer setzt Breite/Länge **und** füllt „Standort fürs PDF“ (danach frei änderbar). Namensnennung
  „© OpenStreetMap-Mitwirkende“ unter den Treffern. Ohne Internet: Hinweis, Koordinaten von Hand.
  Anleitung ergänzt: nur die Ortssuche fragt bei OpenStreetMap nach. Der Ortsname wird mit der Variante gespeichert
  und steht in Vergleich und PDF neben den Koordinaten.
- **Sitzung 15 (erledigt, s. o.; Entscheidung 17.11., vor dem Bauen):** Sonnenstand und Schatten.
  **Ort:** kleiner Knopf **„Sonne“ im 3D-Fenster** neben „Zeichnung | Realistisch“; ein Klick öffnet ein kleines Feld mit
  Datum, Uhrzeit-Regler, Schnelltasten 21.3. / 21.6. / 21.12. und den Koordinaten. Seitenleiste bleibt unverändert.
  **Schatten in beiden Darstellungen:** „Zeichnung“ mit ruhigen grauen Schlagschatten (wie eine kolorierte Schattenstudie),
  „Realistisch“ mit echten Schatten. Sonne aus = wie bisher.
  **Bilder:** Ist beim Speichern die Sonne an, bekommen die 5 Bilder Schatten; Datum, Uhrzeit und Standort werden mit der
  Variante gespeichert und in Vergleich und PDF dazugeschrieben. Sonne aus = Bilder wie bisher ohne Schatten.
  **Standort:** zwei Felder Breitengrad / Längengrad zum Eintippen, Start Oldenburg (53,14° N, 8,21° O).
  Das ist zugleich der Ersatz, falls die Ortssuche (Sitzung 16) wegfällt. Sommerzeit automatisch (deutsche Uhrzeit).
  Norden bleibt Plan-oben.
- **Sitzung 18 (Entscheidung 17.11., vor dem Bauen):** Eigene Farbe pro Material.
  **Gilt je Material, überall:** Ändert man die Farbe z. B. von „Putz sand“, ändern sich alle Seiten, einzelnen Wände
  und Stützen mit diesem Material mit. Fugen und Struktur werden automatisch aus der neuen Farbe abgeleitet (etwas dunkler).
  **Auswahl: wenige Vorschläge** – je Material 5–6 gedeckte, ruhige Farbtöne zum Anklicken (passend zum Zeichenstil),
  dazu „Originalfarbe“. Keine freie Farbwahl.
  **Auch für:** einzelne Wände und Stützen (über ihr Material) sowie das **Dach** (eigene Vorschläge je Dachmaterial).
  **Pfosten-Riegel-Profile und Fensterrahmen bleiben anthrazit.**
  Wird mit der Variante gespeichert und geladen (ältere Varianten: Originalfarben); Vergleich zeigt den Farbton,
  Bilder/PDF automatisch. Gilt auch in „realistisch“.
  **Klinker (Nachtrag 17.11., Farben aus einem Verblendklinker-Prospekt der Nutzerin abgelesen, etwas beruhigt):**
  „Klinker rot“ und „Klinker anthrazit“ werden **ein Material „Klinker“**, die Farbe wählt man über die Vorschläge:
  rot #92564b (Start, bisheriges Klinker rot), anthrazit #77726d (bisher, bleibt laut Nutzerin), hell weiß-bunt #d0c6ba,
  braunviolett #5b4744, schwarz #45413d.
  Ältere Varianten mit „Klinker anthrazit“ werden beim Laden zu Klinker + anthrazit.
  **Zeichenstil bleibt:** nur die Grundfarbe wechselt, Fugen weiter dunkler gezeichnet, kein stärkerer „Bunt“-Effekt.
  Nur beim Klinker wird zusammengelegt; die anderen Materialien behalten ihre Namen und bekommen eigene Vorschläge.
  **Endgültige Vorschläge (17.11., Bilder der Nutzerin gemessen + von Claude ergänzt):**
  Regel der Nutzerin: **Töne, die sich zu sehr ähneln, fallen raus.** Gestrichen deshalb: Klinker rot-bunt (≈ rot),
  braun-bunt (≈ braunviolett), rot genarbt (≈ rot); Holz Lärche honig (≈ Lärche); Fassadenplatten schiefergrau (≈ anthrazit);
  Sichtbeton kühlgrau (≈ hell); Glas neutral (≈ blaugrau); Ziegel naturrot (≈ rot); Stehfalz zinkgrau (≈ hellgrau).
  - Holz: Lärche #bfa88b, vergraut #9c978d (beide bisher), hell rötlich #c9b19f, dunkelgrau #5f5c58 (aus Bildern),
    Eiche geölt #8a7260, schwarz lasiert #3f3d3b. Muster bleibt senkrechte Bretter.
  - Fassadenplatten: anthrazit #63676b, silbergrau #aaaeb0 (bisher), weiß #dcdbd6, bronze #7c6b58, cortenbraun #7a5444, olivgrau #6f7264.
  - Sichtbeton: warmgrau #b3b0aa (bisher), hell #cfcec8 (aus Bild), sandfarben #c3b9a8, dunkel #8d8b87.
  - Putz: altweiß #e2ddd3, sand #cfc2a6 (bisher), weiß #ecebe6, hellgrau #c9c8c3, ocker #c4a77c, terrakotta #b5846e,
    salbei #a9ae9a, taubenblau #9fa8ad.
  - Glas: blaugrau #8c9eab (bisher), grünlich #8fa39d, bronze #8f857a, dunkel #5f6b72.
  - Dach: Ziegel zusätzlich braun #634c42, schwarz engobiert #3e3c3a; Stehfalz zusätzlich kupferbraun #7b5a48;
    Schlicht zusätzlich mittelgrau #8f8d88, dunkel #5a5956. Gründach ohne weitere Töne.
- **Sitzung 17b (erledigt, s. o.; Entscheidung 17.11., vor dem Bauen):** Dachmaterial wählbar.
  **Bedienung:** eine Zeile **„Dach“** im Bereich „3 Fassade“ (wie „Stützen“), ein Material für alle Dachteile
  (IfcRoof bzw. Decken mit Typ „Dach“); einzelne Dachflächen nicht.
  **Materialien:** Dachziegel (rot, anthrazit), Stehfalz/Metall (hellgrau, anthrazit), Gründach, schlicht hell / Abdichtung.
  Gezeichnet im Zeichenstil wie die Fassaden, dazu je eine Fassung für „realistisch“ (Sitzung 17).
  **Startwert:** ruhiges Hellgrau (schlicht), damit das Dach nicht mehr heraussticht.
  **Fensterrahmen und Pfosten/Riegel bleiben anthrazit** (Entkopplung von der Dachfarbe).
  Wird mit der Variante gespeichert und geladen (ältere Varianten: hellgrau); Bilder/PDF zeigen es automatisch.
- **Sitzung 17 (erledigt, s. o.; Entscheidung 17.11., vor dem Bauen):** Umschalter „realistisch“.
  **Ort:** kleiner Umschalter **„Zeichnung | Realistisch“ im 3D-Fenster**, immer sichtbar.
  **Look realistisch:** keine Kantenlinien, echtes Licht mit Licht- und Schattenseiten, feinere Texturen
  (Klinkerfugen, Holzmaserung, Betonporen), Glas spiegelt den Himmel. Rohmodell bleibt hellgrau.
  **Umgebung:** Hintergrund wird ein heller Himmelsverlauf (hellblau → weiß), kein Boden/Gras extra.
  **Bilder, Vergleich und PDF bleiben immer im Zeichenstil** – „realistisch“ ist nur zum Anschauen im 3D-Fenster
  (Varianten bleiben einheitlich vergleichbar). Der Umschalter wird nicht mit der Variante gespeichert.
- **Sitzung 14 (erledigt, s. o.; Entscheidung 17.11., vor dem Bauen):** Pfosten-Riegel-Fassade als neues Material „Pfosten-Riegel“
  in der Materialliste je Himmelsrichtung (auch bei „Alle Seiten gleich“). Glas mit dunkelgrauen Pfosten und Riegeln
  (Farbe der Fensterrahmen, ca. 5 cm breit). Darunter zwei Zahlenfelder **Felder breit × hoch** (Start 8 × 3),
  Pfosten und Riegel gleichmäßig verteilt.
  **Ganze Wand = Fenster:** alte Fenster der Seite verschwinden, Fenster-Regler dieser Seite gesperrt,
  Kennwerte zählen die ganze Wandfläche als Fensterfläche.
  **Felder-Anzahl gilt je Wand** (kurze Wände haben schmalere Felder).
  **Auch für einzelne Wände** wählbar (Liste bei „Einzelne Wände“ aus Sitzung 12).
  Wird mit der Variante gespeichert und geladen, Vergleich zeigt es, Bilder/PDF automatisch.
  **Farbe (Wunsch der Nutzerin):** Dach, Pfosten/Riegel und Fensterrahmen in **derselben, recht dunklen Farbe**
  (Vorschlag Anthrazit #3a3d42 statt bisher #5f6266, nach dem Test ggf. nachstellen).
- **Sitzung 13 (erledigt, s. o.; Entscheidung 17.11., vor dem Bauen):** Einzelnes Fenster → Maße ändern.
  Im Bereich „4 Fenster“ ein Schalter **„Einzelne Fenster“** (wie „Einzelne Wände“; ist der eine an, geht der andere aus).
  An: Fenster anklicken, **Umschalt + Klick** nimmt weitere dazu, gewählte Fenster blau getönt.
  Maße in **cm**: zwei Felder Breite × Höhe, Startwert = aktuelle Größe; bei mehreren Fenstern mit verschiedenen Maßen
  bleibt das Feld leer („verschieden“), eine Eingabe gilt dann für alle gewählten. Wie bisher: Sturz bleibt, Brüstung wandert,
  10 cm Abstand zu Wandrand und Nachbaröffnung, 0 = Fenster zu. **Eigenes Maß bleibt**, auch wenn der Regler der Seite
  oder „Alle Seiten gleich“ bewegt wird, bis „wie die Seite“ oder Textknopf „Einzelne Fenster zurücksetzen“.
  Nur Fenster in nachbaubaren Außenwänden, Türen nicht. Wird mit der Variante gespeichert und geladen,
  Kennwerte rechnen mit, Vergleich bekommt eine Zeile „Einzelne Fenster“; PDF zeigt es über die Bilder.
- **Sitzung 12 (erledigt, s. o.; Entscheidung 17.11., vor dem Bauen):** Einzelne Wand → anderes Material.
  Im Bereich „3 Fassade“ ein Schalter **„Einzelne Wände“**. Aus: Klick schaltet wie bisher außen ↔ innen.
  An: Klick wählt eine Außenwand aus, **Umschalt + Klick** nimmt weitere dazu; für die Auswahl gibt es eine
  Material-Liste (dieselben 10 Materialien + „wie die Seite“). Nur Außenwände. Eigenes Material bleibt, auch wenn
  das Material der Seite oder „Alle Seiten gleich“ geändert wird. Textknopf „Einzelne Wände zurücksetzen“.
  Wird mit der Variante gespeichert und geladen; Bilder und PDF zeigen es automatisch.
- **Sitzung 11 (Entscheidung 17.11., vor dem Bauen):** Anleitung als **Startseite** im 3D-Bereich (statt „Noch kein Modell
  geladen“): 4 Schritte (IFC laden · Außenwände prüfen · Gestalten · Vergleichen/PDF), verschwindet beim Laden der IFC.
  Darunter aufklappbar „IFC-Export ▸“: allgemeine Tipps + je ein kurzer Abschnitt **Revit** und **ArchiCAD**.
  Oben in der Seitenleiste ein kleiner Textknopf „Anleitung“, der sie später wieder zeigt. Kein Fenster zum Wegklicken.
- **Sitzung 10c (erledigt, s. o.; Wunsch der Nutzerin, 17.11., nach Sitzung 10b):** Seitenleiste ruhiger machen.
  **Entscheidungen:** Bereich 1: Dateiname bleibt sichtbar, die Bauteil-Anzahlen (Wände, Fenster, Türen …) sind zugeklappt.
  Bereich 2: die Zahl der Außenwände bleibt sichtbar, die Bedienerklärung ist zugeklappt.
  **Alle** grauen Erklärtexte (auch in Fassade, Fenster, Kennwerte, Varianten) werden einheitlich zugeklappt
  und lassen sich mit einem kleinen Textknopf (z. B. „Erklärung ▸“) aufklappen. Start: zugeklappt.
  Fehlermeldungen und Statusmeldungen (z. B. „ist gespeichert“) bleiben immer sichtbar.
- **Sitzung 9b (erledigt, s. o.; Wunsch der Nutzerin, 17.11., nach Sitzung 9):** Die Ansichten sollen wie echte Ansichten aussehen,
  also gerade auf eine „glatte“ Wand. Bisher blickt die Kamera genau aus N/O/S/W. Ist das Gebäude im Plan gedreht
  (wie in `Test.ifc`, ca. 10–15°), sieht man schräg auf zwei Seiten. Vorschlag: Die App ermittelt die Hauptrichtung
  der Außenwände und schaut senkrecht darauf. Die 4 Ansichten gehören weiter zu den Wandgruppen Nord/Ost/Süd/West,
  damit sie zu Material, Fenstern und Kennwerten passen. Bereits gespeicherte Varianten behalten ihre alten Bilder.
  **Entscheidung (17.11.):** Beschriftung mit Himmelsrichtungs-Namen, wohin die Fassade wirklich zeigt
  (z. B. „Nord – zeigt nach Nordnordwest“), keine Gradzahl. Ist das Gebäude kaum gedreht, steht nur „Nord“.
- **Sitzung 10b (Wunsch der Nutzerin, 17.11., nach Sitzung 10):** Die Perspektive schaut zu steil von oben.
  Sie soll flacher werden und sich selbst einstellen lassen. Vor dem Bauen klären: Wie einstellen?
  Idee A: Regler (Blickhöhe/Winkel und Richtung, z. B. aus Südosten/Südwesten …). Idee B: den aktuellen Blick im
  3D-Fenster als Perspektive übernehmen (Knopf „Diesen Blick verwenden“). Gilt nur für neu gespeicherte Varianten
  (alte behalten ihre Bilder). Der Text „Perspektive aus Südosten“ in der PDF-Fußzeile muss dann angepasst werden.
  **Entscheidung (17.11., vor Sitzung 10b):** Idee A, Regler. Auswahl „Blick aus“ mit 4 Ecken (Nordost, Südost,
  Südwest, Nordwest; Start Südost) und Regler „Blickhöhe“ in Grad, Start **15°** (bisher ca. 26°).
  Kein Knopf „Diesen Blick verwenden“.
- Sitzung 10: PDF-Übersichtsseite A3 quer (bis zu 4 Varianten, nutzt die Auswahl aus dem Vergleich).
  **Entscheidungen (17.11., vor Sitzung 10):** PDF wird direkt als Datei gespeichert (Bibliothek jsPDF per CDN),
  nicht über den Druckdialog. Standort: Textfeld zum Eintippen (leer = Zeile fehlt), Sitzung 16 kann es später füllen.
  PDF schon ab 1 angekreuzter Variante (Knopf unter der Liste), ab 2 zusätzlich im Vergleichsfenster.
  Seitenaufbau: Kopf mit Titel, Modell (Dateiname), Datum, Standort; darunter je Variante eine Spalte
  (älteste links) mit Name, Perspektive, Ansichten N/O/S/W, Kennwerte (Material und Fenster nach Test gestrichen, s. Sitzung 10).
- **Entscheidung (16.11., vor Sitzung 7):** Neuer Bereich „5 Kennwerte“ als Tabelle Nord/Ost/Süd/West + Gesamt,
  rechnet sofort neu bei jeder Änderung. Fassadenfläche = Außenseite der Außenwände (Rohbaumaß, Öffnungen mitgezählt).
  Fensterfläche = Fensteröffnungen (Rohbaumaß). **Glastüren zählen als Fenster** (Wunsch der Nutzerin),
  geschlossene Türen nur zur Fassadenfläche. Glastür = Tür, deren Ansicht mindestens zur Hälfte aus
  durchsichtigen Teilen besteht (Transparenz aus der IFC); dann zählt die ganze Türöffnung.
  Material „Glas“ ist nur Optik und zählt nicht als Fenster. Flächen auf 0,1 m², Anteil in ganzen Prozent.
- Probleme in Sitzung 6: Die Wand wird mit ihrem äußeren Umriss nachgebaut. Hat eine Wand eine Einbuchtung
  (z. B. stufige Oberkante) oder ein Loch ohne Fenster/Tür, wird das beim Nachbau zugemacht.
  Gebogene oder L-förmige Wände werden nicht nachgebaut, ihre Fenster bleiben unverändert.
  Bei mehrschaligen Wänden wird die innere Schale mitgeschnitten, wenn sie sich nachbauen lässt.
  Durch das Glas sieht man den (weißen) Innenraum des Modells – gewollt, wirkt wie ein Arbeitsmodell.
  Unter Türen bzw. über raumhohen Fenstern bleibt beim Nachbau ein 5 mm dünner Wandstreifen (rechnerisch nötig, nicht sichtbar).
  Die Fenstergrößen gehen beim Neuladen verloren (gespeichert wird mit den Varianten, Sitzung 8).
  Fenster können nur so groß werden, wie die (meist geschosshohe) Wand es zulässt.
  **Entscheidung (16.11., vor Sitzung 6):** Regler 0–200 %. Breite wächst von der Fenstermitte aus, Sturz bleibt,
  Brüstung wandert. Das Original-Fenster aus der IFC wird gestreckt bzw. gestaucht (Sprossen verzerren mit).
  Türen bleiben unverändert. Abstand zu Nachbaröffnung und Wandende mindestens 10 cm.
  **Geändert (16.11., nach Test):** Sprossen sollen weg. Alle Fenster in Außenwänden werden neu gezeichnet
  (schmaler Rahmen + Glas, ohne Sprossen), auch bei 100 %. Das Original-Fenster wird nicht mehr gestreckt.
  Rahmen 6 cm breit, 7 cm tief, deckend im Dunkelgrau des Dachs (#5f6266); sitzt so tief in der Wand wie das Original-Fenster.
  Nachgebaute Wand übernimmt den Umriss der IFC-Wand (auch Giebelspitzen).
- **Entscheidung (Sitzung 5):** Alle Materialfarben gedeckt und nicht zu knallig, eher etwas grau gebrochen.
- **Entscheidung (Sitzung 5):** Linien nicht „sklavisch korrekt“, sondern wie eine Handskizze:
  Fugen nur angedeutet wie mit der Feder: jeder Strich scharf und gleich kräftig, aber stellenweise fehlen Striche
  oder hören früher auf (keine weich ausgeblendeten, „verschwommenen“ Stellen – so war der erste Versuch, gefiel nicht).
  Klinker und Fassadenplatten ohne wolkige Helligkeitsflecken. Holz: Fugen relativ durchgängig gezogen
  (nur selten eine Lücke von wenigen Zentimetern), leicht unterschiedlich kräftig, dazu ganz leichte Wolken.
  Viele Lücken wirkten beim Holz komisch, beim Klinker gefallen sie.
  Glas ohne dunkle Profilstriche, die Felder (1,25 × 1,50 m) erkennt man nur an der leichten Spiegelung.
  Bauteilkanten stehen an den Enden etwas über (bis 15 cm) und sind unterschiedlich kräftig.
- Eigene Texturen (Fotos) vorerst nicht nötig; passen eher zum Umschalter „realistisch“ (Sitzung 17).
  Dann nur freie Quellen ohne Namensnennungspflicht nehmen, z. B. CC0 von ambientCG oder Poly Haven.
- Probleme in Sitzung 5: Das Muster liegt direkt auf den IFC-Wänden, auch auf Gauben-Seitenwänden und Schornsteinen,
  wenn sie als Außenwand erkannt sind (per Klick abschaltbar). Kellerwände bekommen keine eigene Regel, ebenfalls per Klick.
  Die Materialwahl geht beim Neuladen verloren (gespeichert wird mit den Varianten, Sitzung 8).
- Probleme in Sitzung 4: Das Gelände in der Test-IFC ist kein IfcSite, sondern mehrere Revit-Körper („Mass 1“ bis „Mass 9“,
  IfcBuildingElementProxy). Die App kann sie nicht sicher als Gelände erkennen, deshalb erscheinen sie wie das übrige
  Rohmodell (weiß mit Linien, wirkt wie eine Modellplatte). Ist so in Ordnung.
  Der Browser hält beim Testen manchmal alte JS-Dateien fest: dann Strg+Umschalt+R (neu laden ohne Zwischenspeicher).
- Probleme in Sitzung 2: keine Fehler. Auffällig: Das Gelände (Grundstück) aus der Test-IFC ist viel größer als das Haus
  und weiß auf weiß kaum zu sehen; bei der Darstellung (Sitzung 4) mitbedenken.
- Probleme in Sitzung 3: Die Erkennung ist nicht perfekt. Einzelne Innenwände gelten als außen, einige Kellerwände
  als innen, und bei mehrschaligen Wänden (Revit „Front wall“/„Back wall“) zählt meist nur die äußere Schale.
  Das ist gewollt, denn die Fassade sitzt außen. Korrektur per Klick. Die Klicks gehen beim Neuladen verloren
  (gespeichert wird erst mit den Varianten, Sitzung 8).
  Kellerwände unter dem Gelände werden als außen erkannt; ob sie eine Fassade bekommen, in Sitzung 5 klären.
  Die blaue Markierung ist vorläufig, der Zeichenstil kommt in Sitzung 4.
